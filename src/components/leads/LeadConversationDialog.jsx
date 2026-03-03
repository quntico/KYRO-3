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
import { Send, User, Bot, History, MessageCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const LeadConversationDialog = ({ isOpen, onOpenChange, lead, onSave }) => {
    const { theme } = useTheme();
    const [comment, setComment] = useState('');
    const [history, setHistory] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen && lead) {
            try {
                // Intentamos parsear las notas como JSON si tienen el formato de bitácora
                const parsedNotes = JSON.parse(lead.notes || '[]');
                if (Array.isArray(parsedNotes)) {
                    setHistory(parsedNotes);
                } else {
                    // Si no es un array, lo tratamos como una nota simple y la convertimos en el primer mensaje
                    setHistory([{
                        text: lead.notes,
                        date: new Date().toISOString(),
                        type: 'manual'
                    }]);
                }
            } catch (e) {
                // Si falla el parseo (es texto plano), creamos el primer mensaje
                if (lead.notes) {
                    setHistory([{
                        text: lead.notes,
                        date: new Date().toISOString(),
                        type: 'manual'
                    }]);
                } else {
                    setHistory([]);
                }
            }
        }
    }, [isOpen, lead]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

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

    if (!lead) return null;

    return (
        <Dialog aria-describedby="bitacora-vance-description" open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl glass-bevel p-0 overflow-hidden border-none shadow-2xl !transform !translate-x-[-50%] !translate-y-[-50%]">
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                                <MessageCircle className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Bitácora de Avance</DialogTitle>
                                <DialogDescription className="text-muted-foreground/80">
                                    Sigue la conversación con <span className="text-primary font-bold">{lead.name}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="h-[400px] p-6" viewportRef={scrollRef}>
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
                                    <div className="bg-white/10 backdrop-blur-md border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                            {entry.text}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 bg-white/5 border-t border-white/10">
                    <div className="relative group">
                        <Textarea
                            placeholder="Escribe el avance de lo que dijo el cliente..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-black/20 border-white/10 focus:border-primary/50 transition-all resize-none pr-12 rounded-xl"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!comment.trim()}
                            className="absolute bottom-3 right-3 rounded-full w-8 h-8 bg-primary hover:bg-primary/80 transition-transform active:scale-90"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 text-center">
                        Presiona Enter para enviar • Los avances se guardan automáticamente
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LeadConversationDialog;
