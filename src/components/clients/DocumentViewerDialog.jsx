import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';

const DocumentViewerDialog = ({ isOpen, onClose, documentName, documentType, client }) => {

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text(`Documento: ${documentName}`, 14, 22);
      doc.setFontSize(12);
      doc.text(`Cliente: ${client.companyName}`, 14, 30);
      
      doc.text("Este es un PDF de ejemplo generado desde KYROS CRM.", 14, 50);
      doc.text("El contenido real del documento estaría aquí.", 14, 60);

      doc.save(`${documentType}_${client.companyName.replace(/\s/g, '_')}.pdf`);

      toast({
        title: "¡PDF Exportado!",
        description: "El documento ha sido exportado a PDF correctamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: "No se pudo generar el PDF. Inténtalo de nuevo.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[60vw] lg:max-w-[50vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Visor de Documentos
          </DialogTitle>
          <DialogDescription>
            Visualizando: <span className="font-semibold text-primary">{documentName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow bg-muted/40 rounded-lg border flex items-center justify-center overflow-hidden my-4">
          <div className="w-full h-full p-4">
            <img
              className="w-full h-full object-contain"
              alt={`Vista previa del documento ${documentName}`}
             src="https://images.unsplash.com/photo-1554252116-ed7971ea7623" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar a PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerDialog;