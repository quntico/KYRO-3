import {createClient} from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL||'https://cizkskcvenagvvrnklal.supabase.co';
const key=process.env.SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpemtza2N2ZW5hZ3Z2cm5rbGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDc0MzcsImV4cCI6MjA3NTM4MzQzN30.Yqxe2A514NPDO6RUw6a3HspRmKNV8gW4SkS_U30Wakk';
export async function authenticate(req,res,{ai=false}={}) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.status(405).json({error:'Método no permitido'});return null;}
 if(!req.body||typeof req.body!=='object'||JSON.stringify(req.body).length>3000000){res.status(400).json({error:'Solicitud inválida o demasiado grande'});return null;}
 const token=(req.headers.authorization||'').match(/^Bearer (.+)$/)?.[1];
 if(!token){res.status(401).json({error:'Inicia sesión para continuar'});return null;}
 const db=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.auth.getUser(token);
 if(error||!data.user){res.status(401).json({error:'La sesión venció. Vuelve a iniciar sesión.'});return null;}
 if(ai){const {data:allowed,error:limitError}=await db.rpc('kyro_claim_ai_request');if(limitError||!allowed){res.status(429).json({error:'Se alcanzó el límite diario de IA. Tu agenda y tus registros siguen disponibles.'});return null;}}
 return {db,user:data.user};
}
