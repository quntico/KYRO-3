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
