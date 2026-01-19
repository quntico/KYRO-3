import React, { useState, useEffect, useRef } from 'react';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from "@/components/ui/dialog";
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { toast } from '@/components/ui/use-toast';
    import { Checkbox } from '@/components/ui/checkbox';
    import { UploadCloud, CheckCircle, XCircle, User, Mail, Phone, Building, FileText, Download, ExternalLink } from 'lucide-react';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { supabase } from '@/lib/customSupabaseClient';

    const ClientFileViewerDialog = ({ isOpen, onClose, deal, setDeals }) => {
      const { theme } = useTheme();
      const [clientData, setClientData] = useState({
        hasCSF: false,
        csfFile: null,
        taxData: '',
        deliveryAddress: '',
        salesConditions: {
          anticipoPercentage: 50,
          pago2Percentage: 50,
          pago3Percentage: 0,
          notes: ''
        },
      });
      const [csfFileName, setCsfFileName] = useState('');
      const [sameAddress, setSameAddress] = useState(false);
      const [viewingPdf, setViewingPdf] = useState(null);
      const [pdfObjectUrl, setPdfObjectUrl] = useState(null);
      const fileInputRef = useRef(null);
      
      useEffect(() => {
        if (deal?.client_file) {
          setClientData({
            hasCSF: deal.client_file.hasCSF || false,
            csfFile: deal.client_file.csfFile || null,
            taxData: deal.client_file.taxData || '',
            deliveryAddress: deal.client_file.deliveryAddress || '',
            salesConditions: deal.client_file.salesConditions || { anticipoPercentage: 50, pago2Percentage: 50, pago3Percentage: 0, notes: '' },
          });
          setCsfFileName(deal.client_file.csfFileName || '');
        } else {
           setClientData({
            hasCSF: false,
            csfFile: null,
            taxData: '',
            deliveryAddress: '',
            salesConditions: { anticipoPercentage: 50, pago2Percentage: 50, pago3Percentage: 0, notes: '' },
          });
          setCsfFileName('');
        }
      }, [deal]);

      useEffect(() => {
        if (sameAddress) {
          setClientData(prev => ({ ...prev, deliveryAddress: prev.taxData }));
        }
      }, [sameAddress, clientData.taxData]);

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

      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setClientData(prev => ({ ...prev, [id]: value }));
      };

      const handleSalesConditionsChange = (e) => {
        const { id, value } = e.target;
        const numValue = Number(value);
        setClientData(prev => ({
          ...prev,
          salesConditions: {
            ...prev.salesConditions,
            [id]: isNaN(numValue) ? value : numValue,
          }
        }));
      };
      
      const handleCheckboxChange = (id, checked) => {
        if (id === 'sameAddress') {
          setSameAddress(checked);
        } else {
          setClientData(prev => ({ ...prev, [id]: checked }));
        }
      };

      const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.type !== 'application/pdf') {
            toast({ title: "Archivo no válido", description: "Por favor, sube un archivo PDF.", variant: "destructive" });
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            setClientData(prev => ({...prev, csfFile: reader.result, hasCSF: true }));
            setCsfFileName(file.name);
          };
          reader.readAsDataURL(file);
        }
      };
      
      const handleSave = async () => {
        const payload = { 
            ...clientData, 
            csfFileName: csfFileName 
        };

        const { data: updatedDeal, error } = await supabase
          .from('deals')
          .update({ client_file: payload, last_activity: new Date().toISOString() })
          .eq('id', deal.id)
          .select()
          .single();

        if (error) {
          toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } else {
          setDeals(prevDeals => prevDeals.map(d => d.id === deal.id ? updatedDeal : d));
          toast({ title: "¡Expediente guardado!", description: "La información del cliente ha sido actualizada." });
          onClose();
        }
      };

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

      if (!deal) return null;

      const totalValue = deal.value || 0;
      const anticipoAmount = (totalValue * (clientData.salesConditions.anticipoPercentage || 0)) / 100;
      const pago2Amount = (totalValue * (clientData.salesConditions.pago2Percentage || 0)) / 100;
      const pago3Amount = (totalValue * (clientData.salesConditions.pago3Percentage || 0)) / 100;

      if (viewingPdf) {
        return (
          <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl h-[90vh]">
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
                            <XCircle className="w-4 h-4 mr-2" />
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
            </DialogContent>
          </Dialog>
        );
      }

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Expediente del Cliente</DialogTitle>
              <DialogDescription>
                Información administrativa y fiscal para la venta: {deal.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="p-4 border rounded-lg bg-secondary/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold mb-3">Información de Contacto</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                       <p className="flex items-center"><Building className="w-4 h-4 mr-2 text-primary" /> {deal.client}</p>
                       <p className="flex items-center"><User className="w-4 h-4 mr-2 text-primary" /> {deal.contact}</p>
                       <p className="flex items-center"><Mail className="w-4 h-4 mr-2 text-primary" /> {deal.contact_email || 'N/A'}</p>
                       <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-primary" /> {deal.contact_phone || 'N/A'}</p>
                    </div>
                  </div>
                  {deal.quotations && deal.quotations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => handleViewPdf(deal.quotations[0])}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Cotización
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="hasCSF" checked={clientData.hasCSF} onCheckedChange={(checked) => handleCheckboxChange('hasCSF', checked)} />
                    <label htmlFor="hasCSF" className="text-sm font-medium leading-none">
                        Constancia de Situación Fiscal (CSF) Recibida
                    </label>
                </div>
                
                <div>
                  <Label htmlFor="csf-upload">Subir/Actualizar CSF (PDF)</Label>
                  <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <p className="pl-1">{csfFileName ? `Archivo: ${csfFileName}` : 'Haz clic para subir un archivo'}</p>
                      </div>
                       <p className="text-xs text-muted-foreground">Solo PDF</p>
                    </div>
                  </div>
                  <Input id="csf-upload" ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="application/pdf" />
                </div>
                {clientData.hasCSF && clientData.csfFile && (
                   <div className="text-sm flex items-center gap-2 text-green-600 font-medium">
                       <CheckCircle className="w-4 h-4" /> CSF en sistema: {csfFileName || 'Archivo adjunto'}
                   </div>
                )}
                 {clientData.hasCSF && !clientData.csfFile && (
                   <div className="text-sm flex items-center gap-2 text-yellow-600 font-medium">
                       <XCircle className="w-4 h-4" /> Marcado como recibido, pero sin archivo.
                   </div>
                )}
                
                <div>
                  <Label htmlFor="taxData">Datos Fiscales</Label>
                  <Textarea id="taxData" value={clientData.taxData} onChange={handleInputChange} placeholder="RFC, Razón Social, Dirección Fiscal..." />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deliveryAddress">Lugar de Entrega</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sameAddress" checked={sameAddress} onCheckedChange={(checked) => handleCheckboxChange('sameAddress', checked)} />
                      <label htmlFor="sameAddress" className="text-xs font-medium">Mismo que dirección fiscal</label>
                    </div>
                  </div>
                  <Textarea id="deliveryAddress" value={clientData.deliveryAddress} onChange={handleInputChange} placeholder="Dirección completa de entrega..." disabled={sameAddress} />
                </div>
                
                <div className="p-4 border rounded-lg bg-secondary/50">
                  <h3 className="font-semibold mb-3">Condiciones de Venta</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>Valor Total de Venta:</span>
                      <span className="text-primary">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="anticipoPercentage">Anticipo (%)</Label>
                        <Input type="number" id="anticipoPercentage" value={clientData.salesConditions.anticipoPercentage} onChange={handleSalesConditionsChange} />
                        <p className="text-sm text-muted-foreground mt-1">${anticipoAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <Label htmlFor="pago2Percentage">2do Pago (%)</Label>
                        <Input type="number" id="pago2Percentage" value={clientData.salesConditions.pago2Percentage} onChange={handleSalesConditionsChange} />
                        <p className="text-sm text-muted-foreground mt-1">${pago2Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <Label htmlFor="pago3Percentage">3er Pago (%)</Label>
                        <Input type="number" id="pago3Percentage" value={clientData.salesConditions.pago3Percentage} onChange={handleSalesConditionsChange} />
                        <p className="text-sm text-muted-foreground mt-1">${pago3Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notas Adicionales</Label>
                      <Textarea id="notes" value={clientData.salesConditions.notes} onChange={handleSalesConditionsChange} placeholder="Ej: Tiempos de entrega, garantía, etc." />
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-cyan-400 to-purple-500 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}>Guardar Expediente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default ClientFileViewerDialog;