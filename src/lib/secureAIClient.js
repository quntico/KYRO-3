import {secureApi} from './secureApi';
export const secureAIClient={
 chat:{completions:{create:body=>secureApi('/api/ai',{action:'chat',...body})}},
 images:{generate:body=>secureApi('/api/ai',{action:'image',prompt:body.prompt})},
 audio:{transcriptions:{create:async({file})=>{
   if(file.size>2000000)throw new Error('Para transcribir aquí usa un archivo de audio de hasta 2 MB.');
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
   return secureApi('/api/ai',{action:'transcribe',file:data,name:file.name,type:file.type});
 }}}
};
export async function aiFetch(_url,options){
 const body=JSON.parse(options.body||'{}');
 const result=await secureApi('/api/ai',body.q==='ping'?{action:'status'}:{action:'chat',messages:[{role:'user',content:body.q||body.message||body.prompt||''}]});
 return new Response(JSON.stringify({reply:result.choices?.[0]?.message?.content||'',...result}),{status:200,headers:{'Content-Type':'application/json'}});
}
