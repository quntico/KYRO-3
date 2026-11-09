import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calendarDate, displayDate, datePreset } from '@/lib/leadAnalysis';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const day = value => value ? new Date(`${value}T12:00:00`) : undefined;
const iso = value => value ? `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}` : '';
export function periodLabel(filters) {
  if (filters.undated) return 'Sin fecha registrada';
  if (filters.month) return `${MONTHS[Number(filters.month.slice(5))-1]} ${filters.month.slice(0,4)}`;
  if (filters.from || filters.to) return `${filters.from ? displayDate(filters.from) : 'Inicio'} — ${filters.to ? displayDate(filters.to) : 'Sin límite'}`;
  return 'Todas las fechas';
}

export default function LeadPeriodFilter({ filters, setFilters, months, triggerClass }) {
  const today = calendarDate(new Date().toISOString());
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('month');
  const [year, setYear] = useState(Number(today.slice(0,4)));
  const [range, setRange] = useState();
  const [calendarMonth, setCalendarMonth] = useState(day(today));
  const apply = patch => { setFilters(prev => ({ ...prev, month: '', from: '', to: '', undated: false, ...patch })); setOpen(false); };
  const openPicker = next => {
    setOpen(next);
    if (next) {
      const start = day(filters.from || (filters.month ? `${filters.month}-01` : today));
      setYear(start.getFullYear()); setCalendarMonth(start);
      setRange(filters.from ? { from: day(filters.from), to: day(filters.to) } : undefined);
      setMode(filters.from || filters.to ? 'range' : 'month');
    }
  };
  const selected = Boolean(filters.month || filters.from || filters.to || filters.undated);
  return <Popover open={open} onOpenChange={openPicker}>
    <PopoverTrigger asChild><button type="button" className={triggerClass} aria-label={`Periodo: ${periodLabel(filters)}`}>
      <CalendarDays className="h-4 w-4 shrink-0 text-cyan-400" /><span className="min-w-0 flex-1 text-left"><span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Periodo</span><span className="block text-sm font-semibold leading-snug text-foreground">{periodLabel(filters)}</span></span><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]' : 'bg-border'}`} />
    </button></PopoverTrigger>
    <PopoverContent style={{ colorScheme: 'dark', scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }} collisionPadding={16} align="start" className="w-[342px] max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain rounded-2xl border-primary/25 bg-popover p-4 shadow-2xl">
      <h3 className="text-sm font-bold">Elige un periodo</h3>
      <div className="my-3 grid grid-cols-2 gap-1.5">
        {[['all','Todas las fechas'],['this-month','Este mes'],['last-month','Mes anterior'],['this-year','Este año']].map(([id,label]) => <button type="button" key={id} onClick={() => apply(datePreset(id,today))} className="min-h-9 rounded-lg border border-border px-2 text-xs font-medium hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary">{label}</button>)}
      </div>
      <div role="group" aria-label="Tipo de periodo" className="mb-3 grid grid-cols-2 rounded-xl bg-secondary/60 p-1">
        {[['month','Por mes'],['range','Rango de días']].map(([id,label]) => <button key={id} type="button" aria-pressed={mode===id} onClick={() => setMode(id)} className={`rounded-lg py-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary ${mode===id?'bg-primary/15 text-primary shadow-sm':'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
      </div>
      {mode==='month' ? <>
        <div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Año anterior" onClick={() => setYear(y=>y-1)} className="rounded-lg p-2 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeft className="h-4 w-4" /></button><strong className="text-sm tabular-nums">{year}</strong><button type="button" aria-label="Año siguiente" onClick={() => setYear(y=>y+1)} className="rounded-lg p-2 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"><ChevronRight className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-3 gap-2">{MONTHS.map((name,index) => {
          const value=`${year}-${String(index+1).padStart(2,'0')}`;
          return <button type="button" key={name} aria-label={`${name} ${year}`} aria-pressed={filters.month===value} onClick={() => apply({month:value})} className={`relative min-h-11 rounded-xl border px-2 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary ${filters.month===value?'border-primary bg-primary/15 text-primary':'border-border hover:border-primary/40 hover:bg-secondary'}`}>
            {name}{months.includes(value) && <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-primary" />}
          </button>;
        })}</div><p className="mt-3 text-[11px] text-muted-foreground">El punto indica meses con registros.</p>
      </> : <>
        <p className="text-xs text-muted-foreground">Selecciona el primer y el último día.</p>
        <Calendar mode="range" locale={es} selected={range} onSelect={setRange} month={calendarMonth} onMonthChange={setCalendarMonth} weekStartsOn={1}
          labels={{ labelPrevious: () => 'Mes anterior del calendario', labelNext: () => 'Mes siguiente del calendario' }} className="p-0 pt-3" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">{range?.from ? `${displayDate(iso(range.from))} → ${displayDate(iso(range.to || range.from))}` : 'Sin selección'}</span>
          <button type="button" disabled={!range?.from} onClick={() => apply({from:iso(range.from),to:iso(range.to || range.from)})} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary">Ver periodo</button>
        </div>
      </>}
      <button type="button" onClick={() => apply({undated:true})} className="mt-3 flex min-h-9 w-full items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">Solo registros sin fecha {filters.undated && <Check className="h-3.5 w-3.5 text-primary" />}</button>
    </PopoverContent>
  </Popover>;
}
