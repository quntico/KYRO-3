import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, Check, Search, ChevronUp, ChevronDown, BrainCircuit, ExternalLink, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import { AGENDA_ZONE, dayKey, shiftDay, agendaRange, selectAgenda, pendingAgendaForDay, mexicoLocalToISO, readableDate } from '@/lib/agenda';

const field = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const priorityLabel = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' };
const priorityTone = { urgent: 'border-rose-400/40 bg-rose-400/10 text-rose-300', high: 'border-orange-400/40 bg-orange-400/10 text-orange-300', medium: 'border-sky-400/40 bg-sky-400/10 text-sky-300', low: 'border-border bg-secondary text-muted-foreground' };

function TaskRow({ task, busy, onComplete, onEdit, googleLink }) {
  const time = new Intl.DateTimeFormat('es-MX', { timeZone: AGENDA_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(task.due));
  const priority = priorityLabel[task.priority] || 'Sin prioridad';
  return (
    <article className="flex min-w-0 flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-3 sm:items-center sm:p-4">
      <button
        type="button"
        disabled={busy}
        onClick={() => onComplete(task)}
        aria-label={`${task.completed ? 'Marcar pendiente' : 'Completar'} ${task.title}`}
        aria-pressed={!!task.completed}
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${task.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
      >
        {task.completed ? <Check className="size-5" /> : <span className="size-4 rounded border border-muted-foreground" />}
      </button>
      <div className="min-w-0 flex-1 basis-[calc(100%_-_3.5rem)] sm:basis-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className={`min-w-0 break-words font-semibold ${task.completed ? 'text-muted-foreground line-through' : ''}`}>{task.title}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityTone[task.priority] || priorityTone.low}`}>{priority}</span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span>{task.client || 'Actividad personal'}</span><span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{time} · {task.duration_minutes || 30} min</span>
        </p>
        {task.comments && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/80">{task.comments}</p>}
        {task.google_conflict && <p role="alert" className="mt-1 text-sm text-amber-300">Cambio simultáneo en Google: revisión pendiente. Tus datos se conservan.</p>}
        {task.google_sync_error && <p className="mt-1 text-xs text-amber-300">Calendar: {task.google_sync_error}</p>}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <Button size="sm" variant="outline" className="min-h-11 sm:min-h-9" onClick={() => onEdit(task)}>Editar / reprogramar</Button>
        {task.lead_id && <Link className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-9" to={`/leads?q=${encodeURIComponent(task.client || '')}`}>Ficha</Link>}
        <a href={googleLink(task)} target="_blank" rel="noreferrer" title="Preparar evento en Google Calendar" aria-label={`Preparar ${task.title} en Google Calendar`} className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:size-9"><ExternalLink className="size-4" /></a>
      </div>
    </article>
  );
}

export default function Agenda() {
  const { tasks, leads, addTask, updateTask, removeTask, fetchData, loading, dataError } = useData();
  const [mode, setMode] = useState('day');
  const [day, setDay] = useState(dayKey());
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(() => new URLSearchParams(location.search).has('code') || new URLSearchParams(location.search).has('error'));
  const [showYarvis, setShowYarvis] = useState(true);
  const [showMissing, setShowMissing] = useState(false);
  const [quality, setQuality] = useState('');

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const today = dayKey(clock);
  const tomorrow = shiftDay(today, 1);
  const visible = useMemo(() => selectAgenda(tasks, { mode, day, status, query, now: clock }), [tasks, mode, day, status, query, clock]);
  const tomorrowTasks = useMemo(() => pendingAgendaForDay(tasks, tomorrow), [tasks, tomorrow]);
  const overdue = useMemo(() => selectAgenda(tasks, { mode: 'overdue', now: clock }), [tasks, clock]);
  const todayTasks = useMemo(() => pendingAgendaForDay(tasks, today), [tasks, today]);
  const missing = useMemo(() => leads.filter(lead => !tasks.some(task => String(task.lead_id) === String(lead.id) && !task.completed && task.status !== 'cancelled' && task.due) && !lead.next_step?.date), [leads, tasks]);
  const incomplete = useMemo(() => leads.filter(lead => quality && (!lead[quality]?.trim?.() || ['NA', 'N/A', 'SIN DATO'].includes(String(lead[quality] || '').trim().toUpperCase()))), [leads, quality]);
  const groups = useMemo(() => visible.reduce((out, task) => {
    const key = dayKey(task.due) || 'Sin fecha';
    (out[key] ??= []).push(task);
    return out;
  }, {}), [visible]);

  const openNew = lead => setEditing({ title: lead ? `Seguimiento con ${lead.name}` : '', lead_id: lead?.id || '', client: lead?.name || '', date: day, time: '09:00', duration_minutes: 30, comments: '', priority: 'medium' });
  const openEdit = task => setEditing({ ...task, date: dayKey(task.due), time: new Intl.DateTimeFormat('en-GB', { timeZone: AGENDA_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(task.due)) });

  const save = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const { date, time, ...rest } = editing;
      const task = { ...rest, lead_id: rest.lead_id ? Number(rest.lead_id) : null, due: mexicoLocalToISO(date, time), duration_minutes: Number(rest.duration_minutes), completed: rest.completed || false };
      if (task.id) await updateTask(task);
      else await addTask(task);
      setEditing(null);
      toast({ title: 'Actividad guardada', description: 'Disponible al volver a abrir KYRO.' });
    } catch (error) {
      toast({ title: 'No se guardó', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const complete = async task => {
    setBusy(task.id);
    try {
      await updateTask({ ...task, completed: !task.completed, ...(task.status === 'cancelled' ? { status: 'pending' } : {}) });
    } finally {
      setBusy(null);
    }
  };

  const selectQuickView = key => {
    setStatus('pending');
    if (key === 'today') { setDay(today); setMode('day'); }
    else if (key === 'tomorrow') { setDay(tomorrow); setMode('day'); }
    else if (key === 'week') { setDay(today); setMode('week'); }
    else if (key === 'overdue') setMode('overdue');
    else if (key === 'month') setMode('month');
    else setMode('all');
  };

  const move = amount => {
    if (mode === 'month') {
      const date = new Date(`${day.slice(0, 7)}-01T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + amount);
      setDay(date.toISOString().slice(0, 10));
    } else setDay(shiftDay(day, amount * (mode === 'week' ? 7 : 1)));
  };

  const gridStart = agendaRange('week', `${day.slice(0, 7)}-01`)[0];
  const selectedQuickView = mode === 'day' && day === today ? 'today' : mode === 'day' && day === tomorrow ? 'tomorrow' : mode;
  const dateHeading = new Intl.DateTimeFormat('es-MX', { timeZone: AGENDA_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${day}T12:00:00Z`));
  const googleLink = task => {
    const start = new Date(task.due);
    const end = new Date(start.getTime() + (task.duration_minutes || 30) * 60000);
    const format = date => date.toISOString().replace(/[-:]/g, '').replace('.000', '');
    return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: task.title, dates: `${format(start)}/${format(end)}`, ctz: AGENDA_ZONE, details: `${task.client || ''}\n${task.comments || ''}\nhttps://www.kyro.com.mx/agenda` })}`;
  };

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 md:px-6">
      <Helmet><title>Mi agenda · KYRO</title></Helmet>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Hora de Ciudad de México</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Mi agenda</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{dateHeading}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" onClick={() => setShowCalendar(open => !open)} aria-expanded={showCalendar}><CalendarDays className="mr-2 size-4" />Google Calendar</Button>
          <Button className="min-h-11" onClick={() => openNew()}><Plus className="mr-2 size-4" />Nueva actividad</Button>
        </div>
      </header>

      {showCalendar && <GoogleCalendarConnect onSync={() => fetchData({ force: true })} />}

      <section aria-label="Filtrar agenda" className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1">
          {[
            ['today', 'Hoy'], ['tomorrow', 'Mañana'], ['week', 'Semana'], ['overdue', 'Vencidos'], ['month', 'Mes'], ['all', 'Todos'],
          ].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={selectedQuickView === key} onClick={() => selectQuickView(key)} className={`min-h-11 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedQuickView === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              {label}{key === 'tomorrow' && <span className="ml-1.5 text-xs opacity-75">{loading || dataError ? '…' : tomorrowTasks.length}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-full sm:basis-64">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar actividades" placeholder="Buscar actividad, cliente o nota…" className="h-11 pl-10 pr-10" value={query} onChange={event => setQuery(event.target.value)} />
            {query && <button type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" onClick={() => setQuery('')} className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" /></button>}
          </div>
          <label className="sr-only" htmlFor="agenda-status">Estado de actividades</label>
          <select id="agenda-status" aria-label="Estado de actividades" className="h-11 min-w-44 rounded-xl border border-border bg-background px-3 text-sm" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="pending">Pendientes</option><option value="completed">Completadas</option><option value="all">Pendientes y completadas</option><option value="cancelled">Canceladas</option>
          </select>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Periodo anterior" onClick={() => move(-1)} className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeft className="size-4" /></button>
            <input type="date" aria-label="Fecha a consultar" className="h-11 min-w-0 rounded-xl border border-border bg-background px-2 text-sm [color-scheme:dark]" value={day} onChange={event => event.target.value && setDay(event.target.value)} />
            <button type="button" aria-label="Periodo siguiente" onClick={() => move(1)} className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronRight className="size-4" /></button>
            <Button variant="ghost" className="size-11 shrink-0" disabled={loading} onClick={() => fetchData({ force: true })} aria-label="Actualizar agenda" title="Actualizar agenda"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          </div>
        </div>
      </section>

      {dataError && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-300"><AlertCircle className="mt-0.5 size-4 shrink-0" />{dataError}</p>}

      {mode === 'month' && (
        <div className="grid grid-cols-7 gap-1 rounded-2xl border border-border bg-card p-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(label => <div key={label} className="p-2 text-center text-xs text-muted-foreground">{label}</div>)}
          {Array.from({ length: 42 }, (_, index) => shiftDay(gridStart, index)).map(date => {
            const count = selectAgenda(tasks, { day: date, status }).length;
            return <button key={date} type="button" onClick={() => { setDay(date); setMode('day'); }} aria-label={`${date}, ${count} actividades`} className={`min-h-16 rounded-xl p-2 text-left hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${date === today ? 'bg-primary/10 ring-1 ring-primary' : ''} ${date.slice(0, 7) !== day.slice(0, 7) ? 'opacity-40' : ''}`}>
              <span className="text-sm">{Number(date.slice(-2))}</span>{count > 0 && <span className="mt-1 block text-xs font-semibold text-primary">{count}<span className="hidden sm:inline"> actividades</span></span>}
            </button>;
          })}
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
      <section aria-labelledby="agenda-activities-title" className="min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="agenda-activities-title" className="text-xl font-semibold tracking-tight">{({ today: 'Hoy', tomorrow: 'Mañana', week: 'Esta semana', month: 'Mes', overdue: 'Vencidos', all: 'Todas las actividades' })[selectedQuickView] || 'Actividades'}</h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">{loading && !tasks.length ? 'Cargando agenda…' : `${visible.length} ${visible.length === 1 ? 'actividad' : 'actividades'}`}</p>
        </div>
        {!visible.length && (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 px-5 py-8 text-center sm:py-10">
            <CalendarDays className="mx-auto mb-3 size-9 text-primary" />
            <h3 className="font-semibold">{loading ? 'Cargando tu agenda…' : dataError ? 'No se pudo confirmar esta selección' : 'Sin actividades para esta selección'}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{dataError ? 'Reintenta la carga para confirmar tus actividades.' : 'Puedes cambiar el periodo o programar una actividad.'}</p>
            {!dataError && <Button className="mt-4 min-h-11" onClick={() => openNew()}>Crear actividad</Button>}
          </div>
        )}
        {Object.entries(groups).map(([date, items]) => (
          <section key={date} aria-label={`Actividades ${date}`} className="flex flex-col gap-2">
            {mode !== 'day' && <h3 className="text-sm font-semibold capitalize text-primary">{date === 'Sin fecha' ? date : new Intl.DateTimeFormat('es-MX', {weekday:'long',day:'numeric',month:'long',timeZone:AGENDA_ZONE}).format(new Date(`${date}T12:00:00Z`))}</h3>}
            {items.map(task => <TaskRow key={task.id} task={task} busy={busy === task.id} onComplete={item => complete(item).catch(() => {})} onEdit={openEdit} googleLink={googleLink} />)}
          </section>
        ))}
      </section>

      <aside className="min-w-0 overflow-hidden rounded-2xl border border-violet-400/35 bg-gradient-to-b from-violet-400/10 to-card">
        <button type="button" onClick={() => setShowYarvis(open => !open)} aria-expanded={showYarvis} aria-controls="yarvis-tomorrow-panel" className="flex w-full items-center gap-3 p-4 text-left focus-visible:ring-2 focus-visible:ring-primary">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><BrainCircuit className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block text-xs font-semibold tracking-wider text-violet-300">YARVIS</span><strong className="text-lg tracking-tight">Preparar mañana</strong></span>
          {showYarvis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showYarvis && <div id="yarvis-tomorrow-panel" className="border-t border-violet-400/20 p-4">
          <p className="mb-3 text-sm font-semibold capitalize">{new Intl.DateTimeFormat('es-MX', {timeZone: AGENDA_ZONE, weekday:'long',day:'numeric',month:'long'}).format(new Date(`${tomorrow}T12:00:00Z`))}</p>
          {dataError ? <p role="alert" className="text-sm text-rose-300">No se pudo actualizar la agenda. Usa el botón de actualizar para reintentar.</p> : loading ? <p className="text-sm text-muted-foreground">Consultando tus actividades…</p> : <>
            {tomorrowTasks.length ? <ol className="max-h-96 overflow-y-auto divide-y divide-border/60">{tomorrowTasks.map(task => <li key={task.id}>
              <button type="button" onClick={() => openEdit(task)} className="grid w-full grid-cols-[3.25rem_1fr] items-start gap-3 rounded-lg py-3 text-left hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-primary">
                <time className="rounded-md bg-violet-400/10 py-1 text-center text-sm font-semibold tabular-nums text-violet-300">{new Intl.DateTimeFormat('es-MX', {timeZone:AGENDA_ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(task.due))}</time>
                <span className="min-w-0"><strong className="block break-words text-sm">{task.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{task.client || 'Actividad personal'} · {priorityLabel[task.priority] || 'Sin prioridad'}</span></span>
              </button></li>)}</ol> : <p className="py-3 text-sm text-muted-foreground">Tienes el día libre de actividades programadas en KYRO.</p>}
            {overdue.length > 0 && <button type="button" onClick={() => selectQuickView('overdue')} className="mt-3 flex w-full items-center gap-2 rounded-lg border border-rose-400/25 px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-400/10"><Clock className="h-4 w-4" />Ver vencidos ({overdue.length})</button>}
          </>}
        </div>}
      </aside>
      </div>

      <section aria-label="Resumen de agenda" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Hoy', value: todayTasks.length, color: 'text-cyan-300', click: () => selectQuickView('today') },
          { label: 'Esta semana', value: selectAgenda(tasks, { mode: 'week', day: today }).length, color: 'text-blue-400', click: () => selectQuickView('week') },
          { label: 'Vencidos', value: overdue.length, color: 'text-rose-400', click: () => selectQuickView('overdue') },
          { label: 'Sin próxima acción', value: missing.length, color: 'text-amber-300', click: () => setShowMissing(open => !open) },
        ].map(card => <button key={card.label} type="button" onClick={card.click} className="rounded-xl border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="text-xs text-muted-foreground">{card.label}</span><span className={`mt-1 block text-xl font-bold ${card.color}`}>{card.value}</span></button>)}
      </section>

      {showMissing && <section className="rounded-2xl border border-amber-400/30 bg-card p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Prospectos sin próxima acción</h2><Button variant="ghost" className="min-h-11" onClick={() => setShowMissing(false)}>Cerrar</Button></div>{dataError ? <p role="alert" className="text-sm text-rose-300">No se pudieron confirmar los datos de agenda.</p> : <div className="mt-3 grid max-h-72 gap-2 overflow-auto md:grid-cols-3">{missing.map(lead => <button key={lead.id} type="button" onClick={() => openNew(lead)} className="min-h-11 rounded-xl bg-background p-3 text-left text-sm"><strong>{lead.name}</strong><span className="mt-1 block text-primary">+ Agendar seguimiento</span></button>)}</div>}</section>}

      <section className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <label className="text-sm text-muted-foreground">Datos por completar <select aria-label="Datos por completar" className="ml-2 min-h-11 rounded-xl border border-border bg-card px-3" value={quality} onChange={event => setQuality(event.target.value)}><option value="">Elegir campo</option><option value="contact">Sin contacto</option><option value="email">Sin correo</option><option value="phone">Sin teléfono</option></select></label>
        {quality && <span className="text-sm text-amber-300">{incomplete.length} prospectos · Los datos se actualizan solo cuando tú los edites.</span>}
      </section>
      {quality && <div className="grid max-h-52 gap-2 overflow-auto rounded-2xl border border-border bg-card p-3 md:grid-cols-3">{incomplete.map(lead => <Link key={lead.id} to={`/leads?q=${encodeURIComponent(lead.name)}`} className="rounded-xl border border-border p-3 text-sm hover:text-primary">{lead.name} →</Link>)}</div>}

      <Dialog open={!!editing} onOpenChange={open => !saving && !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle><DialogDescription>Se guarda en tu agenda. Los datos del prospecto se conservan.</DialogDescription></DialogHeader>
          {editing && <form onSubmit={save} className="flex flex-col gap-4">
            <label className="block text-sm">Actividad<input required maxLength={200} className={field} value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
            <label className="block text-sm">Prospecto<select className={field} value={editing.lead_id || ''} onChange={event => { const lead = leads.find(item => String(item.id) === event.target.value); setEditing({ ...editing, lead_id: event.target.value, client: lead?.name || '' }); }}><option value="">Actividad personal / sin prospecto</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-sm">Fecha<input required type="date" className={`${field} [color-scheme:dark]`} value={editing.date} onChange={event => setEditing({ ...editing, date: event.target.value })} /></label><label className="text-sm">Hora · CDMX<input required type="time" className={`${field} [color-scheme:dark]`} value={editing.time} onChange={event => setEditing({ ...editing, time: event.target.value })} /></label></div>
            <label className="block text-sm">Prioridad<select className={field} value={editing.priority || 'medium'} onChange={event => setEditing({ ...editing, priority: event.target.value })}><option value="urgent">Urgente</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></label>
            <label className="block text-sm">Duración en minutos<input type="number" required min="5" max="1440" step="5" className={field} value={editing.duration_minutes} onChange={event => setEditing({ ...editing, duration_minutes: event.target.value })} /></label>
            <label className="block text-sm">Notas de la actividad<textarea className={`${field} min-h-24`} rows="3" value={editing.comments || ''} onChange={event => setEditing({ ...editing, comments: event.target.value })} /></label>
            {editing.id && <Button type="button" variant="outline" className="min-h-11" disabled={saving} onClick={async () => { if (!window.confirm('¿Cancelar esta actividad? El historial y el prospecto se conservan.')) return; setSaving(true); try { await removeTask(editing.id); setEditing(null); } catch {} finally { setSaving(false); } }}>Cancelar actividad</Button>}
            <Button type="submit" disabled={saving} className="min-h-11 w-full">{saving ? 'Guardando…' : 'Guardar actividad'}</Button>
          </form>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
