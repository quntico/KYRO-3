import React, { useState, useRef } from 'react';
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
import { Upload, X, Building, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const ManageCompaniesDialog = ({ isOpen, onOpenChange, companies, onSave }) => {
  const { theme } = useTheme();
  const [localCompanies, setLocalCompanies] = useState([]);
  const fileInputRefs = useRef([]);

  React.useEffect(() => {
    if (isOpen && companies) {
      setLocalCompanies(JSON.parse(JSON.stringify(companies)));
    }
  }, [isOpen, companies]);

  const handleNameChange = (id, newName) => {
    setLocalCompanies(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const handleLogoUpload = (id, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Archivo no válido",
        description: "Por favor selecciona una imagen para el logo."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalCompanies(prev => prev.map(c => c.id === id ? { ...c, logo: e.target.result } : c));
      toast({
        title: "Logo Cargado",
        description: "La imagen se ha asignado correctamente a la empresa."
      });
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = (id) => {
    setLocalCompanies(prev => prev.map(c => c.id === id ? { ...c, logo: '' } : c));
  };

  const handleSave = () => {
    onSave(localCompanies);
    toast({
      title: "Configuración Guardada",
      description: "Los nombres y logos de tus 5 empresas se han actualizado."
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-border glass-bevel shadow-2xl z-[60] bg-card text-foreground`}>
        <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/10">
          <DialogTitle className="text-xl font-black uppercase tracking-wider text-foreground">Configurar Mis 5 Empresas</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            Personaliza los nombres y sube los logos de tus 5 unidades de negocio para segmentar tu CRM de leads.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar max-h-[60vh]">
          <div className="space-y-4">
            {localCompanies.map((company, index) => (
              <div 
                key={company.id} 
                className="p-5 bg-card border border-border rounded-2xl flex flex-col md:flex-row md:items-center gap-6 hover:bg-secondary/30 transition-all"
              >
                {/* Logo Uploader Column */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="relative w-20 h-20 rounded-xl bg-secondary/30 border border-dashed border-border flex items-center justify-center overflow-hidden group">
                    {company.logo ? (
                      <>
                        <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-2" />
                        <button
                          type="button"
                          onClick={() => clearLogo(company.id)}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <Building className="w-8 h-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => fileInputRefs.current[index] = el}
                    onChange={(e) => handleLogoUpload(company.id, e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="border-border text-foreground hover:bg-secondary text-[9px] h-7 px-3 font-bold uppercase tracking-wider rounded-lg"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Logo
                  </Button>
                </div>

                {/* Info Input Column */}
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                    Empresa Gestora #{index + 1}
                  </Label>
                  <Input
                    value={company.name}
                    onChange={(e) => handleNameChange(company.id, e.target.value)}
                    placeholder={`Nombre de la Empresa Gestora ${index + 1}`}
                    className="bg-background border-border text-foreground font-bold rounded-xl h-12 focus:border-primary/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border bg-secondary/10 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground hover:bg-secondary h-11 px-5 font-bold uppercase tracking-wider text-[10px] rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 font-bold uppercase tracking-wider text-[10px] rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.2)]"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCompaniesDialog;
