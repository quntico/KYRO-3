import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { partitionPipeline, convertLeadToSale, revertSaleToLead, setSaleDeleted } from '@/lib/dealConversion';
import { cleanConversationNotes } from '@/lib/conversationNotes';
import { DEFAULT_STATUSES } from '@/constants/leadStatuses';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

import { taskPayload } from '@/lib/agenda';
import { loadWorkspaceData, readArrayCache } from '@/lib/workspaceLoader';

const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [pipelineLoading, setPipelineLoading] = useState(true);
    const [dataError, setDataError] = useState(null);
    const pipelineReady = useRef(null);
    const inFlight = useRef(null);
    const currentUser = useRef(user?.id);
    currentUser.current = user?.id;
    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [deletedDeals, setDeletedDeals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [notes, setNotes] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [leadStatuses, setLeadStatuses] = useState(DEFAULT_STATUSES);

    // Sync from cache whenever user becomes available
    useEffect(() => {
        if (user?.id) {
            const loadCache = (key, setter, fallback = []) => {
                const cached = readArrayCache(localStorage, `kyro-${key}-${user.id}`);
                setter(cached ?? fallback);
                return cached !== null;
            };
            const hasLeads = loadCache('leads', setLeads);
            const hasDeals = loadCache('deals', setDeals);
            const cachedPipeline = hasLeads && hasDeals;
            pipelineReady.current = cachedPipeline ? user.id : null;
            setPipelineLoading(!cachedPipeline);

            loadCache('deletedDeals', setDeletedDeals);
            loadCache('tasks', setTasks);
            loadCache('contacts', setContacts);
            loadCache('notes', setNotes);
            loadCache('logistics', setLogistics);
            loadCache('leadStatuses', setLeadStatuses, DEFAULT_STATUSES);
        } else {
            inFlight.current?.controller.abort();pipelineReady.current=null;
            setLeads([]);setDeals([]);setDeletedDeals([]);setTasks([]);setContacts([]);setNotes([]);setLogistics([]);
        }
    }, [user?.id]);

    const fetchData = useCallback((options = {}) => {
        const userId = user?.id;
        if (!userId) { setLoading(false); setPipelineLoading(false); return Promise.resolve(); }
        if (inFlight.current?.userId === userId) {
            return options.force ? inFlight.current.promise.then(() => fetchData()) : inFlight.current.promise;
        }
        inFlight.current?.controller.abort();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const isCurrent = () => currentUser.current === userId;
        setDataError(null);
        setPipelineLoading(pipelineReady.current !== userId);
        setLoading(true);
        const promise = loadWorkspaceData({
            db: supabase, userId, signal: controller.signal,
            onPipeline: (rawLeads, rawDeals) => {
                if (!isCurrent()) return;
                const pipeline = partitionPipeline(rawLeads, rawDeals);
                const trash = rawDeals.filter(d => d.closing_status?.deleted_at && !d.closing_status?.reverted_at);
                setLeads(pipeline.leads);
                setDeals(pipeline.deals);
                setDeletedDeals(trash);
                pipelineReady.current = userId;
                saveToCache(`leads-${userId}`, pipeline.leads);
                saveToCache(`deals-${userId}`, pipeline.deals);
                saveToCache(`deletedDeals-${userId}`, trash);
            },
            onSection: (table, data) => {
                if (!isCurrent()) return;
                if(table==='notes') {setNotes(previous=>{const merged=[...data,...previous.filter(n=>!data.some(d=>String(d.id)===String(n.id)))];saveToCache(`notes-${userId}`,merged);return merged;});return;}
                ({tasks: setTasks, contacts: setContacts, logistics: setLogistics})[table](data);
                saveToCache(`${table}-${userId}`, data);
            },
            onPipelineSettled: () => { if (isCurrent()) setPipelineLoading(false); },
            onError: (section, error) => {
                console.error(`Error fetching ${section}:`, error);
                if (isCurrent()) setDataError(section==='pipeline'?'No se pudo actualizar la cartera. Tus datos guardados se conservan.':`No se pudo actualizar ${section==='tasks'?'la agenda':section}. Reintenta para confirmar la información.`);
            },
        }).finally(() => {
            clearTimeout(timeout);
            if (inFlight.current?.promise === promise) inFlight.current = null;
            if (isCurrent()) setLoading(false);
        });
        inFlight.current = {userId, promise, controller};
        return promise;
    }, [user?.id]);

    const saveToCache = (key, data) => {
        try {
            localStorage.setItem(`kyro-${key}`, JSON.stringify(data));
        } catch (e) {
            // A full browser cache must never erase the user's other KYRO settings.
            console.warn('No se pudo actualizar la caché local:', e.name);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const removeLead = useCallback(async (leadId) => {
        try {
            const { error } = await supabase.from('leads').delete().eq('id', leadId).select('id').single();
            if (error) throw error;
            setLeads(prev => prev.filter(l => l.id !== leadId));
        } catch (error) {
            toast({title:'No se pudo borrar', description:error.message, variant:'destructive'}); throw error;
        }
    }, []);

    const convertLead = useCallback(async (leadId) => {
        const deal = await convertLeadToSale(supabase, user?.id, leadId);
        setDeals(prev => [deal, ...prev.filter(d => d.id !== deal.id)]);
        setLeads(prev => prev.filter(l => String(l.id) !== String(leadId)));
        return deal;
    }, [user?.id]);

    const revertDeal = useCallback(async (dealId) => {
        await revertSaleToLead(supabase, user?.id, dealId);
        await fetchData({force: true});
    }, [user?.id, fetchData]);

    const setDealDeleted = useCallback(async (dealId, deleted) => {
        await setSaleDeleted(supabase, user?.id, dealId, deleted);
        await fetchData({force: true});
    }, [user?.id, fetchData]);

    const updateLead = useCallback(async (id, updates) => {
        if (!updates || !id) throw new Error('Actualización de prospecto incompleta.');
        if (updates.quotations?.some(file => file.deferred)) throw new Error('Carga la ficha completa antes de modificar sus documentos.');
        if ('notes' in updates) updates = { ...updates, notes: cleanConversationNotes(updates.notes) };
        try {
            const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select('id').single();
            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
            return {data: {...updates, id}, error:null};
        } catch (error) {
            toast({title:'No se guardaron los cambios', description:error.message, variant:'destructive'}); throw error;
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
            return null;
        }
    }, [user]);

    const addLead = useCallback(async (lead) => {
        if ('notes' in lead) lead = { ...lead, notes: cleanConversationNotes(lead.notes) };
        try {
            const { data, error } = await supabase.from('leads').insert([{ ...lead, user_id: user?.id }]).select().single();
            if (error) throw error;
            setLeads(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Error adding lead:', error);
            toast({title:'No se guardó el prospecto', description:error.message, variant:'destructive'}); throw error;
        }
    }, [user]);

    const persistTask = useCallback(async (task, existing = false) => {
        const payload = taskPayload(task, user?.id);
        const query = existing ? supabase.from('tasks').update(payload).eq('id',task.id).eq('user_id',user.id) : supabase.from('tasks').insert(payload);
        const {data,error} = await query.select().single();
        if(error) {toast({title:'No se guardó la tarea',description:error.message,variant:'destructive'}); throw error;}
        setTasks(prev => {const next = [data,...prev.filter(t=>t.id!==data.id)]; saveToCache(`tasks-${user.id}`,next); return next;});
        return data;
    }, [user?.id]);
    const addTask = useCallback(task => persistTask(task), [persistTask]);
    const updateTask = useCallback(task => persistTask(task,true), [persistTask]);
    const updateTaskByLeadId = useCallback((_leadId, updatedTask) => {
        setTasks(prev => [updatedTask,...prev.filter(t=>t.id!==updatedTask.id)]);
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

    const removeTask = useCallback(async (taskId) => {
        const {error} = await supabase.from('tasks').update({status:'cancelled',completed:true}).eq('id',taskId).eq('user_id',user.id).select('id').single();
        if(error) {toast({title:'No se pudo cancelar',description:error.message,variant:'destructive'}); throw error;}
        setTasks(prev => prev.map(t=>t.id===taskId ? {...t,status:'cancelled',completed:true} : t));
    }, [user?.id]);

    const addNote = useCallback(async (note) => {
        try {
            const { data, error } = await supabase.from('notes').insert([{ ...note, user_id: user?.id }]).select();
            if (error) throw error;
            setNotes(prev => [data[0], ...prev]);
            return data[0];
        } catch (error) {
            toast({title:'No se guardó la nota',description:error.message,variant:'destructive'}); throw error;
        }
    }, [user]);

    const updateNote = useCallback(async (id, updates) => {
        try {
            const { error } = await supabase.from('notes').update(updates).eq('id', id).select('id').single();
            if (error) throw error;
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        } catch (error) {
            toast({title:'No se guardó la nota',description:error.message,variant:'destructive'}); throw error;
        }
    }, []);

    const deleteNote = useCallback(async (id) => {
        try {
            const { error } = await supabase.from('notes').delete().eq('id', id).select('id').single();
            if (error) throw error;
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            toast({title:'No se pudo borrar la nota',description:error.message,variant:'destructive'}); throw error;
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
        deletedDeals,
        setDealDeleted,
        tasks,
        contacts,
        notes,
        logistics,
        loading,
        pipelineLoading,
        dataError,
        fetchData,
        updateLead,
        removeLead,
        addLead,
        updateDeal,
        removeDeal,
        addDeal,
        convertLead,
        revertDeal,
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
    }), [leads, deals, deletedDeals, setDealDeleted, tasks, contacts, notes, logistics, loading, pipelineLoading, dataError, fetchData, updateLead, removeLead, addLead, updateDeal, removeDeal, addDeal, convertLead, revertDeal, addTask, updateTask, updateTaskByLeadId, removeTask, updateLogistics, removeLogistics, addLogistics, addNote, updateNote, deleteNote, uploadMedia, leadStatuses]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
