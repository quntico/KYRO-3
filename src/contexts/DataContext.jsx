import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

        const fetchData = useCallback(async () => {
            if (!user) {
                setLeads([]);
                setDeals([]);
                setTasks([]);
                setContacts([]);
                setLoading(false);
                return;
            };
            
            setLoading(true);
            try {
                const [
                    { data: leadsData, error: leadsError },
                    { data: dealsData, error: dealsError },
                    { data: tasksData, error: tasksError },
                    { data: contactsData, error: contactsError },
                ] = await Promise.all([
                    supabase.from('leads').select('*').eq('user_id', user.id),
                    supabase.from('deals').select('*').eq('user_id', user.id),
                    supabase.from('tasks').select('*').eq('user_id', user.id),
                    supabase.from('contacts').select('*').eq('user_id', user.id),
                ]);

                if (leadsError) throw leadsError;
                if (dealsError) throw dealsError;
                if (tasksError) throw tasksError;
                if (contactsError) throw contactsError;

                setLeads(leadsData || []);
                setDeals(dealsData || []);
                setTasks(tasksData || []);
                setContacts(contactsData || []);
            } catch (error) {
                toast({ title: 'Error al cargar los datos', description: error.message, variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        }, [user]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        const updateLead = useCallback((updatedLead) => {
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        }, []);

        const removeLead = useCallback((leadId) => {
            setLeads(prev => prev.filter(l => l.id !== leadId));
        }, []);

        const addLead = useCallback((newLead) => {
            setLeads(prev => [newLead, ...prev]);
        }, []);

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

        const removeTask = useCallback((taskId) => {
            setTasks(prev => prev.filter(t => t.id !== taskId));
        }, []);

        const value = useMemo(() => ({
            leads,
            deals,
            tasks,
            contacts,
            loading,
            fetchData,
            updateLead,
            removeLead,
            addLead,
            setTasks,
            addTask,
            updateTask,
            updateTaskByLeadId,
            removeTask,
        }), [leads, deals, tasks, contacts, loading, fetchData, updateLead, removeLead, addLead, addTask, updateTask, updateTaskByLeadId, removeTask]);

        return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
    };

    export const useData = () => {
        const context = useContext(DataContext);
        if (context === undefined) {
            throw new Error('useData must be used within a DataProvider');
        }
        return context;
    };