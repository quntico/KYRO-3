import React, { useState, useEffect, useCallback } from 'react';
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
    import { File, Send, FileSearch, Calendar, Video, Gem, CheckCircle, Circle, Download, ExternalLink, X } from 'lucide-react';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { supabase } from '@/lib/customSupabaseClient';

    const activitySteps = [
      { id: 'quotationSent', label: 'Cotización Enviada', Icon: Send },
      { id: 'quotationReview', label: 'Revisión de Cotización', Icon: FileSearch },
      { id: 'appointment', label: 'Cita', Icon: Calendar },
      { id: 'zoom', label: 'Zoom', Icon: Video },
      { id: 'closing', label: 'Próximo a Cierre', Icon: Gem },
    ];

    const ViewLeadDialog = ({ isOpen, setIsOpen, lead, onUpdate }) => {
      const { theme } = useTheme();
      const [activityStatus, setActivityStatus] = useState({});
      const [viewingPdf, setViewingPdf] = useState(null);
      const [pdfObjectUrl, setPdfObjectUrl] = useState(null);

      useEffect(() => {
        if (isOpen && lead) {
          setActivityStatus(lead.activity_status || {});
        }
        if (!isOpen) {
          setViewingPdf(null);
        }
      }, [isOpen, lead]);

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

      const handleStatusChange = useCallback((stepId) => {
        setActivityStatus(prevStatus => {
          const newStatus = { ...prevStatus };
          const step = newStatus[stepId];
          
          newStatus[stepId] = {
            checked: !step?.checked,
            date: !step?.checked ? new Date().toISOString() : null,
          };
          
          return newStatus;
        });
      }, []);

      const handleSaveStatus = useCallback(async () => {
        if (!lead) return;
        const firstUncheckedStep = activitySteps.find(step => !activityStatus[step.id]?.checked);
        const nextStep = firstUncheckedStep 
          ? { type: firstUncheckedStep.label, date: null }
          : { type: 'Cierre Completado', date: new Date().toISOString() };

        const { data: updatedLead, error } = await supabase
            .from('leads')
            .update({ activity_status: activityStatus, next_step: nextStep, last_activity: new Date().toISOString() })
            .eq('id', lead.id)
            .select()
            .single();

        if (error) {
            toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive"});
        } else {
            onUpdate(updatedLead);
            toast({ title: "¡Estado Actualizado!", description: `El estado de "${lead.name}" ha sido guardado.` });
            setIsOpen(false);
        }
      }, [activityStatus, lead, onUpdate, setIsOpen]);
      
      const handleViewPdf = useCallback((file) => {
        if (!file.url.startsWith('data:application/pdf;base64,')) {
            toast({ title: "Archivo no soportado", description: "El formato de la cotización no es un PDF válido.", variant: "destructive"});
            return;
        }
        setViewingPdf(file);
      }, []);
      
      const downloadPdf = useCallback((file) => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.fileName || 'cotizacion.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, []);

      if (!lead) return null;

      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className={`sm:max-w-md ${viewingPdf ? "sm:max-w-4xl h-[90vh]" : "flex flex-col"}`}>
            {viewingPdf ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="truncate">Visor: {viewingPdf.fileName}</DialogTitle>
                        <DialogDescription>Revisando cotización para {lead.name}.</DialogDescription>
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
                  <DialogTitle>Detalles del Prospecto: {lead.name}</DialogTitle>
                  <DialogDescription>
                    Visualiza las cotizaciones y actualiza el estado del prospecto.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Estado de Actividad</h3>
                    <div className="space-y-3">
                      {activitySteps.map(({ id, label, Icon }) => {
                        const isChecked = activityStatus[id]?.checked;
                        return (
                          <div
                            key={id}
                            className="flex items-center cursor-pointer group"
                            onClick={() => handleStatusChange(id)}
                          >
                            <div className="flex items-center space-x-2">
                              {isChecked ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              )}
                              <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                              <span className={`font-medium ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {lead.quotations && lead.quotations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Cotizaciones Adjuntas</h3>
                      <div className="space-y-2">
                        {lead.quotations.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden mr-2">
                              <File className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{file.fileName}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                               <Button variant="ghost" size="sm" onClick={() => handleViewPdf(file)}>
                                  <ExternalLink className="w-4 h-4" />
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
                <DialogFooter className="flex-shrink-0">
                  <Button 
                    onClick={handleSaveStatus}
                    className={`w-full ${theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-cyan-400 to-purple-500 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}
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

    export default React.memo(ViewLeadDialog);