import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FILTERS, analyzeLeads, financials, summarizeLeads, calendarDate, leadDate, datePreset } from '../src/lib/leadAnalysis.js';
const make = (id, name, date, machines, status='new', extra={}) => ({ id, name, status, machines, created_at: '2026-11-07T18:00:00Z', activity_status: {clientDirectory:{amountDate: date}}, ...extra });
const leads = [make(1,'Álamo','2026-10-31',[{price:100,commission:0}]),make(2,'Beta','2026-11-01',[{price:200,commission:-20}],'hot'),make(3,'Ñandú','',[{price:'',commission:''}]),make(4,'Norte','2026-11-30',[{price:300,commission:'',estimated_commission:60}])];
const query = (patch={},options={}) => analyzeLeads(leads,{filters:{...DEFAULT_FILTERS,...patch},...options});
test('month and inclusive day boundaries use documentary dates, not the import date',()=>{
 assert.deepEqual(query({month:'2026-11'}).map(l=>l.id).sort(),[2,4]);
 assert.deepEqual(query({from:'2026-10-31',to:'2026-11-01'}).map(l=>l.id).sort(),[1,2]);
 assert.deepEqual(query({undated:true}).map(l=>l.id),[3]);
 assert.equal(calendarDate('2026-02-30'),'');
 assert.equal(calendarDate('2026-11-01T02:00:00Z'),'2026-10-31');
 assert.equal(leadDate(leads[2],'document'),'');
});
test('all filters compose; accents and Ñ work; unknown values do not pass a numeric range',()=>{
 assert.deepEqual(query({initial:'A',max:'100'},{search:'alamo',status:'new'}).map(l=>l.id),[1]);
 assert.deepEqual(query({initial:'N'}).map(l=>l.id),[4]);
 assert.deepEqual(query({initial:'Ñ'}).map(l=>l.id),[3]);
 assert.equal(query({min:'0'}).length,3);
 assert.equal(query({from:'2026-12-01',to:'2026-01-01'}).length,0);
 assert.equal(query({min:'500',max:'100'}).length,0);
 assert.equal(query({}, {companies:['different']}).length,0);
});
test('zero profit, losses and manual estimates are preserved; missing values stay unknown',()=>{
 assert.equal(financials(leads[0]).profit,0);
 assert.equal(financials(leads[1]).profit,-20);
 assert.equal(financials(leads[2]).profit,null);
 assert.equal(financials(leads[3]).profit,60);
 assert.equal(financials(leads[0],'registered','30').profit,0);
 const incomplete=make(5,'Incomplete','2026-01-01',[{price:100,commission:10},{price:200,commission:''},{price:''}]);
 assert.equal(financials(incomplete).profit,10);
 assert.equal(financials(incomplete).complete,false);
 assert.equal(financials(incomplete,'registered','20').profit,50);
 assert.equal(financials(incomplete,'registered','20').complete,false);
 assert.equal(financials(incomplete,'registered','101').profit,10);
});
test('totals use the visible subset and split currencies, excluding unknown currency',()=>{
 const docs=[['USD',100],['MXN',2000],['',900]].map(([currency,amount],i)=>make(i,'Doc','',[], 'new',{activity_status:{clientDirectory:{amount,currency}}}));
 const filtered=analyzeLeads(docs,{filters:{...DEFAULT_FILTERS,basis:'document'},margin:'20'});
 const summary=summarizeLeads(filtered);
 assert.equal(summary.groups.length,2);
 assert.equal(summary.unknownCurrency,1);
 assert.equal(summary.groups.find(g=>g.currency==='MXN').profit,400);
 const hot=summarizeLeads(query({}, {status:'hot'}));
 assert.equal(hot.groups[0].value,200); assert.equal(hot.groups[0].profit,-20);
 assert.equal(summarizeLeads([]).count,0);
});
test('sorting respects missing dates, numeric values and stable alphabetic order',()=>{
 assert.deepEqual(query({}, {sort:'date-asc'}).map(l=>l.id),[1,2,4,3]);
 assert.deepEqual(query({}, {sort:'value'}).map(l=>l.id),[4,2,1,3]);
 assert.deepEqual(query({}, {sort:'value-asc'}).map(l=>l.id),[1,2,4,3]);
});
test('analysis never mutates source records or converts leads',()=>{
 const snapshot=JSON.stringify(leads); query({month:'2026-11'},{margin:'30'});
 assert.equal(JSON.stringify(leads),snapshot);
});

test('period shortcuts keep calendar months and cross the year correctly',()=>{
 assert.deepEqual(datePreset('last-month','2026-01-05'),{month:'2025-12'});
 assert.deepEqual(datePreset('this-month','2026-11-07'),{month:'2026-11'});
 assert.deepEqual(datePreset('this-year','2026-11-07'),{from:'2026-01-01',to:'2026-12-31'});
 assert.deepEqual(datePreset('all','2026-11-07'),{});
});
