import React,{useState,useEffect,useRef} from 'react';
import {secureApi} from '@/lib/secureApi';
import {Button} from '@/components/ui/button';
import {toast} from '@/components/ui/use-toast';
export default function GoogleCalendarConnect({onSync}) {
 const [state,setState]=useState(null),[busy,setBusy]=useState(false),[calendars,setCalendars]=useState([]);const handled=useRef(false);
 const refresh=()=>secureApi('/api/calendar',{action:'status'}).then(setState).catch(()=>setState({configured:false}));
 useEffect(()=>{refresh();const p=new URLSearchParams(location.search);if(p.has('error')){history.replaceState(null,'','/agenda');toast({title:'Conexión cancelada',description:'No se cambió tu agenda.'});return;}if(!p.has('code')||handled.current)return;handled.current=true;
 const saved=JSON.parse(sessionStorage.getItem('kyro-calendar-oauth')||'null');
 history.replaceState(null,'','/agenda');
 if(!saved||p.get('state')!==saved.state||Date.now()-saved.created>600000){toast({title:'Conexión vencida',description:'Vuelve a conectar Google Calendar.',variant:'destructive'});return;}
 setBusy(true);secureApi('/api/calendar',{action:'exchange',code:p.get('code'),verifier:saved.verifier}).then(r=>{setCalendars(r.calendars);sessionStorage.removeItem('kyro-calendar-oauth');return refresh();}).catch(e=>toast({title:'No se pudo conectar',description:e.message,variant:'destructive'})).finally(()=>setBusy(false));
 },[]);
 const run=async action=>{setBusy(true);try{
 if(action==='connect'){
  const hex=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  const state=hex(),verifier=hex();const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));const challenge=btoa(String.fromCharCode(...new Uint8Array(hash))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  const data=await secureApi('/api/calendar',{action:'authorize',state,challenge});sessionStorage.setItem('kyro-calendar-oauth',JSON.stringify({state,verifier,created:Date.now()}));location.assign(data.url);
 } else if(action==='calendars'){setCalendars((await secureApi('/api/calendar',{action})).calendars);}
 else {const result=await secureApi('/api/calendar',{action});toast({title:'Sincronización terminada',description:`${result.synced||0} actividades actualizadas; ${result.conflicts||0} requieren revisión.`});await onSync();await refresh();}
 }catch(e){toast({title:'Google Calendar',description:e.message,variant:'destructive'});}finally{setBusy(false);}};
 return <div className="rounded-2xl border border-border bg-card/70 p-4 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Google Calendar</p><p className="text-xs text-muted-foreground">{state?.calendar_name ? `Conectado: ${state.calendar_name}` : state?.configured ? 'Conecta tu calendario de trabajo' : 'Conexión automática pendiente de configurar en Google'}</p></div>
 <div className="flex gap-2">{state?.connected&&<Button variant="outline" disabled={busy} onClick={()=>run('calendars')}>Calendario</Button>}<Button disabled={busy||!state?.configured} onClick={()=>run(state?.calendar_id?'sync':'connect')}>{busy?'Procesando…':state?.calendar_id?'Sincronizar':'Conectar Google'}</Button></div></div>
 {calendars.length>0&&<label className="block text-sm">Calendario para las actividades de KYRO<select className="mt-2 w-full rounded-xl border border-border bg-background p-3" value={state?.calendar_id||''} onChange={async e=>{if(!e.target.value)return;setBusy(true);try{await secureApi('/api/calendar',{action:'select',calendarId:e.target.value});setCalendars([]);await refresh();}catch(error){toast({title:'No se pudo elegir',description:error.message,variant:'destructive'});}finally{setBusy(false);}}}><option value="">Selecciona un calendario</option>{calendars.map(c=><option key={c.id} value={c.id}>{c.summary}</option>)}</select></label>}
 {state?.calendar_id&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!state.auto_sync} disabled={busy} onChange={async e=>{setBusy(true);try{await secureApi('/api/calendar',{action:'auto',enabled:e.target.checked});await refresh();window.dispatchEvent(new Event('kyro-calendar-connected'));}catch(error){toast({title:'No se guardó la preferencia',description:error.message,variant:'destructive'});}finally{setBusy(false);}}}/>Sincronizar cada 5 minutos mientras KYRO esté abierto</label>}
 <p className="text-xs text-muted-foreground">Sincroniza únicamente actividades vinculadas a KYRO. No envía invitaciones. Los cambios simultáneos se muestran para revisión.</p>
 </div>;
}
