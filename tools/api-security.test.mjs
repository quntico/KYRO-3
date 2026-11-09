import test from 'node:test';import assert from 'node:assert/strict';
import {authenticate} from '../api/_lib/security.js';
import calendar from '../api/calendar.js';
import ai from '../api/ai.js';
const res=()=>({code:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}});
test('calendar and AI reject unauthenticated writes before contacting upstream services',async()=>{
 for(const handler of [calendar,ai]){const r=res();await handler({method:'POST',body:{action:'sync'},headers:{}},r);assert.equal(r.code,401);assert.match(r.body.error,/sesión/);assert.equal(r.headers['Cache-Control'],'no-store');}
});
test('API rejects unsupported methods and excessive payloads',async()=>{
 let r=res();await authenticate({method:'GET',headers:{}},r);assert.equal(r.code,405);
 r=res();await authenticate({method:'POST',body:{text:'x'.repeat(3000001)},headers:{}},r);assert.equal(r.code,400);
});
