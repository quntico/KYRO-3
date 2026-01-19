import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
    } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { UploadCloud, File, Calendar as CalendarIcon, Bell, X, PlusCircle, Trash2, DollarSign } from 'lucide-react';
    import { Checkbox } from "@/components/ui/checkbox";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { Calendar } from "@/components/ui/calendar";
    import { cn } from "@/lib/utils";
    import { format } from "date-fns";
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select";
    import { supabase } from '@/lib/customSupabaseClient';
    import { Textarea } from '@/components/ui/textarea';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const EditLeadDialog = ({ isOpen, onOpenChange, lead, onUpdate }) => {
      const { user } = useAuth();
      const [editingLead, setEditingLead] = useState(null);
      const [files, setFiles] = useState([]);
      const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
      const [followUpDate, setFollowUpDate] = useState(null);
      const [followUpTime, setFollowUpTime] = useState("09:00");
      const fileInputRef = useRef(null);

      const statusOptions = useMemo(() => [
        { value: 'new', label: 'Nuevo' },
        { value: 'hot', label: 'Caliente' },
        { value: 'warm', label: 'Tibio' },
        { value: 'cold', label: 'Frío' },
      ], []);

      useEffect(() => {
        if (isOpen && lead) {
          setEditingLead({ ...lead });
          setFiles(lead.quotations || []);
          const hasFollowUp = !!lead.follow_up_date;
          setScheduleFollowUp(hasFollowUp);
          if (hasFollowUp) {
            const date = new Date(lead.follow_up_date);
            setFollowUpDate(date);
            setFollowUpTime(format(date, "HH:mm"));
          } else {
            setFollowUpDate(new Date());
            setFollowUpTime("09:00");
          }
        } else if (!isOpen) {
          setEditingLead(null);
          setFiles([]);
          setScheduleFollowUp(false);
        }
      }, [isOpen, lead]);

      const handleInputChange = useCallback((e) => {
        const { id, value } = e.target;
        setEditingLead(prev => ({ ...prev, [id]: value }));
      }, []);
      
      const handleTextareaChange = useCallback((e) => {
        const { id, value } = e.target;
        setEditingLead(prev => ({ ...prev, [id]: value }));
      }, []);

      const handleStatusChange = useCallback((value) => {
        setEditingLead(prev => ({ ...prev, status: value }));
      }, []);

      const onMachineChange = useCallback((index, field, value) => {
        setEditingLead(prev => {
          if (!prev) return null;
          const newMachines = [...(prev.machines || [])];
          newMachines[index] = {...newMachines[index], [field]: value};
          return { ...prev, machines: newMachines };
        });
      }, []);

      const addMachine = useCallback(() => {
        setEditingLead(prev => {
          if (!prev) return null;
          return {
            ...prev,
            machines: [...(prev.machines || []), { name: '', price: '', commission: '' }]
          }
        });
      }, []);

      const removeMachine = useCallback((index) => {
        setEditingLead(prev => {
          if (!prev) return null;
          const newMachines = prev.machines.filter((_, i) => i !== index);
          return { ...prev, machines: newMachines };
        });
      }, []);

      const { totalSaleAmount, totalCommission } = useMemo(() => {
        if (!editingLead?.machines) return { totalSaleAmount: 0, totalCommission: 0 };
        return editingLead.machines.reduce((acc, machine) => {
          acc.totalSaleAmount += Number(machine.price) || 0;
          acc.totalCommission += Number(machine.commission) || 0;
          return acc;
        }, { totalSaleAmount: 0, totalCommission: 0 });
      }, [editingLead]);

      const handleFileChange = useCallback((e) => {
        if (e.target.files) {
          const selectedFiles = Array.from(e.target.files);
          const filePromises = selectedFiles.map(file => {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                resolve({ url: event.target.result, fileName: file.name });
              };
              reader.readAsDataURL(file);
            });
          });

          Promise.all(filePromises).then(newFilesData => {
            setFiles(prevFiles => [...prevFiles, ...newFilesData]);
          });

          toast({
            title: "Archivos seleccionados",
            description: `${selectedFiles.length} archivo(s) listos para subirse.`,
          });
        }
      }, []);

      const removeFile = useCallback((index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
      }, []);

      const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        const droppedFiles = Array.from(event.dataTransfer.files).filter(f => f.type === 'application/pdf');
        const filePromises = droppedFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({ url: e.target.result, fileName: file.name });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(filePromises).then(newFilesData => {
          setFiles(prevFiles => [...prevFiles, ...newFilesData]);
        });
      }, []);

      const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
      }, []);

      const handleSubmit = useCallback(async () => {
        if (!editingLead) return;

        const [hours, minutes] = followUpTime.split(':').map(Number);
        const finalFollowUpDate = scheduleFollowUp && followUpDate ? new Date(new Date(followUpDate).setHours(hours, minutes, 0, 0)).toISOString() : null;

        const updatePayload = {
          name: editingLead.name,
          contact: editingLead.contact,
          position: editingLead.position,
          email: editingLead.email,
          phone: editingLead.phone,
          status: editingLead.status,
          machines: editingLead.machines,
          notes: editingLead.notes,
          quotations: files,
          follow_up_date: finalFollowUpDate,
          last_activity: new Date().toISOString(),
          score: editingLead.score,
        };

        const { data: updatedLead, error } = await supabase
          .from('leads')
          .update(updatePayload)
          .eq('id', editingLead.id)
          .select()
          .single();

        if (error) {
          toast({ title: "Error al actualizar prospecto", description: error.message, variant: "destructive" });
          return;
        }

        onUpdate(updatedLead);

        if (scheduleFollowUp && finalFollowUpDate) {
          const { error: taskError } = await supabase
            .from('tasks')
            .upsert({ 
              lead_id: updatedLead.id,
              title: `Seguimiento con ${updatedLead.name}`,
              due: finalFollowUpDate,
              priority: 'medium',
              user_id: user.id,
            }, { onConflict: 'lead_id' });
            if (taskError) {
                toast({ title: "Error actualizando tarea de seguimiento", description: taskError.message, variant: "destructive" });
            }
        } else {
            await supabase.from('tasks').delete().eq('lead_id', updatedLead.id);
        }

        toast({ title: "¡Prospecto Actualizado!", description: `El prospecto "${updatedLead.name}" ha sido actualizado.` });
        onOpenChange(false);
      }, [editingLead, followUpTime, scheduleFollowUp, followUpDate, files, onUpdate, onOpenChange, user]);

      if (!isOpen || !editingLead) return null;

      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Prospecto: {editingLead.name}</DialogTitle>
              <DialogDescription>
                Actualiza la información y agenda un seguimiento si es necesario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Empresa</Label>
                  <Input id="name" value={editingLead.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contacto</Label>
                  <Input id="contact" value={editingLead.contact} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="position">Puesto</Label>
                  <Input id="position" value={editingLead.position || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={editingLead.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={editingLead.phone} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={handleStatusChange} value={editingLead.status}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecciona un status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Máquinas/Proyectos</Label>
                <div className="space-y-2">
                  {(editingLead.machines || []).map((machine, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                      <Input 
                        value={machine.name} 
                        onChange={(e) => onMachineChange(index, 'name', e.target.value)} 
                        placeholder="Nombre de la máquina"
                        className="flex-1"
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          value={machine.price} 
                          onChange={(e) => onMachineChange(index, 'price', e.target.value)} 
                          placeholder="Precio"
                          className="w-32 pl-7"
                        />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          value={machine.commission} 
                          onChange={(e) => onMachineChange(index, 'commission', e.target.value)} 
                          placeholder="Comisión"
                          className="w-32 pl-7"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeMachine(index)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addMachine}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Agregar otra máquina
                </Button>
              </div>

              <div className="space-y-4 bg-secondary p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Venta Total</span>
                    <span className="text-2xl font-bold text-primary">${totalSaleAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Comisión Total</span>
                    <span className="text-xl font-bold text-yellow-400">${totalCommission.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={editingLead.notes}
                    onChange={handleTextareaChange}
                    placeholder="Añade un comentario sobre la última conversación o un detalle importante..."
                    className="h-24"
                  />
              </div>
              
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf"
                  multiple
                />
                <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta PDFs aquí, o haz clic para seleccionar</p>
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground truncate">{file.fileName}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="schedule-follow-up" checked={scheduleFollowUp} onCheckedChange={setScheduleFollowUp} />
                <Label htmlFor="schedule-follow-up">Agendar Seguimiento</Label>
              </div>

              {scheduleFollowUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="follow-up-date">Fecha de Seguimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !followUpDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {followUpDate ? format(followUpDate, "PPP") : <span>Elige una fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={followUpDate}
                          onSelect={setFollowUpDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="follow-up-time">Hora</Label>
                    <Input id="follow-up-time" type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleSubmit}>Guardar Cambios</Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    };

    export default React.memo(EditLeadDialog);