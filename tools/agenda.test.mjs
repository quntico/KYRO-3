import test from 'node:test';import assert from 'node:assert/strict';
import {dayKey,mexicoLocalToISO,agendaRange,selectAgenda,taskPayload} from '../src/lib/agenda.js';
test('CDMX midnight and calendar boundaries',()=>{
 assert.equal(dayKey('2026-11-10T05:59:00Z'),'2026-11-09');assert.equal(dayKey('2026-11-10T06:00:00Z'),'2026-11-10');
 assert.equal(mexicoLocalToISO('2026-11-09','10:00'),'2026-11-09T16:00:00.000Z');
 assert.deepEqual(agendaRange('week','2026-11-01'),['2026-10-26','2026-11-01']);
 assert.deepEqual(agendaRange('month','2028-02-10'),['2028-02-01','2028-02-29']);
});
test('agenda filters preserve separate tasks of same lead, completion and overdue',()=>{
 const tasks=[{id:1,lead_id:3,title:'Llamar',due:'2026-11-09T16:00Z',completed:false},{id:2,lead_id:3,title:'Cotizar',due:'2026-11-09T18:00Z',completed:false},{id:3,title:'Listo',due:'2026-11-09T12:00Z',completed:true}];
 assert.equal(selectAgenda(tasks,{day:'2026-11-09'}).length,2);
 assert.deepEqual(selectAgenda(tasks,{mode:'overdue',now:new Date('2026-11-09T17:00Z')}).map(t=>t.id),[1]);
 assert.equal(selectAgenda(tasks,{day:'2026-11-09',status:'completed'}).length,1);
});
test('task writes exclude synthetic ids and cross-account ownership',()=>{
 const p=taskPayload({id:Date.now(),title:' Cita ',due:'2026-11-09T16:00Z',user_id:'other',paymentAmount:20},'owner');
 assert.equal(p.user_id,'owner');assert.equal(p.id,undefined);assert.equal(p.title,'Cita');assert.equal(p.payment_amount,20);
 assert.throws(()=>taskPayload({title:'a',due:'bad'},'owner'));
});
