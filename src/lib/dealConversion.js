import { calendarDate, financials, leadDate, numberOrNull } from './leadAnalysis.js';

export const SALE_STAGES = [
  ['registered', 'Venta registrada'], ['anticipo', 'Anticipo recibido'],
  ['production', 'En producción'], ['shipment', 'Logística / envío'],
  ['installation', 'Instalación'], ['completed', 'Finalizada'], ['canceled', 'Cancelada'],
];
export const activeDeals = deals => (deals || []).filter(d => !d.closing_status?.reverted_at);
export function partitionPipeline(leads, deals) {
  const sales = activeDeals(deals);
  const moved = new Set(sales.map(d => d.closing_status?.source_lead_id).filter(id => id !== undefined && id !== null).map(String));
  return { leads: (leads || []).filter(l => !moved.has(String(l.id))), deals: sales };
}
export function buildDealFromLead(lead, now = new Date().toISOString()) {
  return {
    user_id: lead.user_id, title: `Venta - ${lead.name}`, client: lead.name,
    contact: lead.contact, contact_email: lead.email, contact_phone: lead.phone,
    value: financials(lead).value ?? 0, stage: 'registered', probability: 100,
    close_date: calendarDate(now), last_activity: now,
    description: `Venta generada desde el prospecto: ${lead.name}.`,
    quotations: lead.quotations || [], machines: lead.machines || [],
    closing_status: { source_lead_id: lead.id, converted_at: now, source_lead: structuredClone(lead) },
  };
}
export function saleAsCard(deal) {
  const original = deal.closing_status?.source_lead || {};
  const lead = { ...original, id: deal.id, sourceLeadId: original.id,
    name: deal.client || deal.title, contact: deal.contact, email: deal.contact_email, phone: deal.contact_phone,
    machines: deal.machines || original.machines || [], quotations: deal.quotations || original.quotations || [],
    notes: deal.notes ?? original.notes, status: original.status || 'closing',
    created_at: original.created_at || deal.created_at,
  };
  const f = financials(lead);
  // Older sales may have a saved amount without itemized machinery.
  if (!lead.machines.length && !deal.closing_status?.source_lead) f.value = numberOrNull(deal.value);
  return { ...lead, financial:f, value:f.value ?? 0, reportBasis:'registered',
    reportDate:leadDate(lead,'document'), reportDateLabel:'Fecha del documento' };
}
const result = response => {
  if (response.error?.code === '42501') {
    const error = new Error('La base de datos bloqueó el guardado en Ventas. Es necesario corregir los permisos de KYRO; tu prospecto sigue intacto.');
    error.code = '42501'; throw error;
  }
  if (response.error) throw response.error;
  return response.data;
};
export async function convertLeadToSale(db, userId, leadId, now = new Date().toISOString()) {
  if (!userId) throw new Error('Inicia sesión para convertir el prospecto.');
  const existing = result(await db.from('deals').select('*').eq('user_id',userId).eq('closing_status->>source_lead_id',String(leadId)));
  const active = activeDeals(existing);
  if (active.length > 1) throw new Error('Hay más de una venta vinculada. Revisa las ventas antes de continuar.');
  if (active.length === 1) return active[0];
  const lead = result(await db.from('leads').select('*').eq('id',leadId).eq('user_id',userId).single());
  // Keep the origin intact for tasks, files and reversal. Visibility moves only after a confirmed insert.
  return result(await db.from('deals').insert(buildDealFromLead(lead,now)).select('*').single());
}
export async function revertSaleToLead(db, userId, dealId, now = new Date().toISOString()) {
  const deal = result(await db.from('deals').select('*').eq('id',dealId).eq('user_id',userId).single());
  if (deal.closing_status?.reverted_at) return deal;
  const source = deal.closing_status?.source_lead || {};
  const originalId = deal.closing_status?.source_lead_id;
  const fields = { name:deal.client, contact:deal.contact, email:deal.contact_email, phone:deal.contact_phone,
    machines:deal.machines || [], quotations:deal.quotations || [], notes:deal.notes ?? source.notes ?? '[]',
    ...(source.activity_status ? {activity_status:{...source.activity_status, ...(source.quotationNumber !== undefined ? {quotationNumber:source.quotationNumber} : {})}} : {}) };
  if (originalId !== undefined && originalId !== null) {
    result(await db.from('leads').update(fields).eq('id',originalId).eq('user_id',userId).select('id').single());
  } else {
    const restored = result(await db.from('leads').insert({ ...fields,user_id:userId,status:'warm',score:60,activity_status:{},source:'Reverted from Deal' }).select('id').single());
    deal.closing_status = { ...deal.closing_status, source_lead_id:restored.id };
  }
  // Archive the sale instead of deleting its history. If this fails, it remains visible and retryable.
  return result(await db.from('deals').update({closing_status:{...deal.closing_status,reverted_at:now},last_activity:now}).eq('id',dealId).eq('user_id',userId).select('*').single());
}
