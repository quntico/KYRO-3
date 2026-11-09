export const AGENDA_ZONE = 'America/Mexico_City';
export function dayKey(value = new Date()) {
  if(value === null || value === '') return '';
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:AGENDA_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const get = key => parts.find(p=>p.type===key)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function shiftDay(day, count) {const d=new Date(`${day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
export function mexicoLocalToISO(day,time='09:00') {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{2}:\d{2}$/.test(time)) throw new Error('Fecha u hora inválida');
  const target=Date.parse(`${day}T${time}:00Z`);
  if(!Number.isFinite(target)) throw new Error('Fecha inválida');
  let guess=target;
  for(let i=0;i<3;i++) {
    const p=new Intl.DateTimeFormat('en-GB',{timeZone:AGENDA_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));
    const g=k=>p.find(x=>x.type===k).value;
    const actual=Date.parse(`${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}Z`);
    guess+=target-actual;
  }
  return new Date(guess).toISOString();
}
export function agendaRange(mode, day=dayKey()) {
  if(mode==='week') {const wd=new Date(day+'T12:00:00Z').getUTCDay();const start=shiftDay(day,-((wd+6)%7));return [start,shiftDay(start,6)];}
  if(mode==='month') {const start=day.slice(0,7)+'-01';const d=new Date(start+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);return [start,shiftDay(d.toISOString().slice(0,10),-1)];}
  return [day,day];
}
export function selectAgenda(tasks,{mode='day',day=dayKey(),status='pending',query='',now=new Date()}={}) {
  const [start,end]=agendaRange(mode,day);const q=query.toLocaleLowerCase('es');
  return tasks.filter(t=> {
    if(t.status==='cancelled' && status!=='cancelled') return false;
    if(status==='cancelled' && t.status!=='cancelled') return false;
    if(status==='pending'&&t.completed || status==='completed'&&!t.completed) return false;
    const key=dayKey(t.due);
    const inRange=mode==='overdue' ? !t.completed&&key&&new Date(t.due)<now : mode==='all' ? true : key>=start&&key<=end;
    return inRange&&`${t.title||''} ${t.client||''} ${t.comments||''}`.toLocaleLowerCase('es').includes(q);
  }).sort((a,b)=>(Date.parse(a.due)||Infinity)-(Date.parse(b.due)||Infinity)||a.id-b.id);
}
export function taskPayload(task,userId) {
  if(!userId) throw new Error('Inicia sesión para guardar tu agenda.');
  if(!task.title?.trim()) throw new Error('Escribe el título de la actividad.');
  if(!task.due || !Number.isFinite(Date.parse(task.due))) throw new Error('Selecciona una fecha válida.');
  const fields=['title','due','client','priority','completed','attachments','lead_id','status','comments','payment_concept','payment_amount','duration_minutes'];
  const result=Object.fromEntries(fields.filter(k=>task[k]!==undefined).map(k=>[k,task[k]]));
  if(task.paymentConcept!==undefined) result.payment_concept=task.paymentConcept;
  if(task.paymentAmount!==undefined) result.payment_amount=task.paymentAmount;
  return {...result,title:task.title.trim(),user_id:userId};
}
export function readableDate(value,options={}) {
  if(!value||!Number.isFinite(Date.parse(value))) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX',{timeZone:AGENDA_ZONE,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',...options}).format(new Date(value));
}
