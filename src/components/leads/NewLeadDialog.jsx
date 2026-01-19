import React, { useState, useRef, useCallback, useMemo } from 'react';
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogFooter,
    } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { UploadCloud, File, X, PlusCircle, Trash2, DollarSign } from 'lucide-react';
    import { Textarea } from '@/components/ui/textarea';
    
    const NewLeadDialog = ({ open, onOpenChange, onSubmit }) => {
      const [company, setCompany] = useState('');
      const [name, setName] = useState('');
      const [position, setPosition] = useState('');
      const [email, setEmail] = useState('');
      const [phone, setPhone] = useState('');
      const [files, setFiles] = useState([]);
      const [machines, setMachines] = useState([{ name: '', price: '', commission: '' }]);
      const [notes, setNotes] = useState('');
      const fileInputRef = useRef(null);

      const resetForm = useCallback(() => {
        setCompany('');
        setName('');
        setPosition('');
        setEmail('');
        setPhone('');
        setFiles([]);
        setMachines([{ name: '', price: '', commission: '' }]);
        setNotes('');
      }, []);
    
      const handleOpenChange = useCallback((isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        onOpenChange(isOpen);
      }, [onOpenChange, resetForm]);

      const handleFileChange = (e) => {
        if (e.target.files) {
          const selectedFiles = Array.from(e.target.files);
          const newFiles = [...files];
          
          selectedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
              newFiles.push({ url: event.target.result, fileName: file.name });
              if (newFiles.length === files.length + selectedFiles.length) {
                setFiles(newFiles);
              }
            };
            reader.readAsDataURL(file);
          });
    
          toast({
            title: "Archivos seleccionados",
            description: `${selectedFiles.length} archivo(s) listos para subirse.`,
          });
        }
      };
    
      const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
      };
    
      const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        const droppedFiles = Array.from(event.dataTransfer.files);
        const newFiles = [...files];

        droppedFiles.forEach(file => {
          if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (e) => {
              newFiles.push({ url: e.target.result, fileName: file.name });
              if (newFiles.length === files.length + droppedFiles.filter(f => f.type === 'application/pdf').length) {
                setFiles(newFiles);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }, [files]);
    
      const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
      }, []);
    
      const handleSubmit = useCallback(() => {
        if (!company || !name) {
          toast({ variant: "destructive", title: "Campos Requeridos", description: "Por favor, completa el nombre de la empresa y del contacto." });
          return;
        }
        onSubmit({ company, name, position, email, phone, machines, quotations: files, notes });
      }, [company, name, position, email, phone, machines, files, notes, onSubmit]);

      const onMachineChange = (index, field, value) => {
        const newMachines = [...machines];
        newMachines[index][field] = value;
        setMachines(newMachines);
      };

      const addMachine = () => {
        setMachines([...machines, { name: '', price: '', commission: '' }]);
      };

      const removeMachine = (index) => {
        setMachines(machines.filter((_, i) => i !== index));
      };
      
      const { totalSaleAmount, totalCommission } = useMemo(() => {
        return machines.reduce((acc, machine) => {
          acc.totalSaleAmount += Number(machine.price) || 0;
          acc.totalCommission += Number(machine.commission) || 0;
          return acc;
        }, { totalSaleAmount: 0, totalCommission: 0 });
      }, [machines]);

      return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Prospecto</DialogTitle>
              <DialogDescription>
                Completa los detalles para crear una nueva oportunidad de venta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nombre de la empresa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Contacto</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del contacto principal" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="position">Puesto</Label>
                  <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ej: Gerente de Compras" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono de contacto" />
                </div>
              </div>

               <div className="space-y-2">
                <Label>Máquinas/Proyectos</Label>
                <div className="space-y-2">
                  {machines.map((machine, index) => (
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añade un comentario sobre la última conversación o un detalle importante..."
                    className="h-24"
                  />
              </div>

              <div className="space-y-2">
                <Label>Cotizaciones (PDF)</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta PDFs aquí, o haz clic para seleccionar</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" multiple />
                <div className="mt-2 space-y-2">
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
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>Crear Prospecto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };
    
    export default NewLeadDialog;