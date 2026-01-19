import React from 'react';
    import { motion } from 'framer-motion';
    import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    } from "@/components/ui/table";
    import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
    import { es } from 'date-fns/locale';
    import { useTheme } from '@/contexts/ThemeContext.jsx';

    const LeadsTable = ({ leads }) => {
      const { theme } = useTheme();
      const getNextStep = (lead) => {
        if (lead.next_step && lead.next_step.type) {
          return lead.next_step.type;
        }
        const status = lead.activity_status;
        if (!status) return lead.notes || 'N/A';
        if (!status.quotationSent?.checked) return 'Enviar Cotización';
        if (!status.quotationReview?.checked) return 'Revisión de Cotización';
        if (!status.appointment?.checked) return 'Agendar Cita';
        if (!status.zoom?.checked) return 'Realizar Zoom';
        if (!status.closing?.checked) return 'Próximo a Cierre';
        return 'Cerrado';
      };

      const formatLastActivity = (dateString) => {
        if (!dateString) return 'N/A';
        
        const date = parseISO(dateString);
        if (!isValid(date)) {
          return 'Fecha inválida';
        }

        if (new Date() - date > 7 * 24 * 60 * 60 * 1000) {
          return format(date, 'dd MMM yyyy', { locale: es });
        }
        return formatDistanceToNow(date, { addSuffix: true, locale: es });
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <h2 className={`text-2xl font-bold mb-6 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Concentrado de Prospectos</h2>
          <div className="bg-card rounded-2xl border border-border shadow-sm card-hover">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Máquinas/Proyectos</TableHead>
                  <TableHead>Siguiente Paso</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Monto de Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const machineProjects = (lead.machines || []).map(m => m.name).join(', ');
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-muted-foreground">{machineProjects || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{getNextStep(lead)}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{formatLastActivity(lead.last_activity)}</TableCell>
                      <TableCell className={`text-right font-semibold ${theme === 'futuristic' ? 'text-glow' : ''}`}>${lead.value.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      );
    };

    export default LeadsTable;