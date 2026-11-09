import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
import {authenticate} from './_lib/security.js';
import {mexicoLocalToISO} from '../src/lib/agenda.js';
const scopes='openid email https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.calendarlist.readonly';
const redirect=()=>`${process.env.KYRO_APP_ORIGIN||'https://www.kyro.com.mx'}/agenda`;
const configured=()=>!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.CALENDAR_TOKEN_KEY);
function seal(value){const key=Buffer.from(process.env.CALENDAR_TOKEN_KEY,'base64');if(key.length!==32)throw new Error('Configuración de cifrado pendiente');const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),ciphertext]).toString('base64');}
function unseal(value){const all=Buffer.from(value,'base64'),dec=createDecipheriv('aes-256-gcm',Buffer.from(process.env.CALENDAR_TOKEN_KEY,'base64'),all.subarray(0,12));dec.setAuthTag(all.subarray(12,28));return JSON.parse(Buffer.concat([dec.update(all.subarray(28)),dec.final()]).toString());}
async function google(path,token,{method='GET',body,etag}={}){
 const r=await fetch(`https://www.googleapis.com/calendar/v3${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(etag?{'If-Match':etag}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 if(r.status===404||r.status===410)return null;
 if(!r.ok){const e=new Error(r.status===401?'Vuelve a conectar tu cuenta de Google.':r.status===412?'El evento cambió durante la sincronización. Reintenta para revisarlo.':`Google Calendar no completó la operación (${r.status}).`);e.status=r.status;throw e;}
 return r.status===204?{}:r.json();
}
async function exchange(params){const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('La autorización de Google venció o no está configurada. Vuelve a conectar.');const t=await r.json();return {...t,expires_at:Date.now()+t.expires_in*1000};}
async function calendars(token){let page,items=[];do{const r=await google(`/users/me/calendarList?maxResults=250${page?`&pageToken=${encodeURIComponent(page)}`:''}`,token);items.push(...r.items);page=r.nextPageToken;}while(page);return items.filter(c=>c.accessRole==='owner').map(({id,summary})=>({id,summary}));}
export default async function handler(req,res){
 const auth=await authenticate(req,res);if(!auth)return;const {db,user}=auth;const {action}=req.body;
 try{
 const {data:connection,error:readError}=await db.from('kyro_calendar_connections').select('*').eq('user_id',user.id).maybeSingle();if(readError)throw readError;
 if(action==='status')return res.json({configured:configured(),connected:!!connection,calendar_id:connection?.calendar_id,calendar_name:connection?.calendar_name,last_sync_at:connection?.last_sync_at,auto_sync:connection?.auto_sync});
 if(!configured())return res.status(503).json({error:'Falta configurar el cliente OAuth de Google y el cifrado en Vercel. La agenda interna ya funciona.'});
 if(action==='authorize'){
  if(!/^[a-f0-9]{64}$/.test(req.body.state||'')||!/^[A-Za-z0-9_-]{43}$/.test(req.body.challenge||''))throw new Error('Solicitud de autorización inválida');
  return res.json({url:'https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:redirect(),response_type:'code',scope:scopes,access_type:'offline',prompt:'consent',state:req.body.state,code_challenge:req.body.challenge,code_challenge_method:'S256'})});
 }
 let tokens;
 if(action==='exchange'){
  if(typeof req.body.code!=='string'||!/^[a-f0-9]{64}$/.test(req.body.verifier||''))throw new Error('Autorización inválida');
  tokens=await exchange({code:req.body.code,code_verifier:req.body.verifier,redirect_uri:redirect(),grant_type:'authorization_code'});
  const identity=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`},signal:AbortSignal.timeout(10000)}).then(r=>r.json());
  if(!identity.email_verified||identity.email?.toLowerCase()!==user.email.toLowerCase())throw new Error('Conecta la misma cuenta de correo con la que entraste a KYRO.');
  const {error}=await db.from('kyro_calendar_connections').upsert({user_id:user.id,encrypted_tokens:seal(tokens)});if(error)throw error;
  return res.json({calendars:await calendars(tokens.access_token)});
 }
 if(!connection)throw new Error('Primero conecta Google Calendar.');tokens=unseal(connection.encrypted_tokens);
 if(tokens.expires_at<Date.now()+60000){if(!tokens.refresh_token)throw new Error('Vuelve a conectar Google para renovar la autorización.');tokens={...tokens,...await exchange({refresh_token:tokens.refresh_token,grant_type:'refresh_token'})};const {error}=await db.from('kyro_calendar_connections').update({encrypted_tokens:seal(tokens)}).eq('user_id',user.id);if(error)throw error;}
 if(action==='auto'){if(!connection.calendar_id)throw new Error('Elige un calendario primero.');const {error}=await db.from('kyro_calendar_connections').update({auto_sync:req.body.enabled===true}).eq('user_id',user.id);if(error)throw error;return res.json({ok:true});}
 if(action==='calendars')return res.json({calendars:await calendars(tokens.access_token)});
 if(action==='select'){
  if(connection.calendar_id&&connection.calendar_id!==req.body.calendarId)throw new Error('Ya hay un calendario vinculado. El cambio requiere revisar primero sus eventos para evitar duplicados.');
  const selected=(await calendars(tokens.access_token)).find(c=>c.id===req.body.calendarId);if(!selected)throw new Error('Selecciona un calendario propio.');
  const {error}=await db.from('kyro_calendar_connections').update({calendar_id:selected.id,calendar_name:selected.summary}).eq('user_id',user.id);if(error)throw error;return res.json({ok:true});
 }
 if(action!=='sync')return res.status(400).json({error:'Acción desconocida'});
 if(!connection.calendar_id)throw new Error('Elige el calendario de trabajo.');
 const {data:tasks,error}=await db.from('tasks').select('*').eq('user_id',user.id).order('due');if(error)throw error;
 const base=`/calendars/${encodeURIComponent(connection.calendar_id)}/events`;let synced=0,conflicts=0;
 const save=async(id,patch)=>{const {error}=await db.rpc('kyro_save_calendar_sync',{p_task_id:id,p_patch:patch});if(error)throw error;};
 for(const t of tasks){
  if(!t.due||!Number.isFinite(Date.parse(t.due))||(!t.google_event_id&&(t.completed||t.status==='cancelled')))continue;
  if(t.google_conflict){conflicts++;continue;}
  const eventId=t.google_event_id||createHash('sha256').update(`${user.id}:${t.id}`).digest('hex');
  try{
   let remote=await google(`${base}/${eventId}`,tokens.access_token);
   // A remote deletion never deletes a lead or the task history.
   if(t.google_event_id&&(!remote||remote.status==='cancelled')){await save(t.id,{google_conflict:{type:'deleted_in_google',detected_at:new Date().toISOString()},google_sync_error:'El evento se eliminó en Google. Revisa la actividad en KYRO.'});conflicts++;continue;}
   const localChanged=!t.google_synced_at||Date.parse(t.updated_at)>Date.parse(t.google_synced_at);
   const remoteChanged=remote&&t.google_etag&&remote.etag!==t.google_etag;
   if(localChanged&&remoteChanged){await save(t.id,{google_conflict:{type:'simultaneous',google_title:remote.summary,google_start:remote.start,detected_at:new Date().toISOString()},google_sync_error:'Cambios simultáneos. No se sobrescribió ninguna versión.'});conflicts++;continue;}
   if(remoteChanged){const due=remote.start?.dateTime||(remote.start?.date?mexicoLocalToISO(remote.start.date,'09:00'):null);if(!due)throw new Error('El evento no tiene una fecha válida.');await save(t.id,{title:remote.summary||t.title,due,comments:(remote.description||'').split('\n\nKYRO · ')[0],duration_minutes:remote.end?.dateTime?Math.max(5,Math.min(1440,Math.round((Date.parse(remote.end.dateTime)-Date.parse(due))/60000))):t.duration_minutes,google_etag:remote.etag,google_synced_at:new Date().toISOString(),google_sync_error:null});synced++;continue;}
   if(localChanged||!remote){
    const description=`${t.comments||''}\n\nKYRO · https://www.kyro.com.mx/${t.lead_id?`leads?q=${encodeURIComponent(t.client||'')}`:'agenda'}`;
    const body={summary:t.title,description,start:{dateTime:t.due,timeZone:'America/Mexico_City'},end:{dateTime:new Date(Date.parse(t.due)+(t.duration_minutes||30)*60000).toISOString(),timeZone:'America/Mexico_City'},extendedProperties:{private:{kyro_task_id:String(t.id),kyro_completed:String(!!t.completed),kyro_cancelled:String(t.status==='cancelled')}},reminders:{useDefault:true}};
    if(!remote){try{remote=await google(base+'?sendUpdates=none',tokens.access_token,{method:'POST',body:{...body,id:eventId}});}catch(e){if(e.status!==409)throw e;remote=await google(`${base}/${eventId}`,tokens.access_token);}}
    else remote=await google(`${base}/${eventId}?sendUpdates=none`,tokens.access_token,{method:'PATCH',body,etag:remote.etag});
    await save(t.id,{google_event_id:eventId,google_etag:remote.etag,google_synced_at:new Date().toISOString(),google_sync_error:null});synced++;
   }
  }catch(error){await save(t.id,{google_sync_error:error.message});conflicts++;}
 }
 await db.from('kyro_calendar_connections').update({last_sync_at:new Date().toISOString()}).eq('user_id',user.id);
 return res.json({synced,conflicts});
 }catch(error){return res.status(400).json({error:error.message||'No se pudo completar la conexión con Google.'});}
}
