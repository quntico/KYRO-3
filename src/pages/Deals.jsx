import React, { useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Search, LayoutGrid, List, Columns, ArrowLeft, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import ModernLeadCard from '@/components/leads/ModernLeadCard';
import ViewDealDialog from '@/components/deals/ViewDealDialog';
import ClientFileViewerDialog from '@/components/deals/ClientFileViewerDialog';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SALE_STAGES, saleAsCard } from '@/lib/dealConversion';
import { money, normalizeText, displayDate, calendarDate } from '@/lib/leadAnalysis';

const Deals = () => {
  const { user, session } = useAuth();
  const { deals, loading, updateDeal, revertDeal } = useData();
  const [viewingId, setViewingId] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('recent');
  const busy = useRef(new Set());
  const companies = useMemo(() => {
    for (const key of ['kyro_crm_companies_v5.5','kyro_crm_companies_v5.0','kyro_crm_companies','pandora_companies_data','kyro_companies','companies']) {
      try { const saved=JSON.parse(localStorage.getItem(key)); if(Array.isArray(saved)&&saved.length)return saved; } catch { /* try the next existing preference */ }
    }
    return [];
  }, []);
  const rows = useMemo(() => (deals || []).map(deal => ({deal,card:saleAsCard(deal)})).filter(({deal,card}) =>
    (stage==='all'||deal.stage===stage) && normalizeText([card.name,card.contact,card.email,card.phone,...card.machines.map(m=>m?.name)].join(' ')).includes(normalizeText(search))
  ).sort((a,b) => sort==='name' ? a.card.name.localeCompare(b.card.name,'es') : sort==='value' ? (b.card.financial.value??-Infinity)-(a.card.financial.value??-Infinity) : String(b.deal.closing_status?.converted_at||b.deal.created_at||'').localeCompare(String(a.deal.closing_status?.converted_at||a.deal.created_at||''))),[deals,stage,search,sort]);
  const totals = useMemo(() => rows.reduce((sum,{card}) => ({value:sum.value+(card.financial.value||0),profit:sum.profit+(card.financial.profit||0),pending:sum.pending+Number(!card.financial.complete)}),{value:0,profit:0,pending:0}),[rows]);
  const persist = async (deal, patch) => {
    const {data,error}=await supabase.from('deals').update({...patch,last_activity:new Date().toISOString()}).eq('id',deal.id).eq('user_id',user.id).select('*').single();
    if(error)throw error;
    updateDeal(data); return data;
  };
  const changeStage = async (deal, next) => {
    try { await persist(deal,{stage:next}); toast({title:'Etapa actualizada'}); }
    catch(error){toast({title:'No se guardó la etapa',description:error.message,variant:'destructive'});}
  };
  const returnToLead = async deal => {
    if(busy.current.has(deal.id))return;
    busy.current.add(deal.id);
    try {await revertDeal(deal.id);setViewingId(null);toast({title:'Ficha devuelta a Prospectos',description:deal.client});}
    catch(error){toast({title:'No se pudo devolver la ficha',description:error.message,variant:'destructive'});}
    finally{busy.current.delete(deal.id);}
  };
  const updateCardField = async (deal, patch) => {
    const changes={};
    if(patch.activity_status)changes.closing_status={...deal.closing_status,source_lead:{...deal.closing_status?.source_lead,activity_status:patch.activity_status}};
    if(patch.quotationNumber !== undefined)changes.closing_status={...(changes.closing_status || deal.closing_status),source_lead:{...(changes.closing_status?.source_lead || deal.closing_status?.source_lead),quotationNumber:patch.quotationNumber}};
    if(patch.quotations)changes.quotations=patch.quotations;
    try {await persist(deal,changes);}
    catch(error){toast({title:'No se guardó el cambio',description:error.message,variant:'destructive'});throw error;}
  };
  const renderCard = ({deal,card},index) => <ModernLeadCard key={deal.id} lead={card} index={index} companies={companies} onView={()=>setViewingId(deal.id)} onUpdateField={(_,patch)=>updateCardField(deal,patch)} sale={{stage:deal.stage,onStageChange:next=>changeStage(deal,next),onViewFile:()=>setFileId(deal.id),onRevert:()=>returnToLead(deal)}} />;
  const viewingDeal=deals.find(d=>d.id===viewingId), fileDeal=deals.find(d=>d.id===fileId);
  return <div className="min-h-full bg-background text-foreground">
    <Helmet><title>Ventas | KYRO</title></Helmet>
    <div className="mx-auto max-w-[1700px] space-y-3 p-3 md:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-l-4 border-primary pl-3"><h1 className="text-2xl font-black uppercase tracking-tight">Ventas</h1><p className="text-xs text-muted-foreground">Tus fichas, desde el cierre hasta la entrega.</p></div>
        <Link to="/leads" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Ver prospectos</Link>
      </header>
      {session?.access_token === 'mock-token' && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-sm"><span>Inicia sesión con tu cuenta de KYRO para registrar y actualizar ventas.</span><Link to="/login" className="rounded-lg border border-primary/30 px-3 py-2 font-semibold text-primary">Iniciar sesión</Link></div>}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Etapa de venta">{[['all','Todas'],...SALE_STAGES].map(([id,label])=><button key={id} type="button" aria-pressed={stage===id} onClick={()=>setStage(id)} className={`min-h-9 rounded-full border px-3 text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-primary ${stage===id?'border-primary bg-primary text-primary-foreground':'border-border bg-card text-muted-foreground hover:text-foreground'}`}>{label} <span className="ml-1 opacity-70">{id==='all'?deals.length:deals.filter(d=>d.stage===id).length}</span></button>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><input aria-label="Buscar ventas" placeholder="Buscar empresa, contacto o proyecto…" value={search} onChange={e=>setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-primary" /></div>
        <select aria-label="Ordenar ventas" value={sort} onChange={e=>setSort(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-xs"><option value="recent">Más recientes</option><option value="value">Mayor importe</option><option value="name">Nombre A–Z</option></select>
        <div role="group" aria-label="Vista de ventas" className="flex h-10 gap-1 rounded-xl border border-border bg-card p-1">{[['grid','01',LayoutGrid,'Cuadrícula'],['list','02',List,'Lista'],['kanban','03',Columns,'Kanban']].map(([id,n,Icon,label])=><button type="button" key={id} aria-label={`Ventas ${n}: ${label}`} aria-pressed={view===id} onClick={()=>setView(id)} className={`flex items-center gap-2 rounded-lg px-3 text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary ${view===id?'bg-primary/15 text-primary':'text-muted-foreground'}`}><Icon className="h-4 w-4" />{n}</button>)}</div>
      </div>
      <section aria-label="Resumen de ventas" className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-400/20 bg-card p-3"><p className="text-xs text-muted-foreground">Ventas seleccionadas</p><p className="text-lg font-bold text-cyan-400">{rows.length}</p></div>
        <div className="rounded-xl border border-blue-400/20 bg-card p-3"><p className="text-xs text-muted-foreground">Valor de venta · USD</p><p className="text-lg font-bold">$ {totals.value.toLocaleString('es-MX',{maximumFractionDigits:2})}</p></div>
        <div className="rounded-xl border border-pink-400/20 bg-card p-3"><p className="text-xs text-muted-foreground">Utilidad posible · USD</p><p className="text-lg font-bold">{rows.length&&totals.pending===rows.length?'Por revisar':`$ ${totals.profit.toLocaleString('es-MX',{maximumFractionDigits:2})}`}</p><p className="text-[10px] text-muted-foreground">{totals.pending} con utilidad pendiente</p></div>
      </section>
      {loading&&!deals.length ? <p role="status" className="p-8 text-center">Cargando ventas…</p> : !rows.length ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><FolderKanban className="mx-auto mb-3 h-8 w-8 text-primary"/><h2 className="font-bold">{deals.length?'No hay ventas con estos filtros':'Tu próxima venta empieza en Prospectos'}</h2><p className="mt-2 text-sm text-muted-foreground">Al convertir un prospecto, su ficha completa aparecerá aquí.</p></div> : view==='grid' ? <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 lg:grid-cols-3">{rows.map(renderCard)}</div> : view==='kanban' ? <div className="flex gap-3 overflow-x-auto pb-3">{SALE_STAGES.filter(([id])=>rows.some(r=>r.deal.stage===id)).map(([id,label])=><section key={id} className="w-80 shrink-0 space-y-2"><h2 className="rounded-xl border border-primary/20 bg-card p-3 text-sm font-bold">{label}</h2>{rows.filter(r=>r.deal.stage===id).map(renderCard)}</section>)}</div> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-secondary/30 text-xs text-muted-foreground"><tr>{['Empresa','Etapa','Fecha de conversión','Venta · USD','Utilidad · USD',''].map((t,i)=><th key={i} className="p-3">{t}</th>)}</tr></thead><tbody>{rows.map(({deal,card})=><tr key={deal.id} className="border-t border-border"><td className="min-w-48 p-3 font-bold">{card.name}</td><td className="p-3">{SALE_STAGES.find(([id])=>id===deal.stage)?.[1]||deal.stage}</td><td className="p-3">{displayDate(calendarDate(deal.closing_status?.converted_at||deal.close_date))}</td><td className="p-3">{money(card.financial.value)}</td><td className="p-3">{money(card.financial.profit)}</td><td className="p-3"><Button variant="outline" size="sm" onClick={()=>setViewingId(deal.id)}>Ver venta</Button></td></tr>)}</tbody></table></div>}
      {viewingDeal&&<ViewDealDialog isOpen setIsOpen={()=>setViewingId(null)} deal={viewingDeal} onUpdate={updateDeal} onRevert={returnToLead}/>}
      {fileDeal&&<ClientFileViewerDialog isOpen onClose={()=>setFileId(null)} deal={fileDeal} onUpdate={updateDeal}/>}
    </div>
  </div>;
};
export default Deals;
