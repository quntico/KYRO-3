import React, { useState, useMemo, useEffect } from 'react';
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
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from '@/components/ui/select';
    import { Calendar } from '@/components/ui/calendar';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
    import { Calendar as CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
    import { format, parseISO } from 'date-fns';
    import { es } from 'date-fns/locale';
    import { cn } from '@/lib/utils';
    import { useTheme } from '@/contexts/ThemeContext.jsx';

    const taskTypes = [
      { value: 'Cita', label: '📅 Cita' },
      { value: 'Zoom', label: '💻 Zoom' },
      { value: 'Llamada', label: '📞 Llamada' },
      { value: 'WhatsApp', label: '💬 WhatsApp' },
      { value: 'Cotizar', label: '📄 Cotizar' },
      { value: 'Correo', label: '✉️ Correo' },
      { value: 'Cobranza', label: '💰 Cobranza' },
      { value: 'Pago', label: '💵 Pago' },
      { value: 'Otro', label: '✨ Otro...' },
    ];

    const NewTaskDialog = ({ open, onOpenChange, onAddTask, onUpdateTask, contacts = [], leads = [], taskToEdit, quickAddInfo }) => {
      const [taskType, setTaskType] = useState('');
      const [customTitle, setCustomTitle] = useState('');
      const [date, setDate] = useState(new Date());
      const [time, setTime] = useState(format(new Date(), 'HH:mm'));
      const [client, setClient] = useState('');
      const [comboboxOpen, setComboboxOpen] = useState(false);
      const [paymentConcept, setPaymentConcept] = useState('');
      const [paymentAmount, setPaymentAmount] = useState('');
      const { theme } = useTheme();

      const isEditMode = !!taskToEdit;

      useEffect(() => {
        let initialDate = new Date();
        let initialTime = format(initialDate, 'HH:mm');

        if (quickAddInfo) {
            const quickAddDate = parseISO(quickAddInfo.due);
            initialDate = quickAddDate;
            initialTime = format(quickAddDate, 'HH:mm');
        }

        if (isEditMode && taskToEdit) {
          const isPredefinedType = taskTypes.some(t => t.value === taskToEdit.title);
          if (isPredefinedType) {
            setTaskType(taskToEdit.title);
            setCustomTitle('');
          } else {
            setTaskType('Otro');
            setCustomTitle(taskToEdit.title);
          }
          const taskDate = parseISO(taskToEdit.due);
          setDate(taskDate);
          setTime(format(taskDate, 'HH:mm'));
          setClient(taskToEdit.client || '');
          setPaymentConcept(taskToEdit.paymentConcept || '');
          setPaymentAmount(taskToEdit.paymentAmount || '');
        } else {
          // Reset form for new task
          setTaskType(quickAddInfo?.type || '');
          setCustomTitle('');
          setDate(initialDate);
          setTime(initialTime);
          setClient(quickAddInfo?.client || '');
          setPaymentConcept('');
          setPaymentAmount('');
        }
      }, [taskToEdit, quickAddInfo, open]);

      const clientOptions = useMemo(() => {
        const allClients = [
          ...contacts.map(c => ({ value: c.name, label: c.name, type: 'Contacto' })),
          ...leads.map(l => ({ value: l.name, label: l.name, type: 'Prospecto' })),
        ];
        // Remove duplicates
        return allClients.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);
      }, [contacts, leads]);

      const handleSaveTask = () => {
        const title = taskType === 'Otro' ? customTitle : taskType;
        if (!title || !date || !time) {
          return;
        }
        if (taskType === 'Pago' && (!paymentConcept || !paymentAmount)) {
          return;
        }

        const [hours, minutes] = time.split(':');
        const dueDateTime = new Date(date);
        dueDateTime.setHours(parseInt(hours, 10));
        dueDateTime.setMinutes(parseInt(minutes, 10));
        dueDateTime.setSeconds(0);
        dueDateTime.setMilliseconds(0);

        const taskData = {
          id: isEditMode ? taskToEdit.id : Date.now(),
          title,
          priority: 'medium',
          due: dueDateTime.toISOString(),
          client: client,
          completed: isEditMode ? taskToEdit.completed : false,
          paymentConcept: taskType === 'Pago' ? paymentConcept : undefined,
          paymentAmount: taskType === 'Pago' ? parseFloat(paymentAmount) : undefined,
        };

        if (isEditMode) {
          onUpdateTask(taskData);
        } else {
          onAddTask(taskData);
        }
        onOpenChange(false);
      };

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[425px] bg-card/80 backdrop-blur-lg border-white/10">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Reprogramar Tarea' : 'Agregar Nueva Tarea'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Actualiza los detalles de tu tarea.' : 'Organiza tu día. Selecciona un tipo de tarea y programa tu próximo movimiento.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="task-type" className="text-right">
                  Tipo
                </Label>
                <Select onValueChange={setTaskType} value={taskType}>
                  <SelectTrigger id="task-type" className="col-span-3">
                    <SelectValue placeholder="Selecciona un tipo de tarea" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {taskType === 'Otro' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="custom-title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="custom-title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe tu tarea"
                  />
                </div>
              )}
              {taskType === 'Pago' && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-concept" className="text-right">
                      Concepto
                    </Label>
                    <Input
                      id="payment-concept"
                      value={paymentConcept}
                      onChange={(e) => setPaymentConcept(e.target.value)}
                      className="col-span-3"
                      placeholder="Ej: Anticipo proyecto X"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-amount" className="text-right">
                      Importe
                    </Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="col-span-3"
                      placeholder="Ej: 1500.00"
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Cliente
                </Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="col-span-3 justify-between"
                    >
                      {client || "Selecciona o escribe un cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-card/80 backdrop-blur-lg border-white/10">
                    <Command>
                      <CommandInput 
                        placeholder="Busca o crea un cliente..."
                        onValueChange={(currentValue) => setClient(currentValue)}
                      />
                      <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                      <CommandGroup>
                        {clientOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setClient(currentValue === client ? "" : currentValue);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                client === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
                  className="col-span-3 dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveTask} className="text-white bg-gradient-to-r from-primary to-accent button-glow">
                {isEditMode ? 'Guardar Cambios' : 'Guardar Tarea'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default NewTaskDialog;