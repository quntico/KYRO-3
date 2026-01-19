import React, { useState, useMemo, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Users, Search, Filter, Eye, MoreVertical, FileText, Download, XCircle } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    } from "@/components/ui/table";
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
    } from "@/components/ui/dialog";
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu";
    import { Badge } from '@/components/ui/badge';
    import ClientFileViewerDialog from '@/components/deals/ClientFileViewerDialog';

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Revisión de Contrato': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'Esperando OC': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
            case 'OC Recibida': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            case 'Anticipo Recibido': return 'bg-green-500/20 text-green-500 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };


    const Clients = ({ deals, setDeals }) => {
      const { theme } = useTheme();
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedClient, setSelectedClient] = useState(null);
      const [isClientFileViewerOpen, setIsClientFileViewerOpen] = useState(false);
      const [viewingQuotation, setViewingQuotation] = useState(null);
      const [pdfObjectUrl, setPdfObjectUrl] = useState(null);

      useEffect(() => {
        if (viewingQuotation) {
          try {
            const base64String = viewingQuotation.url.split(',')[1];
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
            setViewingQuotation(null);
          }
        }
      }, [viewingQuotation]);

      const filteredClients = useMemo(() => {
        return deals.filter(deal =>
          deal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (deal.contact_email && deal.contact_email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }, [deals, searchTerm]);

      const handleViewFile = (deal) => {
        setSelectedClient(deal);
        setIsClientFileViewerOpen(true);
      };

      const handleViewQuotation = (deal) => {
        if (deal.quotations && deal.quotations.length > 0) {
          const quotation = deal.quotations[0];
           if (!quotation.url || !quotation.url.startsWith('data:application/pdf;base64,')) {
              toast({ title: "Archivo no soportado", description: "El formato de la cotización no es un PDF válido o no se encuentra.", variant: "destructive"});
              return;
          }
          setViewingQuotation(quotation);
        } else {
          toast({
            title: "Sin Cotización",
            description: "Este cliente no tiene una cotización adjunta.",
          });
        }
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

      const handleAction = (action) => {
        toast({
          title: `🚧 ${action}`,
          description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
        });
      };
      
      const handleCloseDialogs = () => {
        setIsClientFileViewerOpen(false);
        setSelectedClient(null);
        setViewingQuotation(null);
      }


      return (
        <>
          <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
            <Helmet>
              <title>Clientes - KYRO</title>
              <meta name="description" content="Gestiona tu base de clientes activos en KYRO CRM." />
            </Helmet>
            <div className="p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                  <div>
                    <h1 className={`text-3xl font-bold mb-1 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Clientes</h1>
                    <p className="text-muted-foreground">Listado de clientes con ventas concretadas.</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Buscar clientes por nombre, empresa o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto flex items-center space-x-2 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
                    onClick={() => handleAction('Filtros')}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtros</span>
                  </Button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente / Empresa</TableHead>
                          <TableHead className="hidden md:table-cell">Contacto</TableHead>
                          <TableHead className="hidden lg:table-cell">Valor</TableHead>
                          <TableHead>Estado del Proyecto</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.length > 0 ? filteredClients.map((deal) => (
                          <TableRow key={deal.id}>
                            <TableCell>
                              <div className="font-medium">{deal.contact}</div>
                              <div className="text-sm text-muted-foreground">{deal.client}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="text-sm">{deal.contact_email || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">{deal.contact_phone || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-medium">${(deal.value || 0).toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`font-mono ${getStatusBadge(deal.stage)}`}>
                                    {deal.stage || 'No definido'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewFile(deal)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Expediente
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleViewQuotation(deal)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver Cotización
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              {searchTerm ? 'No se encontraron clientes con tu búsqueda.' : 'No hay clientes aún.'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                </div>
              </motion.div>
            </div>
          </div>
          
          {isClientFileViewerOpen && selectedClient && (
            <ClientFileViewerDialog
              isOpen={isClientFileViewerOpen}
              onClose={handleCloseDialogs}
              deal={selectedClient}
              setDeals={setDeals}
            />
          )}

          {viewingQuotation && (
              <Dialog open={true} onOpenChange={handleCloseDialogs}>
                <DialogContent className="sm:max-w-4xl h-[90vh]">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="truncate">Visor: {viewingQuotation.fileName}</DialogTitle>
                            <DialogDescription>Revisando cotización.</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => downloadPdf(viewingQuotation)}>
                                <Download className="w-4 h-4 mr-2" />
                                Descargar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCloseDialogs}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Cerrar Visor
                            </Button>
                        </div>
                    </div>
                    <div className="flex-grow w-full h-full bg-muted/20 rounded-lg overflow-hidden">
                        {pdfObjectUrl && (
                          <iframe 
                              src={pdfObjectUrl} 
                              title={viewingQuotation.fileName}
                              className="w-full h-full"
                              frameBorder="0"
                          >
                          </iframe>
                        )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
          )}

        </>
      );
    };

    export default Clients;