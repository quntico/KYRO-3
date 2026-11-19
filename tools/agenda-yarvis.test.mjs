import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, mexicoLocalToISO, pendingAgendaForDay } from '../src/lib/agenda.js';
import { formatTomorrowAgendaReply, getTomorrowTasksForUser, isTomorrowAgendaQuestion } from '../src/lib/yarvisAgenda.js';

const userId = 'user-1';
const now = new Date('2026-05-01T12:00:00.000Z');
const tasks = [
  { id: 1, user_id: userId, title: 'Revisión logística', client: 'DHL', due: '2026-05-02T06:00:00.000Z', priority: 'high', completed: false, status: 'pending' },
  { id: 2, user_id: userId, title: 'Cierre de propuesta', client: 'Acme', due: '2026-05-03T05:59:59.000Z', priority: 'urgent', completed: false },
  { id: 3, user_id: userId, title: 'Ya realizado', due: '2026-05-02T15:00:00.000Z', completed: true },
  { id: 4, user_id: userId, title: 'Cancelado', due: '2026-05-02T16:00:00.000Z', status: 'cancelled', completed: false },
  { id: 5, user_id: 'user-2', title: 'Privado de otra persona', due: '2026-05-02T17:00:00.000Z', completed: false },
  { id: 6, user_id: userId, title: 'Día siguiente', due: '2026-05-03T06:00:00.000Z', completed: false },
];

test('CDMX day keys change precisely at local midnight', () => {
  assert.equal(dayKey('2026-05-01T05:59:59.000Z'), '2026-04-30');
  assert.equal(dayKey('2026-05-01T06:00:00.000Z'), '2026-05-01');
  assert.equal(dayKey('2026-05-03T05:59:59.000Z'), '2026-05-02');
  assert.equal(dayKey('2026-05-03T06:00:00.000Z'), '2026-05-03');
});

test('CDMX local entry round-trips the day and time around midnight', () => {
  assert.equal(dayKey(mexicoLocalToISO('2026-05-02', '00:00')), '2026-05-02');
  assert.equal(dayKey(mexicoLocalToISO('2026-05-02', '23:59')), '2026-05-02');
});

test('tomorrow list includes only authenticated user pending commitments in CDMX day bounds', () => {
  const tomorrowTasks = getTomorrowTasksForUser(tasks, userId, now);
  assert.deepEqual(tomorrowTasks.map(task => task.id), [1, 2]);
  assert.deepEqual(pendingAgendaForDay(tasks, '2026-05-02').map(task => task.id), [1, 5, 2]);
});

test('YARVIS detects tomorrow agenda questions and reports every matching item', () => {
  assert.equal(isTomorrowAgendaQuestion('¿Qué pendientes tengo mañana?'), true);
  assert.equal(isTomorrowAgendaQuestion('qué actividades tengo manana'), true);
  assert.equal(isTomorrowAgendaQuestion('Revisa los pendientes de hoy'), false);
  const reply = formatTomorrowAgendaReply(getTomorrowTasksForUser(tasks, userId, now), now);
  assert.match(reply, /DHL/);
  assert.match(reply, /Acme/);
  assert.match(reply, /prioridad alta/);
  assert.match(reply, /prioridad urgente/);
  assert.doesNotMatch(reply, /Privado de otra persona|Ya realizado|Cancelado|Día siguiente/);
});

test('empty tomorrow response is explicit and honest', () => {
  assert.match(formatTomorrowAgendaReply([], now), /no tienes actividades pendientes registradas/);
});
