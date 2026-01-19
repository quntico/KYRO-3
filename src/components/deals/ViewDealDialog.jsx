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
    import { toast } from '@/components/ui/use-toast';
    import { File, Download, ExternalLink, X, CheckCircle, Circle, ClipboardCheck, Clock, FileCheck2, DollarSign } from 'lucide-react';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { supabase } from '@/lib/customSupabaseClient';

    const closingSteps = [
      { id: 'contractReview', label: 'Revisión de Contrato', Icon: ClipboardCheck },
      { id: 'waitingPO', label: 'Esperando OC', Icon: Clock },
      { id: 'poReceived', label: 'OC Recibida', Icon: FileCheck2 },
      { id: 'depositReceived', label: 'Anticipo Recibido', Icon: DollarSign },
    ];

    const ViewDealDialog = ({ isOpen, setIsOpen, deal, setDeals, onRevert }) => {
      const { theme } = useTheme();
      const [activityStatus, setActivityStatus] = useState({});
      const [viewingPdf, setViewingPdf] = useState(null);
      const [pdfObjectUrl, setPdfObjectUrl] = useState(null);

      useEffect(() => {
        if (isOpen && deal) {
          setActivityStatus(deal.closing_status || {});
        }
        if (!isOpen) {
          setViewingPdf(null);
        }
      }, [isOpen, deal]);

      useEffect(() => {
        if (viewingPdf) {
          try {
            const base64String = viewingPdf.url.split(',')[1];
            const byteCharacters = atob(base64String);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const objectUrl = URL.createObjectURL(blob);
            setPdfObjectUrl(objectUrl);

            return () => {
              URL.revokeObjectURL(objectUrl);
              setPdfObjectUrl(null);
            };
          } catch (error) {
            toast({ title: "Error al cargar PDF", description: "No se pudo procesar el archivo para visualización.", variant: "destructive"});
            setViewingPdf(null);
          }
        }
      }, [viewingPdf]);

      const handleStatusChange = (stepId) => {
        setActivityStatus(prevStatus => {
          const newStatus = { ...prevStatus };
          const step = newStatus[stepId];
          
          newStatus[stepId] = {
            checked: !step?.checked,
            date: !step?.checked ? new Date().toISOString() : null,
          };
          
          return newStatus;
        });
      };

      const handleSaveStatus = async () => {
        const { data: updatedDeal, error } = await supabase
            .from('deals')
            .update({ closing_status: activityStatus, last_activity: new Date().toISOString() })
            .eq('id', deal.id)
            .select()
            .single();

        if (error) {
            toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive"});
        } else {
            setDeals(prevDeals => prevDeals.map(d => d.id === deal.id ? updatedDeal : d));
            toast({ title: "¡Estado de Cierre Actualizado!", description: `El estado de "${deal.title}" ha sido guardado.` });
            setIsOpen(false);
        }
      };

      if (!deal) return null;
      
      const handleViewPdf = (file) => {
        if (!file.url || !file.url.startsWith('data:application/pdf;base64,')) {
            toast({ title: "Archivo no soportado", description: "El formato de la cotización no es un PDF válido o no se encuentra.", variant: "destructive"});
            return;
        }
        setViewingPdf(file);
      };
      
      const downloadPdf = (file) => {
        if (!file.url) {
            toast({ title: "Error de descarga", description: "No se encontró el archivo para descargar.", variant: "destructive"});
            return;
        }
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.fileName || 'cotizacion.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className={viewingPdf ? "sm:max-w-4xl h-[90vh]" : "sm:max-w-md"}>
            {viewingPdf ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="truncate">Visor: {viewingPdf.fileName}</DialogTitle>
                        <DialogDescription>Revisando cotización para {deal.client}.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadPdf(viewingPdf)}>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setViewingPdf(null)}>
                            <X className="w-4 h-4 mr-2" />
                            Cerrar Visor
                        </Button>
                    </div>
                </div>
                <div className="flex-grow w-full h-full bg-muted/20 rounded-lg overflow-hidden">
                    {pdfObjectUrl && (
                      <iframe 
                          src={pdfObjectUrl} 
                          title={viewingPdf.fileName}
                          className="w-full h-full"
                          frameBorder="0"
                      >
                      </iframe>
                    )}
                </div>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Detalles de la Venta: {deal.title}</DialogTitle>
                  <DialogDescription>
                    {deal.client} - {deal.contact}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Seguimiento de Cierre</h3>
                    <div className="space-y-3">
                      {closingSteps.map(({ id, label, Icon }) => {
                        const isChecked = activityStatus[id]?.checked;
                        return (
                          <div
                            key={id}
                            className="flex items-center cursor-pointer group"
                            onClick={() => handleStatusChange(id)}
                          >
                            <div className="relative mr-3">
                              {isChecked ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                <Circle className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                              )}
                            </div>
                            <Icon className={`w-5 h-5 mr-3 ${isChecked ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                            <span className={`font-medium ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {deal.quotations && deal.quotations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Cotizaciones Adjuntas</h3>
                      <div className="space-y-2">
                        {deal.quotations.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <File className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{file.fileName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                               <Button variant="ghost" size="sm" onClick={() => handleViewPdf(file)}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Ver
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPdf(file)}>
                                  <Download className="w-4 h-4" />
                               </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="sm:justify-between">
                  <Button variant="outline" onClick={() => onRevert(deal)}>
                    Revertir a Prospecto
                  </Button>
                  <Button 
                    onClick={handleSaveStatus}
                    className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-cyan-400 to-purple-500 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}
                  >
                    Guardar Estado
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      );
    };

    export default ViewDealDialog;