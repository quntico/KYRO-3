import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, PlusCircle, Trash2, DollarSign, User, Building, Briefcase, Mail, Phone } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { toast } from '@/components/ui/use-toast';

const ContactDialog = ({ open, onOpenChange, contact, onSubmit }) => {
  const isEditMode = !!contact;
  
  const getInitialData = () => {
    if (isEditMode) {
      const machines = contact.machines && contact.machines.length > 0 
        ? contact.machines 
        : [{ name: contact.machineModel || '', price: contact.saleAmount || '' }];
      return { ...contact, machines };
    }
    return { 
      name: '', 
      company: '', 
      position: '', 
      email: '', 
      phone: '', 
      machines: [{ name: '', price: '' }], 
      commission: '', 
      quotations: [] 
    };
  };

  const [contactData, setContactData] = useState(getInitialData);
  const [files, setFiles] = useState(contact?.quotations || []);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    setContactData(getInitialData());
    setFiles(contact?.quotations || []);
  }, [contact, open]);
  
  const title = isEditMode ? "Editar Contacto" : "Agregar Nuevo Contacto";
  const description = isEditMode
    ? "Actualiza los detalles del contacto."
    : "Completa los detalles para agregar un nuevo contacto a tu red.";
  const buttonText = isEditMode ? "Guardar Cambios" : "Guardar Contacto";

  const onInputChange = (e) => {
    const { id, value } = e.target;
    setContactData(prev => ({ ...prev, [id]: value }));
  };

  const onMachineChange = (index, field, value) => {
    const newMachines = [...contactData.machines];
    newMachines[index][field] = value;
    setContactData(prev => ({ ...prev, machines: newMachines }));
  };

  const addMachine = () => {
    setContactData(prev => ({
      ...prev,
      machines: [...(prev.machines || []), { name: '', price: '' }]
    }));
  };

  const removeMachine = (index) => {
    const newMachines = contactData.machines.filter((_, i) => i !== index);
    setContactData(prev => ({ ...prev, machines: newMachines }));
  };

  const totalSaleAmount = useMemo(() => {
    return (contactData.machines || []).reduce((sum, machine) => sum + (Number(machine.price) || 0), 0);
  }, [contactData.machines]);

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

  const handleSubmitClick = () => {
    onSubmit({ contactData, files });
  };

  const InputField = ({ id, label, placeholder, value, onChange, icon: Icon, type = "text" }) => (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} className="pl-9" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField id="name" label="Nombre" placeholder="Ej. María González" value={contactData.name} onChange={onInputChange} icon={User} />
              <InputField id="company" label="Empresa" placeholder="Ej. TechCorp Solutions" value={contactData.company} onChange={onInputChange} icon={Building} />
              <InputField id="position" label="Puesto" placeholder="Ej. CEO" value={contactData.position} onChange={onInputChange} icon={Briefcase} />
              <InputField id="email" label="Correo" type="email" placeholder="Ej. maria@techcorp.com" value={contactData.email} onChange={onInputChange} icon={Mail} />
            </div>
            <InputField id="phone" label="Móvil" placeholder="Ej. +1 555 123 4567" value={contactData.phone} onChange={onInputChange} icon={Phone} />
          </div>

          <div className="border-t border-border -mx-6"></div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Detalles de la Venta</h3>
            <div className="space-y-3">
              {(contactData.machines || []).map((machine, index) => (
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

          <div className="border-t border-border -mx-6"></div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Archivos y Resumen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quotation">Cotizaciones (PDF)</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors h-full flex flex-col justify-center"
                  onClick={() => fileInputRef.current.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta o haz clic para seleccionar</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" multiple />
                <div className="mt-2 space-y-2 max-h-24 overflow-y-auto">
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
              <div className="space-y-4 bg-secondary p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Venta Total</span>
                  <span className="text-2xl font-bold text-primary">${totalSaleAmount.toLocaleString()}</span>
                </div>
                <InputField id="commission" label="Comisión" type="number" placeholder="Ej. 5000" value={contactData.commission || ''} onChange={onInputChange} icon={DollarSign} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmitClick} className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}>{buttonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;