import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { Sparkles, Send, Trash2, RotateCcw, Download, Cloud, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FONTS = ['Inter','Montserrat','Playfair Display','Oswald','Bebas Neue','Roboto','Pacifico','Anton','Raleway','Dancing Script'];
const EFFECTS = [
  { name: 'Original',  filter: 'none' },
  { name: 'Dramático', filter: 'contrast(150%) brightness(90%) saturate(120%)' },
  { name: 'Vintage',   filter: 'sepia(60%) contrast(110%) brightness(95%)' },
  { name: 'Neón',      filter: 'saturate(250%) contrast(130%) brightness(110%)' },
  { name: 'Noir',      filter: 'grayscale(100%) contrast(130%)' },
  { name: 'Fade',      filter: 'contrast(80%) brightness(115%) saturate(80%)' },
  { name: 'Golden',    filter: 'sepia(30%) brightness(110%) saturate(150%)' },
  { name: 'Electric',  filter: 'hue-rotate(200deg) saturate(200%) brightness(110%)' },
  { name: 'Cold',      filter: 'hue-rotate(180deg) saturate(120%) brightness(105%)' },
  { name: 'Vivid',     filter: 'saturate(200%) contrast(120%)' },
];

let _id = 1;
const uid = () => _id++;

async function toBlobUrl(url) {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  
  // Try direct fetch first
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return URL.createObjectURL(await res.blob());
  } catch (e) {
    console.warn("KYRO: Direct fetch failed, trying proxy...");
  }

  // Fallback to CORS proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) return URL.createObjectURL(await res.blob());
  } catch (e) {
    console.warn("KYRO: Proxy fetch failed, trying canvas fallback...");
  }

  // Last resort: Canvas (might be tainted)
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; 
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        c.toBlob(b => resolve(URL.createObjectURL(b)), 'image/png');
      } catch (e) { resolve(url); }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

