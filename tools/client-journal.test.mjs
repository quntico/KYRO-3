import test from 'node:test';
import assert from 'node:assert/strict';
import {buildJournal,journalPayload} from '../src/lib/clientJournal.js';
import {agendaReply,agendaRequest} from '../src/lib/yarvisAgenda.js';

test('combines historical conversation, dated quick notes and new entries by owner and stable record ID',()=>{
  const lead = {id:6,user_id:'me',name:'MOLEX',notes:JSON.stringify([{text:'Acuerdo',date:'2026-11-10T01:46:00Z'}])};
  const note = {id:4,user_id:'me',...journalPayload({text:'Revisar <oferta>'},'MOLEX','lead:6'),created_at:'2026-11-19T16:03:00Z'};
  const deal = {id:3,user_id:'me',client:'MOLEX',closing_status:{source_lead_id:6,source_lead:lead}};
  const journal = buildJournal([lead,{...lead,id:7}], [deal], [note,{...note,id:5,user_id:'other'}], 'me');
  assert.deepEqual(journal.byClient.get('lead:6').map(x=>x.text),['Acuerdo','Revisar <oferta>']);
  assert.equal(journal.byClient.get('lead:7').length,1);
  assert.deepEqual(buildJournal([], [deal], [note], 'me').byClient.get('lead:6').map(x=>x.text),['Acuerdo','Revisar <oferta>']);
  const reply = agendaReply(agendaRequest('Seguimiento de MOLEX'),{journal,tasks:[],notes:[note],userId:'me',question:'Seguimiento de MOLEX'});
  assert.match(reply,/Acuerdo/); assert.match(reply,/Revisar <oferta>/);
  assert.equal(buildJournal([lead],[deal],[note],null).entries.length,0);
});
test('preserves media and leaves undated historical text undated',()=>{
  const lead = {id:1,user_id:'x',name:'Empresa',notes:'Entrada sin fecha',last_activity:'2026-11-19T17:00:00Z'};
  const voice = {text:'Nota de voz',type:'audio',audioUrl:'data:audio/webm;base64,TEST'};
  const journal = buildJournal([lead],[],[{id:2,user_id:'x',created_at:'2026-11-19T12:00:00Z',...journalPayload(voice,'Empresa','lead:1')}],'x');
  assert.equal(journal.entries[0].audioUrl,voice.audioUrl);
  assert.equal(journal.entries[1].date,null);
});
