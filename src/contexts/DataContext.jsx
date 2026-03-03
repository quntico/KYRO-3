import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_STATUSES } from '@/constants/leadStatuses';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [notes, setNotes] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [leadStatuses, setLeadStatuses] = useState(DEFAULT_STATUSES);

    // Sync from cache whenever user becomes available
    useEffect(() => {
        if (user?.id) {
            const loadCache = (key, setter) => {
                const cached = localStorage.getItem(`kyro-${key}-${user.id}`);
                if (cached) {
                    try {
                        setter(JSON.parse(cached));
                    } catch (e) {
                        console.error(`Error parsing cache for ${key}:`, e);
                    }
                }
            };

            loadCache('leads', setLeads);
            loadCache('deals', setDeals);
            loadCache('tasks', setTasks);
            loadCache('contacts', setContacts);
            loadCache('notes', setNotes);
            loadCache('notes', setNotes);
            loadCache('logistics', setLogistics);
            loadCache('leadStatuses', setLeadStatuses);

            // If we have some data in cache, we can turn off visible loading soon
            // but we still want the initial fetch to happen
        }
    }, [user?.id]);

    const fetchData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            // No bloqueamos la UI con un loader si ya tenemos datos en memoria o caché
            if (leads.length === 0) {
                const hasCache = !!localStorage.getItem(`kyro-leads-${user.id}`);
                if (!hasCache) setLoading(true);
                else setLoading(false); // Si hay caché, entramos directo
            }

            const [
                { data: leadsData, error: leadsError },
                { data: dealsData, error: dealsError },
                { data: tasksData, error: tasksError },
                { data: contactsData, error: contactsError },
                { data: notesData, error: notesError },
                { data: logisticsData, error: logisticsError },
            ] = await Promise.all([
                supabase.from('leads').select('*').eq('user_id', user.id),
                supabase.from('deals').select('*').eq('user_id', user.id),
                supabase.from('tasks').select('*').eq('user_id', user.id),
                supabase.from('contacts').select('*').eq('user_id', user.id),
                supabase.from('notes').select('*').eq('user_id', user.id),
                supabase.from('logistics').select('*').eq('user_id', user.id),
            ]);

            if (leadsError) throw leadsError;

            const safeData = (data) => data || [];

            const lData = safeData(leadsData);
            const dData = safeData(dealsData);
            const tData = safeData(tasksData);
            const cData = safeData(contactsData);
            const nData = safeData(notesData);
            const logData = safeData(logisticsData);

            setLeads(lData);
            setDeals(dData);
            setTasks(tData);
            setContacts(cData);
            setNotes(nData);
            setNotes(nData);
            setLogistics(logData);

            // Try fetch lead statuses, fallback to default if table missing or error
            try {
                const { data: statusData, error: statusError } = await supabase.from('lead_statuses').select('*').order('created_at', { ascending: true });
                if (!statusError && statusData && statusData.length > 0) {
                    setLeadStatuses(statusData);
                    localStorage.setItem(`kyro-leadStatuses-${user.id}`, JSON.stringify(statusData));
                } else {
                    // Start with default if no custom statuses found
                    localStorage.setItem(`kyro-leadStatuses-${user.id}`, JSON.stringify(DEFAULT_STATUSES));
                }
            } catch (e) {
                console.log('Using default statuses');
            }

            // Update cache
            localStorage.setItem(`kyro-leads-${user.id}`, JSON.stringify(lData));
            localStorage.setItem(`kyro-deals-${user.id}`, JSON.stringify(dData));
            localStorage.setItem(`kyro-tasks-${user.id}`, JSON.stringify(tData));
            localStorage.setItem(`kyro-contacts-${user.id}`, JSON.stringify(cData));
            localStorage.setItem(`kyro-notes-${user.id}`, JSON.stringify(nData));
            localStorage.setItem(`kyro-logistics-${user.id}`, JSON.stringify(logData));

        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const removeLead = useCallback(async (leadId) => {
        try {
            const { error } = await supabase.from('leads').delete().eq('id', leadId);
            if (error) throw error;
            setLeads(prev => prev.filter(l => l.id !== leadId));
        } catch (error) {
            setLeads(prev => prev.filter(l => l.id !== leadId));
        }
    }, []);

    const updateLead = useCallback(async (id, updates) => {
        try {
            const { error } = await supabase.from('leads').update(updates).eq('id', id);
            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        } catch (error) {
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        }
    }, []);


    const updateDeal = useCallback((updatedDeal) => {
        setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
    }, []);

    const removeDeal = useCallback((dealId) => {
        setDeals(prev => prev.filter(d => d.id !== dealId));
    }, []);

    const addDeal = useCallback(async (deal) => {
        try {
            const { data, error } = await supabase.from('deals').insert([{ ...deal, user_id: user?.id }]).select().single();
            if (error) throw error;
            setDeals(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Error adding deal:', error);
            const localDeal = { ...deal, id: Date.now(), user_id: user?.id, created_at: new Date().toISOString() };
            setDeals(prev => [localDeal, ...prev]);
            return localDeal;
        }
    }, [user]);

    const addLead = useCallback(async (lead) => {
        try {
            const { data, error } = await supabase.from('leads').insert([{ ...lead, user_id: user?.id }]).select().single();
            if (error) throw error;
            setLeads(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Error adding lead:', error);
            const localLead = { ...lead, id: Date.now(), user_id: user?.id, created_at: new Date().toISOString() };
            setLeads(prev => [localLead, ...prev]);
            return localLead;
        }
    }, [user]);

    const addTask = useCallback((newTask) => {
        setTasks(prev => [newTask, ...prev].sort((a, b) => new Date(a.due) - new Date(b.due)));
    }, []);

    const updateTask = useCallback((updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }, []);

    const updateTaskByLeadId = useCallback((leadId, updatedTask) => {
        setTasks(prev => {
            const otherTasks = prev.filter(t => t.lead_id !== leadId);
            return [...otherTasks, updatedTask];
        });
    }, []);

    const updateLogistics = useCallback((updatedLog) => {
        setLogistics(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    }, []);

    const removeLogistics = useCallback((logId) => {
        setLogistics(prev => prev.filter(l => l.id !== logId));
    }, []);

    const addLogistics = useCallback((newLog) => {
        setLogistics(prev => [newLog, ...prev]);
    }, []);

    const removeTask = useCallback((taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }, []);

    const addNote = useCallback(async (note) => {
        try {
            const { data, error } = await supabase.from('notes').insert([{ ...note, user_id: user?.id }]).select();
            if (error) throw error;
            setNotes(prev => [data[0], ...prev]);
            return data[0];
        } catch (error) {
            const localNote = { ...note, id: Date.now(), user_id: user?.id, created_at: new Date().toISOString() };
            setNotes(prev => [localNote, ...prev]);
            return localNote;
        }
    }, [user]);

    const updateNote = useCallback(async (id, updates) => {
        try {
            const { error } = await supabase.from('notes').update(updates).eq('id', id);
            if (error) throw error;
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        } catch (error) {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        }
    }, []);

    const deleteNote = useCallback(async (id) => {
        try {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            setNotes(prev => prev.filter(n => n.id !== id));
        }
    }, []);

    const uploadMedia = useCallback(async (file, clientId) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${clientId}/${Math.random()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('client-media').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('client-media').getPublicUrl(fileName);
            return publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }, []);

    const addLeadStatus = useCallback(async (newStatus) => {
        try {
            // Optimistic update
            const tempStatus = { ...newStatus, id: Date.now(), user_id: user?.id };
            setLeadStatuses(prev => [...prev, tempStatus]);

            const { data, error } = await supabase.from('lead_statuses').insert([{ ...newStatus, user_id: user?.id }]).select();
            if (error) throw error;

            // Replace temp with real
            setLeadStatuses(prev => prev.map(s => s.id === tempStatus.id ? data[0] : s));
            return data[0];
        } catch (error) {
            console.error('Error adding status:', error);
            // Revert on error if needed, but for now kept optimistic
            toast({
                title: "Error al guardar status",
                description: error.message,
                variant: "destructive"
            });
        }
    }, [user]);

    const updateLeadStatus = useCallback(async (id, updates) => {
        try {
            setLeadStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            const { error } = await supabase.from('lead_statuses').update(updates).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Error al actualizar status",
                description: error.message,
                variant: "destructive"
            });
        }
    }, []);

    const deleteLeadStatus = useCallback(async (id) => {
        try {
            setLeadStatuses(prev => prev.filter(s => s.id !== id));
            const { error } = await supabase.from('lead_statuses').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting status:', error);
            toast({
                title: "Error al eliminar status",
                description: error.message,
                variant: "destructive"
            });
        }
    }, []);

    const value = useMemo(() => ({
        leads,
        deals,
        tasks,
        contacts,
        notes,
        logistics,
        loading,
        fetchData,
        updateLead,
        removeLead,
        addLead,
        updateDeal,
        removeDeal,
        addDeal,
        setTasks,
        addTask,
        updateTask,
        updateTaskByLeadId,
        removeTask,
        updateLogistics,
        removeLogistics,
        addLogistics,
        addNote,
        updateNote,
        deleteNote,
        uploadMedia,
        leadStatuses,
        addLeadStatus,
        updateLeadStatus,
        deleteLeadStatus
    }), [leads, deals, tasks, contacts, notes, logistics, loading, fetchData, updateLead, removeLead, addLead, updateDeal, removeDeal, addDeal, addTask, updateTask, updateTaskByLeadId, removeTask, updateLogistics, removeLogistics, addLogistics, addNote, updateNote, deleteNote, uploadMedia, leadStatuses]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};