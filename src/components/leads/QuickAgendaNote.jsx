import React, {useRef, useState} from 'react';
import {StickyNote} from 'lucide-react';
import {useData} from '@/contexts/DataContext';
import {quickNotePayload} from '@/lib/agendaCapture';

export default function QuickAgendaNote({name, recordKey}) {
  const {addNote} = useData();
  const [open,setOpen] = useState(false);
  const [value,setValue] = useState('');
  const [busy,setBusy] = useState(false);
  const pending = useRef(false);
  async function save() {
    if (pending.current || !value.trim()) return;
    pending.current = true;
    setBusy(true);
    try {
      await addNote(quickNotePayload(value,name,recordKey));
      setValue('');
      setOpen(false);
    } catch { /* The data provider displays the error. Preserve the draft. */ }
    finally { pending.current = false; setBusy(false); }
  }
  return <div className={open ? 'w-full min-w-0' : ''} onClick={event=>event.stopPropagation()}>
    <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-primary"><StickyNote className="h-4 w-4"/>Nota rápida</button>
    {open && <div className="mt-1 rounded-xl border border-primary/30 bg-background p-2">
      <textarea autoFocus aria-label={name ? `Nota para ${name}` : 'Nota para mi agenda'} value={value} maxLength={4000} rows={2} onChange={e=>setValue(e.target.value)} placeholder={name ? `¿Qué necesitas recordar de ${name}?` : 'Escribe lo que YARVIS debe tener presente…'} className="block w-full resize-y bg-transparent px-2 py-1 text-sm text-foreground outline-none"/>
      <div className="mt-1 text-right"><button type="button" disabled={busy || !value.trim()} onClick={save} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50">{busy?'Guardando…':'Guardar nota'}</button></div>
    </div>}
  </div>;
}
