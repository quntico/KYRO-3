import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Unlock, Link as LinkIcon, Save, X, Loader2, Building2, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const EditorModeDialog = ({ isOpen, onOpenChange }) => {
    const { theme } = useTheme();
    const [pin, setPin] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [copiedId, setCopiedId] = useState(null);

    // Reset state when closing
    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setIsAuthenticated(false);
            setLeads([]);
            setCopiedId(null);
        }
    }, [isOpen]);

    const copyToClipboard = (text, id) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({
            title: "Copiado",
            description: "Enlace copiado al portapapeles.",
        });
    };

    const handleAuth = (e) => {
        if (e) e.preventDefault();
        if (pin === '2020') {
            setIsAuthenticated(true);
            fetchLeads();
        } else {
            toast({
                variant: "destructive",
                title: "Acceso Denegado",
                description: "La clave ingresada es incorrecta.",
            });
            setPin('');
        }
    };

    const fetchLeads = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            toast({
                variant: "destructive",
                title: "Error al cargar prospectos",
                description: error.message,
            });
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    };

    const handleUrlChange = (id, url) => {
        setLeads(prev => prev.map(lead =>
            lead.id === id ? { ...lead, dynamic_quotation_url: url } : lead
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Realizamos actualizaciones individuales para asegurar integridad
            const updatePromises = leads.map(lead =>
                supabase
                    .from('leads')
                    .update({ dynamic_quotation_url: lead.dynamic_quotation_url })
                    .eq('id', lead.id)
            );

            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                throw new Error(`Error en ${errors.length} actualizaciones.`);
            }

            toast({
                title: "Cambios Guardados",
                description: "Todas las URLs han sido actualizadas exitosamente.",
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: error.message,
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px] glass-bevel">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            Editor Mode
                        </DialogTitle>
                        <DialogDescription>
                            Ingresa la clave maestra para acceder a la gestión de enlaces.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAuth} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="pin">PIN de acceso</Label>
                            <Input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="****"
                                className="text-center text-2xl tracking-[1em] font-mono"
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full">Acceder</Button>
                    </form>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl glass-bevel max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Unlock className="w-6 h-6 text-green-400" />
                                Gestión Centralizada de Cotizaciones
                            </DialogTitle>
                            <DialogDescription>
                                Edita las URLs dinámicas de todos tus prospectos desde aquí.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-muted-foreground animate-pulse">Sincronizando con la nube...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {leads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center"
                                >
                                    <div className="flex-1 space-y-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 text-primary font-bold">
                                            <Building2 className="w-4 h-4 text-primary/50" />
                                            {lead.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground ml-6">
                                            {lead.contact}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-[450px] flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${lead.dynamic_quotation_url ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                            <Input
                                                value={lead.dynamic_quotation_url || ''}
                                                onChange={(e) => handleUrlChange(lead.id, e.target.value)}
                                                placeholder="Sin enlace asignado..."
                                                className={`pl-10 transition-all ${lead.dynamic_quotation_url ? 'border-primary/50 bg-primary/5' : ''}`}
                                            />
                                        </div>
                                        {lead.dynamic_quotation_url && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0 h-10 w-10 border-white/10 hover:bg-primary/20"
                                                onClick={() => copyToClipboard(lead.dynamic_quotation_url, lead.id)}
                                            >
                                                {copiedId === lead.id ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading} className="gap-2 min-w-[140px]">
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
};

export default EditorModeDialog;
