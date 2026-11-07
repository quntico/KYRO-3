import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDealFromLead,partitionPipeline,saleAsCard,convertLeadToSale,revertSaleToLead} from '../src/lib/dealConversion.js';
const lead={id:7,user_id:'owner',name:'Empresa de prueba',contact:'Contacto',email:'test@example.test',phone:'123',status:'closing',score:98,created_at:'2026-01-01',machines:[{name:'Equipo',price:100,commission:0}],quotations:[{url:'test.pdf'}],notes:'[{"text":"Nota"}]',next_step:{type:'Llamada'},activity_status:{managingCompanyId:'c1',clientDirectory:{amountDate:'2026-10-01'}},quotationNumber:'Q-1'};
function mock(responses){const calls=[];return {calls,from(table){const call={table,ops:[]};calls.push(call);const q=new Proxy({}, {get(_,key){if(key==='then')return (resolve,reject)=>Promise.resolve(responses.shift()).then(resolve,reject);return (...args)=>{call.ops.push([key,...args]);return q;};}});return q;}};}
test('conversion preserves the entire source, documents, dates, notes and zero profit without claiming payment',()=>{
 const deal=buildDealFromLead(lead,'2026-11-08T01:00:00Z');assert.equal(deal.stage,'registered');assert.equal(deal.close_date,'2026-11-07');assert.equal(deal.value,100);assert.deepEqual(deal.closing_status.source_lead,lead);assert.notEqual(deal.closing_status.source_lead,lead);assert.equal(deal.closing_status.depositReceived,undefined);
 const card=saleAsCard({...deal,id:99});assert.equal(card.name,lead.name);assert.equal(card.financial.profit,0);assert.equal(card.reportDate,'2026-10-01');assert.equal(card.sourceLeadId,7);assert.equal(card.quotationNumber,'Q-1');assert.deepEqual(card.quotations,lead.quotations);assert.equal(card.notes,lead.notes);assert.equal('notes' in deal,false);
});
test('only the converted lead moves and archived sales restore visibility',()=>{
 const sale={...buildDealFromLead(lead),id:99};const other={...lead,id:8};
 const p=partitionPipeline([lead,other],[sale]);assert.deepEqual(p.leads,[other]);assert.deepEqual(p.deals,[sale]);
 const reversed={...sale,closing_status:{...sale.closing_status,reverted_at:'today'}};
 assert.deepEqual(partitionPipeline([lead,other],[reversed]),{leads:[lead,other],deals:[]});
});
test('failed inserts do not remove or modify the source lead',async()=>{
 const db=mock([{data:[],error:null},{data:lead,error:null},{data:null,error:new Error('offline')}]);
 await assert.rejects(convertLeadToSale(db,'owner',7),/offline/);assert.equal(db.calls.filter(c=>c.ops.some(o=>o[0]==='delete'||o[0]==='update')).length,0);
});
test('retrying a completed conversion returns the existing sale without a second insert',async()=>{
 const sale={...buildDealFromLead(lead),id:99};const db=mock([{data:[sale],error:null}]);assert.deepEqual(await convertLeadToSale(db,'owner',7),sale);assert.equal(db.calls.length,1);
});
test('conversion uses fresh complete database data instead of a partial card and scopes it to owner',async()=>{
 const sale={...buildDealFromLead(lead),id:99};const db=mock([{data:[],error:null},{data:lead,error:null},{data:sale,error:null}]);assert.deepEqual(await convertLeadToSale(db,'owner',7),sale);
 assert.deepEqual(db.calls[1].ops.find(o=>o[0]==='select'),['select','*']);assert(db.calls[1].ops.some(o=>o[0]==='eq'&&o[1]==='user_id'&&o[2]==='owner'));assert.equal(db.calls[2].ops.find(o=>o[0]==='insert')[1].closing_status.source_lead.quotationNumber,'Q-1');
});
test('reversion preserves origin identity and archives the sale without deleting either record',async()=>{
 const sale={...buildDealFromLead(lead),id:99};const db=mock([{data:sale,error:null},{data:{id:7},error:null},{data:{...sale,closing_status:{...sale.closing_status,reverted_at:'now'}},error:null}]);
 await revertSaleToLead(db,'owner',99,'now');assert.equal(db.calls.some(c=>c.ops.some(o=>o[0]==='delete'||o[0]==='insert')),false);assert(db.calls[1].ops.some(o=>o[0]==='eq'&&o[1]==='id'&&o[2]===7));assert.equal(db.calls[2].ops.find(o=>o[0]==='update')[1].closing_status.reverted_at,'now');
});
test('unknown profit remains unknown and a recorded loss survives conversion',()=>{
 const noProfit={...lead,machines:[{price:100,commission:''}]};assert.equal(saleAsCard(buildDealFromLead(noProfit)).financial.profit,null);
 assert.equal(saleAsCard(buildDealFromLead({...lead,machines:[{price:100,commission:-10}]})).financial.profit,-10);
});

test('database access errors preserve the lead without requesting a login',async()=>{
 const db=mock([{data:[],error:null},{data:lead,error:null},{data:null,error:{code:'42501',message:'RLS blocked'}}]);
 await assert.rejects(convertLeadToSale(db,'owner',7),error=>error.code==='42501'&&error.message.includes('prospecto sigue intacto')&&!error.message.includes('Inicia sesión'));
 assert.equal(db.calls.some(c=>c.ops.some(o=>o[0]==='delete'||o[0]==='update')),false);
});
