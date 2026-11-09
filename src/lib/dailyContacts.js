const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function contactDay(now = new Date()) {
  const parts = Object.fromEntries(dayFormatter.formatToParts(now).map(({type, value}) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function dailyContacts(raw, day = contactDay()) {
  try {
    const saved = JSON.parse(raw);
    if (saved?.day === day && Array.isArray(saved.ids)) {
      return {day, ids: [...new Set(saved.ids.filter(id => typeof id === 'string'))]};
    }
  } catch { /* Missing or invalid cache starts an empty day. */ }
  return {day, ids: []};
}

export function setContacted(state, id, checked, day = contactDay()) {
  const ids = new Set(state.day === day ? state.ids : []);
  if (checked) ids.add(id); else ids.delete(id);
  return {day, ids: [...ids]};
}

export function contactRecordKey(lead, isSale = false) {
  return lead.sourceLeadId != null ? `lead:${lead.sourceLeadId}` : `${isSale ? 'sale' : 'lead'}:${lead.id}`;
}

export function contactHistory(raw) {
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([key, date]) =>
      /^(lead|sale):[0-9]+$/.test(key) && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date));
  } catch { return {}; }
}

export function legacyContactRows(raw, userId, today = contactDay()) {
  try {
    const saved = JSON.parse(raw);
    if (!saved?.day || saved.day > today || !Array.isArray(saved.ids)) return [];
    return Object.entries(contactHistory(JSON.stringify(Object.fromEntries(saved.ids.map(id => [id, saved.day])))))
      .map(([record_key, contact_date]) => ({user_id: userId, record_key, contact_date}));
  } catch { return []; }
}

export function contactMatches(lastDate, mode, today = contactDay()) {
  if (mode === 'today') return lastDate === today;
  if (mode === 'pending') return lastDate !== today;
  if (mode === 'never') return !lastDate;
  return true;
}
