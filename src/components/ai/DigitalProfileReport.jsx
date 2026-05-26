import React from 'react';
import { motion } from 'framer-motion';
import { 
  Fingerprint, 
  Activity, 
  Zap, 
  Target,
  Shield,
  Eye,
  Radar as RadarIcon,
  Network
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Globe, MessageCircle, Clock } from 'lucide-react';

const DigitalProfileReport = ({ data, onClose }) => {
  if (!data) return null;
  const { name, contact, status, value = 0, created_at } = data;

  const handleDownload = async () => {
    const element = document.getElementById('digital-report-content');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const totalImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = totalImgHeight;
    let position = 0;

    // Primera página
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
    heightLeft -= pdfHeight;

    // Páginas adicionales si es necesario
    while (heightLeft > 0) {
      position = heightLeft - totalImgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`PERFIL_DIGITAL_${name}.pdf`);
  };

  const profileData = [
    { subject: 'Innovación', A: 80 + (value > 500000 ? 40 : 10), fullMark: 150 },
    { subject: 'Solvencia', A: 100 + (value > 1000000 ? 30 : 5), fullMark: 150 },
    { subject: 'Urgencia', A: status === 'Hot' ? 140 : 70, fullMark: 150 },
    { subject: 'Tecnología', A: 110, fullMark: 150 },
    { subject: 'Fidelidad', A: 95, fullMark: 150 },
    { subject: 'Escala', A: value > 100000 ? 120 : 60, fullMark: 150 },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F3FF] text-slate-900 overflow-y-auto">
      {/* Header Sticky con Botones Claros */}
      <div className="sticky top-0 z-50 bg-white border-b border-purple-100 p-4 flex justify-between items-center px-8 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <Fingerprint className="w-6 h-6" />
          </div>
          <h3 className="font-black text-purple-900 uppercase tracking-tighter text-lg">Perfil Estratégico Digital</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownload}
            className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 h-11 shadow-lg shadow-purple-100 flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button 
            onClick={onClose} 
            className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black h-11 px-6 font-black shadow-lg shadow-cyan-400/20 uppercase tracking-widest text-[11px] border-0"
          >
            Cerrar
          </Button>
        </div>
      </div>

      <div id="digital-report-content" className="p-8 space-y-8 max-w-6xl mx-auto w-full bg-[#F5F3FF]">
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-purple-100">
          <div className="h-48 bg-gradient-to-r from-purple-600 to-indigo-500 p-10 flex justify-between items-start text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-black tracking-tighter italic uppercase">{name}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">ANÁLISIS DE COMPORTAMIENTO</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-[0.9] uppercase">Huella<br/>Digital</h1>
            </div>
            <div className="text-right z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Confiabilidad del Perfil</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-6 bg-white/30 rounded-full overflow-hidden relative">
                    <div className="absolute bottom-0 w-full bg-white h-[80%]" />
                  </div>)}
                </div>
                <span className="text-2xl font-black italic">8.4</span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-12">
            {/* Secciones de Inteligencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <Globe className="w-4 h-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Resumen Digital (Internet)</h4>
                </div>
                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 text-sm text-slate-600 leading-relaxed italic">
                  "Líder sectorial con fuerte presencia en mercados emergentes. Reportes recientes indican una transición hacia automatización 4.0. Alta reputación en cumplimiento ESG y solidez financiera demostrada en el último trimestre."
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <MessageCircle className="w-4 h-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Notas Estratégicas del Usuario</h4>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                  El cliente muestra interés genuino en reducir tiempos de ciclo. Mencionó que la competencia está evaluando tecnologías similares. Foco prioritario: **Conectividad KYRO-X**.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4">Matriz de Personalidad Corporativa</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profileData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Radar name={name} dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Factores Críticos de Decisión</h4>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Aversión al Riesgo', value: 'Baja', icon: Shield, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Velocidad de Respuesta', value: 'Alta', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Afinidad Tecnológica', value: 'Visionario', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Potencial de Escalamiento', value: 'Global', icon: Network, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((item, idx) => (
                  <div key={idx} className={`${item.bg} p-4 rounded-2xl flex items-center justify-between border border-white/50 shadow-sm`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* Línea de Tiempo */}
            <div className="pt-12 border-t border-purple-100 mt-12">
              <div className="flex items-center gap-2 text-purple-600 mb-8">
                <Clock className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Línea de Tiempo del Proyecto</h4>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-purple-100 -translate-y-1/2" />
                <div className="grid grid-cols-4 gap-4 relative z-10">
                  {[
                    { label: 'Apertura Lead', date: '12 Ene 2026', active: true },
                    { label: 'Primer Contacto', date: '25 Ene 2026', active: true },
                    { label: 'Envío Cotización', date: '05 Feb 2026', active: true },
                    { label: 'Estatus Actual', date: '30 Abr 2026', active: true, highlight: true },
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className={`w-4 h-4 rounded-full border-4 border-white mb-2 shadow-sm ${step.highlight ? 'bg-purple-600 scale-125' : 'bg-purple-300'}`} />
                      <p className={`text-[10px] font-black uppercase tracking-tighter ${step.highlight ? 'text-purple-600' : 'text-slate-400'}`}>{step.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">{step.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalProfileReport;
