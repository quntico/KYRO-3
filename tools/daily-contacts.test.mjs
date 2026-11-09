import test from 'node:test';
import assert from 'node:assert/strict';
import {contactDay, dailyContacts, setContacted, contactRecordKey} from '../src/lib/dailyContacts.js';

test('contact day changes at midnight in Mexico City, not UTC', () => {
  assert.equal(contactDay(new Date('2026-11-10T05:59:59Z')), '2026-11-09');
  assert.equal(contactDay(new Date('2026-11-10T06:00:00Z')), '2026-11-10');
});
test('checks survive serialization and can be undone without affecting other cards', () => {
  const initial = {day:'2026-11-09',ids:[]};
  const first = setContacted(initial,'lead:136',true,initial.day);
  const second = setContacted(first,'lead:143',true,initial.day);
  assert.deepEqual(dailyContacts(JSON.stringify(second),initial.day),second);
  assert.deepEqual(setContacted(second,'lead:136',false,initial.day).ids,['lead:143']);
  assert.deepEqual(initial.ids,[]);
  assert.equal(setContacted(second,'lead:143',true,initial.day).ids.length,2);
});
test('a new day resets checks on reload and while an old session is open', () => {
  const yesterday = {day:'2026-11-09',ids:['lead:136']};
  assert.deepEqual(dailyContacts(JSON.stringify(yesterday),'2026-11-10').ids,[]);
  assert.deepEqual(setContacted(yesterday,'lead:143',true,'2026-11-10'),{day:'2026-11-10',ids:['lead:143']});
  for (const raw of [null,'oops','{}','{"day":"2026-11-10","ids":false}']) assert.deepEqual(dailyContacts(raw,'2026-11-10').ids,[]);
});
test('a converted sale shares its source mark but unrelated sale IDs cannot collide', () => {
  assert.equal(contactRecordKey({id:136}),contactRecordKey({id:17,sourceLeadId:136},true));
  assert.notEqual(contactRecordKey({id:17}),contactRecordKey({id:17},true));
});

test('legacy checks migrate with their saved date, never re-stamped as today', async () => {
  const {legacyContactRows, contactHistory} = await import('../src/lib/dailyContacts.js');
  const rows = legacyContactRows(JSON.stringify({day:'2026-11-08',ids:['lead:28','lead:28','sale:3']}),'owner','2026-11-09');
  assert.deepEqual(rows,[{user_id:'owner',record_key:'lead:28',contact_date:'2026-11-08'},{user_id:'owner',record_key:'sale:3',contact_date:'2026-11-08'}]);
  assert.deepEqual(legacyContactRows('{"day":"2026-11-10","ids":["lead:28"]}','owner','2026-11-09'),[]);
  assert.deepEqual(contactHistory('{"lead:28":"2026-02-30","bad":"2026-11-09","sale:3":"2026-11-08"}'),{'sale:3':'2026-11-08'});
});
test('today resets while last contact remains available; pending includes never-contacted', async () => {
  const {contactHistory, contactMatches} = await import('../src/lib/dailyContacts.js');
  const history = contactHistory('{"lead:28":"2026-11-09"}');
  assert.equal(contactMatches(history['lead:28'],'today','2026-11-09'),true);
  assert.equal(contactMatches(history['lead:28'],'today','2026-11-10'),false);
  assert.equal(contactMatches(history['lead:28'],'pending','2026-11-10'),true);
  assert.equal(contactMatches(undefined,'pending','2026-11-10'),true);
  assert.equal(contactMatches(history['lead:28'],'never','2026-11-10'),false);
  assert.equal(history['lead:28'],'2026-11-09');
});
test('contact filter composes with status, search, period and updates financial totals', async () => {
  const {analyzeLeads, DEFAULT_FILTERS, summarizeLeads} = await import('../src/lib/leadAnalysis.js');
  const leads = [
    {id:1,name:'Alfa',contact:'Ana',status:'hot',last_contact_date:'2026-11-09',machines:[{price:100,commission:20}]},
    {id:2,name:'Alfa 2',contact:'Ana',status:'hot',last_contact_date:'2026-11-08',machines:[{price:200,commission:40}]},
    {id:3,name:'Beta',status:'cold',machines:[{price:300,commission:60}]},
  ];
  const selected = analyzeLeads(leads,{filters:{...DEFAULT_FILTERS,contact:'today'},today:'2026-11-09',status:'hot',search:'Ana'});
  assert.deepEqual(selected.map(x=>x.id),[1]);
  assert.equal(summarizeLeads(selected).groups[0].value,100);
  assert.equal(summarizeLeads(selected).groups[0].profit,20);
  assert.deepEqual(analyzeLeads(leads,{filters:{...DEFAULT_FILTERS,dateField:'contact',month:'2026-11',to:'2026-11-08'}}).map(x=>x.id),[2]);
  assert.equal(analyzeLeads(leads,{filters:{...DEFAULT_FILTERS,contact:'pending'},today:'2026-11-09'}).length,2);
  assert.equal(analyzeLeads(leads,{filters:{...DEFAULT_FILTERS,contact:'never'}})[0].id,3);
});
