import { agendaNotes, noteText, quickNotePayload } from './agendaCapture.js';
import { conversationEntries } from './conversationNotes.js';

const MEDIA_TAG = 'seguimiento-adjunto';
export const journalDate = value => {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00-06:00' : value);
  return Number.isFinite(date.getTime()) ? date : null;
};
const stamp = entry => journalDate(entry.date)?.getTime() || 0;
export const journalKey = (record, sale = false) => record.sourceLeadId != null
  ? 'lead:' + record.sourceLeadId : (sale ? 'sale:' : 'lead:') + record.id;

export function journalPayload(entry, name, key) {
  const note = quickNotePayload(entry.text, name, key);
  if (entry.type === 'audio' || entry.type === 'file') {
    note.tags.push(MEDIA_TAG);
    const {type,text,fileType,fileName,fileUrl,audioUrl} = entry;
    note.content = JSON.stringify({type,text,fileType,fileName,fileUrl,audioUrl});
  }
  return note;
}

export function buildJournal(leads, deals, notes, userId) {
  const entries = [];
  const byClient = new Map();
  const clients = new Map();
  function append(row) {
    entries.push(row);
    if (!row.key) return;
    if (!byClient.has(row.key)) byClient.set(row.key, []);
    byClient.get(row.key).push(row);
  }
  function addClient(key, name, raw) {
    clients.set(key, name || 'Cliente sin nombre');
    conversationEntries(raw).forEach((entry, index) => {
      if (!entry || typeof entry.text !== 'string') return;
      append({...entry, uid:key + '/' + index, legacyIndex:index, key, name});
    });
  }
  if (userId) {
    for (const lead of leads.filter(l => l.user_id === userId))
      addClient('lead:' + lead.id, lead.name, lead.notes, lead.last_activity);
    for (const deal of deals.filter(d => d.user_id === userId)) {
      const source = deal.closing_status?.source_lead;
      const id = deal.closing_status?.source_lead_id ?? source?.id;
      const key = id == null ? 'sale:' + deal.id : 'lead:' + id;
      if (!clients.has(key)) addClient(key, deal.client || deal.title, source?.notes, source?.last_activity);
    }
    for (const note of agendaNotes(notes.filter(n => n.user_id === userId))) {
      const key = note.tags.find(tag => /^(lead|sale):\d+$/.test(tag)) || '';
      if (key && !clients.has(key)) clients.set(key, note.title?.replace(/^Nota · /,'') || 'Cliente');
      let entry = {type:'manual', text:noteText(note)};
      if (note.tags.includes(MEDIA_TAG)) {
        try { entry = JSON.parse(note.content); } catch { entry = {type:'manual', text:'Archivo adjunto'}; }
      }
      append({...entry, date:note.created_at, uid:'note/'+note.id, noteId:note.id, key,
        name:clients.get(key) || note.title?.replace(/^Nota · /,'') || 'Agenda'});
    }
  }
  entries.sort((a,b) => stamp(b) - stamp(a) || (b.noteId ?? b.legacyIndex) - (a.noteId ?? a.legacyIndex));
  for (const group of byClient.values()) group.sort((a,b) => stamp(a) - stamp(b) || (a.noteId ?? a.legacyIndex) - (b.noteId ?? b.legacyIndex));
  return {entries, byClient, clients};
}

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function mentionedClients(journal, question) {
  const q = ' ' + normalize(question) + ' ';
  return [...journal.clients].filter(([,name]) => normalize(name) && q.includes(' ' + normalize(name) + ' ')).map(([key]) => key);
}
export function journalLine(entry) {
  const time = stamp(entry) ? journalDate(entry.date).toLocaleString('es-MX',{timeZone:'America/Mexico_City',dateStyle:'short',...(/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? {} : {timeStyle:'short'})}) + ' · ' : '';
  return '• ' + time + entry.name + ': ' + entry.text + (entry.fileContent ? '\n' + entry.fileContent : '');
}
