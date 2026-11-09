import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {contactDay, contactHistory, legacyContactRows} from '@/lib/dailyContacts';
import {supabase} from '@/lib/customSupabaseClient';
import {toast} from '@/components/ui/use-toast';

const DailyContactContext = createContext(null);
const readLocal = key => { try { return localStorage.getItem(key); } catch { return null; } };

export function DailyContactProvider({userId, children}) {
  const storageKey = `kyro-contact-history-${userId}`;
  const legacyKey = `kyro-contacted-today-${userId}`;
  const [history, setHistory] = useState(() => contactHistory(readLocal(storageKey)));
  const [day, setDay] = useState(contactDay);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(new Set());
  const inFlight = useRef(new Set());
  const revision = useRef(0);
  const loading = useRef(false);
  const mounted = useRef(true);
  const initialized = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(history)); } catch { /* Database is authoritative. */ }
  }, [history, storageKey]);

  const refresh = useCallback(async () => {
    if (loading.current || inFlight.current.size) return;
    loading.current = true;
    const version = revision.current;
    try {
      // Preserve the user's existing local checks, including their original date.
      if (!initialized.current) {
        const rows = legacyContactRows(readLocal(legacyKey), userId);
        if (rows.length) {
          const {error} = await supabase.from('kyro_contact_days').upsert(rows, {
            onConflict: 'user_id,record_key,contact_date', ignoreDuplicates: true,
          });
          if (error) throw error;
        }
        try { localStorage.removeItem(legacyKey); } catch { /* Idempotent import can safely retry. */ }
        initialized.current = true;
      }
      const {data, error} = await supabase.from('kyro_last_contacts')
        .select('record_key,last_contact_date').eq('user_id', userId);
      if (error) throw error;
      if (!mounted.current || version !== revision.current) return;
      const next = Object.fromEntries((data || []).map(row => [row.record_key, row.last_contact_date]));
      setHistory(previous => Object.keys(previous).length === Object.keys(next).length && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
      setError(false);
      setReady(true);
    } catch {
      if (mounted.current) setError(true);
    } finally { loading.current = false; }
  }, [legacyKey, userId]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const clock = setInterval(() => setDay(current => {
      const today = contactDay(); return current === today ? current : today;
    }), 1000);
    const sync = () => {
      if (document.visibilityState === 'hidden') return;
      setDay(contactDay());
      refresh();
    };
    const poll = setInterval(sync, 30000);
    window.addEventListener('focus', sync);
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      mounted.current = false;
      clearInterval(clock); clearInterval(poll);
      window.removeEventListener('focus', sync);
      window.removeEventListener('online', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [refresh]);

  const mark = useCallback(async (id, checked) => {
    if (!ready || inFlight.current.has(id)) return;
    inFlight.current.add(id);
    revision.current++;
    setPending(new Set(inFlight.current));
    try {
      const {data, error} = await supabase.rpc('kyro_mark_contact', {
        p_user_id: userId, p_record_key: id, p_checked: checked,
      });
      if (error || !data?.length) throw error || new Error('Missing saved contact');
      if (!mounted.current) return;
      setDay(data[0].business_day);
      setHistory(previous => {
        const next = {...previous};
        if (data[0].last_contact_date) next[id] = data[0].last_contact_date; else delete next[id];
        return next;
      });
      setError(false);
    } catch {
      if (mounted.current) toast({title: 'No se pudo guardar el contacto', description: 'La marca no cambió. Revisa tu conexión e intenta de nuevo.', variant: 'destructive'});
    } finally {
      inFlight.current.delete(id);
      revision.current++;
      if (mounted.current) setPending(new Set(inFlight.current));
    }
  }, [userId, ready]);

  const value = useMemo(() => ({history, day, pending, ready, error, refresh, mark,
    ids: new Set(Object.keys(history).filter(key => history[key] === day)),
  }), [history, day, pending, ready, error, refresh, mark]);
  return <DailyContactContext.Provider value={value}>{children}</DailyContactContext.Provider>;
}
export const useDailyContacts = () => useContext(DailyContactContext);
