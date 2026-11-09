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
