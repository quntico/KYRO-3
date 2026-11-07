import React from 'react';
import { money } from '@/lib/leadAnalysis';

export default function LeadFinancialSummary({ summary, basis, total, dateLabel, dateSelection, margin, onReset, active }) {
  const metrics = [
    { label: 'Prospectos filtrados', lines: [String(summary.count)], detail: `de ${total} en KYRO`, accent: 'border-cyan-400/40' },
    { label: basis === 'document' ? 'Importe documental' : 'Venta potencial registrada', lines: summary.groups.map(g => money(g.value, g.currency)), detail: `${summary.unpriced} sin importe${summary.partialPrice ? ` · ${summary.partialPrice} incompletos` : ''}`, accent: 'border-blue-400/40' },
    { label: summary.groups.some(g => g.scenario) ? 'Utilidad posible · simulada' : 'Utilidad posible registrada', lines: summary.groups.map(g => g.profitCount ? money(g.profit, g.currency) : `Por revisar (${g.currency})`), detail: `${summary.pendingProfit} prospectos con utilidad pendiente`, accent: 'border-emerald-400/40' },
    { label: 'Margen sobre venta', lines: summary.groups.map(g => g.coveredValue > 0 ? `${(g.profit / g.coveredValue * 100).toLocaleString('es-MX', { maximumFractionDigits: 1 })}% ${g.currency}` : `— ${g.currency}`), detail: 'Solo importes con utilidad disponible', accent: 'border-pink-400/40' },
  ];
  return <section aria-label="Resumen financiero del filtro" className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <p>{dateLabel}: <strong className="text-foreground">{dateSelection || 'Todas las fechas'}</strong> · {summary.undated} sin fecha</p>
      {(active > 0 || margin !== '') && <button type="button" onClick={onReset} className="min-h-8 rounded-md px-2 text-primary underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary">Restablecer consulta</button>}
    </div>
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {metrics.map(metric => <div key={metric.label} className={`min-w-0 rounded-xl border ${metric.accent} bg-card/90 px-3 py-2.5`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
        <div className="my-1 space-y-1 text-base font-black tabular-nums text-foreground md:text-lg">{(metric.lines.length ? metric.lines : [summary.count ? 'Por revisar' : '0']).map(line => <p key={line} className="break-words">{line}</p>)}</div>
        <p className="text-[11px] text-muted-foreground">{metric.detail}</p>
      </div>)}
    </div>
    {summary.unknownCurrency > 0 && <p className="text-xs text-amber-400">{summary.unknownCurrency} importes sin moneda confirmada, excluidos de las sumas.</p>}
    {summary.groups.some(g => g.scenario) && <p className="text-xs text-muted-foreground">Escenario con margen de {margin}% para importes sin utilidad; conserva las utilidades ya registradas.</p>}
  </section>;
}
