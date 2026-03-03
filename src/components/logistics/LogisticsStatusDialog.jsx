import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
    Factory,
    Ship,
    ShieldCheck,
    Truck,
    Home,
    ChevronRight,
    Calendar as CalendarIcon,
    Package,
    Navigation
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';

const stages = [
    { id: 'china', label: 'China', icon: Factory, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'maritime', label: 'Marítimo', icon: Ship, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 'customs', label: 'Aduanas', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'land', label: 'Terrestre', icon: Truck, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { id: 'delivery', label: 'Entrega', icon: Home, color: 'text-green-400', bg: 'bg-green-400/10' },
];

const LogisticsStatusDialog = ({ isOpen, onOpenChange, entry, onUpdate }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        current_stage: 'china',
        tracking_number: '',
        container_id: '',
        estimated_delivery: '',
        notes: '',
        machine_name: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (entry) {
            setFormData({
                current_stage: entry.current_stage || 'china',
                tracking_number: entry.tracking_number || '',
                container_id: entry.container_id || '',
                estimated_delivery: entry.estimated_delivery ? entry.estimated_delivery.split('T')[0] : '',
                notes: entry.notes || '',
                machine_name: entry.machine_name || entry.machineName || ''
            });
        }
    }, [entry, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        const { data: updatedEntry, error } = await supabase
            .from('logistics')
            .update({
                current_stage: formData.current_stage,
                tracking_number: formData.tracking_number,
                container_id: formData.container_id,
                estimated_delivery: formData.estimated_delivery || null,
                notes: formData.notes,
                last_updated: new Date().toISOString()
            })
            .eq('id', entry.id)
            .select()
            .single();

        if (error) {
            toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        } else {
            if (onUpdate) onUpdate(updatedEntry);
            toast({ title: "Logística Actualizada", description: "El estado del envío ha sido guardado exitosamente." });
            onOpenChange(false);
        }
        setLoading(false);
    };

    if (!entry) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                        <Navigation className="w-6 h-6 text-primary" />
                        TRACKING: <span className="text-primary">{formData.machine_name.toUpperCase()}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Gestiona las etapas del proceso de importación y logística.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    {/* Timeline Selector */}
                    <div className="relative flex justify-between items-center px-2">
                        <div className="absolute left-0 right-0 h-0.5 bg-border top-1/2 -translate-y-1/2 z-0" />
                        {stages.map((stage, idx) => {
                            const Icon = stage.icon;
                            const isSelected = formData.current_stage === stage.id;
                            const isPast = stages.findIndex(s => s.id === formData.current_stage) > idx;

                            return (
                                <div
                                    key={stage.id}
                                    className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                                    onClick={() => setFormData({ ...formData, current_stage: stage.id })}
                                >
                                    <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isSelected ? `${stage.bg} ${stage.color} ring-4 ring-primary/20 scale-110 shadow-lg` :
                                            isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                  `}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tracking" className="text-xs font-bold uppercase text-muted-foreground">No. de Seguimiento (BL/AWB)</Label>
                            <Input
                                id="tracking"
                                value={formData.tracking_number}
                                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                                className="bg-secondary/30 border-primary/10"
                                placeholder="Ej: ABC123456"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="container" className="text-xs font-bold uppercase text-muted-foreground">ID de Contenedor</Label>
                            <Input
                                id="container"
                                value={formData.container_id}
                                onChange={(e) => setFormData({ ...formData, container_id: e.target.value })}
                                className="bg-secondary/30 border-primary/10"
                                placeholder="Ej: MSCU1234567"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="eta" className="text-xs font-bold uppercase text-muted-foreground">Fecha Estimada de Entrega (ETA)</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="eta"
                                type="date"
                                value={formData.estimated_delivery}
                                onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                                className="pl-10 bg-secondary/30 border-primary/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-xs font-bold uppercase text-muted-foreground">Notas de Seguimiento</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="min-h-[100px] bg-secondary/30 border-primary/10"
                            placeholder="Detalles sobre el despacho, ubicación actual o incidencias..."
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className={`
                min-w-[150px] font-bold text-white
                ${theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-primary'}
            `}
                    >
                        {loading ? "GUARDANDO..." : "ACTUALIZAR ESTADO"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LogisticsStatusDialog;
