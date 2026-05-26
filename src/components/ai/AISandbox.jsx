import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
// Configurar el worker de PDF.js usando CDN para compatibilidad total con Vite
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Bot, 
  Send, 
  BrainCircuit, 
  History, 
  Terminal,
  Zap,
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle,
  FileText,
  Search,
  Fingerprint,
  Image as ImageIcon,
  Video,
  MessageSquare,
  LayoutGrid,
  Presentation,
  MapPin,
  Box,
  Layers,
  Key,
  CheckCircle,
  Maximize2,
  Minimize2,
  GripHorizontal,
  Paperclip,
  File,
  FileImage,
  Copy,
  Share,
  Edit2,
  Trash2,
  Eraser,
  Lock,
  Unlock
} from 'lucide-react';
// KYRO V8.11 - CORS-FREE ARCHITECTURE ACTIVE
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabaseAnonKey, supabase } from '@/lib/customSupabaseClient';
import ParametricReport from './ParametricReport';
import CapexReport from './CapexReport';
import DigitalProfileReport from './DigitalProfileReport';
import FullProjectReport from './FullProjectReport';
import KyroImageEditor from './KyroImageEditor';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AISandbox = ({ open, onOpenChange, initialPrompt }) => {
  const { leads, deals, logistics } = useData();
  const [messages, setMessages] = useState([]);
  const isSyncingRef = useRef(false);
  const [input, setInput] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [fichaDocs, setFichaDocs] = useState([]);
  const fichaDocsRef = useRef([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [panelOpacity, setPanelOpacity] = useState(() => Number(localStorage.getItem('kyro_panel_opacity')) || 85);
  const [isOpacityLocked, setIsOpacityLocked] = useState(() => localStorage.getItem('kyro_opacity_locked') === 'true');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('parametric'); 
  const [reportData, setReportData] = useState(null);
  const [showExplorer, setShowExplorer] = useState(false);
  const [userMemory, setUserMemory] = useState(() => {
    const saved = localStorage.getItem('kyro_pandora_memory');
    return saved ? JSON.parse(saved) : { name: '' };
  });
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('kyro_openai_key') || '');
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [editorImage, setEditorImage] = useState(null);
  const [panelW, setPanelW] = useState(900);
  const [panelH, setPanelH] = useState(Math.floor(window.innerHeight * 0.85));
  const [showVault, setShowVault] = useState(false);
  const fileInputRef = useRef(null);
  const dragControls = useDragControls();
  const scrollRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setMessages(prev => {
          const updated = [...prev, {
            role: 'user',
            content: `Subió imagen: ${file.name}`,
            imageUrl,
            timestamp: new Date(),
            type: 'image'
          }];
          saveToCloud(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjs.getDocument(typedarray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(" ") + "\n";
          }
          
          setMessages(prev => {
            const updated = [...prev, {
              role: 'user',
              content: `📄 Analizando PDF: ${file.name}`,
              fileContent: fullText,
              timestamp: new Date(),
              type: 'file',
              fileType: file.type,
              fileName: file.name
            }];
            saveToCloud(updated);
            return updated;
          });
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error("Error al leer PDF:", err);
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
       const reader = new FileReader();
       reader.onload = (e) => {
         const data = new Uint8Array(e.target.result);
         const workbook = XLSX.read(data, { type: 'array' });
         const sheetName = workbook.SheetNames[0];
         const worksheet = workbook.Sheets[sheetName];
         const json = XLSX.utils.sheet_to_json(worksheet);
         const text = JSON.stringify(json, null, 2);
         
         setMessages(prev => {
           const updated = [...prev, {
             role: 'user',
             content: `📊 Analizando Hoja de Cálculo: ${file.name}`,
             fileContent: text,
             timestamp: new Date(),
             type: 'file',
             fileType: 'excel',
             fileName: file.name
           }];
           saveToCloud(updated);
           return updated;
         });
       };
       reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.docx')) {
       const reader = new FileReader();
       reader.onload = async (e) => {
         const arrayBuffer = e.target.result;
         const result = await mammoth.extractRawText({ arrayBuffer });
         setMessages(prev => {
           const updated = [...prev, {
             role: 'user',
             content: `📝 Analizando Documento Word: ${file.name}`,
             fileContent: result.value,
             timestamp: new Date(),
             type: 'file',
             fileType: 'word',
             fileName: file.name
           }];
           saveToCloud(updated);
           return updated;
         });
       };
       reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
       // --- RUTA MULTIMEDIA: TRANSCRIPCIÓN NEURAL ---
       setMessages(prev => [...prev, {
         role: 'assistant',
         content: `🎙️ Procesando audio/video con el motor Whisper de OpenAI... por favor espera.`,
         timestamp: new Date(),
         type: 'text'
       }]);

       try {
         const { default: OpenAI } = await import('openai');
         const openaiClient = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
         
         const transcription = await openaiClient.audio.transcriptions.create({
           file: file,
           model: "whisper-1",
         });

         setMessages(prev => {
           const updated = prev.slice(0, -1).concat([{
             role: 'user',
             content: `🎬 Transcripción Neural de ${file.name}`,
             fileContent: transcription.text,
             timestamp: new Date(),
             type: 'file',
             fileType: 'multimedia',
             fileName: file.name
           }]);
           saveToCloud(updated);
           return updated;
         });
       } catch (err) {
         console.error("Error en transcripción:", err);
         setMessages(prev => prev.slice(0, -1).concat([{
           role: 'assistant',
           content: `❌ Error al procesar audio: ${err.message}. Asegúrate de tener una API Key válida configurada.`,
           timestamp: new Date(),
           type: 'text'
         }]));
       }
    } else {
      // Other files
      setMessages(prev => [...prev, {
        role: 'user',
        content: `📁 Archivo subido: ${file.name}`,
        timestamp: new Date(),
        type: 'file',
        fileType: file.type,
        fileName: file.name
      }]);
    }
  };

  const onPaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleFileUpload(file);
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Cargar mensajes al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('kyro_pandora_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed.filter(m => m && m.content));
        }
      } catch (e) {
        console.error('Error loading chat history:', e);
        localStorage.removeItem('kyro_pandora_chat');
      }
    }
  }, []);

  // Guardar mensajes cuando cambien
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const pruned = messages.length > 50 ? messages.slice(-50) : messages;
        localStorage.setItem('kyro_pandora_chat', JSON.stringify(pruned));
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          localStorage.setItem('kyro_pandora_chat', JSON.stringify(messages.slice(-10)));
        }
      }
    }
  }, [messages]);

  const handleDeleteMessage = (idx) => {
    setMessages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleForwardMessage = (content) => {
    setInputText(content);
  };

  const handleStartEdit = (idx, content) => {
    setEditingIndex(idx);
    setEditValue(content);
  };

  const handleSaveEdit = (idx) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], content: editValue };
      return updated;
    });
    setEditingIndex(null);
  };

  // ESC para cerrar editor o sandbox
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (editorImage) { setEditorImage(null); }
      else if (open) onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editorImage, open, onOpenChange]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = panelW, startH = panelH;
    const onMove = (ev) => {
      setPanelW(Math.max(640, startW + ev.clientX - startX));
      setPanelH(Math.max(480, startH + ev.clientY - startY));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleSelectLead = async (lead) => {
    isSyncingRef.current = true;
    setSelectedLead(lead);
    setLeadSearch('');
    setShowExplorer(false);

    // --- CARGA ASÍNCRONA DE DATOS PESADOS (Lazy Loading) ---
    // Fetch notes y quotations solo para el lead seleccionado para no saturar el login inicial
    let cloudNotes = lead.notes;
    let cloudQuotations = lead.quotations;

    if (!cloudNotes || !cloudQuotations) {
      try {
        const { data: details } = await supabase
          .from('leads')
          .select('notes, quotations')
          .eq('id', lead.id)
          .single();
        if (details) {
          cloudNotes = details.notes;
          cloudQuotations = details.quotations;
        }
      } catch (e) {
        console.warn("Lazy fetch failed:", e);
      }
    }
    
    // Cargar historial de la nube (leads.notes) si existe
    if (cloudNotes) {
      try {
        const cloudHistory = JSON.parse(cloudNotes);
        if (Array.isArray(cloudHistory)) {
          const aiMessages = cloudHistory.map(entry => ({
            role: entry.type === 'ai_response' ? 'assistant' : 'user',
            content: entry.text,
            timestamp: new Date(entry.date),
            type: entry.msgType || 'text',
            fileName: entry.fileName,
            fileContent: entry.fileContent,
            imageUrl: entry.fileUrl,
            chartType: entry.chartType,
            chartData: entry.chartData,
            chartTitle: entry.chartTitle
          }));
          setMessages(aiMessages);
        }
      } catch (e) {
        console.error("Error parsing cloud history:", e);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }

    const leadDeal = (deals || []).find(d => d.lead_id === lead.id);
    const leadLogistics = (logistics || []).find(l => l.lead_id === lead.id);
    
    // Cálculo Dinámico del Valor (Suma de máquinas + metadatos)
    const machinesValue = (lead.machines || []).reduce((sum, m) => sum + (Number(m?.price) || 0), 0);
    const finalValue = leadDeal?.value || lead.value || machinesValue || 0;
    
    // RE-HIDRATACIÓN CRÍTICA: Actualizamos el estado con TODO el contexto recuperado
    const hydratedLead = { 
      ...lead, 
      notes: cloudNotes, 
      quotations: cloudQuotations, 
      value: finalValue,
      deal: leadDeal,
      logistics: leadLogistics
    };
    setSelectedLead(hydratedLead);

    setReportData(hydratedLead);

    const contextMsg = {
      id: Date.now(),
      role: 'assistant',
      content: `He activado la consola industrial para **${lead.name}**. Tengo acceso a la cotización de **$${finalValue.toLocaleString()} USD** y el inventario técnico. ¿Qué área estratégica deseas profundizar?`,
      timestamp: new Date(),
      isContext: true,
      type: 'text'
    };
    setMessages(prev => [...prev, contextMsg]);

    // --- ESCANEO DE FICHA: CARGAR DOCUMENTOS OFICIALES ---
    if (cloudQuotations && cloudQuotations.length > 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔍 Escaneando bóveda de documentos oficiales de **${lead.name}**...`,
        timestamp: new Date(),
        type: 'text'
      }]);

      const parsedDocs = [];
      for (const q of cloudQuotations) {
        if (q.url && (q.url.includes('application/pdf') || q.url.startsWith('data:application/pdf') || q.fileName?.toLowerCase().endsWith('.pdf'))) {
          try {
            console.log(`KYRO: Procesando documento de ficha: ${q.fileName}`);
            let pdfData = q.url;
            
            // Si es base64, convertir a Uint8Array para PDF.js
            if (q.url.startsWith('data:application/pdf;base64,')) {
              const base64 = q.url.split(',')[1];
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              pdfData = { data: bytes };
            }

            const loadingTask = pdfjs.getDocument(pdfData);
            const pdf = await loadingTask.promise;
            let docText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              docText += textContent.items.map(item => item.str).join(" ") + "\n";
            }
            parsedDocs.push({ fileName: q.fileName, content: docText });
          } catch (err) {
            console.error(`Error escaneando documento de ficha ${q.fileName}:`, err);
          }
        }
      }

      if (parsedDocs.length > 0) {
        setFichaDocs(parsedDocs);
        fichaDocsRef.current = parsedDocs;
        setMessages(prev => prev.slice(0, -1).concat([{
          role: 'assistant',
          content: `✅ He analizado **${parsedDocs.length}** documentos de la ficha oficial. Tengo los montos y especificaciones técnicas en mi memoria.`,
          timestamp: new Date(),
          type: 'text'
        }]));
      } else {
        setMessages(prev => prev.slice(0, -1)); 
      }
    } else {
      setFichaDocs([]);
      fichaDocsRef.current = [];
    }

    setTimeout(() => { isSyncingRef.current = false; }, 500);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredLeads = (leads || []).filter(l => 
    l.name.toLowerCase().includes(leadSearch.toLowerCase()) || 
    (l.contact && l.contact.toLowerCase().includes(leadSearch.toLowerCase()))
  ).slice(0, 5);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('¿Deseas purgar todo el historial estratégico? Esta acción también eliminará el respaldo en la nube para este cliente.')) {
      setMessages([]);
      localStorage.removeItem('kyro_pandora_chat');
      
      if (selectedLead) {
        try {
          await supabase.from('leads').update({ notes: null }).eq('id', selectedLead.id);
        } catch (e) {
          console.error("Failed to clear cloud notes:", e);
        }
      }
    }
  };

  const saveToCloud = async (newMessages) => {
    if (!selectedLead || isSyncingRef.current) return;
    
    try {
      const cloudFormat = newMessages.map(m => ({
        text: m.content,
        date: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        type: m.role === 'assistant' ? 'ai_response' : 'ai_prompt',
        msgType: m.type,
        fileName: m.fileName,
        fileContent: m.fileContent,
        fileUrl: m.imageUrl,
        chartType: m.chartType,
        chartData: m.chartData,
        chartTitle: m.chartTitle
      }));
      
      // Sincronizar con la nube (Supabase)
      const { error } = await supabase.from('leads').update({ 
        notes: JSON.stringify(cloudFormat) 
      }).eq('id', selectedLead.id);
      
      if (error) console.warn("Supabase Sync Warning:", error);
    } catch (e) {
      console.error("Cloud sync failed:", e);
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Guardar en localStorage como fallback
    if (messages.length > 0) {
      localStorage.setItem('kyro_pandora_chat', JSON.stringify(messages));
      if (!isSyncingRef.current) {
        saveToCloud(messages);
      }
    }
  }, [messages, open]);

  const handleQuickAction = (action) => {
    if (!selectedLead) {
      const errorMsg = {
        id: Date.now(),
        role: 'assistant',
        content: 'Primero selecciona un cliente o proyecto para realizar esta acción estratégica.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }
    setReportType(action);
    setShowReport(true);
  };

  const MarkdownText = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-black text-cyan-400">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </span>
    );
  };

  useEffect(() => {
    localStorage.setItem('kyro_pandora_memory', JSON.stringify(userMemory));
  }, [userMemory]);

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const { user } = useAuth();

  // Inicializar memoria desde la nube (Supabase Auth Metadata) o Local
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUserMemory(prev => ({ ...prev, name: user.user_metadata.full_name }));
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      const pingAI = async () => {
        try {
          // Usamos un fetch limpio (sin x-client-info) para evitar bloqueos CORS en localhost:3001
          const res = await fetch('https://cizkskcvenagvvrnklal.supabase.co/functions/v1/ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ q: 'ping' })
          });
          if (res.ok) setConnectionStatus('online');
          else setConnectionStatus('offline');
        } catch (e) {
          setConnectionStatus('offline');
        }
      };
      pingAI();
    }
  }, [open]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const lowerText = text.toLowerCase();

    // --- CAPA DE INTENCIÓN NEURAL: COMANDOS DE APERTURA ---
    // Detecta frases como "abre dhl", "abrir fyffes", "selecciona a Bimbo"
    const openPatterns = [/^(abre|abrir|selecciona|seleccionar|ver)\s+(a\s+)?(.+)$/i];
    let matchedLead = null;
    
    for (const pattern of openPatterns) {
      const match = text.match(pattern);
      if (match) {
        const leadNameQuery = match[3].trim().toLowerCase();
        matchedLead = (leads || []).find(l => 
          l.name.toLowerCase() === leadNameQuery || 
          l.name.toLowerCase().includes(leadNameQuery)
        );
        if (matchedLead) break;
      }
    }

    if (matchedLead) {
      setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Confirmado. Accediendo a la ficha técnica de **${matchedLead.name}** y sincronizando documentos oficiales...`,
        timestamp: new Date(),
        type: 'text'
      }]);
      setInput('');
      handleSelectLead(matchedLead);
      return;
    }

    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // --- RUTA 0: DETECCIÓN CONTEXTUAL DE NOMBRE ---
      // Si Pandora acaba de pedir el nombre y el usuario responde con una sola palabra, es su nombre
      const lastAIMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
      const isNameContext = lastAIMsg.includes('llamarte') || lastAIMsg.includes('llamas') || lastAIMsg.includes('nombre oficial') || lastAIMsg.includes('registrar tu nombre');
      const isSingleName = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(\s[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?$/.test(text.trim()) && text.trim().split(' ').length <= 3;
      
      if (isNameContext && isSingleName && text.trim().length > 2) {
        const newName = text.trim();
        try { await supabase.auth.updateUser({ data: { full_name: newName } }); } catch(e) {}
        setUserMemory(prev => ({ ...prev, name: newName }));
        setMessages(prev => [...prev, { role: 'assistant', content: `Perfecto, **${newName}**. Identidad registrada y sincronizada con la nube de KYRO. Soy tu orquestador estratégico personal. ¿En qué frente operamos hoy?`, timestamp: new Date(), type: 'text' }]);
        setIsTyping(false); return;
      }

      // --- RUTA 1: REGISTRO DE IDENTIDAD EXPLÍCITO (Local + Nube) ---
      if (lowerText.includes('me llamo') || lowerText.includes('mi nombre es') || lowerText.includes('recuerda que soy')) {
        const nameMatch = text.match(/(?:me llamo|mi nombre es|recuerda que soy)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
        if (nameMatch?.[1]) {
          const newName = nameMatch[1];
          try { await supabase.auth.updateUser({ data: { full_name: newName } }); } catch(e) {}
          setUserMemory(prev => ({ ...prev, name: newName }));
          setMessages(prev => [...prev, { role: 'assistant', content: `Confirmado, **${newName}**. Identidad sincronizada con la nube de KYRO. ¿En qué frente estratégico operamos hoy?`, timestamp: new Date(), type: 'text' }]);
          setIsTyping(false); return;
        }
      }

      if (lowerText.includes('quien soy') || lowerText.includes('quién soy') || lowerText.includes('como me llamo')) {
        const n = userMemory.name || user?.user_metadata?.full_name;
        const resp = (n && n !== 'Developer') ? `Eres **${n}**, el Estratega Senior a cargo de **${selectedLead?.name || 'KYRO'}**.` : `No tengo tu nombre registrado aún. ¿Cómo debería llamarte?`;
        setMessages(prev => [...prev, { role: 'assistant', content: resp, timestamp: new Date(), type: 'text' }]);
        setIsTyping(false); return;
      }

      // --- RUTA 2: GENERACIÓN DE IMÁGENES (OpenAI DALL-E 3 directo desde browser) ---
      const imageKeywords = ['crea', 'genera', 'dibuja', 'imagen', 'foto', 'ilustra', 'muestra', 'haz', 'diseña', 'pintame', 'píntame', 'bosqueja', 'renderiza'];
      const isImageRequest = imageKeywords.some(k => lowerText.includes(k));
      const hasVisualNoun = lowerText.includes('imagen') || lowerText.includes('foto') || lowerText.includes('ilustración') || lowerText.includes('logo') || lowerText.includes('diseño') || lowerText.includes('banner') || lowerText.includes('dibujo') || lowerText.includes('manzana') || lowerText.includes('retrato') || lowerText.includes('paisaje') || lowerText.includes('realista') || lowerText.includes('fotografia') || lowerText.includes('fotografía');
      
      if (isImageRequest && hasVisualNoun) {
        if (!openaiKey) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Para generar imágenes necesito tu **API Key de OpenAI**. Haz clic en el botón 🔑 **Sin Key** en la esquina superior derecha del chat y pega tu key. Solo lo haces una vez y queda guardada.', 
            timestamp: new Date(), type: 'text' 
          }]);
          setIsTyping(false); return;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: '🎨 Generando imagen con DALL-E 3... (10-20 segundos)', timestamp: new Date(), type: 'text' }]);
        
        try {
          const { default: OpenAI } = await import('openai');
          const openaiClient = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
          
          const response = await openaiClient.images.generate({
            model: 'dall-e-3',
            prompt: `${text}, high quality, detailed, professional`,
            n: 1, size: '1024x1024', quality: 'standard',
            response_format: 'b64_json'
          });
          
          const imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
          setMessages(prev => prev.slice(0, -1).concat([{
            role: 'assistant', content: text, imageUrl,
            timestamp: new Date(), type: 'image'
          }]));
        } catch(imgErr) {
          const errMsg = imgErr.message?.includes('401') || imgErr.message?.includes('Incorrect API key')
            ? 'La API Key no es válida. Haz clic en 🔑 para actualizarla.'
            : `Error al generar imagen: ${imgErr.message}`;
          setMessages(prev => prev.slice(0, -1).concat([{
            role: 'assistant', content: errMsg, timestamp: new Date(), type: 'text'
          }]));
        }
        setIsTyping(false); return;
      }

      // --- RUTA 3: GENERACIÓN DE GRÁFICAS (Recharts) ---
      const isChartRequest = lowerText.includes('gráfica') || lowerText.includes('grafica') || lowerText.includes('chart') || lowerText.includes('grafico') || lowerText.includes('gráfico') || lowerText.includes('visualiza') || lowerText.includes('tabla comparativa') || lowerText.includes('barra') || lowerText.includes('pastel') || lowerText.includes('comparativa');
      
      if (isChartRequest) {
        // Pedir a GPT datos estructurados para la gráfica
        const chartPromptPayload = `El usuario pidió: "${text}". Responde ÚNICAMENTE con JSON válido (sin markdown, sin explicación) en este formato exacto:
{"title": "Título del gráfico", "type": "bar|line|pie", "data": [{"name": "Etiqueta", "value": número}], "insight": "Una sola oración de análisis estratégico."}\nSi necesitas datos del contexto: Lead=${selectedLead?.name || 'N/A'}, Valor=${selectedLead?.value || 0} USD.`;
        
        const chartRes = await fetch('https://cizkskcvenagvvrnklal.supabase.co/functions/v1/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` },
          body: JSON.stringify({ q: chartPromptPayload, prompt: chartPromptPayload })
        });
        
        if (chartRes.ok) {
          const chartRaw = await chartRes.json();
          const chartText = chartRaw.reply || chartRaw.response || chartRaw.output || chartRaw.content || chartRaw.text || '';
          try {
            const cleanJson = chartText.replace(/```json|```/g, '').trim();
            const chartJson = JSON.parse(cleanJson);
            if (chartJson?.data?.length > 0) {
              setMessages(prev => [...prev, {
                role: 'assistant', type: 'chart',
                chartType: chartJson.type || 'bar',
                chartData: chartJson.data,
                chartTitle: chartJson.title,
                content: chartJson.insight || '',
                timestamp: new Date()
              }]);
              setIsTyping(false); return;
            }
          } catch(e) { /* Si no parsea JSON, cae al chat normal */ }
        }
      }

      // --- RUTA 4: CHAT GPT-4o LIBRE (Todo lo demás) ---
      // 1. Extraer TODOS los archivos técnicos disponibles en toda la historia para contexto perpetuo
      const allTechnicalFiles = messages.filter(m => m.fileContent);
      const persistentFilesCtx = allTechnicalFiles.map(f => 
        `[CONTENIDO TÉCNICO PERPETUO - ARCHIVO: ${f.fileName}]:\n${f.fileContent.substring(0, 15000)}`
      ).join('\n\n---\n\n');

      // 2. Extraer documentos de la ficha (Quotations/Docs guardados)
      const fichaDocsCtx = fichaDocsRef.current.map(d => 
        `[DOCUMENTO OFICIAL DE LA FICHA - ARCHIVO: ${d.fileName}]:\n${d.content.substring(0, 15000)}`
      ).join('\n\n---\n\n');

      // 3. Historial reciente (últimos 10 mensajes) para flujo conversacional
      const historyCtx = messages.slice(-10)
        .filter(m => m.type !== 'image' && m.type !== 'chart')
        .map(m => `${m.role === 'user' ? 'USUARIO' : 'KYRO'}: ${m.content}`)
        .join('\n');

      // Contexto global del sistema
      const totalLeads = leads?.length || 0;
      const pipelineValue = (deals || []).reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const leadsList = (leads || []).map(l => `- ${l.name} (${l.status || 'Sin estado'})`).join('\n');

      const systemPrompt = `Eres KYRO, la IA estratégica industrial de KYRO. Responde en español, con tono experto, autoritario y servicial.
IMPORTANTE: Tienes acceso a la base de datos global de clientes, así como a documentos técnicos específicos.

CONTEXTO GLOBAL DEL SISTEMA KYRO:
- Total de clientes/proyectos registrados: ${totalLeads}
- Valor total del Pipeline: $${pipelineValue.toLocaleString()} USD
- Lista de clientes en el programa:\n${leadsList}

Analiza la información global y los documentos con precisión milimétrica. Si el usuario pregunta por la cantidad de clientes, usa el CONTEXTO GLOBAL. Si pregunta por documentos o cotizaciones previas de un cliente activo, búscalas en los "DOCUMENTOS OFICIALES DE LA FICHA". Nunca digas que no tienes acceso a ellos.

DOCUMENTOS OFICIALES DE LA FICHA:
${fichaDocsCtx || 'No hay documentos oficiales en la ficha.'}

DOCUMENTOS DE SESIÓN CARGADOS:
${persistentFilesCtx || 'No hay archivos de sesión cargados.'}

Fecha y Hora Actual: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.
Usuario: ${userMemory.name || user?.user_metadata?.full_name || 'Estratega Senior'}.
Contexto activo: ${selectedLead ? `Cliente ${selectedLead.name}, valor $${(selectedLead.value || 0).toLocaleString()} USD + IVA` : 'Sin cliente seleccionado (Modo Consola Global)'}.
Historial reciente de chat:\n${historyCtx}`;

      const chatRes = await fetch('https://cizkskcvenagvvrnklal.supabase.co/functions/v1/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ q: `${systemPrompt}\n\nPREGUNTA: ${text}`, prompt: systemPrompt, query: text, message: text })
      });

      if (!chatRes.ok) throw new Error(`HTTP ${chatRes.status}`);
      
      const rawText = await chatRes.text();
      console.log('KYRO RAW RESPONSE:', rawText.substring(0, 200));
      
      let aiText = '';
      try {
        const chatData = JSON.parse(rawText);
        // Intentar todos los campos posibles que puede devolver la función
        aiText = chatData.reply || chatData.response || chatData.output || chatData.content || chatData.text ||
                 chatData.message || chatData.answer || chatData.result || chatData.data?.reply || 
                 chatData.data?.content || chatData.data?.text || chatData.choices?.[0]?.message?.content ||
                 (typeof chatData === 'string' ? chatData : '') ||
                 Object.values(chatData).find(v => typeof v === 'string' && v.length > 5) || '';
      } catch(e) {
        // Si no es JSON, usar el texto raw directamente
        aiText = rawText;
      }
      
      if (!aiText) throw new Error('Sin respuesta del motor');

      setMessages(prev => {
        const updated = [...prev, { role: 'assistant', content: aiText, timestamp: new Date(), type: 'text' }];
        saveToCloud(updated);
        return updated;
      });

    } catch (error) {
      console.error('KYRO Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Hay un problema de conectividad con el motor neural (${error.message}). Verifica que el servidor de KYRO esté activo en el puerto 3001.`,
        timestamp: new Date(), type: 'text'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateReport = (lead = null) => {
    const sLead = lead || leads[0];
    setReportData(sLead);
    setShowReport(true);
  };

  return (
    <>
      {/* ===== EDITOR PROFESIONAL DE IMAGEN ===== */}
      {editorImage && (
        <KyroImageEditor 
          imageUrl={editorImage} 
          onClose={() => {
            console.log("Cerrando editor KYRO...");
            setEditorImage(null);
          }} 
        />
      )}

      {/* ===== BÓVEDA CLOUD OVERLAY ===== */}
      {showVault && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10">
          <div className="w-full max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-400/10 rounded-2xl">
                  <Cloud className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Bóveda Cloud de Diseños</h3>
                  <p className="text-white/40 text-xs mt-1 uppercase tracking-wider">Historial de activos generados y guardados</p>
                </div>
              </div>
              <button onClick={() => setShowVault(false)} className="p-3 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              {JSON.parse(localStorage.getItem('kyro_cloud_vault') || '[]').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                  <LayoutGrid className="w-20 h-20" />
                  <span className="text-sm font-black uppercase tracking-[0.3em]">No hay diseños en la nube aún</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-6">
                  {JSON.parse(localStorage.getItem('kyro_cloud_vault') || '[]').reverse().map((design, i) => (
                    <div key={i} className="group relative aspect-square bg-black rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-400/50 transition-all cursor-pointer"
                      onClick={() => { setEditorImage(design.activeBgUrl); setShowVault(false); }}>
                      <img src={design.activeBgUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Diseño #{i+1}</div>
                        <div className="text-[8px] text-white/40 uppercase mt-1">{new Date(design.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => onOpenChange(false)}
            />
            {/* Draggable Panel */}
            <motion.div
              drag={!isFullScreen} dragControls={dragControls} dragListener={false} dragMomentum={false} dragElastic={0}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={isFullScreen ? {
                width: '100vw',
                height: '100vh',
                left: 0,
                top: 0,
                borderRadius: 0,
                backgroundColor: `rgba(0, 0, 0, ${panelOpacity / 100})`
              } : { 
                width: panelW, 
                height: panelH,
                left: `calc(50vw - ${panelW / 2}px)`,
                top: `calc(50vh - ${panelH / 2}px)`,
                backgroundColor: `rgba(0, 0, 0, ${panelOpacity / 100})`
              }}
              className="fixed z-50 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,169,193,0.2)] select-none glass-bevel"
            >
              {/* Resize handle */}
              {!isFullScreen && (
                <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-6 h-6 z-50 cursor-se-resize flex items-end justify-end p-1">
                  <GripHorizontal className="w-3 h-3 text-white/20 rotate-45" />
                </div>
              )}

        <div className="flex h-full relative">
          <div className={`flex flex-col h-full transition-all duration-500 ${showReport ? 'w-1/3 border-r border-white/10' : 'w-full'}`}>
            
            {/* Header — drag handle */}
            <div
              onPointerDown={e => dragControls.start(e)}
              className="pt-10 pb-6 px-10 border-b border-white/10 flex flex-col items-center justify-center bg-black/40 relative overflow-hidden group cursor-grab active:cursor-grabbing"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="absolute top-6 left-10 flex flex-col items-start opacity-50">
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                  {currentTime.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
                <span className="text-[15px] font-medium tracking-[0.1em] text-cyan-400">
                  {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-6 h-10">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    connectionStatus === 'online' ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse' :
                    connectionStatus === 'offline' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' :
                    'bg-white/20'
                  }`} />
                  <span className="text-[11px] font-black tracking-[0.3em] text-white/60 uppercase">
                    {connectionStatus === 'online' ? 'Neural Sync Active' : 
                     connectionStatus === 'offline' ? 'Neural Sync Offline' : 
                     'Syncing Neurons...'}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={selectedLead ? selectedLead.id : 'pandora'}
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  >
                    {selectedLead ? selectedLead.name : 'PANDORA'}
                  </motion.h2>
                </AnimatePresence>
                <motion.div 
                  layoutId="header-underline"
                  className="w-12 h-0.5 bg-cyan-400 mt-3 shadow-[0_0_15px_rgba(34,211,238,0.8)]" 
                />
              </div>

              {/* Buscador de Clientes Integrado en Header */}
              <div className="w-full max-w-md relative group/search z-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within/search:text-cyan-400 transition-colors" />
                <input 
                  type="text"
                  placeholder="Explorar vectores de clientes o proyectos..."
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    if(e.target.value && !showExplorer) setShowExplorer(true);
                  }}
                  className="w-full h-10 bg-white/[0.03] border border-white/5 rounded-lg pl-10 pr-10 text-[11px] text-white placeholder:text-white/10 focus:outline-none focus:border-cyan-400/30 focus:bg-white/[0.06] transition-all font-mono uppercase tracking-wider"
                />
                <button 
                  onClick={() => setShowExplorer(!showExplorer)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded transition-all ${showExplorer ? 'text-cyan-400' : 'text-white/10 hover:text-white'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="absolute top-6 right-14 flex items-center gap-3 z-20">
                {/* Indicador Key OpenAI */}
                <button
                  onClick={() => { setKeyInput(openaiKey); setShowKeySetup(true); }}
                  title={openaiKey ? 'API Key configurada — Click para cambiar' : 'Configurar API Key de OpenAI'}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                    openaiKey 
                      ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400 hover:bg-emerald-400/10' 
                      : 'border-white/10 bg-white/5 text-white/20 hover:text-white/50 hover:border-white/20'
                  }`}
                >
                  {openaiKey 
                    ? <CheckCircle className="w-3 h-3" /> 
                    : <Key className="w-3 h-3" />
                  }
                  <span className="text-[7px] font-bold uppercase tracking-widest">
                    {openaiKey ? 'DALL-E' : 'Sin Key'}
                  </span>
                </button>
                <div className="flex items-center gap-2 opacity-30">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">KYRO-X v5.5</span>
                </div>
                <button
                  onClick={handleClearChat}
                  title="Limpiar Conversación"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-red-500/10 bg-red-500/5 text-red-500/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all ml-2"
                >
                  <Eraser className="w-3 h-3" />
                  <span className="text-[7px] font-bold uppercase tracking-widest">Clear</span>
                </button>

                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                  {/* Opacity Slider */}
                  <div className={`flex items-center gap-3 transition-all duration-500 ${isOpacityLocked ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Density</span>
                      <span className="text-[9px] font-mono text-cyan-400">{panelOpacity}%</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" step="1"
                      value={panelOpacity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPanelOpacity(val);
                        localStorage.setItem('kyro_panel_opacity', val);
                      }}
                      className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  
                  {/* Lock Button */}
                  <button
                    onClick={() => {
                      const newLock = !isOpacityLocked;
                      setIsOpacityLocked(newLock);
                      localStorage.setItem('kyro_opacity_locked', newLock);
                    }}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isOpacityLocked 
                        ? 'border-cyan-400/50 bg-cyan-400/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                        : 'border-white/10 bg-white/5 text-white/20 hover:text-white hover:border-white/30'
                    }`}
                    title={isOpacityLocked ? 'Desbloquear Opacidad' : 'Bloquear Configuración de Opacidad'}
                  >
                    {isOpacityLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-white/10">
                  <button
                    onClick={() => setIsFullScreen(false)}
                    title="Minimizar"
                    className={`p-1.5 rounded-lg transition-all ${!isFullScreen ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFullScreen(true)}
                    title="Pantalla Completa"
                    className={`p-1.5 rounded-lg transition-all ${isFullScreen ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Area Principal */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
                <AnimatePresence mode="wait">
                  {messages.length === 0 && !leadSearch && !showExplorer ? (
                    <motion.div 
                      key="welcome"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10"
                    >
                      <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center relative">
                         <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
                         <Bot className="w-10 h-10 text-cyan-400 relative z-10" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">¿En qué puedo ayudarte hoy?</h3>
                        <p className="text-white/30 text-[9px] font-medium max-w-sm mx-auto leading-relaxed uppercase tracking-[0.3em]">
                          SISTEMA DE ANÁLISIS ESTRATÉGICO KYRO ACTIVADO
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">

                      {/* Panel de Configuración de API Key */}
                      {showKeySetup && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-black/80 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.1)]"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                              <Key className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widest">Configurar OpenAI API Key</p>
                              <p className="text-[9px] text-white/30 mt-0.5">Se guarda localmente. Necesaria para generar imágenes con DALL-E 3.</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="password"
                              placeholder="sk-proj-... (pega tu key aquí)"
                              value={keyInput}
                              onChange={e => setKeyInput(e.target.value)}
                              className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 font-mono"
                              autoFocus
                            />
                            <div className="text-[9px] text-white/20 leading-relaxed">
                              Obtén tu key gratis en{' '}
                              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-cyan-400/60 underline">
                                platform.openai.com/api-keys
                              </a>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (keyInput.trim().startsWith('sk-')) {
                                    localStorage.setItem('kyro_openai_key', keyInput.trim());
                                    setOpenaiKey(keyInput.trim());
                                    setShowKeySetup(false);
                                    setMessages(prev => [...prev, { role: 'assistant', content: '✅ API Key de OpenAI configurada correctamente. Ya puedes generar imágenes con DALL-E 3. Intenta: **"crea una imagen de una manzana roja"**', timestamp: new Date(), type: 'text' }]);
                                  }
                                }}
                                className="flex-1 h-9 bg-cyan-400 text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-cyan-300 transition-all"
                              >
                                Guardar Key
                              </button>
                              <button
                                onClick={() => setShowKeySetup(false)}
                                className="h-9 px-4 bg-white/5 border border-white/10 text-white/40 text-[10px] rounded-xl hover:bg-white/10 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {messages.map((m, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex group relative ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Botones de Acción en Hover */}
                          <div className={`absolute -top-2 ${m.role === 'user' ? 'right-4 flex-row-reverse' : 'left-4 flex-row'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
                             <button onClick={() => handleCopyMessage(m.content)} className="p-1.5 bg-black/80 border border-white/10 rounded-lg text-white/40 hover:text-cyan-400 transition-all" title="Copiar"><Copy className="w-3 h-3" /></button>
                             <button onClick={() => handleForwardMessage(m.content)} className="p-1.5 bg-black/80 border border-white/10 rounded-lg text-white/40 hover:text-cyan-400 transition-all" title="Reenviar"><Share className="w-3 h-3" /></button>
                             <button onClick={() => handleStartEdit(i, m.content)} className="p-1.5 bg-black/80 border border-white/10 rounded-lg text-white/40 hover:text-cyan-400 transition-all" title="Editar"><Edit2 className="w-3 h-3" /></button>
                             <button onClick={() => handleDeleteMessage(i)} className="p-1.5 bg-black/80 border border-white/10 rounded-lg text-white/40 hover:text-red-400 transition-all" title="Borrar"><Trash2 className="w-3 h-3" /></button>
                          </div>

                          {m.type === 'image' ? (
                            <div className="max-w-[85%] rounded-2xl overflow-hidden border border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-black/40">
                              <div className="bg-black/40 px-4 py-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center justify-between">
                                <div className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> KYRO VISION · DALL-E 3</div>
                                <button onClick={() => setEditorImage(m.imageUrl)} className="p-1 hover:bg-cyan-400/20 rounded-lg transition-all" title="Abrir Editor Pro">
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="relative min-h-[200px] bg-black/60">
                                <div className="absolute inset-0 overflow-hidden" style={{ display: 'block' }}>
                                  <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                                    <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest">Sintetizando imagen...</span>
                                  </div>
                                </div>
                                <img 
                                  src={m.imageUrl} alt={m.content}
                                  className="w-full object-cover relative z-10 transition-opacity duration-500 cursor-zoom-in"
                                  style={{ opacity: 0 }}
                                  onClick={() => setEditorImage(m.imageUrl)}
                                  onLoad={(e) => { e.target.style.opacity = '1'; e.target.previousSibling.style.display = 'none'; }}
                                  onError={(e) => { e.target.previousSibling.innerHTML = '<div class="flex flex-col items-center justify-center gap-2 p-8"><span style="color:rgba(239,68,68,0.6);font-size:10px;text-transform:uppercase;letter-spacing:0.2em;">Error al generar imagen</span></div>'; }}
                                />
                              </div>
                              <div className="bg-black/40 px-4 py-2 text-[10px] text-white/40 italic flex justify-between items-center">
                                <span>{m.content}</span>
                                <span className="text-[8px] opacity-40">{new Date(m.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          ) : m.type === 'chart' ? (
                            <div className="max-w-[95%] w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 shadow-xl relative">
                               <div className="absolute top-4 right-4 text-[8px] opacity-30 font-mono">
                                 {new Date(m.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                               </div>
                              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> {m.chartTitle || 'Análisis Visual'}
                              </div>
                              <ResponsiveContainer width="100%" height={220}>
                                {m.chartType === 'pie' ? (
                                  <PieChart>
                                    <Pie data={m.chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                      {m.chartData.map((_, ci) => (
                                        <Cell key={ci} fill={['#22d3ee','#0ea5e9','#6366f1','#a855f7','#10b981'][ci % 5]} />
                                      ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                  </PieChart>
                                ) : m.chartType === 'line' ? (
                                  <LineChart data={m.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} />
                                  </LineChart>
                                ) : (
                                  <BarChart data={m.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                    <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                )}
                              </ResponsiveContainer>
                              {m.content && <p className="text-white/50 text-xs mt-3 leading-relaxed"><MarkdownText text={m.content} /></p>}
                            </div>
                          ) : m.type === 'file' ? (
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mt-2">
                              <div className="p-3 bg-red-400/10 rounded-xl">
                                {m.fileType === 'application/pdf' ? <FileText className="w-6 h-6 text-red-400" /> : <File className="w-6 h-6 text-white/40" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white">{m.fileName}</span>
                                <span className="text-[9px] text-white/40 uppercase mt-1">Archivo de Soporte</span>
                              </div>
                            </div>
                          ) : (
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed transition-all ${m.role === 'user' ? 'bg-cyan-400 text-black font-bold shadow-[0_4px_15px_rgba(34,211,238,0.3)]' : 'bg-white/[0.05] border border-white/5 text-white/90 shadow-xl'}`}>
                              {editingIndex === i ? (
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                  <textarea
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-cyan-400/50 text-white"
                                    rows={3}
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSaveEdit(i)} className="flex-1 py-1.5 bg-cyan-500 text-black text-[10px] font-black rounded-lg uppercase">Guardar</button>
                                    <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 bg-white/10 text-white/60 text-[10px] rounded-lg">Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <MarkdownText text={m.content} />
                              )}
                              <div className={`mt-1 text-[8px] uppercase tracking-widest opacity-30 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {new Date(m.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/[0.05] p-4 rounded-2xl flex gap-1">
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>

                {showExplorer && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-8 top-8 z-50 bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Directorio de Vectores</h4>
                      <Button 
            onClick={() => setShowExplorer(false)} 
            className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black h-11 px-6 font-black shadow-lg shadow-cyan-400/20 uppercase tracking-widest text-[11px] border-0"
          >
            Cerrar
          </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(leads || [])
                        .filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase()))
                        .slice(0, 12)
                        .map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="flex flex-col items-center p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-cyan-400/10 hover:border-cyan-400/30 transition-all group"
                        >
                          <div className="w-16 h-16 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 border border-white/5 group-hover:border-cyan-400/50 transition-all">
                            <span className="text-3xl font-black text-white/80 group-hover:text-cyan-400">
                              {lead.name?.charAt(0)}
                            </span>
                          </div>
                          <p className="text-[11px] font-black text-white/90 uppercase tracking-tighter truncate w-full text-center">{lead.name}</p>
                        </button>
                      ))}
                      {leads?.filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase())).length === 0 && (
                        <div className="col-span-full py-10 text-center">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No se encontraron vectores coincidentes</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer de Entrada */}
              <div className="p-8 bg-black/40 border-t border-white/10 space-y-4">
                <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                  {[
                    { label: 'Informe Proyecto', icon: FileText, color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5', action: 'parametric' },
                    { label: 'Calcular CAPEX', icon: DollarSign, color: 'text-amber-500 border-amber-500/20 bg-amber-500/5', action: 'capex' },
                    { label: 'Perfil Digital', icon: Fingerprint, color: 'text-purple-500 border-purple-500/20 bg-purple-500/5', action: 'perfil' },
                    { label: 'Proyecto Completo', icon: Presentation, color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5', action: 'full' },
                  ].map((act, i) => (
                    <button 
                      key={i}
                      onClick={() => handleQuickAction(act.action)}
                      className={`flex-none flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${act.color} hover:scale-105`}
                    >
                      <act.icon className="w-3.5 h-3.5" />
                      {act.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all focus:outline-none"
                    title="Subir archivo o imagen"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="relative flex-1 group transition-all duration-300">
                    <Input 
                      placeholder="Escribe una instrucción estratégica (arrastra o pega imágenes)..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      onPaste={onPaste}
                      style={{ outline: 'none' }}
                      className="h-14 bg-white/[0.03] border-white/10 pl-6 pr-14 text-sm rounded-2xl focus:border-cyan-400 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-all placeholder:text-white/20"
                    />
                    <button 
                      onClick={() => handleSend()}
                      style={{ outline: 'none' }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-cyan-400 text-black rounded-xl hover:scale-110 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] focus:outline-none focus-visible:ring-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <div className="absolute -inset-[2px] rounded-2xl border-2 border-cyan-400/0 group-focus-within:border-cyan-400/40 blur-[1px] -z-10 transition-all duration-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Visor de Reporte Completo */}
          <AnimatePresence>
            {showReport && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute inset-0 bg-[#070707] overflow-y-auto z-[100] custom-scrollbar border border-white/10 rounded-3xl"
              >
                <div className="min-h-full flex flex-col p-6 sm:p-12">
                   {/* Botón de Cierre Flotante Premium */}
                   <button 
                     onClick={() => setShowReport(false)}
                     className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-2xl text-white/40 hover:text-red-400 transition-all z-[110] group"
                   >
                     <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                   </button>

                  {reportType === 'parametric' && <ParametricReport data={reportData} onClose={() => setShowReport(false)} />}
                  {reportType === 'capex' && <CapexReport data={reportData} onClose={() => setShowReport(false)} />}
                  {reportType === 'perfil' && <DigitalProfileReport data={reportData} onClose={() => setShowReport(false)} />}
                  {reportType === 'full' && <FullProjectReport data={reportData} onClose={() => setShowReport(false)} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AISandbox;
