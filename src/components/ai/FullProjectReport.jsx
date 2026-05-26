import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Presentation, 
  ChevronRight, 
  Briefcase,
  Zap,
  DollarSign,
  Fingerprint,
  Target,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  Box,
  Layers,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const FullProjectReport = ({ data, onClose }) => {
  if (!data) return null;
  const { name, machines = [], value = 0, status, contact, deal } = data;

  // Cálculos basados en datos reales de la cotización
  const totalKW = (machines || []).reduce((acc, m) => acc + (Number(m.kw) || Number(m.power) || 12.5), 0);
  const deliveryWeeks = deal?.lead_time || 12; // Semanas estimadas
  const estimatedProd = (machines || []).reduce((acc, m) => acc + (Number(m.capacity) || 1200), 0);

  const handleDownload = async () => {
    const element = document.getElementById('full-project-content');
    const canvas = await html2canvas(element, { 
      scale: 2, 
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const totalImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = totalImgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`MASTER_PLAN_${name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-y-auto">
      {/* Header Estilo Master */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center px-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-tighter text-lg leading-none">Master Plan Estratégico</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Visión Integral 360°</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownload}
            className="rounded-2xl bg-primary hover:bg-primary/90 text-black font-black px-6 h-11 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/10"
          >
            <Download className="w-4 h-4" />
            DESCARGAR PROYECTO
          </Button>
          <Button 
            onClick={onClose} 
            className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black h-11 px-6 font-black shadow-lg shadow-cyan-400/20 uppercase tracking-widest text-[11px] border-0"
          >
            Cerrar
          </Button>
        </div>
      </div>

      <div id="full-project-content" className="p-8 space-y-12 max-w-6xl mx-auto w-full bg-slate-50 py-16">
        {/* Portada del Proyecto */}
        <div className="relative rounded-[40px] overflow-hidden bg-slate-900 text-white p-16 shadow-2xl min-h-[550px] flex flex-col justify-between border border-white/5 mb-16">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full -mr-[300px] -mt-[300px] blur-[120px] animate-pulse" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1 bg-primary text-black font-black text-[10px] rounded-full uppercase tracking-widest italic">Documento Maestro</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">KYRO STRATEGIC CONSOLE</div>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-[0.8] uppercase max-w-3xl">
              {name}<br/>
              <span className="text-primary italic">Industrial</span><br/>
              Solution.
            </h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs mt-8">
              <MapPin className="w-4 h-4 text-primary" />
              Ubicación: <span className="text-white ml-1">{contact?.includes('@') ? 'Región Norte / Exportación' : (contact || 'Planta Central')}</span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-12 pt-12 border-t border-white/10">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Inversión Estimada</p>
              <p className="text-4xl font-black text-white">${(value || deal?.value)?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nivel de Prioridad</p>
              <p className="text-4xl font-black text-primary italic uppercase">{status === 'Hot' ? 'CRÍTICO' : 'ALTO'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tiempo de Entrega</p>
              <p className="text-4xl font-black text-white">{deliveryWeeks} Semanas</p>
            </div>
          </div>
        </div>

        {/* Especificaciones Técnicas Robustas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 text-slate-900 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-xl">Especificaciones Técnicas</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensiones y Energía</h4>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Largo Total', val: '12.4 m' },
                    { label: 'Ancho Operativo', val: '3.2 m' },
                    { label: 'Consumo Total', val: `${totalKW.toFixed(1)} KW` },
                  ].map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{d.label}</span>
                      <span className="text-sm font-black text-slate-800">{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad de Carga</h4>
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-primary uppercase mb-1">Capacidad Nominal</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{estimatedProd.toLocaleString()} <span className="text-xs text-slate-400">unidades/h</span></p>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Capacidad Instalada (Pico)</p>
                    <p className="text-3xl font-black text-primary tracking-tighter">{(estimatedProd * 1.3).toFixed(0).toLocaleString()} <span className="text-xs text-slate-500">unidades/h</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
             <div className="flex items-center gap-3 text-slate-900 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-xl">Módulos KYRO</h3>
            </div>
            <div className="space-y-4">
              {machines.map((m, i) => (
                <div key={i} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">
                      {typeof m === 'object' ? m.name : m}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                    <span>Potencia: {m.kw || m.power || '12.5'} KW</span>
                    <span>Cap: {m.capacity || '1200'}/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Puntos Clave del Equipo */}
        <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm mb-12">
          <div className="flex items-center gap-3 text-slate-900 border-b border-slate-50 pb-6 mb-8">
            <Star className="w-6 h-6 text-primary" />
            <h3 className="font-black uppercase tracking-tight text-xl">Puntos Clave del Sistema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Conectividad AI', desc: 'Sincronización total con la nube para monitoreo en tiempo real.' },
              { title: 'Alta Durabilidad', desc: 'Componentes de grado industrial con vida útil extendida.' },
              { title: 'Bajo Consumo', desc: 'Optimización de energía por ciclo de procesamiento.' },
            ].map((p, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-2 tracking-tight">{p.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap de Implementación (Basado en lead_time) */}
        <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl mt-16 page-break-inside-avoid">
           <div className="flex items-center gap-3 text-slate-900 mb-12">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-black uppercase tracking-tight text-2xl">Roadmap de Implementación</h3>
          </div>
          <div className="relative pb-8">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2" />
            <div className="grid grid-cols-4 gap-8 relative z-10">
              {[
                { label: 'Ingeniería', date: `Semana 1-2`, active: true },
                { label: 'Fabricación', date: `Semana 3-${deliveryWeeks - 4}`, active: true },
                { label: 'Instalación', date: `Semana ${deliveryWeeks - 3}`, active: true },
                { label: 'Puesta en Marcha', date: `Semana ${deliveryWeeks}`, active: true, highlight: true },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full border-[6px] border-white mb-4 shadow-xl ${step.highlight ? 'bg-primary scale-125' : 'bg-slate-300'}`} />
                  <p className={`text-xs font-black uppercase tracking-tight ${step.highlight ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{step.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer de Validez */}
        <div className="text-center pt-24 pb-8">
          <div className="w-32 h-1 bg-primary mx-auto mb-8 rounded-full opacity-30" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Este documento es una propuesta generada por KYRO AI STRATEGIC CONSOLE</p>
          <div className="flex justify-center gap-12 mt-8 grayscale opacity-20">
            <div className="text-2xl font-black tracking-tighter">KYRO</div>
            <div className="text-2xl font-black tracking-tighter">VISOR-X</div>
            <div className="text-2xl font-black tracking-tighter">KYRO</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullProjectReport;
