import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Plus, Phone, Mail, FileText, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Briefcase, ZoomIn, Banknote, User, MoreHorizontal, Trash2, Edit } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Calendar } from '@/components/ui/calendar';
    import { format, isSameDay, parseISO } from 'date-fns';
    import { es } from 'date-fns/locale';
    import NewTaskDialog from './NewTaskDialog';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';

    const TasksList = ({ tasks, setTasks, contacts, leads }) => {
      const [selectedDate, setSelectedDate] = useState(new Date());
      const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
      const [taskToDelete, setTaskToDelete] = useState(null);
      const [taskToEdit, setTaskToEdit] = useState(null);
      const { theme } = useTheme();

      const getTaskIcon = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('llamar') || lowerTitle.includes('llamada')) return <Phone className="w-4 h-4" />;
        if (lowerTitle.includes('correo') || lowerTitle.includes('email')) return <Mail className="w-4 h-4" />;
        if (lowerTitle.includes('propuesta') || lowerTitle.includes('cotizar')) return <FileText className="w-4 h-4" />;
        if (lowerTitle.includes('cita')) return <Briefcase className="w-4 h-4" />;
        if (lowerTitle.includes('zoom')) return <ZoomIn className="w-4 h-4" />;
        if (lowerTitle.includes('cobranza')) return <Banknote className="w-4 h-4" />;
        return <CalendarIcon className="w-4 h-4" />;
      };

      const handleAddTask = (newTask) => {
        const updatedTasks = [...tasks, newTask].sort((a, b) => parseISO(a.due) - parseISO(b.due));
        setTasks(updatedTasks);
      };

      const handleUpdateTask = (updatedTask) => {
        const updatedTasks = tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
        setTasks(updatedTasks.sort((a, b) => parseISO(a.due) - parseISO(b.due)));
        setTaskToEdit(null);
      };

      const handleDeleteTask = () => {
        if (taskToDelete) {
          setTasks(tasks.filter(task => task.id !== taskToDelete.id));
          setTaskToDelete(null);
          toast({
            title: "Tarea eliminada",
            description: "La tarea ha sido eliminada de tu agenda.",
          });
        }
      };

      const selectedDayTasks = tasks
        .filter(task => isSameDay(parseISO(task.due), selectedDate))
        .sort((a, b) => parseISO(a.due) - parseISO(b.due));

      const getTimelineTitle = () => {
        if (isSameDay(selectedDate, new Date())) {
          return `Hoy, ${format(selectedDate, 'd MMMM', { locale: es })}`;
        }
        return format(selectedDate, 'eeee, d MMMM', { locale: es });
      };

      return (
        <>
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border border-white/10 h-full flex flex-col card-hover">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-xl font-semibold text-glow">Agenda Semanal</h2>
              <Button variant="outline" size="sm" onClick={() => { setTaskToEdit(null); setIsNewTaskDialogOpen(true); }} className="bg-primary/20 border-primary text-primary hover:bg-primary/30 text-xs px-2 py-1 h-auto md:text-sm md:px-4 md:py-2 md:h-9">
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Nueva
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-white/10 p-0 [&_td]:w-8 [&_td]:h-8 [&_th]:text-xs"
                  locale={es}
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                  }}
                />
              </div>
              <div className="overflow-y-auto scrollbar-hide max-h-[300px] md:max-h-full">
                <h3 className="font-semibold text-sm md:text-base text-foreground mb-3 md:mb-4 capitalize">{getTimelineTitle()}</h3>
                {selectedDayTasks.length > 0 ? (
                  <div className="relative pl-6 md:pl-8 border-l-2 border-dashed border-primary/50">
                    {selectedDayTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="mb-4 md:mb-6 group"
                      >
                        <div className="absolute -left-[13px] md:-left-[17px] top-1 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-background ring-2 md:ring-4 bg-gradient-to-br from-primary to-accent ring-card/80" style={{boxShadow: '0 0 8px hsl(var(--primary)/0.7)'}}>
                          {getTaskIcon(task.title)}
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-xs md:text-sm text-primary text-glow">{format(parseISO(task.due), 'HH:mm', { locale: es })}</p>
                            <p className="font-medium text-sm md:text-base text-foreground">{task.title}</p>
                            {task.client && (
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3 mr-1.5" />
                                <span>{task.client}</span>
                              </div>
                            )}
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 md:h-8 md:w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 bg-card/80 backdrop-blur-lg border-white/10">
                              <div className="grid gap-2">
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setTaskToEdit(task); setIsNewTaskDialogOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Reprogramar
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-red-400 hover:text-red-500" onClick={() => setTaskToDelete(task)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <CalendarIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">No hay tareas para este día.</p>
                    <p className="text-xs text-muted-foreground/80">¡Añade una nueva tarea o disfruta tu día libre!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <NewTaskDialog 
            open={isNewTaskDialogOpen}
            onOpenChange={setIsNewTaskDialogOpen}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            contacts={contacts}
            leads={leads}
            taskToEdit={taskToEdit}
          />
          <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
            <AlertDialogContent className="bg-card/80 backdrop-blur-lg border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea de tu agenda.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    };

    export default TasksList;