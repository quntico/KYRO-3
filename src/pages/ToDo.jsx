import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2,
  Calendar, CheckCircle, Circle, BookOpen, Hash, Star,
  Search, Paperclip, Video, Image as ImageIcon, X, Save,
  Clock, User, Tag, Layout, ListTodo, FileText, Highlighter, Underline,
  Type, Maximize2, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useData } from '@/contexts/DataContext.jsx';
import { format, parseISO, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isToday, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import NewTaskDialog from '@/components/dashboard/NewTaskDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const NoteContentEditor = ({ initialContent, onChange }) => {
  const editorRef = React.useRef(null);
  const [content, setContent] = useState(initialContent || '');

  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent || '';
    }
  }, [initialContent]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      // Find the direct parent if it's a text node
      let container = range.startContainer.nodeType === 3 ? range.startContainer.parentNode : range.startContainer;

      // Look for the task container
      while (container && container !== editorRef.current) {
        if (container.nodeType === 1 && container.classList.contains('kyro-task-item')) {
          e.preventDefault();

          const textElement = container.querySelector('span');
          const currentText = textElement ? textElement.innerText.trim() : '';

          // If current task is empty, stop the list on Enter (Double Enter)
          if (!currentText) {
            container.classList.remove('kyro-task-item', 'flex', 'items-center', 'gap-2');
            container.innerHTML = '<div><br></div>';
            return;
          }

          const newTask = document.createElement('div');
          newTask.className = 'flex items-center gap-2 my-2 group kyro-task-item';
          newTask.innerHTML = `
            <input type="checkbox" class="w-5 h-5 accent-primary cursor-pointer" onchange="this.nextElementSibling.style.textDecoration = this.checked ? 'line-through' : 'none'; this.nextElementSibling.style.opacity = this.checked ? '0.5' : '1'" />
            <span contenteditable="true" class="outline-none flex-grow" data-placeholder="Nueva tarea..."></span>
          `;

          // Insert after current task
          if (container.nextSibling) {
            container.parentNode.insertBefore(newTask, container.nextSibling);
          } else {
            container.parentNode.appendChild(newTask);
          }

          // Focus the new task's span
          const newSpan = newTask.querySelector('span');
          const newRange = document.createRange();
          newRange.selectNodeContents(newSpan);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return;
        }
        container = container.parentNode;
      }
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => {
        onChange(e.currentTarget.innerHTML);
      }}
      onKeyDown={onKeyDown}
      className="w-full h-auto min-h-[500px] bg-transparent text-lg leading-relaxed border-none focus:outline-none resize-none relative outline-none"
      style={{ whiteSpace: 'pre-wrap' }}
      data-placeholder="Escribe algo increíble..."
    />
  );
};

