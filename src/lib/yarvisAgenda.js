import { dayKey, pendingAgendaForDay, readableDate, shiftDay } from './agenda.js';

export function isTomorrowAgendaQuestion(text = '') {
  const normalized = String(text).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /(?:que|cuales|cuantos|dime|muestra|ver|pendientes?|agenda|actividades|tareas).*(?:manana|tomorrow)|(?:manana|tomorrow).*(?:pendientes?|agenda|actividades|tareas)/.test(normalized);
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
  const rows = tasks.map(task => {
    const time = readableDate(task.due, { hour: '2-digit', minute: '2-digit' });
    const priority = ({ high: 'alta', urgent: 'urgente', medium: 'media', low: 'baja' })[task.priority] || 'sin prioridad indicada';
    return `• ${time} — ${task.title} · ${task.client || 'Actividad personal'} · prioridad ${priority}`;
  });
  return `Pendientes para mañana, ${dateLabel}:\n${rows.join('\n')}`;
}
