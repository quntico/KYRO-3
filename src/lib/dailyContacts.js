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
