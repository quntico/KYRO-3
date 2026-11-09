import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, RotateCcw, X, ArrowUpDown, Wallet, Circle, Check, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DATE_FIELDS, LEAD_STATUSES, filterError } from '@/lib/leadAnalysis';
import LeadPeriodFilter, { periodLabel } from './LeadPeriodFilter';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const control = `flex min-h-[64px] w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5 ${focus}`;
const field = `h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm text-foreground ${focus}`;
const SORTS = [['status','Prioridad de estatus'],['date','Más recientes primero'],['date-asc','Más antiguos primero'],['value','Mayor importe primero'],['value-asc','Menor importe primero'],['alpha','Nombre de A a Z'],['alpha-desc','Nombre de Z a A']];
const statusColors = { all:'bg-slate-400',new:'bg-purple-400',closing:'bg-cyan-400',hot:'bg-red-400',warming:'bg-emerald-400',warm:'bg-amber-400',cooling:'bg-sky-400',cold:'bg-blue-400',declined:'bg-orange-400' };
function Menu({ label, value, options, onChange, icon:Icon, color, dots }) {
  const [open,setOpen]=useState(false);
  const selected=options.find(([key])=>key===value)?.[1] || value;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" className={control} aria-label={`${label}: ${selected}`}>
    <Icon className={`h-4 w-4 shrink-0 ${color}`} /><span className="min-w-0 flex-1 text-left"><span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><span className="block text-sm font-semibold leading-snug">{selected}</span></span><ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  </button></PopoverTrigger><PopoverContent style={{ colorScheme: 'dark', scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }} collisionPadding={16} align="start" className="w-64 max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain rounded-2xl border-primary/20 bg-popover p-2 shadow-2xl"><p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div role="group" aria-label={label}>{options.map(([key,text])=><button type="button" key={key} onClick={()=>{onChange(key);setOpen(false);}} aria-pressed={value===key} className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${focus} ${value===key?'bg-primary/10 text-primary':'hover:bg-secondary'}`}>{dots&&<span className={`h-2 w-2 shrink-0 rounded-full ${statusColors[key]}`} />}<span className="flex-1">{text}</span>{value===key&&<Check className="h-4 w-4" />}</button>)}</div></PopoverContent></Popover>;
}
export function LeadFilterButton({ open, onClick, count }) {
  return <button type="button" onClick={onClick} aria-expanded={open} aria-controls="lead-analysis-filters" className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-4 text-xs font-semibold text-foreground shadow-[0_0_16px_rgba(34,211,238,0.08)] ${focus}`}>
    <SlidersHorizontal className="h-4 w-4 text-cyan-400" /> Fechas y filtros {count>0&&<span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{count}</span>}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open?'rotate-180':''}`} />
  </button>;
}
export default function LeadFilters({ open, filters, setFilters, status, setStatus, sort, setSort, margin, setMargin, onReset, months, resultCount }) {
  const [advanced,setAdvanced]=useState(false);
  const set=(key,value)=>setFilters(prev=>({...prev,[key]:value}));
  const clearDates=()=>setFilters(prev=>({...prev,month:'',from:'',to:'',undated:false}));
  const error=filterError(filters);
  const amountLabel = filters.min!=='' || filters.max!=='' ? `${filters.min!==''?Number(filters.min).toLocaleString('es-MX'):'0'} — ${filters.max!==''?Number(filters.max).toLocaleString('es-MX'):'sin límite'}` : 'Cualquier importe';
  const chips=[];
  if(filters.month||filters.from||filters.to||filters.undated)chips.push({text:`${DATE_FIELDS[filters.dateField]} · ${periodLabel(filters)}`,clear:clearDates});
  if(status!=='all')chips.push({text:LEAD_STATUSES.find(([key])=>key===status)?.[1]||status,clear:()=>setStatus('all')});
  if(filters.min!==''||filters.max!=='')chips.push({text:`Importe: ${amountLabel}`,clear:()=>setFilters(prev=>({...prev,min:'',max:''}))});
  if(filters.initial)chips.push({text:`Inicial: ${filters.initial==='#'?'0–9':filters.initial}`,clear:()=>set('initial','')});
  if(filters.currency!=='all')chips.push({text:`Moneda: ${filters.currency==='unknown'?'Sin confirmar':filters.currency}`,clear:()=>set('currency','all')});
  if(filters.basis==='document')chips.push({text:'Importes de documentos',clear:()=>setFilters(prev=>({...prev,basis:'registered',currency:'all',min:'',max:''}))});
  if(margin!=='')chips.push({text:`Simulación: ${margin}%`,clear:()=>setMargin('')});
  return <>
    {open&&<section id="lead-analysis-filters" aria-label="Filtros de prospectos" className="overflow-hidden rounded-2xl border border-primary/20 bg-card/95 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <div className="h-px bg-gradient-to-r from-cyan-400/70 via-blue-400/20 to-pink-400/50" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-bold tracking-tight">Encuentra tu próxima oportunidad</h2><span role="status" className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">{resultCount} prospectos</span></div>
          <button type="button" onClick={onReset} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground ${focus}`}><RotateCcw className="h-3.5 w-3.5" /> Restablecer</button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <LeadPeriodFilter filters={filters} setFilters={setFilters} months={months} triggerClass={control} />
          <Menu label="Estatus" value={status} options={LEAD_STATUSES} onChange={setStatus} icon={Circle} color="text-pink-400" dots />
          <Popover><PopoverTrigger asChild><button type="button" className={control} aria-label={`Importe: ${amountLabel}`}><Wallet className="h-4 w-4 shrink-0 text-blue-400" /><span className="min-w-0 flex-1 text-left"><span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Importe</span><span className="block text-sm font-semibold leading-snug">{amountLabel}</span></span><ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></button></PopoverTrigger>
            <PopoverContent style={{ colorScheme: 'dark', scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }} collisionPadding={16} align="start" className="w-[350px] max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain space-y-4 rounded-2xl border-primary/20 bg-popover p-4 shadow-2xl">
              <h3 className="text-sm font-bold">Valor de los proyectos</h3>
              <div role="group" aria-label="Origen del importe" className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1">{[['registered','Valores de KYRO'],['document','Documentos']].map(([value,label])=><button type="button" key={value} aria-pressed={filters.basis===value} onClick={()=>setFilters(prev=>({...prev,basis:value,currency:'all',min:'',max:''}))} className={`rounded-lg px-2 py-2 text-xs font-semibold ${focus} ${filters.basis===value?'bg-primary/15 text-primary':'text-muted-foreground'}`}>{label}</button>)}</div>
              <p className="text-xs leading-relaxed text-muted-foreground">{filters.basis==='registered'?'Precios de venta guardados en tus prospectos, en USD.':'Referencias de cotizaciones y anexos; pueden requerir revisión e incluir IVA.'}</p>
              {filters.basis==='document'&&<label className="block space-y-1 text-xs text-muted-foreground">Moneda<select aria-label="Moneda del importe" className={field} value={filters.currency} onChange={e=>set('currency',e.target.value)}>{[['all','Todas, sin mezclar'],['USD','Dólares · USD'],['MXN','Pesos · MXN'],['EUR','Euros · EUR'],['COP','Pesos colombianos · COP'],['unknown','Sin confirmar']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-xs text-muted-foreground">Desde<input aria-label="Importe mínimo" type="number" min="0" step="any" placeholder="Sin mínimo" className={field} value={filters.min} onChange={e=>set('min',e.target.value)} /></label><label className="space-y-1 text-xs text-muted-foreground">Hasta<input aria-label="Importe máximo" type="number" min="0" step="any" placeholder="Sin máximo" className={field} value={filters.max} onChange={e=>set('max',e.target.value)} /></label></div>
              <div className="flex flex-wrap gap-1.5">{[['','25000','Hasta 25 mil'],['25000','100000','25–100 mil'],['100000','','Desde 100 mil']].map(([min,max,label])=><button type="button" key={label} onClick={()=>setFilters(prev=>({...prev,min,max}))} className={`min-h-9 rounded-lg border border-border px-2 text-[11px] hover:border-primary/40 hover:bg-primary/5 ${focus}`}>{label}</button>)}</div>
              {filters.basis==='document'&&filters.currency==='all'&&<p className="text-xs text-muted-foreground">El rango usa la moneda de cada documento. Elige una moneda para comparar importes.</p>}
              {error&&<p role="alert" className="text-xs text-red-400">{error}</p>}
              <button type="button" onClick={()=>setFilters(prev=>({...prev,min:'',max:''}))} className={`min-h-9 rounded-lg px-2 text-xs text-primary ${focus}`}>Quitar límite de importe</button>
            </PopoverContent>
          </Popover>
          <Menu label="Ordenar" value={sort} options={SORTS} onChange={setSort} icon={ArrowUpDown} color="text-violet-400" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] text-muted-foreground">Los resultados y totales se actualizan al elegir.</p><button type="button" onClick={()=>setAdvanced(v=>!v)} aria-expanded={advanced} aria-controls="lead-filter-options" className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium hover:bg-secondary ${focus}`}><SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" /> Más opciones<ChevronDown className={`h-3.5 w-3.5 transition-transform ${advanced?'rotate-180':''}`} /></button></div>
        {advanced&&<div id="lead-filter-options" className="grid gap-4 border-t border-border pt-4 lg:grid-cols-[minmax(220px,1fr)_2fr]">
          <div><Menu label="Fecha de referencia" value={filters.dateField} options={Object.entries(DATE_FIELDS)} onChange={dateField=>setFilters(prev=>({...prev,dateField,month:'',from:'',to:'',undated:false}))} icon={CalendarDays} color="text-cyan-400" /><p className="mt-2 text-[11px] text-muted-foreground">El periodo se aplica a esta fecha, que también verás en las tarjetas.</p></div>
          <div><p className="mb-2 text-xs font-semibold text-muted-foreground">El nombre empieza con</p><div role="group" aria-label="Inicial del prospecto" className="flex flex-wrap gap-1">{['','A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z','#'].map(letter=><button type="button" key={letter} aria-pressed={filters.initial===letter} onClick={()=>set('initial',letter)} className={`min-h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold ${focus} ${filters.initial===letter?'border-primary/50 bg-primary/10 text-primary':'border-border hover:bg-secondary'}`}>{letter===''?'Todas':letter==='#'?'0–9':letter}</button>)}</div></div>
        </div>}
      </div>
    </section>}
    {chips.length>0&&<div aria-label="Filtros activos" className="flex flex-wrap items-center gap-1.5">{chips.map(chip=><button type="button" key={chip.text} onClick={chip.clear} aria-label={`Quitar ${chip.text}`} className={`inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-left text-xs text-foreground transition-colors hover:border-primary/50 ${focus}`}><span>{chip.text}</span><X className="h-3 w-3 shrink-0 text-muted-foreground" /></button>)}</div>}
    {error&&<p role="alert" className="text-sm text-red-400">{error}</p>}
  </>;
}
export function activeFilterCount(filters, search, status, companies) {
  return Number(Boolean(filters.month||filters.from||filters.to||filters.undated)) + Number(filters.min!==''||filters.max!=='') + Number(Boolean(filters.initial)) + Number(filters.currency!=='all') + Number(filters.basis!=='registered') + Number(status!=='all') + Number(Boolean(search)) + Number(!companies.includes('all'));
}
