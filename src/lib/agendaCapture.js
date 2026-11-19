import { dayKey, shiftDay, mexicoLocalToISO } from './agenda.js';

export const QUICK_NOTE_TAG = 'agenda-rapida';

export function callForCard(record, key, date) {
  const [kind, id] = key.split(':');
  return {
    title: kind === 'sale' ? `Llamar a ${record.name} · venta #${id}` : `Llamar a ${record.name}`,
    client: record.name, lead_id: kind === 'lead' ? Number(id) : null,
    due: mexicoLocalToISO(date, '09:00'), duration_minutes: 15, priority: 'medium',
    completed: false, status: 'pending'
  };
}

export function findCardCall(tasks, call, date) {
  return tasks.find(task => task.status !== 'cancelled' && task.title === call.title &&
    String(task.lead_id ?? '') === String(call.lead_id ?? '') && dayKey(task.due) === date);
}

// Read the persisted state under the signed-in user's scope. Concurrent inserts
// converge on the lowest id. Only duplicate copies of this same call are retired.
export async function saveCardCall(db, userId, call, date, checked) {
  const start = mexicoLocalToISO(date, '00:00');
  const end = mexicoLocalToISO(shiftDay(date, 1), '00:00');
  const matching = () => {
    let q = db.from('tasks').select('*').eq('user_id', userId).eq('title', call.title)
      .gte('due', start).lt('due', end).order('id');
    return call.lead_id == null ? q.is('lead_id', null) : q.eq('lead_id', call.lead_id);
  };
  async function read() {
    const {data,error} = await matching();
    if (error) throw error;
    return data.filter(t => t.status !== 'cancelled');
  }
  async function cancel(rows) {
    if (!rows.length) return [];
    const {data,error} = await db.from('tasks').update({status:'cancelled',completed:true})
      .eq('user_id',userId).in('id',rows.map(t => t.id)).eq('completed',false)
      .gte('due',start).lt('due',end).eq('title',call.title).select('*');
    if (error) throw error;
    return data;
  }
  let rows = await read();
  if (!checked) return [...rows, ...await cancel(rows.filter(t => !t.completed && t.status !== 'completed'))];
  if (rows.length) return rows;
  const {error} = await db.from('tasks').insert({...call,user_id:userId});
  if (error) throw error;
  rows = await read();
  if (!rows.length) throw new Error('La llamada cambió mientras se estaba guardando. Actualiza la agenda.');
  const completed = rows.find(t => t.completed || t.status === 'completed');
  const keep = completed || rows[0];
  const duplicates = rows.filter(t => t.id !== keep.id && !t.completed && t.status !== 'completed');
  return [...rows, ...await cancel(duplicates)];
}

export function quickNotePayload(value, name, key) {
  const content = value.trim().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replace(/\r?\n/g,'<br>');
  return { title: name ? `Nota · ${name}` : 'Nota de agenda', content, tags: [QUICK_NOTE_TAG, ...(key ? [key] : [])] };
}

export function noteText(note) {
  return String(note.content || '').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ')
    .replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&nbsp;',' ').replaceAll('&amp;','&').trim();
}

export function agendaNotes(notes) {
  return notes.filter(n => n.tags?.includes(QUICK_NOTE_TAG))
    .sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id);
}
