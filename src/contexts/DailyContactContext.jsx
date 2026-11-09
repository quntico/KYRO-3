import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {contactDay, dailyContacts, setContacted} from '@/lib/dailyContacts';
import {toast} from '@/components/ui/use-toast';

const DailyContactContext = createContext(null);

export function DailyContactProvider({userId, children}) {
  const storageKey = `kyro-contacted-today-${userId}`;
  const read = () => {
    try { return localStorage.getItem(storageKey); } catch { return null; }
  };
  const [state, setState] = useState(() => dailyContacts(read()));
  const latest = useRef(state);
  const storageWarning = useRef(false);
  const publish = useCallback(next => { latest.current = next; setState(next); }, []);

  useEffect(() => {
    // One clock for the whole workspace, including tabs left open overnight.
    const refresh = () => {
      const day = contactDay();
      if (latest.current.day !== day) publish({day, ids: []});
    };
    const sync = event => {
      if (event.key === storageKey || event.key === null) publish(dailyContacts(event.newValue));
    };
    const timer = setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('storage', sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('storage', sync);
    };
  }, [storageKey, publish]);

  const mark = useCallback((id, checked) => {
    const day = contactDay();
    let base = latest.current;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null && !storageWarning.current) base = dailyContacts(raw, day);
    } catch { /* Keep this session usable when browser storage is unavailable. */ }
    const next = setContacted(base, id, checked, day);
    publish(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch {
      if (!storageWarning.current) {
        storageWarning.current = true;
        toast({title: 'Marca guardada en esta sesión', description: 'El navegador no permitió conservarla al recargar.', variant: 'destructive'});
      }
    }
  }, [storageKey, publish]);

  const value = useMemo(() => ({ids: new Set(state.ids), mark}), [state, mark]);
  return <DailyContactContext.Provider value={value}>{children}</DailyContactContext.Provider>;
}

export const useDailyContacts = () => useContext(DailyContactContext);
