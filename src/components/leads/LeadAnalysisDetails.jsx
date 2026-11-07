import React from 'react';
import { displayDate, money } from '@/lib/leadAnalysis';

export default function LeadAnalysisDetails({ lead }) {
  if (!lead.financial) return null;
  const f = lead.financial;
  return <div className="my-2 space-y-1 text-xs leading-relaxed text-muted-foreground" data-lead-analysis>
    <p><span>{lead.reportDateLabel}: </span><time dateTime={lead.reportDate || undefined} className="font-semibold text-foreground">{displayDate(lead.reportDate)}</time></p>
    {lead.reportBasis === 'document' && <p>Referencia documental: <strong className="text-foreground">{money(f.value, f.currency)}</strong></p>}
    {lead.reportBasis !== 'document' && f.value === null && <p>Valor de venta: <span className="text-amber-400">Por revisar</span></p>}
    <p>{f.scenario ? 'Utilidad simulada' : 'Utilidad posible'}: <strong className={f.profit !== null && f.profit < 0 ? 'text-red-400' : 'text-foreground'}>{money(f.profit, f.currency)}</strong>{f.profit !== null && !f.complete && ' (parcial)'}</p>
  </div>;
}