export default function KyroImageEditor({ imageUrl, onClose }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(imageUrl); // Start with original
  const [activeBgUrl, setActiveBgUrl] = useState(imageUrl); // Start with original
  const [isLoading, setIsLoading] = useState(true);
  const [texts, setTexts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [effect, setEffect] = useState(EFFECTS[0]);
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100, hue: 0 });
  const [tool, setTool] = useState('select');
  const [isExporting, setIsExporting] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgError, setBgError] = useState('');
  const [bgProgress, setBgProgress] = useState(0);
  
  const [aiCommand, setAiCommand] = useState('');
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [openaiKey] = useState(() => localStorage.getItem('kyro_openai_key') || '');

  useEffect(() => {
    if (!imageUrl) return;
    
    // Si ya es local, no mostrar cargando
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      setBlobUrl(imageUrl);
      setActiveBgUrl(imageUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    toBlobUrl(imageUrl).then(b => { 
      setBlobUrl(b); 
      setActiveBgUrl(b);
      setIsLoading(false);
    }).catch(err => {
      console.error("KYRO Load Error:", err);
      setBlobUrl(imageUrl);
      setActiveBgUrl(imageUrl);
      setIsLoading(false);
    });
  }, [imageUrl]);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Playfair+Display:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Pacifico&family=Anton&family=Raleway:wght@400;700&family=Dancing+Script:wght@400;700&display=swap';
    document.head.appendChild(l);
    return () => document.head.removeChild(l);
  }, []);

  // ESC to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // DRAG logic
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      const { id, sx, sy, ox, oy, rw, rh } = dragRef.current;
      updText(id, 'x', Math.max(0, Math.min(95, ox + ((e.clientX - sx) / rw) * 100)));
      updText(id, 'y', Math.max(0, Math.min(95, oy + ((e.clientY - sy) / rh) * 100)));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const updText = (id, k, v) => setTexts(p => p.map(t => t.id === id ? { ...t, [k]: v } : t));

  const addText = useCallback((e) => {
    if (tool !== 'text') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const n = { id: uid(), content: 'Nuevo Texto', x, y, font: 'Montserrat', size: 40, weight: '800', color: '#ffffff', opacity: 100, shadow: '2px 2px 8px rgba(0,0,0,0.9)', letterSpacing: 0, stroke: '#000000', strokeWidth: 0 };
    setTexts(p => [...p, n]);
    setSelected(n.id);
    setTool('select');
  }, [tool]);

  const handleRemoveBg = async () => {
    setBgError('');
    setIsRemovingBg(true);
    setBgProgress(0);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      
      // Intentar cargar con configuración de CDN explícita para evitar errores de ruta local
      const result = await removeBackground(activeBgUrl, {
        model: 'medium',
        publicPath: 'https://unpkg.com/@imgly/background-removal@1.7.0/dist/',
        progress: (key, current, total) => {
          setBgProgress(Math.round((current / total) * 100));
        }
      });
      
      const newUrl = URL.createObjectURL(result);
      setActiveBgUrl(newUrl);
      setBlobUrl(newUrl);
    } catch (e) { 
      console.error("KYRO AI BG Error:", e);
      setBgError(`Error IA: ${e.message?.slice(0, 30) || 'Procesamiento'}`);
    }
    setIsRemovingBg(false);
    setBgProgress(0);
  };

  const handleAiCommand = async () => {
    if (!aiCommand.trim() || !openaiKey) return;
    setIsAiWorking(true);
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
      
      const prompt = `Actúa como un editor de diseño experto. El usuario tiene una imagen con estos filtros: ${JSON.stringify(filters)} y estos textos: ${JSON.stringify(texts)}. El usuario dice: "${aiCommand}". Responde ÚNICAMENTE con JSON (sin markdown).`;

      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(res.choices[0].message.content);
      if (result.filterUpdates) setFilters(p => ({ ...p, ...result.filterUpdates }));
      if (result.textUpdates) {
        const targetId = selected || (texts[0]?.id);
        if (targetId) setTexts(p => p.map(t => t.id === targetId ? { ...t, ...result.textUpdates } : t));
      }
      if (result.addText) {
        const n = { id: uid(), font: 'Montserrat', size: 40, weight: '800', color: '#ffffff', opacity: 100, shadow: '2px 2px 8px rgba(0,0,0,0.9)', letterSpacing: 0, stroke: '#000000', strokeWidth: 0, ...result.addText };
        setTexts(p => [...p, n]);
        setSelected(n.id);
      }
      setAiCommand('');
    } catch (err) { console.error("AI Error:", err); }
    setIsAiWorking(false);
  };

  const handleCloudSave = () => {
    const design = { activeBgUrl, texts, filters, effect, timestamp: new Date() };
    const saved = JSON.parse(localStorage.getItem('kyro_cloud_vault') || '[]');
    saved.push(design);
    localStorage.setItem('kyro_cloud_vault', JSON.stringify(saved));
    alert('Diseño guardado en la bóveda de KYRO.');
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cvs = await html2canvas(canvasRef.current, { 
        useCORS: true, 
        allowTaint: false, 
        scale: 2, 
        backgroundColor: null,
        logging: false
      });
      const a = document.createElement('a');
      a.download = `kyro-design-${Date.now()}.png`;
      a.href = cvs.toDataURL('image/png', 1.0);
      a.click();
    } catch (e) { 
      console.error("Export Error:", e);
      alert("Error al exportar. Intenta capturar la pantalla.");
    }
    setIsExporting(false);
  };

  const sel = texts.find(t => t.id === selected);
  const combinedFilter = effect.filter !== 'none' ? effect.filter
    : `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg)`;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#050505', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      
      {/* TOP BAR */}
      <div style={{ height: 64, background: '#000', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sparkles className="text-cyan-400" size={18} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: '0.2em' }}>KYRO DESIGN STATION</span>
          <div style={{ width: 1, height: 24, background: '#222', margin: '0 10px' }} />
          <div style={{ display: 'flex', background: '#111', padding: 4, borderRadius: 12, gap: 4 }}>
            {[{ id: 'select', label: 'Mover' }, { id: 'text', label: 'Texto' }].map(t => (
              <button key={t.id} onClick={() => setTool(t.id)}
                style={{ padding: '6px 16px', borderRadius: 10, border: 'none', background: tool === t.id ? '#22d3ee' : 'transparent', color: tool === t.id ? '#000' : '#666', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI COMMAND */}
        <div style={{ flex: 1, maxWidth: 500, position: 'relative', margin: '0 20px' }}>
          <input 
            type="text" 
            placeholder="Comando AI: 'texto azul', 'más brillo', 'fuente Bebas'..." 
            value={aiCommand}
            onChange={e => setAiCommand(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiCommand()}
            style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: 14, padding: '12px 45px 12px 18px', color: '#fff', fontSize: 12, outline: 'none' }}
          />
          <button onClick={handleAiCommand} disabled={isAiWorking || !aiCommand} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: aiCommand ? '#22d3ee' : 'transparent', border: 'none', padding: 8, borderRadius: 10, cursor: 'pointer', color: '#000' }}>
            {isAiWorking ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleCloudSave} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 14, background: '#111', border: '1px solid #222', color: '#888', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <Cloud size={14} /> Nube
          </button>
          <button onClick={handleExport} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14, background: '#22d3ee', border: 'none', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
            <Download size={14} /> Exportar
          </button>
          <button onClick={onClose} style={{ padding: 10, borderRadius: 14, background: '#111', border: '1px solid #222', color: '#888', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: Effects */}
        <div style={{ width: 140, background: '#000', borderRight: '1px solid #1a1a1a', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 9, color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Atmósfera</div>
          {EFFECTS.map(ef => (
            <button key={ef.name} onClick={() => setEffect(ef)} style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${effect.name === ef.name ? '#22d3ee' : '#111'}`, cursor: 'pointer', background: '#111', padding: 0 }}>
              <img src={blobUrl} style={{ width: '100%', aspectRatio: '1.2', objectFit: 'cover', filter: ef.filter, opacity: effect.name === ef.name ? 1 : 0.5 }} />
              <div style={{ fontSize: 9, color: effect.name === ef.name ? '#fff' : '#666', padding: '6px 0', fontWeight: 700 }}>{ef.name}</div>
            </button>
          ))}
        </div>

        {/* CENTER: Canvas */}
        <div style={{ flex: 1, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
          onClick={(e) => { if (e.target === e.currentTarget) { addText(e); setSelected(null); } }}>
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-cyan-400">
              <Loader2 className="animate-spin" size={40} />
              <span className="text-xs font-black uppercase tracking-widest">Sincronizando Imagen...</span>
            </div>
          ) : (
            <div ref={canvasRef} onClick={addText} style={{ position: 'relative', boxShadow: '0 50px 100px rgba(0,0,0,0.9)', borderRadius: 12, overflow: 'hidden' }}>
              <img src={activeBgUrl} draggable={false} style={{ display: 'block', maxWidth: '75vw', maxHeight: '72vh', objectFit: 'contain', filter: combinedFilter, userSelect: 'none' }} />
              {texts.map(t => (
                <div key={t.id}
                  onMouseDown={(e) => {
                    e.stopPropagation(); setSelected(t.id);
                    const rect = canvasRef.current.getBoundingClientRect();
                    dragRef.current = { id: t.id, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, rw: rect.width, rh: rect.height };
                  }}
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => updText(t.id, 'content', e.currentTarget.innerText)}
                  style={{
                    position: 'absolute', left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)',
                    fontFamily: `'${t.font}', sans-serif`, fontSize: t.size, fontWeight: t.weight,
                    color: t.color, opacity: t.opacity / 100, textShadow: t.shadow,
                    letterSpacing: `${t.letterSpacing}px`,
                    WebkitTextStroke: t.strokeWidth > 0 ? `${t.strokeWidth}px ${t.stroke}` : 'none',
                    cursor: 'move', userSelect: 'none', whiteSpace: 'nowrap', padding: '4px 8px',
                    outline: selected === t.id ? '2px solid #22d3ee' : 'none',
                    outlineOffset: '4px', borderRadius: 4,
                  }}>
                  {t.content}
                </div>
              ))}
            </div>
          )}

          {/* FLOAT TEXT PANEL */}
          <AnimatePresence>
            {sel && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,10,10,0.95)', border: '1px solid #222', borderRadius: 24, padding: '20px 30px', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', gap: 24, zIndex: 100, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-white/40 uppercase">Fuente</span>
                  <select value={sel.font} onChange={e => updText(sel.id, 'font', e.target.value)} style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: 150 }}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-white/40 uppercase">Color</span>
                  <div className="flex gap-2">
                    <input type="color" value={sel.color} onChange={e => updText(sel.id, 'color', e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'none' }} />
                    <input type="text" value={sel.color} onChange={e => updText(sel.id, 'color', e.target.value)} style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '8px', fontSize: 11, width: 90, fontFamily: 'monospace' }} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-white/40 uppercase">Tamaño {sel.size}</span>
                  <input type="range" min={8} max={400} value={sel.size} onChange={e => updText(sel.id, 'size', Number(e.target.value))} style={{ accentColor: '#22d3ee', width: 120 }} />
                </div>

                <button onClick={() => { setTexts(p => p.filter(t => t.id !== sel.id)); setSelected(null); }} style={{ padding: 12, borderRadius: 14, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Calibration */}
        <div style={{ width: 240, background: '#000', borderLeft: '1px solid #1a1a1a', padding: 25, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 10, color: '#22d3ee', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sensores</div>
          
          <button onClick={handleRemoveBg} disabled={isRemovingBg} style={{ width: '100%', padding: '14px', borderRadius: 16, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', fontSize: 11, fontWeight: 900, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            {isRemovingBg ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="animate-spin" size={14} />
                <span className="text-[8px]">{bgProgress}%</span>
              </div>
            ) : '✂️ Quitar Fondo'}
            {isRemovingBg && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: '#a855f7', width: `${bgProgress}%`, transition: 'width 0.3s ease' }} />
            )}
          </button>
          {bgError && <p style={{ color: '#ef4444', fontSize: 9, marginTop: 5, textAlign: 'center' }}>{bgError}</p>}

          {[{ k: 'brightness', l: 'Brillo' }, { k: 'contrast', l: 'Contraste' }, { k: 'saturation', l: 'Saturación' }, { k: 'hue', l: 'Matiz' }].map(({ k, l }) => (
            <div key={k}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#555', fontSize: 10, fontWeight: 800 }}>{l}</span>
                <span style={{ color: '#22d3ee', fontSize: 10, fontWeight: 900 }}>{filters[k]}</span>
              </div>
              <input type="range" min={0} max={k==='hue'?360:200} value={filters[k]} onChange={e => { setEffect(EFFECTS[0]); setFilters(p => ({ ...p, [k]: Number(e.target.value) })); }} style={{ width: '100%', accentColor: '#22d3ee' }} />
            </div>
          ))}

          <button onClick={() => { setFilters({ brightness: 100, contrast: 100, saturation: 100, hue: 0 }); setEffect(EFFECTS[0]); }} style={{ marginTop: 10, padding: '12px', borderRadius: 16, background: 'transparent', border: '1px solid #222', color: '#444', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RotateCcw size={14} /> Resetear
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
