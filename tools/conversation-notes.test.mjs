import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationEntries, cleanConversationNotes } from '../src/lib/conversationNotes.js';

const imported = {text:'ACTUALIZACIÓN DOCUMENTAL · 07/11/2026 · Empresa',type:'manual',importBatch:'kyro-clientes-2026-11-07'};
test('removes documentary imports while preserving message order, dates, edits and attachments', () => {
  const messages = [
    {text:'El cliente pidió llamar mañana.',date:'2026-11-01',type:'manual'},
    {text:'Archivo',type:'file',fileUrl:'data:test',fileName:'cotizacion.pdf'},
    {text:'Audio',type:'audio',audioUrl:'data:audio'},
    {text:'ACTUALIZACIÓN DOCUMENTAL · texto escrito por el usuario',type:'manual'},
  ];
  const notes=JSON.stringify([messages[0],imported,...messages.slice(1)]);
  assert.deepEqual(conversationEntries(notes),messages);
  assert.deepEqual(JSON.parse(cleanConversationNotes(notes)),messages);
  assert.equal(cleanConversationNotes(cleanConversationNotes(notes)),cleanConversationNotes(notes));
});
test('empty imported conversations stay empty and legacy user text is preserved without inventing a date', () => {
  assert.deepEqual(conversationEntries(JSON.stringify([imported])),[]);
  assert.equal(cleanConversationNotes(JSON.stringify([imported])),'[]');
  for (const notes of [null,'','Se envió la cotización.','[{broken']) assert.equal(cleanConversationNotes(notes),notes);
  assert.deepEqual(conversationEntries('Texto anterior'),[{text:'Texto anterior',type:'manual',date:null}]);
  assert.deepEqual(conversationEntries('[]'),[]);
});
