export const LEAD_STATUSES = [
  ['all', 'Todos'], ['new', 'Nuevos'], ['closing', 'Próximo cierre'],
  ['hot', 'Calientes'], ['warming', 'Avanzando'], ['warm', 'Tibios'],
  ['cooling', 'Enfriando'], ['cold', 'Fríos'], ['declined', 'Declinados / riesgo'],
];
export const DATE_FIELDS = {
  document: 'Fecha del documento', created: 'Alta en KYRO',
  activity: 'Última actividad', followup: 'Próximo seguimiento',
};
export const DEFAULT_FILTERS = {
  dateField: 'document', month: '', from: '', to: '', undated: false,
  initial: '', min: '', max: '', basis: 'registered', currency: 'all',
};
export const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
export function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function calendarDate(value) {
  if (!value || typeof value !== 'string') return '';
  const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  if (match) return parsed.toISOString().slice(0, 10) === value ? value : '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(parsed);
  const get = (type) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function leadDate(lead, field) {
  const directory = lead.activity_status?.clientDirectory || {};
  if (field === 'created') return calendarDate(lead.created_at);
  if (field === 'activity') return calendarDate(lead.last_activity);
  if (field === 'followup') return calendarDate(lead.follow_up_date || lead.next_step?.date);
  return calendarDate(directory.amountDate || directory.verifiedSupplement?.date);
}
export function displayDate(value) {
  return value ? new Date(`${value}T12:00:00Z`).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';
}
export function money(value, currency = 'USD') {
  return value === null ? 'Por revisar' : `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value)} ${currency === 'unknown' ? '(moneda pendiente)' : currency}`;
}
export function documentValue(lead) {
  const data = lead.activity_status?.clientDirectory || {};
  const supplement = data.verifiedSupplement || {};
  const main = numberOrNull(data.amount);
  const value = main ?? numberOrNull(supplement.amount);
  const raw = String(main !== null ? data.currency || '' : supplement.currency || '').trim().toUpperCase();
  const currency = ({ USD: 'USD', 'US DOLLAR': 'USD', 'DÓLARES': 'USD', MXN: 'MXN', 'PESOS': 'MXN', EUR: 'EUR', COP: 'COP' })[raw] || 'unknown';
  return { value, currency };
}
// Missing estimates are never treated as zero. A saved zero or loss is a valid result.
export function financials(lead, basis = 'registered', margin = '') {
  const pct = numberOrNull(margin);
  const useScenario = pct !== null && pct >= 0 && pct <= 100;
  if (basis === 'document') {
    const { value, currency } = documentValue(lead);
    const known = value !== null;
    return { value, currency, profit: known && useScenario ? value * pct / 100 : null,
      complete: known && useScenario, coveredValue: known && useScenario ? value : 0,
      scenario: known && useScenario, partialPrice: false };
  }
  const machines = (lead.machines || []).filter(Boolean);
  let value = 0, profit = 0, coveredValue = 0, priced = 0, covered = 0, scenario = false;
  for (const machine of machines) {
    const price = numberOrNull(machine.price);
    if (price === null) continue;
    value += price; priced++;
    const saved = numberOrNull(machine.commission) ?? numberOrNull(machine.estimated_commission);
    const estimate = saved ?? (useScenario ? price * pct / 100 : null);
    if (estimate !== null) { profit += estimate; covered++; coveredValue += price; }
    if (saved === null && useScenario) scenario = true;
  }
  return { value: priced ? value : null, currency: 'USD', profit: covered ? profit : null,
    complete: priced > 0 && priced === machines.length && covered === priced,
    coveredValue, scenario, partialPrice: priced > 0 && priced < machines.length };
}
export function filterError(filters) {
  if (filters.from && filters.to && filters.from > filters.to) return 'La fecha inicial debe ser anterior o igual a la final.';
  const min = numberOrNull(filters.min), max = numberOrNull(filters.max);
  if (min !== null && max !== null && min > max) return 'El importe mínimo debe ser menor o igual al máximo.';
  if ((min !== null && min < 0) || (max !== null && max < 0)) return 'Los importes del filtro deben ser positivos o cero.';
  return '';
}
export function analyzeLeads(leads, { filters = DEFAULT_FILTERS, search = '', status = 'all', companies = ['all'], sort = 'status', margin = '' } = {}) {
  if (filterError(filters)) return [];
  const min = numberOrNull(filters.min), max = numberOrNull(filters.max);
  const query = normalizeText(search);
  return (leads || []).filter(Boolean).map(lead => ({
    ...lead,
    value: (lead.machines || []).reduce((sum, m) => sum + (numberOrNull(m?.price) ?? 0), 0),
    commission: financials(lead).profit ?? 0,
    reportDate: leadDate(lead, filters.dateField), reportDateLabel: DATE_FIELDS[filters.dateField],
    financial: financials(lead, filters.basis, margin), reportBasis: filters.basis,
  })).filter(lead => {
    const haystack = [lead.name, lead.contact, lead.email, lead.phone, ...(lead.machines || []).map(m => m?.name)].map(normalizeText).join(' ');
    const initial = String(lead.name || '').trim().charAt(0).toLocaleUpperCase('es');
    if (query && !haystack.includes(query)) return false;
    if (status !== 'all' && lead.status !== status) return false;
    if (!companies.includes('all') && !companies.includes(lead.activity_status?.managingCompanyId || 'comp-1')) return false;
    if (filters.initial === '#' ? !/\d/.test(initial) : filters.initial && (filters.initial === 'Ñ' ? initial !== 'Ñ' : initial === 'Ñ' || normalizeText(initial) !== normalizeText(filters.initial))) return false;
    const date = lead.reportDate;
    if (filters.undated) { if (date) return false; }
    else {
      if (filters.month && (!date || !date.startsWith(filters.month))) return false;
      if (filters.from && (!date || date < filters.from)) return false;
      if (filters.to && (!date || date > filters.to)) return false;
    }
    const { value, currency } = lead.financial;
    if (filters.currency !== 'all' && currency !== filters.currency) return false;
    if ((min !== null || max !== null) && (value === null || currency === 'unknown')) return false;
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;
    return true;
  }).sort((a, b) => {
    const alpha = (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
    if (sort.startsWith('date')) {
      if (!a.reportDate || !b.reportDate) return a.reportDate ? -1 : b.reportDate ? 1 : alpha;
      return (sort === 'date-asc' ? 1 : -1) * a.reportDate.localeCompare(b.reportDate) || alpha;
    }
    if (sort.startsWith('value')) {
      if (a.financial.value === null || b.financial.value === null) return a.financial.value !== null ? -1 : b.financial.value !== null ? 1 : alpha;
      return a.financial.currency.localeCompare(b.financial.currency) || (sort === 'value-asc' ? 1 : -1) * (a.financial.value - b.financial.value) || alpha;
    }
    if (sort === 'alpha') return alpha;
    if (sort === 'alpha-desc') return -alpha;
    const priority = { closing: 1, hot: 2, warming: 3, warm: 4, cooling: 5, cold: 6, new: 7, declined: 8 };
    return (priority[a.status] || 99) - (priority[b.status] || 99) || b.value - a.value || alpha;
  });
}
export function summarizeLeads(leads) {
  const groups = {};
  let unpriced = 0, pendingProfit = 0, undated = 0, unknownCurrency = 0, partialPrice = 0;
  for (const lead of leads) {
    const f = lead.financial;
    if (!lead.reportDate) undated++;
    if (f.value === null) unpriced++;
    if (!f.complete) pendingProfit++;
    if (f.partialPrice) partialPrice++;
    if (f.currency === 'unknown' && f.value !== null) unknownCurrency++;
    if (f.value === null || f.currency === 'unknown') continue;
    const group = groups[f.currency] ||= { currency: f.currency, value: 0, profit: 0, profitCount: 0, coveredValue: 0, scenario: false };
    group.value += f.value;
    if (f.profit !== null) { group.profit += f.profit; group.profitCount++; group.coveredValue += f.coveredValue; }
    group.scenario ||= f.scenario;
  }
  return { count: leads.length, groups: Object.values(groups).sort((a, b) => a.currency.localeCompare(b.currency)), unpriced, pendingProfit, undated, unknownCurrency, partialPrice };
}

// Calendar shortcuts use the business date in Mexico City, including year rollovers.
export function datePreset(kind, today = calendarDate(new Date().toISOString())) {
  const [year, month] = today.split('-').map(Number);
  if (kind === 'this-month') return { month: today.slice(0, 7) };
  if (kind === 'last-month') return { month: `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}` };
  if (kind === 'this-year') return { from: `${year}-01-01`, to: `${year}-12-31` };
  return {};
}
