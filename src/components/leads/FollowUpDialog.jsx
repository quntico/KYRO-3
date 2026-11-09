import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { mexicoLocalToISO } from '@/lib/agenda';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const FollowUpDialog = ({ open, onOpenChange, lead, actionType, onSchedule, onUpdate }) => {
  const pending = useRef(false);
  const [saving,setSaving] = useState(false);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('09:00');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (open) {
      const now = new Date();
      setDate(now);
      try {
        setTime(format(now, 'HH:mm'));
      } catch (e) {
        setTime('09:00');
      }
      setShowCalendar(false);
    }
  }, [open]);

  const handleSchedule = useCallback(async () => {
    if (!date || !time || !lead) {
      return;
    }

    const [hours, minutes] = time.split(':');
    const scheduledDate = new Date(date);
    scheduledDate.setHours(parseInt(hours, 10));
    scheduledDate.setMinutes(parseInt(minutes, 10));
    scheduledDate.setSeconds(0);
    scheduledDate.setMilliseconds(0);

    if(pending.current) return; pending.current=true; setSaving(true);
    try {await onSchedule(lead, actionType, new Date(mexicoLocalToISO(format(date,'yyyy-MM-dd'),time)));}
    catch(error){toast({title:'No se pudo agendar',description:error.message,variant:'destructive'});}
    finally {pending.current=false;setSaving(false);}
  }, [date, time, onSchedule, lead, actionType]);

  const handleJustUpdate = useCallback(async () => {
    if (!lead) return;

    try {
    const { data, error } = await onUpdate(lead.id, {
      next_step: { type: actionType, date: new Date().toISOString() }
    });

    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "¡Siguiente Paso Actualizado!",
        description: `El estado del prospecto ahora es "${actionType}".`,
      });
    }
    onOpenChange(false);
    } catch(error) { toast({title:"No se guardó el cambio",description:error.message,variant:"destructive"}); }
  }, [lead, actionType, onOpenChange, onUpdate]);

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Próxima acción: "{actionType}"</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            ¿Quieres agendar esta acción para <span className="font-bold">{lead.name}</span>?
          </DialogDescription>
        </DialogHeader>

        {showCalendar ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'col-span-3 justify-start text-left font-normal border-border',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {(() => {
                        if (!date) return <span>Elige una fecha</span>;
                        try {
                          return format(date, 'PPP', { locale: es });
                        } catch (e) {
                          return <span>Fecha inválida</span>;
                        }
                      })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={es}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Hora
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="col-span-3 border-border bg-background"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCalendar(false)}>Atrás</Button>
              <Button disabled={saving} onClick={handleSchedule} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Agendar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <DialogFooter className="sm:justify-between gap-2 pt-4">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary" onClick={handleJustUpdate}>
              Guardar próxima acción
            </Button>
            <Button onClick={() => setShowCalendar(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Elegir fecha y agendar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(FollowUpDialog);