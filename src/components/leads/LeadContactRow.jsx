import React from 'react';
import {Check, User} from 'lucide-react';
import {useDailyContacts} from '@/contexts/DailyContactContext';
import {contactRecordKey} from '@/lib/dailyContacts';

export default function LeadContactRow({lead, isSale = false}) {
  const {ids, mark} = useDailyContacts();
  const key = contactRecordKey(lead, isSale);
  const checked = ids.has(key);
  const contact = String(lead.contact || '').trim();
  const name = !contact || /^(n\/?a|sin definir)$/i.test(contact) ? 'Sin contacto registrado' : contact;
  return <div className="relative z-10 mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1" onClick={event => event.stopPropagation()}>
    <p className="flex min-w-0 flex-1 basis-28 items-start gap-1.5 text-xs font-medium leading-snug text-foreground/85">
      <User aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="whitespace-normal [overflow-wrap:anywhere]">{name}</span>
    </p>
    <label title="Se conserva hoy en este navegador. Nuevo día según horario de CDMX." className={`inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-colors ${checked ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.12)]' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input type="checkbox" aria-label={`Contactado hoy: ${lead.name}`} checked={checked} onChange={event => mark(key, event.target.checked)} className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-muted-foreground/60 bg-background checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card" />
        <Check aria-hidden="true" className="pointer-events-none absolute inset-0 h-4 w-4 p-0.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      Contactado hoy
    </label>
  </div>;
}
