import React, { useState, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Plus, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Calendar, CheckCircle, Circle } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { format, parseISO, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isToday } from 'date-fns';
    import { es } from 'date-fns/locale';
    import NewTaskDialog from '@/components/dashboard/NewTaskDialog';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

    const ToDo = ({ tasks, setTasks, leads }) => {
      const { theme } = useTheme();
      const [currentDate, setCurrentDate] = useState(new Date());
      const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
      const [editingTask, setEditingTask] = useState(null);
      const [quickAddInfo, setQuickAddInfo] = useState(null);
      const [taskToDelete, setTaskToDelete] = useState(null);

      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      const handleAddTask = (newTaskData) => {
        const newTask = { ...newTaskData, id: Date.now(), completed: false, attachments: [] };
        setTasks(prev => [...prev, newTask].sort((a, b) => parseISO(a.due) - parseISO(b.due)));
        toast({ title: "¡Tarea Creada!", description: `"${newTask.title}" ha sido añadida.` });
        setIsNewTaskDialogOpen(false);
        setQuickAddInfo(null);
      };

      const handleUpdateTask = (updatedTaskData) => {
        setTasks(prev => prev.map(t => t.id === updatedTaskData.id ? updatedTaskData : t).sort((a, b) => parseISO(a.due) - parseISO(b.due)));
        toast({ title: "¡Tarea Actualizada!", description: `"${updatedTaskData.title}" ha sido actualizada.` });
        setEditingTask(null);
        setIsNewTaskDialogOpen(false);
      };

      const handleDeleteConfirmation = (task) => {
        setTaskToDelete(task);
      };

      const handleDeleteTask = () => {
        if (taskToDelete) {
          setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
          toast({ title: "Tarea Eliminada" });
          setTaskToDelete(null);
        }
      };

      const handleToggleComplete = (taskId) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
      };

      const handleQuickAdd = (day) => {
        const date = new Date(day);
        date.setHours(12, 0, 0, 0); // Default to noon
        setQuickAddInfo({ due: date.toISOString() });
        setEditingTask(null);
        setIsNewTaskDialogOpen(true);
      };

      const getPriorityClass = (priority) => {
        switch (priority) {
          case 'high': return 'border-l-4 border-red-500';
          case 'medium': return 'border-l-4 border-yellow-500';
          case 'low': return 'border-l-4 border-green-500';
          default: return 'border-l-4 border-gray-500';
        }
      };

      const todayTasks = useMemo(() => {
        return tasks
          .filter(task => isToday(parseISO(task.due)))
          .sort((a, b) => parseISO(a.due) - parseISO(b.due));
      }, [tasks]);

      return (
        <div className="h-full flex flex-col overflow-hidden bg-background text-foreground p-4 sm:p-6 lg:p-8">
          <Helmet>
            <title>Agenda Semanal - KYRO</title>
            <meta name="description" content="Gestiona tus tareas con una vista semanal en KYRO CRM." />
          </Helmet>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'futuristic' ? 'text-glow' : ''}`}>Agenda Semanal</h1>
              <p className="text-muted-foreground capitalize">{format(weekStart, "MMMM yyyy", { locale: es })}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
              <Button className={theme === 'futuristic' ? 'button-glow' : ''} onClick={() => { setEditingTask(null); setQuickAddInfo(null); setIsNewTaskDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Nueva Tarea
              </Button>
            </div>
          </motion.div>

          <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-card/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 p-4 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-glow">Pendientes de Hoy</h2>
              <div className="overflow-y-auto scrollbar-hide flex-grow">
                {todayTasks.length > 0 ? (
                  todayTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={() => { setEditingTask(task); setIsNewTaskDialogOpen(true); }}
                      onDelete={() => handleDeleteConfirmation(task)}
                      getPriorityClass={getPriorityClass}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mb-2" />
                    <p>¡Día libre! No hay tareas para hoy.</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 bg-card/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 flex flex-col overflow-hidden">
              <div className="grid grid-cols-7 flex-shrink-0">
                {weekDays.map(day => (
                  <div key={day.toString()} className="text-center py-2 border-b border-border">
                    <p className="font-semibold text-sm capitalize">{format(day, 'eee', { locale: es })}</p>
                    <p className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-grow overflow-y-auto scrollbar-hide">
                {weekDays.map(day => {
                  const dayTasks = tasks
                    .filter(task => isSameDay(parseISO(task.due), day))
                    .sort((a, b) => parseISO(a.due) - parseISO(b.due));
                  return (
                    <div key={day.toString()} className="border-r border-border p-2 flex flex-col gap-2 relative group" onClick={() => handleQuickAdd(day)}>
                      {dayTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onEdit={() => { setEditingTask(task); setIsNewTaskDialogOpen(true); }}
                          onDelete={() => handleDeleteConfirmation(task)}
                          getPriorityClass={getPriorityClass}
                          isCompact={true}
                        />
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <NewTaskDialog
            open={isNewTaskDialogOpen}
            onOpenChange={setIsNewTaskDialogOpen}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            taskToEdit={editingTask}
            quickAddInfo={quickAddInfo}
            leads={leads}
          />
          <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
            <AlertDialogContent className="bg-card/80 backdrop-blur-lg border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    };

    const TaskItem = ({ task, onToggleComplete, onEdit, onDelete, getPriorityClass, isCompact = false }) => {
      const handleActionClick = (e, action) => {
        e.stopPropagation();
        action();
      };

      const title = task.title === 'Pago' ? task.paymentConcept : task.title;
      const amount = task.paymentAmount ? `$${task.paymentAmount.toLocaleString()}` : null;

      return (
        <div
          className={`bg-secondary/50 rounded-lg p-2 flex items-start gap-2 cursor-pointer hover:bg-secondary transition-colors ${getPriorityClass(task.priority)}`}
          onClick={(e) => handleActionClick(e, onEdit)}
        >
          <button onClick={(e) => handleActionClick(e, () => onToggleComplete(task.id))} className="mt-1">
            {task.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
          </button>
          <div className="flex-grow overflow-hidden">
            <p className={`font-medium text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {title}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{format(parseISO(task.due), 'HH:mm')}{task.client && !isCompact ? ` - ${task.client}` : ''}</p>
              {amount && <p className="text-xs font-bold text-green-400">{amount}</p>}
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 bg-card/80 backdrop-blur-lg border-white/10 p-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={(e) => handleActionClick(e, onEdit)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-400 hover:text-red-500" onClick={(e) => handleActionClick(e, onDelete)}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      );
    };

    export default ToDo;