import React from 'react';
import { CalendarDays, ChevronDown, RotateCcw } from 'lucide-react';
import { DATE_FIELDS, LEAD_STATUSES, filterError } from '@/lib/leadAnalysis';

const fieldClass = 'h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const Field = ({ label, children }) => <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-muted-foreground">{label}{children}</label>;

export function LeadFilterButton({ open, onClick, count }) {
  return <button type="button" onClick={onClick} aria-expanded={open} aria-controls="lead-analysis-filters"
    className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-blue-400/50 bg-blue-400/10 px-3 text-xs font-bold text-foreground shadow-[0_0_12px_rgba(96,165,250,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
    <span className="h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_#60a5fa]" />
    <CalendarDays className="h-4 w-4" /> Fechas y filtros {count > 0 && <span className="rounded bg-primary px-1.5 text-primary-foreground">{count}</span>}
    <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
  </button>;
}

export default function LeadFilters({ open, filters, setFilters, status, setStatus, sort, setSort, margin, setMargin, onReset, months }) {
  const set = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const error = filterError(filters);
  return <>
    {open && <section id="lead-analysis-filters" aria-label="Filtros de prospectos" className="space-y-3 rounded-xl border border-blue-400/30 bg-card/95 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-foreground">Explora tus prospectos</p>
        <button type="button" onClick={onReset} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw className="h-3.5 w-3.5" /> Limpiar filtros</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Field label="Fecha a consultar"><select className={fieldClass} value={filters.dateField} onChange={e => setFilters(prev => ({ ...prev, dateField: e.target.value, month: '', from: '', to: '' }))}>{Object.entries(DATE_FIELDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Mes"><select className={fieldClass} value={filters.month} disabled={filters.undated} onChange={e => setFilters(prev => ({ ...prev, month: e.target.value, from: '', to: '' }))}><option value="">Todos los meses</option>{months.map(month => <option key={month} value={month}>{new Date(`${month}-15T12:00:00Z`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</option>)}</select></Field>
        <Field label="Desde"><input type="date" className={fieldClass} value={filters.from} disabled={filters.undated} onBlur={e => { if (e.target.value !== filters.from) setFilters(prev => ({ ...prev, from: e.target.value, month: '' })); }} onChange={e => setFilters(prev => ({ ...prev, from: e.target.value, month: '' }))} /></Field>
        <Field label="Hasta"><input type="date" className={fieldClass} value={filters.to} disabled={filters.undated} onBlur={e => { if (e.target.value !== filters.to) setFilters(prev => ({ ...prev, to: e.target.value, month: '' })); }} onChange={e => setFilters(prev => ({ ...prev, to: e.target.value, month: '' }))} /></Field>
        <Field label="Estatus"><select className={fieldClass} value={status} onChange={e => setStatus(e.target.value)}>{LEAD_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Ordenar por"><select className={fieldClass} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="status">Prioridad de estatus</option><option value="date">Fecha: más recientes</option><option value="date-asc">Fecha: más antiguas</option>
          <option value="value">Importe: mayor a menor</option><option value="value-asc">Importe: menor a mayor</option><option value="alpha">Nombre: A → Z</option><option value="alpha-desc">Nombre: Z → A</option>
        </select></Field>
        <Field label="Base del importe"><select className={fieldClass} value={filters.basis} onChange={e => setFilters(prev => ({ ...prev, basis: e.target.value, currency: 'all', min: '', max: '' }))}>
          <option value="registered">Valor registrado en KYRO</option><option value="document">Referencia documental</option>
        </select></Field>
        <Field label="Moneda del importe"><select className={fieldClass} value={filters.currency} onChange={e => set('currency', e.target.value)}>
          <option value="all">Todas (separadas)</option><option value="USD">USD</option>
          {filters.basis === 'document' && <><option value="MXN">MXN</option><option value="EUR">EUR</option><option value="COP">COP</option><option value="unknown">Sin confirmar</option></>}
        </select></Field>
        <Field label="Importe mínimo"><input type="number" min="0" step="any" className={fieldClass} placeholder="Sin mínimo" value={filters.min} onChange={e => set('min', e.target.value)} /></Field>
        <Field label="Importe máximo"><input type="number" min="0" step="any" className={fieldClass} placeholder="Sin máximo" value={filters.max} onChange={e => set('max', e.target.value)} /></Field>
        <Field label="Inicial del prospecto"><select className={fieldClass} value={filters.initial} onChange={e => set('initial', e.target.value)}><option value="">Todas las letras</option>{'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').map(letter => <option key={letter}>{letter}</option>)}<option value="#">0–9</option></select></Field>
        <Field label="Margen para simular (%)"><input type="number" min="0" max="100" step="0.1" className={fieldClass} placeholder="Opcional, sin supuesto" value={margin} onChange={e => setMargin(e.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2"><input type="checkbox" checked={filters.undated} onChange={e => setFilters(prev => ({ ...prev, undated: e.target.checked, month: '', from: '', to: '' }))} className="h-4 w-4 accent-cyan-400" /> Solo sin fecha</label>
        <p>El margen simulado se aplica sobre la venta, solo donde falta utilidad. No modifica tus registros.</p>
      </div>
      {filters.basis === 'document' && <p className="text-xs text-muted-foreground">Referencia por expediente; puede ser una alternativa o un anexo. Importes con el tratamiento de IVA de cada documento, pendientes de validar como venta.</p>}
      {filters.basis === 'document' && filters.currency === 'all' && <p className="text-xs text-muted-foreground">El rango se aplica en la moneda original; el orden por importe agrupa por moneda. Selecciona una moneda para comparar.</p>}
    </section>}
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    {margin !== '' && (!Number.isFinite(Number(margin)) || Number(margin) < 0 || Number(margin) > 100) && <p role="alert" className="text-sm text-red-400">El margen debe estar entre 0 y 100. La simulación está desactivada.</p>}
  </>;
}

export function activeFilterCount(filters, search, status, companies) {
  return ['month', 'from', 'to', 'initial', 'min', 'max'].filter(key => filters[key] !== '').length + Number(filters.undated) + Number(filters.currency !== 'all') + Number(status !== 'all') + Number(Boolean(search)) + Number(!companies.includes('all'));
}
