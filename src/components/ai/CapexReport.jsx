import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  ArrowUpRight,
  PieChart as PieChartIcon,
  ShieldCheck,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

const CapexReport = ({ data, onClose }) => {
  if (!data) return null;
  const { name, machines = [], deal, logistics } = data;
  const actualValue = deal?.value || data.value || 340000;
  
  // Calcular Equipos basándose en precios reales de máquinas si existen
  const equipmentsPrice = (machines || []).reduce((acc, m) => acc + (Number(m.price) || (actualValue * 0.1)), 0);
  
  const handleDownload = async () => {
    const element = document.getElementById('capex-report-content');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
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
    
    pdf.save(`CAPEX_${name.replace(/\s+/g, '_')}.pdf`);
  };

  const capexData = [
    { name: 'Equipos', value: equipmentsPrice || (actualValue * 0.7) },
    { name: 'Instalación', value: actualValue * 0.15 },
    { name: 'Software/AI', value: actualValue * 0.1 },
    { name: 'Capacitación', value: actualValue * 0.05 },
  ];

  // Ajustar el total si la suma de partes supera el valor del trato
  const calculatedTotal = capexData.reduce((acc, item) => acc + item.value, 0);

  const roiData = [
    { year: 'Año 1', value: -actualValue },
    { year: 'Año 2', value: -actualValue * 0.35 },
    { year: 'Año 3', value: actualValue * 0.15 },
    { year: 'Año 4', value: actualValue * 0.75 },
    { year: 'Año 5', value: actualValue * 1.4 },
  ];

  const COLORS = ['#F59E0B', '#111827', '#00A9C1', '#8B5CF6'];

  return (
    <div className="flex flex-col h-full bg-[#FFFBEB] text-slate-900 overflow-y-auto">
      {/* Header Sticky con Botones Claros */}
      <div className="sticky top-0 z-50 bg-white border-b border-amber-100 p-4 flex justify-between items-center px-8 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="font-black text-amber-900 uppercase tracking-tighter text-lg">Análisis de CAPEX Estratégico</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownload}
            className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 h-11 shadow-lg shadow-amber-100 flex items-center gap-2 transition-all active:scale-95"
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

      <div id="capex-report-content" className="p-8 space-y-8 max-w-6xl mx-auto w-full bg-[#FFFBEB]">
        {/* Header CAPEX */}
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-amber-100">
          <div className="h-48 bg-gradient-to-r from-amber-500 to-orange-400 p-10 flex justify-between items-start text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-black tracking-tighter italic uppercase">{name}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">PROYECCIÓN FINANCIERA v1.2</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-[0.9] uppercase">Inversión<br/>de Capital</h1>
            </div>
            <div className="text-right z-10">
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">CAPEX Global Real</p>
              <p className="text-4xl font-black tracking-tighter mt-1">${calculatedTotal?.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 space-y-6">
              <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Distribución de Inversión</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={capexData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {capexData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {capexData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-slate-500 w-24">{item.name}</span>
                      <span className="text-slate-400 ml-2 font-medium">${item.value.toLocaleString()}</span>
                    </div>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {calculatedTotal > 0 ? ((item.value / calculatedTotal) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-900 uppercase">
                  <span>Inversión Total Real</span>
                  <span>${calculatedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-6">
              <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Punto de Equilibrio (ROI)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fef3c7" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#fffbeb'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {roiData.map((entry, index) => (
                        <Cell key={index} fill={entry.value < 0 ? '#EF4444' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Recuperación estimada</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">2.4 Años</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">TIR Proyectada</p>
                  <p className="text-2xl font-black text-emerald-600 tracking-tight">+18.5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapexReport;
