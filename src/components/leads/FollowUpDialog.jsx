import React, { useState, useEffect, useCallback } from 'react';
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
    import { cn } from '@/lib/utils';
    import { toast } from '@/components/ui/use-toast';

    const FollowUpDialog = ({ open, onOpenChange, lead, actionType, onSchedule, onUpdate }) => {
      const [date, setDate] = useState(null);
      const [time, setTime] = useState('09:00');
      const [showCalendar, setShowCalendar] = useState(false);

      useEffect(() => {
        if (open) {
          setDate(new Date());
          setTime(format(new Date(), 'HH:mm'));
          setShowCalendar(false);
        }
      }, [open]);

      const handleSchedule = useCallback(() => {
        if (!date || !time || !lead) {
          return;
        }

        const [hours, minutes] = time.split(':');
        const scheduledDate = new Date(date);
        scheduledDate.setHours(parseInt(hours, 10));
        scheduledDate.setMinutes(parseInt(minutes, 10));
        scheduledDate.setSeconds(0);
        scheduledDate.setMilliseconds(0);

        onSchedule(lead, actionType, scheduledDate);
      }, [date, time, onSchedule, lead, actionType]);

      const handleJustUpdate = useCallback(async () => {
        if (!lead) return;

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
      }, [lead, actionType, onOpenChange, onUpdate]);

      if (!lead) return null;

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[425px] bg-card/80 backdrop-blur-lg border-white/10">
            <DialogHeader>
              <DialogTitle>Cambiar Status a "{actionType}"</DialogTitle>
              <DialogDescription>
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
                            'col-span-3 justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card/80 backdrop-blur-lg border-white/10">
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
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowCalendar(false)}>Atrás</Button>
                  <Button onClick={handleSchedule} className="text-white bg-gradient-to-r from-primary to-accent button-glow">
                    Agendar
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <DialogFooter className="sm:justify-between gap-2 pt-4">
                <Button variant="outline" onClick={handleJustUpdate}>
                  Sólo Actualizar Status
                </Button>
                <Button onClick={() => setShowCalendar(true)} className="text-white bg-gradient-to-r from-primary to-accent button-glow">
                  Actualizar y Agendar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      );
    };

    export default React.memo(FollowUpDialog);