import {supabase} from './customSupabaseClient';
export async function secureApi(path,body={}) {
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token) throw new Error('Inicia sesión para continuar.');
 const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({error:'Respuesta no disponible. Intenta de nuevo.'}));
 if(!response.ok) throw new Error(data.error||'No se pudo completar la operación.');
 return data;
}
