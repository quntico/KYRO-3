import React from 'react';
import { Users, TrendingUp, Wallet, Percent, Sparkles, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { money } from '@/lib/leadAnalysis';

export default function LeadFinancialSummary({ summary, basis, total, dateLabel, dateSelection, margin, setMargin }) {
  const simulated=summary.groups.some(g=>g.scenario);
  const invalid=margin!==''&&(!Number.isFinite(Number(margin))||Number(margin)<0||Number(margin)>100);
  const metrics = [
    { label:'Prospectos', lines:[String(summary.count)], detail:`de ${total} en tu cartera`, icon:Users, color:'text-cyan-400', glow:'from-cyan-400/10', accent:'bg-cyan-400' },
    { label:basis==='document'?'Valor documental':'Venta potencial', lines:summary.groups.map(g=>money(g.value,g.currency)), detail:`${summary.unpriced} sin importe${summary.partialPrice?` · ${summary.partialPrice} incompletos`:''}`, icon:TrendingUp, color:'text-blue-400', glow:'from-blue-400/10', accent:'bg-blue-400' },
    { label:simulated?'Utilidad con simulación':'Utilidad posible', lines:summary.groups.map(g=>g.profitCount?money(g.profit,g.currency):`Por revisar (${g.currency})`), detail:`${summary.pendingProfit} con utilidad pendiente`, icon:Wallet, color:'text-pink-400', glow:'from-pink-400/10', accent:'bg-pink-400' },
    { label:'Margen sobre venta', lines:summary.groups.map(g=>g.coveredValue>0?`${(g.profit/g.coveredValue*100).toLocaleString('es-MX',{maximumFractionDigits:1})}% ${g.currency}`:`— ${g.currency}`), detail:'Solo proyectos con utilidad disponible', icon:Percent, color:'text-violet-400', glow:'from-violet-400/10', accent:'bg-violet-400' },
  ];
  return <section aria-label="Resumen financiero del filtro" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tu selección</span><span className="mx-2 text-border">/</span>{dateSelection||'Todas las fechas'}<span className="ml-2 text-[11px]">· {dateLabel.toLowerCase()}{summary.undated>0?` · ${summary.undated} sin fecha`:''}</span></p>
      <Popover><PopoverTrigger asChild><button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-pink-400/25 bg-pink-400/5 px-3 text-xs font-medium hover:border-pink-400/60 hover:bg-pink-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Sparkles className="h-3.5 w-3.5 text-pink-400" />{margin!==''?`Simulación: ${margin}%`:'Simular utilidad'}</button></PopoverTrigger>
        <PopoverContent style={{ colorScheme: 'dark', scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }} collisionPadding={16} align="end" className="w-80 max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain space-y-3 rounded-2xl border-pink-400/25 bg-popover p-4 shadow-2xl">
          <h3 className="text-sm font-bold">¿Cuánto podrías ganar?</h3><p className="text-xs leading-relaxed text-muted-foreground">Elige un margen sobre la venta. Se aplicará solo a importes sin utilidad registrada.</p>
          <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">Margen de utilidad (%)<input aria-label="Margen de utilidad (%)" type="number" min="0" max="100" step="0.1" placeholder="Escribe un porcentaje" value={margin} onChange={e=>setMargin(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label>
          <div className="flex gap-2">{[10,20,30,40].map(pct=><button type="button" key={pct} aria-pressed={Number(margin)===pct&&margin!==''} onClick={()=>setMargin(String(pct))} className={`min-h-9 flex-1 rounded-lg border text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary ${Number(margin)===pct&&margin!==''?'border-pink-400/50 bg-pink-400/15 text-pink-400':'border-border hover:bg-secondary'}`}>{pct}%</button>)}</div>
          {invalid&&<p role="alert" className="text-xs text-red-400">Usa un valor entre 0 y 100. La simulación está desactivada.</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground">Ejemplo: 20% de una venta de 100,000 = 20,000 de utilidad. Es un escenario; no cambia tus registros.</p>
          {margin!==''&&<button type="button" onClick={()=>setMargin('')} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-pink-400 focus-visible:ring-2 focus-visible:ring-primary"><X className="h-3.5 w-3.5" /> Quitar simulación</button>}
        </PopoverContent>
      </Popover>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(metric=><div key={metric.label} className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card/95 px-4 py-3.5">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${metric.glow} to-transparent`} />
        <div className="relative"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{metric.label}</p><metric.icon className={`h-4 w-4 shrink-0 ${metric.color}`} /></div>
        <div className="space-y-1 text-xl font-bold tracking-tight tabular-nums text-foreground">{(metric.lines.length?metric.lines:[summary.count?'Por revisar':'0']).map(line=><p key={line} className="break-words">{line}</p>)}</div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground"><span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${metric.accent}`} />{metric.detail}</p></div>
      </div>)}
    </div>
    {summary.unknownCurrency>0&&<p className="text-xs text-amber-400">{summary.unknownCurrency} importes sin moneda confirmada, excluidos de las sumas.</p>}
    {simulated&&<p className="text-xs text-muted-foreground">Incluye un margen simulado de {margin}% donde falta utilidad. Las utilidades registradas se conservan.</p>}
    {invalid&&<p role="alert" className="text-xs text-red-400">La simulación requiere un margen entre 0 y 100.</p>}
  </section>;
}
