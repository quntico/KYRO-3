import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const SettingsContext = createContext();

    export const SettingsProvider = ({ children }) => {
        const { user } = useAuth();
        const [settings, setSettings] = useState({ greetings: 'Hola,Bienvenido', logo_url: null });
        const [loading, setLoading] = useState(true);

        const fetchSettings = useCallback(async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('greetings, logo_url')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                } else if (error && error.code !== 'PGRST116') {
                    throw error;
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        }, [user]);

        useEffect(() => {
            fetchSettings();
        }, [user, fetchSettings]);

        const value = useMemo(() => ({
            settings,
            setSettings,
            loading,
            refetchSettings: fetchSettings
        }), [settings, loading, fetchSettings]);

        return (
            <SettingsContext.Provider value={value}>
                {children}
            </SettingsContext.Provider>
        );
    };

    export const useSettings = () => {
        const context = useContext(SettingsContext);
        if (context === undefined) {
            throw new Error('useSettings must be used within a SettingsProvider');
        }
        return context;
    };