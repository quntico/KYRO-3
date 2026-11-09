// UI verification with isolated fixtures. Every Supabase request is intercepted;
// this script never writes to the production database.
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';
import {dayKey,mexicoLocalToISO,shiftDay} from '../src/lib/agenda.js';
const {createServer}=await import('vite');
const server=await createServer({server:{host:'127.0.0.1',port:4173,strictPort:true},logLevel:'error'});await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.KYRO_CHROMIUM_PATH?{executablePath:process.env.KYRO_CHROMIUM_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const owner='00000000-0000-4000-8000-000000000001';
const user={id:owner,email:'fixture@example.test',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Prueba local'}};
const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';
let tasks=[{id:1,title:'Llamada de prueba',due:mexicoLocalToISO(dayKey(),'10:00'),completed:false,user_id:owner,client:'EMPRESA DE PRUEBA',lead_id:1,duration_minutes:30},{id:2,title:'Cotización de prueba',due:mexicoLocalToISO(shiftDay(dayKey(),1),'12:00'),completed:false,user_id:owner,duration_minutes:30},{id:3,title:'Actividad concluida',due:mexicoLocalToISO(dayKey(),'08:00'),completed:true,user_id:owner,duration_minutes:20}];
const lead={id:1,user_id:owner,name:'EMPRESA DE PRUEBA',contact:'Contacto de prueba',status:'new',notes:[],quotations:[],machines:[]};
let failWrite=false;
await page.route('https://cizkskcvenagvvrnklal.supabase.co/**',async route=>{
 const req=route.request(),url=new URL(req.url());let body=[];let status=200;
 if(url.pathname.includes('/auth/'))body=user;
 else if(url.pathname.includes('/tasks')){
  const input=req.postDataJSON();
  if(failWrite&&req.method()==='POST'){status=403;body={message:'Error simulado de permisos',code:'42501'};}
  else if(req.method()==='POST'){const row={...(Array.isArray(input)?input[0]:input),id:tasks.length+1};tasks.push(row);body=row;}
  else if(req.method()==='PATCH'){const id=Number(url.searchParams.get('id')?.replace('eq.',''));tasks=tasks.map(t=>t.id===id?{...t,...input}:t);body=tasks.find(t=>t.id===id);}
  else body=tasks;
 }else if(url.pathname.includes('/kyro_leads_summary')||url.pathname.endsWith('/leads'))body=[lead];
 else if(url.pathname.includes('/user_settings'))body=null;
 else if(url.pathname.includes('/user_profiles'))body=null;
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'Access-Control-Allow-Origin':'*'}});
});
await page.route('**/api/calendar',route=>route.fulfill({status:200,contentType:'application/json',body:'{"configured":false,"connected":false}'}));
// Real route protection, without a session.
await page.goto('http://127.0.0.1:4173/agenda');await page.getByRole('heading',{name:'Inicia sesión en KYRO'}).waitFor();
await page.evaluate(session=>localStorage.setItem('sb-cizkskcvenagvvrnklal-auth-token',JSON.stringify(session)),{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user});
await page.goto('http://127.0.0.1:4173/agenda');await page.getByRole('heading',{name:'Mi agenda',exact:true}).waitFor();
await page.getByRole('heading',{name:'Llamada de prueba',exact:true}).waitFor();
await page.getByRole('button',{name:'Mes',exact:true}).click();assert.ok(await page.getByRole('button',{name:/actividades$/}).count()>=42);
await page.getByRole('button',{name:'Semana',exact:true}).click();await page.getByRole('heading',{name:'Cotización de prueba',exact:true}).waitFor();
await page.getByRole('button',{name:'Nueva actividad',exact:true}).click();await page.getByLabel('Actividad',{exact:true}).fill('Seguimiento guardado');await page.getByRole('button',{name:'Guardar actividad'}).click();await page.getByRole('heading',{name:'Seguimiento guardado',exact:true}).waitFor();
await page.reload();await page.getByRole('heading',{name:'Seguimiento guardado',exact:true}).waitFor();
await page.getByRole('button',{name:'Completar Seguimiento guardado',exact:true}).click();await page.getByLabel('Estado de actividades').selectOption('completed');await page.getByRole('heading',{name:'Seguimiento guardado',exact:true}).waitFor();
failWrite=true;await page.getByRole('button',{name:'Nueva actividad',exact:true}).click();await page.getByLabel('Actividad',{exact:true}).fill('No debe guardarse');await page.getByRole('button',{name:'Guardar actividad'}).click();await page.getByText('Error simulado de permisos').first().waitFor();assert.equal(tasks.some(t=>t.title==='No debe guardarse'),false);assert.equal(await page.getByRole('dialog').count(),1);await page.getByRole('button',{name:'Guardar actividad'}).waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('button[type=submit]')?.disabled);await page.getByRole('dialog').getByRole('button',{name:'Cerrar',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
await page.getByLabel('Estado de actividades').selectOption('pending');await page.locator('[toast-close]').first().click();await page.getByRole('button',{name:'Elegir paleta de colores'}).click();await page.getByRole('menuitemradio',{name:'Futurista',exact:true}).click();await page.screenshot({path:'/workspace/scratch/kyro-agenda-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>getComputedStyle(document.querySelector('main')).paddingLeft==='0px');await page.screenshot({path:'/workspace/scratch/kyro-agenda-mobile.png',fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
assert.deepEqual(errors,[]);console.log('PASS: route protection, day/week/month, persistent create/reload/complete, failed save preserved, mobile overflow, zero JS errors. All data mocked.');
await browser.close();await server.close();