const ToDo = () => {
  const { theme } = useTheme();
  const {
    tasks, addTask, updateTask, removeTask,
    notes, addNote, updateNote, deleteNote,
    leads, uploadMedia
  } = useData();

  const [activeView, setActiveView] = useState('notes'); // 'notes', 'tasks', 'calendar'
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Filter items based on activeView and searchQuery
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const notesArray = Array.isArray(notes) ? notes : [];
    const tasksArray = Array.isArray(tasks) ? tasks : [];

    if (activeView === 'notes') {
      return notesArray.filter(n =>
        (n.title?.toLowerCase().includes(query)) ||
        (n.content?.toLowerCase().includes(query))
      ).sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
    }
    return tasksArray.filter(t =>
      (t.title?.toLowerCase().includes(query)) ||
      (t.description?.toLowerCase().includes(query))
    ).sort((a, b) => {
      const dateA = new Date(a.due || 0);
      const dateB = new Date(b.due || 0);
      return dateB - dateA;
    });
  }, [activeView, notes, tasks, searchQuery]);

  const safeFormat = (date, formatStr) => {
    try {
      if (!date) return "N/A";
      const d = typeof date === 'string' ? parseISO(date) : new Date(date);
      if (isNaN(d.getTime())) return "N/A";
      return format(d, formatStr, { locale: es });
    } catch (e) {
      return "N/A";
    }
  };

  const safeFormatDistance = (date) => {
    try {
      if (!date) return "N/A";
      const d = typeof date === 'string' ? parseISO(date) : new Date(date);
      if (isNaN(d.getTime())) return "Hace un momento";
      return formatDistanceToNow(d, { addSuffix: true, locale: es });
    } catch (e) {
      return "Hace un momento";
    }
  };

  // Handle Initial Selection
  useEffect(() => {
    if (!selectedItem && filteredItems.length > 0) {
      setSelectedItem(filteredItems[0]);
    }
  }, [activeView, filteredItems.length, selectedItem]);

  const handleSaveNote = async () => {
    if (!selectedItem || activeView !== 'notes') return;
    setIsSaving(true);
    await updateNote(selectedItem.id, {
      title: selectedItem.title,
      content: selectedItem.content,
      updated_at: new Date().toISOString()
    });
    setIsSaving(false);
    toast({ title: "Nota guardada" });
  };

  const handleCreateNew = () => {
    if (activeView === 'notes') {
      const newNote = {
        title: "Nueva Nota",
        content: "",
        created_at: new Date().toISOString(),
        tags: [],
        attachments: []
      };
      addNote(newNote).then(res => setSelectedItem(res));
    } else {
      setIsNewTaskDialogOpen(true);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !selectedItem) return;

    toast({ title: "Subiendo archivo..." });
    const url = await uploadMedia(file, selectedItem.client_id || 'general');

    if (url) {
      const updatedAttachments = [...(selectedItem.attachments || []), { url, type, name: file.name }];
      if (activeView === 'notes') {
        updateNote(selectedItem.id, { attachments: updatedAttachments });
      } else {
        updateTask({ ...selectedItem, attachments: updatedAttachments });
      }
      setSelectedItem(prev => ({ ...prev, attachments: updatedAttachments }));
      toast({ title: "Archivo subido con éxito" });
    }
  };

  const toggleTaskCompletion = async (item) => {
    const isCompleted = !item.completed;
    const updatedItem = { ...item, completed: isCompleted };

    if (activeView === 'tasks' || item.due) { // Works for tasks or items with due dates
      updateTask(updatedItem);
      if (selectedItem?.id === item.id) {
        setSelectedItem(updatedItem);
      }
      toast({
        title: isCompleted ? "Tarea completada" : "Tarea pendiente",
        description: isCompleted ? "Buen trabajo, tarea tachada." : "La tarea vuelve a estar activa."
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden border-t border-white/5">
      <Helmet>
        <title>KYRO Notes & Tasks</title>
        <style>
          {`
            [contenteditable]:empty:before {
              content: attr(data-placeholder);
              color: rgba(255, 255, 255, 0.2);
            }
            .group:has(input[type="checkbox"]:checked) span {
              text-decoration: line-through;
              opacity: 0.5;
            }
            .highlight-accent {
              box-shadow: 0 0 10px hsl(var(--primary) / 0.2);
            }
          `}
        </style>
      </Helmet>

      {/* COLUMN 1: NAVIGATION SIDEBAR */}
      <div className="w-16 lg:w-64 flex flex-col border-r border-white/10 bg-card/30 backdrop-blur-md flex-shrink-0">
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl hidden lg:block text-glow">NOTAS</span>
        </div>

        <Button
          onClick={handleCreateNew}
          className="mx-4 mt-2 mb-6 hidden lg:flex items-center gap-2 rounded-full py-6 text-lg font-medium shadow-xl hover:scale-105 transition-all bg-gradient-to-r from-primary to-blue-600 border-none"
        >
          <Plus className="w-6 h-6" /> Nuevo
        </Button>

        <div className="flex-grow space-y-1 px-2">
          <NavButton
            icon={<FileText />} label="Notas" active={activeView === 'notes'}
            onClick={() => { setActiveView('notes'); setSelectedItem(null); }}
          />
          <NavButton
            icon={<ListTodo />} label="Tareas" active={activeView === 'tasks'}
            onClick={() => { setActiveView('tasks'); setSelectedItem(null); }}
          />
          <NavButton
            icon={<Calendar />} label="Calendario" active={activeView === 'calendar'}
            onClick={() => setActiveView('calendar')}
          />
          <div className="h-px bg-white/5 my-4 mx-2" />
          <NavButton icon={<Star className="text-yellow-500" />} label="Atajos" />
          <NavButton icon={<Tag />} label="Etiquetas" />
          <NavButton icon={<Trash2 />} label="Papelera" />
        </div>
      </div>

      {/* COLUMN 2: SEARCH & LIST */}
      {activeView !== 'calendar' && !isMaximized && (
        <div className="w-full sm:w-80 lg:w-96 flex flex-col border-r border-white/10 bg-card/10 flex-shrink-0">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-bold mb-4 px-2 capitalize">{activeView === 'notes' ? 'Mis Notas' : 'Mis Tareas'}</h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar en todo..."
                className="pl-10 bg-white/5 border-white/10 focus:bg-white/10 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-grow">
            <div className="p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border group relative
                      ${selectedItem?.id === item.id
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/5'
                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-start gap-3">
                      {activeView === 'tasks' && (
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(item); }}
                          className={`mt-1 flex-shrink-0 cursor-pointer transition-colors ${item.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        >
                          {item.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`font-semibold truncate pr-6 ${selectedItem?.id === item.id ? 'text-primary' : 'text-foreground'} ${item.completed ? 'line-through opacity-50' : ''}`}>
                            {item.title || (activeView === 'notes' ? 'Sin título' : 'Tarea sin nombre')}
                          </h3>
                          {activeView === 'tasks' && item.priority && (
                            <div className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500'}`} />
                          )}
                        </div>
                        <p className={`text-sm text-muted-foreground line-clamp-2 leading-relaxed ${item.completed ? 'line-through opacity-30' : ''}`}>
                          {item.content ? item.content.replace(/<[^>]*>/g, ' ') : (item.description || 'Sin contenido adicional...')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      <span>{safeFormat(item.updated_at || item.created_at || item.due, "d MMM, HH:mm")}</span>
                      {item.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                          <Paperclip className="w-3 h-3" /> {item.attachments.length}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="ghost" size="icon"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* COLUMN 3: EDITOR / DETAIL / CALENDAR */}
      <div className={`flex-grow bg-card/5 relative overflow-hidden transition-all duration-500 ${isMaximized ? 'w-full' : ''}`}>
        {activeView === 'calendar' ? (
          <CalendarView />
        ) : selectedItem ? (
          <div className="h-full flex flex-col">
            {/* Editor Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Editado {safeFormatDistance(selectedItem.updated_at || selectedItem.created_at || selectedItem.due)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                      <Paperclip className="w-4 h-4" /> Adjuntar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1 bg-card border-white/10" align="end">
                    <label className="flex items-center gap-2 p-2 hover:bg-white/5 cursor-pointer rounded-lg text-sm transition-colors w-full">
                      <ImageIcon className="w-4 h-4 text-blue-400" /> Imágenes
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                    </label>
                    <label className="flex items-center gap-2 p-2 hover:bg-white/5 cursor-pointer rounded-lg text-sm transition-colors w-full">
                      <Video className="w-4 h-4 text-purple-400" /> Videos
                      <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
                    </label>
                  </PopoverContent>
                </Popover>

                {activeView === 'notes' && (
                  <div className="flex items-center gap-1 mr-4 px-2 py-1 bg-white/5 rounded-full border border-white/10">
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                      onClick={() => {
                        const selection = window.getSelection();
                        if (!selection.rangeCount) return;
                        const range = selection.getRangeAt(0);
                        const checkboxContainer = document.createElement('div');
                        checkboxContainer.className = 'flex items-center gap-2 my-2 group kyro-task-item';
                        checkboxContainer.innerHTML = `
                          <input type="checkbox" class="w-5 h-5 accent-primary cursor-pointer" onchange="this.nextElementSibling.style.textDecoration = this.checked ? 'line-through' : 'none'; this.nextElementSibling.style.opacity = this.checked ? '0.5' : '1'" />
                          <span contenteditable="true" class="outline-none flex-grow" data-placeholder="Nueva tarea..."></span>
                        `;
                        range.insertNode(checkboxContainer);
                        // Move cursor inside the new span
                        const newSpan = checkboxContainer.querySelector('span');
                        const newRange = document.createRange();
                        newRange.selectNodeContents(newSpan);
                        newRange.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                      }}
                      title="Insertar Checkbox"
                    >
                      <ListTodo className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                      onClick={() => {
                        const selection = window.getSelection();
                        if (!selection.rangeCount) return;
                        const range = selection.getRangeAt(0);
                        if (range.collapsed) return;

                        const span = document.createElement('span');
                        span.style.backgroundColor = 'hsl(var(--primary) / 0.3)';
                        span.style.color = 'hsl(var(--primary))';
                        span.style.padding = '0 4px';
                        span.style.borderRadius = '4px';
                        span.className = 'highlight-accent';
                        span.appendChild(range.extractContents());
                        range.insertNode(span);
                      }}
                      title="Resaltar"
                    >
                      <Highlighter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                      onClick={() => {
                        const selection = window.getSelection();
                        if (!selection.rangeCount) return;
                        const range = selection.getRangeAt(0);
                        if (range.collapsed) return;

                        const span = document.createElement('span');
                        span.style.color = 'hsl(var(--primary))';
                        span.className = 'text-accent';
                        span.appendChild(range.extractContents());
                        range.insertNode(span);

                        // Collapse selection to end
                        selection.removeAllRanges();
                        const nextRange = document.createRange();
                        nextRange.selectNode(span);
                        nextRange.collapse(false);
                        selection.addRange(nextRange);
                      }}
                      title="Color de Fuente (Acento)"
                    >
                      <Type className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                      onClick={() => setIsMaximized(!isMaximized)}
                      title={isMaximized ? "Ver Lista" : "Maximizar Nota"}
                    >
                      {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                      onClick={() => document.execCommand('underline')}
                      title="Subrayar"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {activeView === 'notes' && (
                  <Button
                    variant="outline" size="sm"
                    className="rounded-full border-primary/50 text-primary hover:bg-primary/10 px-6 gap-2"
                    onClick={handleSaveNote}
                    disabled={isSaving}
                  >
                    {isSaving ? "Guardando..." : "Guardar"} <Save className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Main Editor Surface */}
            <ScrollArea className="flex-grow">
              <div className="max-w-4xl mx-auto px-8 py-12 lg:px-24 space-y-6">
                <div className="flex items-center gap-4">
                  {activeView === 'tasks' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTaskCompletion(selectedItem)}
                      className={`h-10 w-10 rounded-xl transition-all ${selectedItem.completed ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' : 'bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                    >
                      {selectedItem.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </Button>
                  )}
                  <input
                    className={`flex-grow bg-transparent text-4xl font-bold border-none focus:outline-none placeholder:text-muted-foreground/30 text-glow ${selectedItem.completed ? 'line-through opacity-40' : ''}`}
                    placeholder={activeView === 'notes' ? "Título de la nota..." : "Título de la tarea..."}
                    value={selectedItem.title || ''}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-xs text-muted-foreground border border-white/5">
                    <User className="w-3 h-3" />
                    {selectedItem.client_name || selectedItem.client || 'Sin cliente asignado'}
                  </div>
                  {(selectedItem.tags || []).map(tag => (
                    <div key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                      #{tag}
                    </div>
                  ))}
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20">
                    <Hash className="w-3 h-3" />
                  </Button>
                </div>

                <div className="h-px bg-white/10 w-full" />

                {activeView === 'notes' ? (
                  <NoteContentEditor
                    initialContent={selectedItem.content}
                    onChange={(html) => setSelectedItem(prev => ({ ...prev, content: html }))}
                  />
                ) : (
                  <textarea
                    className="w-full h-auto min-h-[500px] bg-transparent text-lg leading-relaxed border-none focus:outline-none resize-none placeholder:text-muted-foreground/20"
                    placeholder="Escribe algo increíble..."
                    value={selectedItem.content || selectedItem.description || ''}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, content: e.target.value, description: e.target.value }))}
                  />
                )}

                {/* Attachments Display */}
                {selectedItem.attachments?.length > 0 && (
                  <div className="mt-12 space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Paperclip className="w-4 h-4" /> Archivos Adjuntos
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedItem.attachments.map((file, idx) => (
                        <div key={idx} className="group relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 hover:border-primary/50 transition-all">
                          {file.type === 'image' ? (
                            <img src={file.url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                              <Video className="w-8 h-8 text-primary mb-2" />
                              <span className="text-[10px] truncate w-full">{file.name || 'Video'}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white ml-auto" onClick={() => window.open(file.url, '_blank')}>
                              <Plus className="w-4 h-4 rotate-45" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6 animate-pulse border border-white/10">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Selecciona una {activeView === 'notes' ? 'nota' : 'tarea'} para leerla</h2>
            <p className="text-muted-foreground max-w-md">
              Organiza tus ideas, sube multimedia de tus clientes y mantén el control total de tu trabajo en un solo lugar.
            </p>
            <Button onClick={handleCreateNew} className="mt-8 gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> Crear mi primer{activeView === 'notes' ? 'a nota' : 'a tarea'}
            </Button>
          </div>
        )}
      </div>

      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        leads={leads}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="bg-card/80 backdrop-blur-lg border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{itemToDelete?.title}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeView === 'notes') deleteNote(itemToDelete.id);
                else removeTask(itemToDelete.id);
                setSelectedItem(null);
                setItemToDelete(null);
                toast({ title: "Eliminado con éxito" });
              }}
              className="bg-destructive hover:bg-destructive/80"
            >
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={`w-full justify-start gap-4 px-4 py-3 h-auto rounded-xl transition-all group relative overflow-hidden
      ${active ? 'bg-primary/10 text-primary shadow-inner shadow-primary/5' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    <span className="font-medium hidden lg:block">{label}</span>
    {active && <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-primary rounded-full" />}
  </Button>
);

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { tasks } = useData();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-glow">Agenda Semanal</h2>
          <p className="text-muted-foreground capitalize">{format(weekStart, "MMMM yyyy", { locale: es })}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" className="rounded-lg h-9 px-4 text-xs font-semibold uppercase tracking-wider" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex-grow bg-card/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
          {weekDays.map(day => (
            <div key={day.toString()} className="py-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-1">
                {format(day, 'eee', { locale: es })}
              </span>
              <span className={`text-xl font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
        <ScrollArea className="flex-grow">
          <div className="grid grid-cols-7 divide-x divide-white/5 h-full min-h-[500px]">
            {weekDays.map(day => {
              const dayTasks = tasks.filter(t => {
                try {
                  return isSameDay(typeof t.due === 'string' ? parseISO(t.due) : new Date(t.due), day);
                } catch (e) {
                  return false;
                }
              });
              return (
                <div key={day.toString()} className={`p-3 hover:bg-white/5 transition-colors group relative ${isToday(day) ? 'bg-primary/5' : ''}`}>
                  <div className="space-y-2">
                    {dayTasks.map(task => (
                      <div key={task.id} className="p-2 bg-card/60 rounded-lg border border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer group/item">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-primary'}`} />
                          <span className="text-[10px] font-mono opacity-50">{safeFormat(task.due, 'HH:mm')}</span>
                        </div>
                        <p className="text-xs font-medium truncate">{task.title}</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 cursor-pointer">
                    <Plus className="w-8 h-8 text-primary/50" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ToDo;