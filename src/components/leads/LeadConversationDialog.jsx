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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, User, Bot, History, MessageCircle, Paperclip, Mic, Download, Share2, X, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';

const LeadConversationDialog = ({ isOpen, onOpenChange, lead, onSave }) => {
    const { theme } = useTheme();
    const [comment, setComment] = useState('');
    const [history, setHistory] = useState([]);
    const scrollRef = useRef(null);
    const endOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedImage(null);
                setSelectedPdf(null);
                setEditingIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, selectedPdf, editingIndex]);

    useEffect(() => {
        if (isOpen && lead) {
            const parseNotes = (notesStr) => {
                if (!notesStr) return [];
                try {
                    const parsed = JSON.parse(notesStr);
                    return Array.isArray(parsed) ? parsed : [{ text: notesStr, date: new Date().toISOString(), type: 'manual' }];
                } catch (e) {
                    return [{ text: notesStr, date: new Date().toISOString(), type: 'manual' }];
                }
            };

            if (lead.notes) {
                setHistory(parseNotes(lead.notes));
            } else {
                setHistory([]);
            }

            const fetchNotes = async () => {
                const { data } = await supabase.from('leads').select('notes').eq('id', lead.id).single();
                if (data && data.notes) {
                    setHistory(parseNotes(data.notes));
                }
            };
            fetchNotes();
        }
    }, [isOpen, lead]);

    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history, isOpen]);

    const safeFormatDate = (dateSource, formatStr = "EEE, dd MMM, HH:mm'h'") => {
        if (!dateSource) return '';
        try {
            const d = new Date(dateSource);
            if (isNaN(d.getTime())) return '';
            return format(d, formatStr, { locale: es });
        } catch (e) {
            return '';
        }
    };

    const handleSend = () => {
        if (!comment.trim()) return;

        const newEntry = {
            text: comment,
            date: new Date().toISOString(),
            type: 'manual'
        };

        const updatedHistory = [...history, newEntry];
        setHistory(updatedHistory);
        onSave(lead.id, { notes: JSON.stringify(updatedHistory) });
        setComment('');
    };

    const handleDeleteMessage = (index) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;
        const newHistory = history.filter((_, i) => i !== index);
        setHistory(newHistory);
        onSave(lead.id, { notes: JSON.stringify(newHistory) });
    };

    const handleEditMessage = (index) => {
        setEditingIndex(index);
        setEditText(history[index].text);
    };

    const handleSaveEdit = (index) => {
        if (!editText.trim()) return;
        const newHistory = [...history];
        newHistory[index].text = editText;
        setHistory(newHistory);
        onSave(lead.id, { notes: JSON.stringify(newHistory) });
        setEditingIndex(null);
    };

    const handleDownloadHistory = () => {
        const text = `Historial de Seguimiento: ${lead.name}\n\n` + history.map(entry => `[${safeFormatDate(entry.date)}] Usuario:\n${entry.text}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Historial_${lead.name.replace(/\s+/g, '_')}.txt`;
        a.click();
    };

    const handleShareWhatsApp = () => {
        const text = `*Historial de Seguimiento: ${lead.name}*\n\n` + history.map(entry => `_${safeFormatDate(entry.date)}_\n${entry.text}`).join('\n\n');
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleFileAttachment = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Url = event.target.result;
            const newEntry = {
                text: `📎 Archivo adjunto: ${file.name}`,
                date: new Date().toISOString(),
                type: 'file',
                fileUrl: base64Url,
                fileName: file.name,
                fileType: file.type
            };
            const updatedHistory = [...history, newEntry];
            setHistory(updatedHistory);
            onSave(lead.id, { notes: JSON.stringify(updatedHistory) });
        };
        reader.readAsDataURL(file);
    };

    const toggleRecording = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        const base64AudioMessage = reader.result;
                        const newEntry = {
                            text: `🎵 Nota de voz`,
                            date: new Date().toISOString(),
                            type: 'audio',
                            audioUrl: base64AudioMessage
                        };
                        const updatedHistory = [...history, newEntry];
                        setHistory(updatedHistory);
                        onSave(lead.id, { notes: JSON.stringify(updatedHistory) });
                    };
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Error accessing microphone:", error);
                alert("No se pudo acceder al micrófono. Por favor revisa los permisos.");
            }
        }
    };

    if (!lead) return null;

    return (
        <>
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Visor" 
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
            {selectedPdf && (
                <div 
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedPdf(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setSelectedPdf(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <object 
                        data={selectedPdf} 
                        type="application/pdf"
                        className="w-[90vw] h-[90vh] rounded-lg shadow-2xl bg-white" 
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <p className="text-white text-center">Tu navegador no soporta visualización de PDFs. <a href={selectedPdf} download className="text-primary underline">Descárgalo aquí</a>.</p>
                    </object>
                </div>
            )}
            <Dialog aria-describedby="bitacora-vance-description" open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-xl border border-border bg-card text-foreground shadow-2xl p-0 overflow-hidden !transform !translate-x-[-50%] !translate-y-[-50%]">
                <div className="p-6 border-b border-border bg-secondary/10">
                    <DialogHeader>
                        <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/20">
                                    <MessageCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-foreground">SEGUIMIENTO</DialogTitle>
                                    <DialogDescription className="text-muted-foreground/80 text-xs">
                                        Sigue la conversación con <span className="text-primary font-bold">{lead.name}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={handleDownloadHistory} title="Descargar Historial">
                                    <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleShareWhatsApp} title="Compartir por WhatsApp">
                                    <Share2 className="w-4 h-4 text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400" />
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="h-[400px] p-6 bg-card" viewportRef={scrollRef}>
                    <div className="space-y-6">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground opacity-50">
                                <History className="w-12 h-12 mb-4" />
                                <p>No hay mensajes aún.</p>
                                <p className="text-xs">Registra el primer avance abajo.</p>
                            </div>
                        ) : (
                            history.map((entry, index) => (
                                <div key={index} className="flex flex-col space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60 px-1">
                                        <User className="w-3 h-3" />
                                        <span>Usuario</span>
                                        <span className="ml-auto font-bold text-primary/90">
                                            {safeFormatDate(entry.date)}
                                        </span>
                                    </div>
                                    <div className="bg-secondary/40 border border-border rounded-2xl rounded-tl-none p-4 shadow-sm relative group/message text-foreground">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 bg-secondary border border-border p-1 rounded-md z-10">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEditMessage(index)}>
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteMessage(index)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        {entry.type === 'file' && entry.fileUrl && (
                                            <div className="mb-3 mt-2">
                                                {entry.fileType?.startsWith('image/') ? (
                                                    <img 
                                                        src={entry.fileUrl} 
                                                        alt={entry.fileName} 
                                                        className="max-h-48 rounded-lg object-contain bg-secondary cursor-pointer hover:opacity-80 transition-opacity border border-border" 
                                                        onClick={() => setSelectedImage(entry.fileUrl)}
                                                    />
                                                ) : entry.fileType?.startsWith('video/') ? (
                                                    <video src={entry.fileUrl} controls className="max-h-48 rounded-lg w-full bg-secondary" />
                                                ) : entry.fileType === 'application/pdf' ? (
                                                    <div className="flex items-center gap-3 bg-secondary p-2 rounded-lg inline-flex cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => setSelectedPdf(entry.fileUrl)}>
                                                        <Paperclip className="w-4 h-4 text-primary" />
                                                        <span className="text-sm font-bold text-primary hover:underline">{entry.fileName}</span>
                                                    </div>
                                                ) : (
                                                    <a href={entry.fileUrl} download={entry.fileName} className="text-primary hover:underline font-bold text-sm flex items-center gap-2 bg-secondary p-2 rounded-lg inline-flex">
                                                        <Paperclip className="w-4 h-4" />
                                                        Descargar {entry.fileName}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {entry.type === 'audio' && entry.audioUrl && (
                                            <div className="mb-3 w-full max-w-[250px] mt-2">
                                                <audio src={entry.audioUrl} controls className="w-full h-10" />
                                            </div>
                                        )}
                                        {editingIndex === index ? (
                                            <div className="mt-2 flex flex-col gap-2 relative z-20">
                                                <Textarea 
                                                    value={editText} 
                                                    onChange={(e) => setEditText(e.target.value)} 
                                                    className="bg-background border-border text-foreground text-sm min-h-[60px]"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>Cancelar</Button>
                                                    <Button size="sm" onClick={() => handleSaveEdit(index)} className="bg-primary hover:bg-primary/80 text-primary-foreground">Guardar</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap mt-2 pr-12">
                                                {entry.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>
                </ScrollArea>

                <div className="p-6 bg-secondary/10 border-t border-border">
                    <div className="relative group">
                        <Textarea
                            placeholder="Escribe el seguimiento de lo que dijo el cliente..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-background border-border text-foreground focus:border-primary/50 transition-all resize-none pr-32 rounded-xl"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileAttachment}
                            accept="image/*,video/*,.pdf,.doc,.docx"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-8 h-8 rounded-full hover:bg-secondary" 
                                title="Adjuntar Archivo"
                            >
                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={toggleRecording}
                                className={`w-8 h-8 rounded-full hover:bg-secondary ${isRecording ? 'bg-red-500/20 animate-pulse' : ''}`} 
                                title={isRecording ? "Detener Grabación" : "Grabar Nota de Voz"}
                            >
                                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={!comment.trim()}
                                className="w-8 h-8 rounded-full bg-primary hover:bg-primary/80 transition-transform active:scale-90"
                            >
                                <Send className="w-4 h-4 text-primary-foreground" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 text-center">
                        Presiona Enter para enviar • Los avances se guardan automáticamente
                    </p>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default LeadConversationDialog;
