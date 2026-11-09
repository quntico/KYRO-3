import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {loadWorkspaceData, loadLeadDetails, readArrayCache} from '../src/lib/workspaceLoader.js';

const deferred = () => {let resolve; const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
function fakeDb(responses, calls) {
  return {from(table) {
    calls.push(table);
    const query={select(){return this;},eq(key,value){if(key==='user_id')assert.equal(value,'owner');return this;},abortSignal(){return this;},single(){return responses[table];},then(resolve,reject){return Promise.resolve(responses[table]).then(resolve,reject);}};
    return query;
  }};
}
test('renders the lightweight pipeline while secondary sections are still loading',async()=>{
  const contacts=deferred(),calls=[],events=[];
  const db=fakeDb({kyro_leads_summary:{data:[{id:1,quotations:[{fileName:'quote.pdf',deferred:true}]}]},deals:{data:[]},tasks:{data:[]},contacts:contacts.promise,logistics:{data:[]},notes:{data:[]}},calls);
  const pending=loadWorkspaceData({db,userId:'owner',onPipeline:(l,d)=>events.push(['pipeline',l,d]),onSection:t=>events.push([t]),onPipelineSettled:()=>events.push(['ready']),onError:()=>assert.fail('unexpected error')});
  await setImmediate();
  assert.ok(events.some(e=>e[0]==='pipeline'));assert.ok(events.some(e=>e[0]==='ready'));
  assert.ok(!events.some(e=>e[0]==='contacts'));assert.ok(!calls.includes('leads'));
  contacts.resolve({data:[]});await pending;
  assert.equal(calls.length,6);assert.ok(events.some(e=>e[0]==='contacts'));
});
test('failed pipeline request preserves prior data instead of publishing a partial or empty pipeline',async()=>{
  const events=[];
  await loadWorkspaceData({db:fakeDb({kyro_leads_summary:{data:[{id:1}]},deals:{error:new Error('offline')},tasks:{data:[]},contacts:{error:new Error('offline')},logistics:{data:[]},notes:{data:[]}},[]),userId:'owner',onPipeline:()=>assert.fail('must preserve cache'),onSection:t=>events.push(t),onPipelineSettled:()=>events.push('settled'),onError:t=>events.push('error:'+t)});
  assert.ok(events.includes('settled'));assert.ok(events.includes('error:pipeline'));assert.ok(events.includes('tasks'));assert.ok(!events.includes('contacts'));
});
test('document hydration uses the complete original record and preserves embedded files',async()=>{
  const record={id:1,quotations:[{fileName:'quote.pdf',url:'data:application/pdf;base64,TEST'}],notes:'conversation'};const calls=[];
  assert.deepEqual(await loadLeadDetails(fakeDb({leads:{data:record}},calls),'owner',1),record);
  assert.deepEqual(calls,['leads']);
  await assert.rejects(loadLeadDetails(fakeDb({leads:{error:new Error('offline')}},[]),'owner',1),/offline/);
});
test('cache accepts empty arrays and ignores malformed, missing, or inaccessible entries',()=>{
  for(const data of [null,'broken','{}','null'])assert.equal(readArrayCache({getItem:()=>data},'key'),null);
  assert.deepEqual(readArrayCache({getItem:()=>'[]'},'key'),[]);
  assert.deepEqual(readArrayCache({getItem:()=>'[{"id":1}]'},'key'),[{id:1}]);
  assert.equal(readArrayCache({getItem:()=>{throw Error('blocked');}},'key'),null);
});
