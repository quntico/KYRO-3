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
const dayFormat = new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',weekday:'long',day:'numeric',month:'long',year:'numeric'});
const timeFormat = new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const showDay = value => journalDate(value) ? dayFormat.format(journalDate(value)) : 'Fecha sin registrar';
const showTime = value => journalDate(value) && !/^\d{4}-\d{2}-\d{2}$/.test(value) ? timeFormat.format(journalDate(value)) : 'Hora sin registrar';
import { Send, User, Bot, History, MessageCircle, Paperclip, Mic, Download, Share2, X, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { conversationEntries, isDocumentaryImport } from '@/lib/conversationNotes';
import { journalKey, journalPayload, journalDate } from '@/lib/clientJournal';
import {useData} from '@/contexts/DataContext';
import {toast} from '@/components/ui/use-toast';

const LeadConversationDialog = ({ isOpen, onOpenChange, lead, isSale = false, agenda = false }) => {
    const { theme } = useTheme();
    const [comment, setComment] = useState('');
    const {journal, leads, deals, addNote, updateNote, deleteNote, reportAgenda, fetchData} = useData();
    const [chosen,setChosen] = useState('');
    const key = agenda ? chosen : lead && journalKey(lead, isSale);
    const name = journal.clients.get(key) || lead?.name;
    const history = React.useMemo(() => agenda && !chosen ? [...journal.entries].reverse() : journal.byClient.get(key) || [], [agenda,chosen,key,journal]);
    const [busy,setBusy] = useState(false);
    const saving = useRef(false);
    async function persist(action) {
        if (saving.current) return false;
        saving.current = true;
        setBusy(true);
        try { await action(); return true; }
        catch (error) { toast({title:'Seguimiento pendiente de guardar',description:error.message,variant:'destructive'}); return false; }
        finally { saving.current = false; setBusy(false); }
    }
    function append(entry) {
        return persist(() => addNote(journalPayload(entry, name, key)));
    }
    async function change(entry, nextText) {
        if (entry.noteId != null) {
            if (nextText === null) await deleteNote(entry.noteId);
            else {
                const payload = journalPayload({...entry, text:nextText}, entry.name, entry.key);
                await updateNote(entry.noteId, {content:payload.content});
            }
        } else {
            const prospect = leads.find(l => 'lead:' + l.id === entry.key);
            const sale = !prospect && deals.find(d => (d.closing_status?.source_lead_id == null ? 'sale:' + d.id : 'lead:' + d.closing_status.source_lead_id) === entry.key);
            const liveLead = prospect || sale?.closing_status?.source_lead;
            if (!liveLead) throw new Error('La ficha cambió. Actualiza la agenda.');
            const raw = liveLead.notes ?? null;
            let all;
            try { all = JSON.parse(raw); } catch { /* Legacy plain text. */ }
            if (!Array.isArray(all)) all = conversationEntries(raw, liveLead?.last_activity);
            const current = all.filter(e => !isDocumentaryImport(e))[entry.legacyIndex];
            if (!current || current.text !== entry.text) throw new Error('El historial cambió. Vuelve a abrir la entrada.');
            const next = all.flatMap(item => item !== current ? [item] : nextText === null ? [] : [{...item,text:nextText}]);
            const {data,error} = await supabase.rpc('kyro_replace_journal_legacy', {p_kind:sale?'sale':'lead',p_id:sale ? sale.id : prospect.id,p_expected:raw,p_next:JSON.stringify(next)});
            if (error) throw error;
            await fetchData({force:true});
            if (!data) throw new Error('Otro dispositivo actualizó el historial. Revisa la versión actual.');
        }
        reportAgenda((nextText === null ? 'Seguimiento eliminado · ' : 'Seguimiento actualizado · ') + entry.name);
    }
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
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history, isOpen]);

    const safeFormatDate = value => showDay(value) + ' · ' + showTime(value);
    const title = name || 'Mi agenda';

    const handleSend = async () => {
        if (!comment.trim()) return;
        if (await append({text:comment.trim(), type:'manual'})) setComment('');
    };

    const handleDeleteMessage = async entry => {
        if (window.confirm('¿Eliminar esta entrada del seguimiento?')) await persist(() => change(entry,null));
    };

    const handleEditMessage = entry => {
        setEditingIndex(entry.uid);
        setEditText(entry.text);
    };

    const handleSaveEdit = async entry => {
        if (editText.trim() && await persist(() => change(entry,editText.trim()))) setEditingIndex(null);
    };

    const handleDownloadHistory = () => {
        const text = `Historial de Seguimiento: ${title}\n\n` + history.map(entry => `[${safeFormatDate(entry.date)}] ${entry.name} · ${entry.type === 'ai_response' ? 'YARVIS' : 'Usuario'}:\n${entry.text}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Historial_${title.replace(/\s+/g, '_')}.txt`;
        a.click();
    };

    const handleShareWhatsApp = () => {
        const text = `*Historial de Seguimiento: ${title}*\n\n` + history.map(entry => `_${safeFormatDate(entry.date)}_ · ${entry.name}\n${entry.text}`).join('\n\n');
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
            append(newEntry);
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
                        append(newEntry);
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

    if (!agenda && !lead) return null;

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
                <DialogContent className="grid-cols-[minmax(0,1fr)] gap-0 max-h-[96dvh] overflow-y-auto sm:max-w-xl border border-border bg-card text-foreground shadow-2xl p-0 !transform !translate-x-[-50%] !translate-y-[-50%]">
                <div className="p-4 sm:p-6 border-b border-border bg-secondary/10">
                    <DialogHeader>
                        <div className="flex flex-wrap items-center justify-between gap-1 w-full pr-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/20">
                                    <MessageCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-foreground">SEGUIMIENTO</DialogTitle>
                                    <DialogDescription className="text-muted-foreground/80 text-xs">
                                        <span className="text-primary font-bold">{title}</span> · Hora de Ciudad de México
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

                {agenda && <label className="flex items-center gap-3 px-6 pt-3 text-xs">Cliente
                  <select value={chosen} onChange={event => {setChosen(event.target.value); setEditingIndex(null);}} disabled={busy || !!comment.trim() || isRecording} className="min-w-0 flex-1 rounded-lg border border-border bg-background p-2">
                    <option value="">Todos · escribir nota de agenda</option>
                    {[...journal.clients].sort((a,b)=>a[1].localeCompare(b[1],'es')).map(([id,label])=><option value={id} key={id}>{label} · #{id.split(':')[1]}</option>)}
                  </select></label>}
                <ScrollArea className="h-[min(46dvh,400px)] px-4 py-3 sm:px-6 bg-card">
                    <div className="space-y-6">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground opacity-50">
                                <History className="w-12 h-12 mb-4" />
                                <p>No hay mensajes aún.</p>
                                <p className="text-xs">Registra aquí lo que platicaste con el cliente.</p>
                            </div>
                        ) : (
                            history.map((entry,index) => (
                                <div key={entry.uid} className="flex flex-col space-y-2">
                                    {(!index || showDay(entry.date) !== showDay(history[index - 1].date)) && <div className="my-2 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground"><span className="h-px flex-1 bg-border"/><span className="capitalize">{showDay(entry.date)}</span><span className="h-px flex-1 bg-border"/></div>}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60 px-1">
                                        <User className="w-3 h-3" />
                                        <span>{entry.type === 'ai_response' ? 'YARVIS' : 'Usuario'}{agenda && !chosen ? ' · ' + entry.name : ''}</span>
                                        <span className="ml-auto font-bold text-primary/90">
                                            <time dateTime={entry.date || undefined} title={safeFormatDate(entry.date)}>{showTime(entry.date)}</time>
                                        </span>
                                    </div>
                                    <div className="bg-secondary/40 border border-border rounded-2xl rounded-tl-none p-4 shadow-sm relative group/message text-foreground">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 bg-secondary border border-border p-1 rounded-md z-10">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEditMessage(entry)}>
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteMessage(entry)}>
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
                                        {editingIndex === entry.uid ? (
                                            <div className="mt-2 flex flex-col gap-2 relative z-20">
                                                <Textarea 
                                                    value={editText} 
                                                    onChange={(e) => setEditText(e.target.value)} 
                                                    className="bg-background border-border text-foreground text-sm min-h-[60px]"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>Cancelar</Button>
                                                    <Button disabled={busy} size="sm" onClick={() => handleSaveEdit(entry)} className="bg-primary hover:bg-primary/80 text-primary-foreground">Guardar</Button>
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

                <div className="p-4 sm:p-6 bg-secondary/10 border-t border-border">
                    <div className="relative group">
                        <Textarea
                            placeholder="Escribe lo que acordaron o lo que quieres recordar…"
                            disabled={busy} value={comment}
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
                                aria-label="Guardar seguimiento" disabled={busy || !comment.trim()}
                                className="w-8 h-8 rounded-full bg-primary hover:bg-primary/80 transition-transform active:scale-90"
                            >
                                <Send className="w-4 h-4 text-primary-foreground" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 text-center">
                        Enter para guardar · Disponible en YARVIS
                    </p>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default LeadConversationDialog;
