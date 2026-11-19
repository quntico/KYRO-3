import { buildJournal, journalLine, mentionedClients } from './clientJournal.js';
import { AGENDA_ZONE, dayKey, pendingAgendaForDay, shiftDay } from './agenda.js';

export function isTomorrowAgendaQuestion(text = '') {
  const normalized = String(text).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!/\b(?:manana|tomorrow)\b/.test(normalized) || /\bpasado manana\b|\b(?:por|de) la manana\b/.test(normalized) && !/\bmanana (?:por|en) la manana\b/.test(normalized)) return false;
  return /\b(?:pendientes?|agenda|actividades?|tareas?|citas?|compromisos?|reuniones?|seguimientos?)\b/.test(normalized)
    || /\bque (?:tengo|hay programado|me toca)(?: para)? manana\b/.test(normalized);
}

export function getTomorrowTasksForUser(tasks, userId, now = new Date()) {
  if (!userId) return [];
  const tomorrow = shiftDay(dayKey(now), 1);
  const ownedTasks = (Array.isArray(tasks) ? tasks : []).filter(task => String(task.user_id) === String(userId));
  return pendingAgendaForDay(ownedTasks, tomorrow);
}

export function formatTomorrowAgendaReply(tasks, now = new Date()) {
  const tomorrow = shiftDay(dayKey(now), 1);
  const dateLabel = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(`${tomorrow}T12:00:00Z`));
  if (!tasks.length) return `Mañana, ${dateLabel}, no tienes actividades pendientes registradas en tu agenda.`;
  const clock = new Intl.DateTimeFormat('es-MX', { timeZone: AGENDA_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const rows = tasks.map(task => {
    const time = clock.format(new Date(task.due));
    const priority = ({ high: 'alta', urgent: 'urgente', medium: 'media', low: 'baja' })[task.priority] || 'sin prioridad indicada';
    return `• ${time} — ${task.title} · ${task.client || 'Actividad personal'} · prioridad ${priority}`;
  });
  return `Pendientes para mañana, ${dateLabel}:\n${rows.join('\n')}`;
}

export function agendaRequest(text) {
  const query = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const calls = /\b(llamar(?:les)?|llamadas?|telefono)\b/.test(query);
  if (/\bmanana\b/.test(query) && calls && !/\bpasado manana\b/.test(query)) return 'calls';
  if (isTomorrowAgendaQuestion(text)) return 'tomorrow';
  if (/\b(notas?|anote|apuntes?|anotaciones|registre|seguimientos?|bitacoras?|historial|recordar|recordatorios?|acordamos|acuerdos|recordarme)\b/.test(query) && !/\b(crea|crear|guarda|guardar|borra|elimina|redacta)\b/.test(query)) return 'notes';
  if (/\b(?:mi resumen|resumen de (?:mi |la )?(?:agenda|dia)|que (?:ya )?(?:hice|termine)|resumen de (?:mis )?pendientes)\b/.test(query)) return 'summary';
  return '';
}

export function agendaReply(kind,{tasks,notes,userId,lastChange,now=new Date(),question='',journal=buildJournal([],[],notes,userId),selectedKey}) {
  const tomorrow = getTomorrowTasksForUser(tasks,userId,now);
  const saved = journal.entries;
  const showNote = journalLine;
  if (kind === 'notes') {
    const named = mentionedClients(journal,question);
    const all = /\b(todos|todas|general|completa la cartera)\b/i.test(question);
    const keys = named.length ? named : selectedKey && !all ? [selectedKey] : [];
    const list = keys.length ? saved.filter(n => keys.includes(n.key)) : saved;
    return list.length ? 'Seguimientos y notas:\n' + list.map(showNote).join('\n') : 'Sin entradas guardadas para esta consulta.';
  }
  const planned = kind === 'calls' ? tomorrow.filter(t=>/\b(?:llamar|llamada|telefonear)\b/i.test(t.title)) : tomorrow;
  const plan = kind==='calls' && !planned.length ? 'No tienes llamadas pendientes para mañana.' : formatTomorrowAgendaReply(planned,now);
  const relevant = saved.filter(n => planned.some(t => t.lead_id != null ? n.key === `lead:${t.lead_id}` : t.client && n.name === t.client));
  const details = planned.filter(t=>t.comments?.trim()).map(t=>`• ${t.title}: ${t.comments.trim()}`);
  if (kind !== 'summary') return [plan, ...(details.length ? ['Indicaciones:\n'+details.join('\n')] : []), ...(relevant.length ? ['Notas de clientes:\n'+relevant.map(showNote).join('\n')] : [])].join('\n\n');
  const completed = tasks.filter(t=>t.user_id===userId && t.status!=='cancelled' && (t.completed || t.status==='completed') &&
    t.updated_at && dayKey(t.updated_at)===dayKey(now));
  const recent = saved.filter(n=>n.date && dayKey(n.date)===dayKey(now));
  return [lastChange && `Último cambio: ${lastChange.message}`,plan,
    'Completadas y actualizadas hoy: '+(completed.map(t=>t.title).join(', ') || 'ninguna'),
    recent.length ? 'Notas de hoy:\n'+recent.map(showNote).join('\n') : 'Sin seguimientos ni notas de hoy.'
  ].filter(Boolean).join('\n\n');
}
