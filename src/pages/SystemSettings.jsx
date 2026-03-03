import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Link as LinkIcon, Lock, Save, Unlock, Loader2, Building2, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { ICON_MAP } from '@/constants/leadStatuses';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // Import Popover

const SystemSettings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { leadStatuses, addLeadStatus, deleteLeadStatus } = useData();

    // Auth State
    const [pin, setPin] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Quotations State
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // UI State
    const [activeTab, setActiveTab] = useState('quotations'); // quotations | statuses
    const [iconPopoverOpen, setIconPopoverOpen] = useState(false); // State for icon popover

    // Status Form State
    const [newStatusLabel, setNewStatusLabel] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('text-blue-400');
    const [newStatusIcon, setNewStatusIcon] = useState('Sparkles');

    const colors = [
        { label: 'Azul', value: 'text-blue-400' },
        { label: 'Rojo', value: 'text-red-400' },
        { label: 'Verde', value: 'text-green-400' },
        { label: 'Amarillo', value: 'text-yellow-400' },
        { label: 'Morado', value: 'text-purple-400' },
        { label: 'Naranja', value: 'text-orange-400' },
        { label: 'Cyan', value: 'text-cyan-400' },
        { label: 'Teal', value: 'text-teal-400' },
        { label: 'Rosa', value: 'text-pink-400' },
        { label: 'Gris', value: 'text-gray-400' },
    ];

    const availableIcons = Object.keys(ICON_MAP);

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

    const handleAddStatus = async () => {
        if (!newStatusLabel.trim()) return;
        setSaving(true);
        await addLeadStatus({
            label: newStatusLabel,
            type: newStatusLabel,
            color: newStatusColor,
            icon: newStatusIcon
        });
        setNewStatusLabel('');
        setSaving(false);
        toast({ title: "Status agregado", description: "El nuevo status está listo para usarse." });
    };

    const handleDeleteStatus = async (id) => {
        if (confirm('¿Estás seguro de eliminar este status?')) {
            await deleteLeadStatus(id);
            toast({ title: "Status eliminado", description: "El status ha sido removido." });
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl"
                >
                    <div className="flex flex-col items-center mb-6 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Ajustes del Sistema</h1>
                        <p className="text-muted-foreground mt-2">
                            Ingresa la clave maestra para acceder a la configuración avanzada.
                        </p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="sr-only">PIN de acceso</Label>
                            <Input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="• • • •"
                                className="text-center text-3xl tracking-[1em] font-mono h-14"
                                autoFocus
                                maxLength={4}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg">
                            Acceder
                        </Button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background">
            <header className="px-8 py-6 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Unlock className="w-6 h-6 text-primary" />
                        Ajustes del Sistema
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configuración avanzada y gestión global.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                        Bloquear
                    </Button>
                    {activeTab === 'quotations' && (
                        <Button onClick={handleSave} disabled={saving || loading} className="min-w-[140px] gap-2">
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
                    )}
                </div>
            </header>

            <div className="flex items-center px-8 border-b border-border gap-6 bg-card/20">
                <button
                    onClick={() => setActiveTab('quotations')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'quotations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Gestión de Cotizaciones
                </button>
                <button
                    onClick={() => setActiveTab('statuses')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'statuses' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Status de Prospectos
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'statuses' ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Agregar Nuevo Status</h2>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full space-y-2">
                                    <Label>Nombre del Status</Label>
                                    <Input
                                        value={newStatusLabel}
                                        onChange={(e) => setNewStatusLabel(e.target.value)}
                                        placeholder="Ej. Visita Realizada"
                                    />
                                </div>
                                <div className="w-full md:w-48 space-y-2">
                                    <Label>Color</Label>
                                    <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colors.map(c => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full bg-current ${c.value}`} />
                                                        {c.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full md:w-auto flex-1 space-y-2">
                                    <Label>Icono</Label>
                                    <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={iconPopoverOpen} className="w-full justify-between px-3 min-w-[140px]">
                                                {(() => {
                                                    const SelectedIcon = ICON_MAP[newStatusIcon] || Icons.Sparkles;
                                                    return (
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <SelectedIcon className="w-4 h-4 shrink-0" />
                                                            <span className="truncate">{newStatusIcon}</span>
                                                        </div>
                                                    );
                                                })()}
                                                <Icons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[340px] p-0" align="start">
                                            <div className="p-4">
                                                <h4 className="mb-2 font-medium leading-none text-muted-foreground text-xs uppercase tracking-wider">Selecciona un Icono</h4>
                                                <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                                    {availableIcons.map(iconName => {
                                                        const IconComp = ICON_MAP[iconName];
                                                        const isSelected = newStatusIcon === iconName;
                                                        return (
                                                            <div
                                                                key={iconName}
                                                                onClick={() => {
                                                                    setNewStatusIcon(iconName);
                                                                    setIconPopoverOpen(false);
                                                                }}
                                                                className={`
                                                                     aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all
                                                                     hover:scale-110 hover:shadow-lg hover:bg-primary hover:text-primary-foreground
                                                                     ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary shadow-lg' : 'bg-secondary/50 text-muted-foreground'}
                                                                 `}
                                                                title={iconName}
                                                            >
                                                                <IconComp className="w-5 h-5" />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <Button onClick={handleAddStatus} disabled={saving} className="min-w-[100px]">
                                    Agregar
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Status Existentes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {leadStatuses.map((status) => {
                                    const IconComp = ICON_MAP[status.icon] || Icons.Sparkles;
                                    return (
                                        <motion.div
                                            key={status.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border group hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-secondary ${status.color}`}>
                                                    <IconComp className="w-5 h-5" />
                                                </div>
                                                <span className="font-medium">{status.label}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteStatus(status.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Icons.Trash2 className="w-4 h-4" />
                                            </Button>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="animate-pulse">Sincronizando con la nube...</p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-4">
                            {leads.map((lead) => (
                                <motion.div
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group"
                                >
                                    <div className="flex-1 space-y-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 font-semibold text-lg">
                                            <Building2 className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                                            {lead.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground ml-7">
                                            {lead.contact}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-[600px] flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${lead.dynamic_quotation_url ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                            <Input
                                                value={lead.dynamic_quotation_url || ''}
                                                onChange={(e) => handleUrlChange(lead.id, e.target.value)}
                                                placeholder="https://..."
                                                className={`pl-10 h-10 transition-all font-mono text-sm ${lead.dynamic_quotation_url ? 'border-primary/30 bg-primary/5' : ''}`}
                                            />
                                        </div>
                                        {lead.dynamic_quotation_url && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="shrink-0 h-10 w-10"
                                                onClick={() => copyToClipboard(lead.dynamic_quotation_url, lead.id)}
                                                title="Copiar enlace"
                                            >
                                                {copiedId === lead.id ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default SystemSettings;
