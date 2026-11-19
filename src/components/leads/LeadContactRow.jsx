import React, {useRef,useState} from 'react';
import {useData} from '@/contexts/DataContext';
import {shiftDay,dayKey} from '@/lib/agenda';
import {callForCard,findCardCall} from '@/lib/agendaCapture';
import QuickAgendaNote from './QuickAgendaNote';
import {toast} from '@/components/ui/use-toast';
import {Check, User} from 'lucide-react';
import {useDailyContacts} from '@/contexts/DailyContactContext';
import {contactRecordKey} from '@/lib/dailyContacts';
import {displayDate} from '@/lib/leadAnalysis';

export default function LeadContactRow({lead, isSale = false}) {
  const {ids, mark, history, pending, ready, error, day} = useDailyContacts();
  const key = contactRecordKey(lead, isSale);
  const {tasks,loading,dataError,toggleCardCall,reportAgenda} = useData();
  const tomorrow = shiftDay(day || dayKey(),1);
  const call = callForCard(lead,key,tomorrow);
  const scheduled = findCardCall(tasks,call,tomorrow);
  const done = scheduled?.completed || scheduled?.status === 'completed';
  const lock = useRef(false);
  const [working,setWorking] = useState(false);
  async function schedule(checked) {
    if (lock.current) return;
    lock.current = true;
    setWorking(true);
    try { await toggleCardCall(call,tomorrow,checked); }
    catch (error) { toast({title:'No se pudo actualizar la llamada',description:error.message || 'Vuelve a intentarlo.',variant:'destructive'}); }
    finally { lock.current=false; setWorking(false); }
  }
  const checked = ids.has(key);
  const saving = pending.has(key);
  const lastDate = history[key];
  const contact = String(lead.contact || '').trim();
  const name = !contact || /^(n\/?a|sin definir)$/i.test(contact) ? 'Sin contacto registrado' : contact;
  return <div className="relative z-10 mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1" onClick={event => event.stopPropagation()}>
    <p className="flex min-w-0 flex-1 basis-28 items-start gap-1.5 text-xs font-medium leading-snug text-foreground/85">
      <User aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{name}<span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">Último contacto: {lastDate ? <time dateTime={lastDate}>{displayDate(lastDate)}</time> : ready ? 'Sin registrar' : error ? 'Sin conexión' : 'Cargando…'}</span></span>
    </p>
    <label title="Guarda el contacto de hoy en KYRO. Al desmarcar, conserva las fechas anteriores. Horario de CDMX." className={`inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-colors ${checked ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.12)]' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input type="checkbox" aria-label={`Contactado hoy: ${lead.name}`} checked={checked} disabled={!ready || saving} aria-busy={saving} onChange={async event => {
          const next = event.target.checked;
          if (await mark(key,next)) reportAgenda(`${next ? 'Contactado hoy' : 'Marca de contacto retirada'} · ${lead.name}`);
        }} className="peer disabled:cursor-wait disabled:opacity-50 h-4 w-4 cursor-pointer appearance-none rounded border border-muted-foreground/60 bg-background checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card" />
        <Check aria-hidden="true" className="pointer-events-none absolute inset-0 h-4 w-4 p-0.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {saving ? 'Guardando…' : 'Contactado hoy'}
    </label>
    <div className="flex w-full flex-wrap items-center justify-end gap-1.5">
      <label title="Agendar llamada para mañana a las 09:00, hora de Ciudad de México" className={`inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-lg border px-2 text-xs font-semibold ${scheduled?'border-primary/50 bg-primary/10 text-primary':'border-border hover:border-primary/50'}`}>
        <input type="checkbox" aria-label={`Llamar mañana: ${lead.name}`} checked={!!scheduled} disabled={working || loading || !!dataError || !!done} onChange={e=>schedule(e.target.checked)} className="h-4 w-4 accent-primary"/>
        {working?'Guardando…':done?'Llamada hecha':'Llamar mañana'}
      </label>
      <QuickAgendaNote name={lead.name} recordKey={key}/>
    </div>
  </div>;
}
