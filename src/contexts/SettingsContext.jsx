import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({ greetings: 'Hola,Bienvenido', logo_url: null, theme: null, themeSettings: null });
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
                .maybeSingle();

            if (data) {
                let parsedGreetings = data.greetings || 'Hola,Bienvenido';
                let themeFromCloud = null;
                let themeSettingsFromCloud = null;
                try {
                    const parsed = JSON.parse(data.greetings);
                    parsedGreetings = parsed.greetings || 'Hola,Bienvenido';
                    themeFromCloud = parsed.theme || null;
                    themeSettingsFromCloud = parsed.themeSettings || null;
                } catch (e) {
                    // Not JSON, keep raw greetings string
                }

                setSettings(prev => ({
                    ...prev,
                    greetings: parsedGreetings,
                    logo_url: data.logo_url,
                    theme: themeFromCloud,
                    themeSettings: themeSettingsFromCloud
                }));
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

    const saveSettingsToCloud = useCallback(async (updates) => {
        if (!user) return { success: false, error: new Error("No user logged in") };
        try {
            const { data } = await supabase
                .from('user_settings')
                .select('greetings, logo_url')
                .eq('id', user.id)
                .maybeSingle();

            let rawGreetings = data?.greetings || 'Hola,Bienvenido';
            let parsed = { greetings: 'Hola,Bienvenido' };
            try {
                parsed = JSON.parse(rawGreetings);
            } catch (e) {
                parsed = { greetings: rawGreetings };
            }

            if (updates.greetings !== undefined) {
                parsed.greetings = updates.greetings;
            }
            if (updates.theme !== undefined) {
                parsed.theme = updates.theme;
            }
            if (updates.themeSettings !== undefined) {
                parsed.themeSettings = updates.themeSettings;
            }

            const jsonGreetings = JSON.stringify(parsed);
            const payload = {
                id: user.id,
                greetings: jsonGreetings,
            };
            if (updates.logo_url !== undefined) {
                payload.logo_url = updates.logo_url;
            } else if (data?.logo_url) {
                payload.logo_url = data.logo_url;
            }

            const { error } = await supabase
                .from('user_settings')
                .upsert(payload, { onConflict: 'id' });

            setSettings(prev => ({
                ...prev,
                ...updates
            }));

            return { success: !error, error };
        } catch (error) {
            console.error("Error saving settings to cloud:", error);
            setSettings(prev => ({
                ...prev,
                ...updates
            }));
            return { success: false, error };
        }
    }, [user]);

    const value = useMemo(() => ({
        settings,
        setSettings,
        loading,
        refetchSettings: fetchSettings,
        saveSettingsToCloud
    }), [settings, loading, fetchSettings, saveSettingsToCloud]);

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