import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Layers
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
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ParametricReport = ({ data, onClose }) => {
  if (!data) return null;

  const { name, machines = [], status, value, contact } = data;
  
  // Normalizar nombres de máquinas (algunos leads traen objetos {name, price...})
  const machineNames = (machines || []).map(m => 
    typeof m === 'object' ? (m.name || m.title || 'Equipo') : m
  );

  // Datos simulados basados en la estructura de los pantallazos para la visualización
  const chartData = [
    { name: 'A', cap: 5800, req: 1200 },
    { name: 'B', cap: 3200, req: 800 },
    { name: 'C', cap: 3500, req: 1100 },
    { name: 'D', cap: 3200, req: 600 },
    { name: 'E', cap: 1500, req: 100 },
    { name: 'F', cap: 1500, req: 200 },
  ];

  const trendData = [
    { year: 'Y1', cob: 126.9, sup: 74.3 },
    { year: 'Y2', cob: 120.6, sup: 59.8 },
    { year: 'Y3', cob: 114.4, sup: 44.1 },
    { year: 'Y4', cob: 108.1, sup: 26.1 },
    { year: 'Y5', cob: 101.7, sup: 5.9 },
  ];

  const pieData = [
    { name: 'Utilizado', value: 99.9 },
    { name: 'Margen', value: 0.1 },
  ];

  const COLORS = ['#00A9C1', '#111827'];

  // Detectar si es trituradora para cambiar m/h por kg/h
  const isTrituradora = machineNames.some(m => m.toUpperCase().includes('TRITURADORA'));

  // Generar métricas "reales" basadas en el cliente y el valor del trato
  const seed = name.length;
  const metrics = {
    vel: isTrituradora ? (450 + (seed % 100)).toFixed(1) : (135 + (seed % 5)).toFixed(1),
    cap: 180 + (seed % 30),
    req: 4000 + (seed * 10),
    cob: (105 + (seed % 10)).toFixed(1)
  };

  const handleDownload = async () => {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Reporte_Parametrico_${name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] text-slate-900 overflow-y-auto">
      {/* Botones de Acción Superiores */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center px-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00A9C1] flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 uppercase tracking-tight">Visor de Reporte Paramétrico</h3>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleDownload}
            className="bg-[#00A9C1] hover:bg-[#008ba0] text-white gap-2 rounded-xl"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
          <Button 
            onClick={onClose}
            className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black h-11 px-6 font-black shadow-lg shadow-cyan-400/20 uppercase tracking-widest text-[11px] border-0"
          >
            Cerrar
          </Button>
        </div>
      </div>

      <div id="report-content" className="p-8 space-y-8 max-w-6xl mx-auto w-full">
        {/* Header Estilo Ryder */}
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100">
          <div className="h-56 bg-gradient-to-r from-[#00A9C1] to-[#00CED1] p-10 flex justify-between items-start text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="z-10 h-full flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-black tracking-tighter italic uppercase">{name}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">KYRO 3.0 · V7.70</span>
              </div>
              <div className="space-y-1 pb-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">Informe Paramétrico de Simulación</p>
                <h1 className="text-5xl font-black tracking-tight leading-[1] uppercase">Simulación<br/>de Línea</h1>
              </div>
            </div>
            <div className="text-right z-10">
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Reporte de Simulación Industrial</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-[#00A9C1] uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-[#00A9C1] animate-pulse" />
                Horizonte Y1 — Y5
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                Análisis de capacidad, velocidad de línea y cobertura operativa para el sistema de {machineNames.length > 0 ? machineNames[0] : 'procesamiento industrial'}.
              </p>
              
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Máquina</span>
                  <span className="text-[11px] font-bold text-slate-700">{machineNames.length > 0 ? machineNames.join(' / ') : 'ESTÁNDAR KYRO'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proyecto</span>
                  <span className="text-[11px] font-bold text-slate-700">Informe de {name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha</span>
                  <span className="text-[11px] font-bold text-slate-700">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50/30 p-8 rounded-[2.5rem] border border-cyan-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-32 h-32 text-[#00A9C1]" />
              </div>
              <h4 className="text-[10px] font-black text-[#00A9C1] uppercase tracking-[0.2em] mb-6">Vista previa de resultados</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-slate-600">{isTrituradora ? 'Prod. Trituración' : 'Vel. de Banda'}</p>
                    <p className="text-[10px] text-slate-400">{isTrituradora ? 'Estimado kg/h' : 'Máx 140 m/h'}</p>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{metrics.vel} <span className="text-sm font-bold text-slate-400">{isTrituradora ? 'kg/h' : 'm/h'}</span></p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-slate-600">Capacidad Promedio</p>
                    <p className="text-[10px] text-slate-400">Por hora</p>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{metrics.cap} <span className="text-sm font-bold text-slate-400">c/h</span></p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-slate-600">Req. Diario Total</p>
                    <p className="text-[10px] text-slate-400">Año 1</p>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{metrics.req.toLocaleString()} <span className="text-sm font-bold text-slate-400">cajas</span></p>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-cyan-100">
                  <div>
                    <p className="text-xs font-bold text-[#00A9C1]">Cobertura Y1</p>
                    <p className="text-[10px] text-cyan-600/60">Del requerimiento</p>
                  </div>
                  <p className="text-3xl font-black text-[#00A9C1] tracking-tighter">{metrics.cob}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores Clave Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Indicadores Clave de Operación</h2>
            <div className="h-[2px] flex-1 bg-slate-100" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Resumen ejecutivo de velocidad, capacidad y cobertura inicial.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Vel. Banda (m/h)', value: metrics.vel, sub: 'Máx: 140 m/h' },
              { label: 'Cap. Prom/h (c/h)', value: metrics.cap, sub: 'Capacidad promedio' },
              { label: 'Cap. Día Y1 (cajas)', value: (metrics.cap * 24).toLocaleString(), sub: 'Producción diaria año 1' },
              { label: 'Req. Total/Día', value: metrics.req.toLocaleString(), sub: 'Requerimiento global' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-[#00A9C1] mb-1">{item.value}</p>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.label}</p>
                <p className="text-[10px] text-slate-400 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-base font-black text-slate-800 tracking-tight">Velocidad de Línea — Utilización</h4>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <p className="text-5xl font-black text-[#00A9C1] tracking-tighter">99.9%</p>
                <p className="text-sm font-bold text-slate-700">Banda Actual</p>
                <p className="text-xs text-slate-400">139.8 m/h de 140 m/h límite</p>
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  La banda opera prácticamente al límite (99.9%). Sin margen para absorber variaciones de demanda.
                </p>
              </div>
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-base font-black text-slate-800 tracking-tight">Capacidad vs Requerimiento por Modelo</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="cap" fill="#00A9C1" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="req" fill="#111827" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#00A9C1]" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Cap/Día</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#111827]" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Req/Día</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-base font-black text-slate-800 tracking-tight">Cobertura Anual Y1-Y5</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} unit="%" />
                  <Tooltip />
                  <Bar dataKey="cob" fill="#00A9C1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium">Cobertura sobre 100% = 1 máquina suficiente.</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-base font-black text-slate-800 tracking-tight">Tendencia de Cobertura Y1-Y5</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cob" stroke="#00A9C1" strokeWidth={3} dot={{r: 4, fill: '#00A9C1', strokeWidth: 2, stroke: '#fff'}} />
                  <Line type="monotone" dataKey="sup" stroke="#111827" strokeWidth={3} dot={{r: 4, fill: '#111827', strokeWidth: 2, stroke: '#fff'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00A9C1]" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Cobertura %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#111827]" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Superávit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <p>© 2026 KYRO STRATEGY ORCHESTRATOR • CONFIDENCIAL</p>
          <div className="flex gap-4">
            <span>KYRO 3.0</span>
            <span>SIMULACIÓN INDUSTRIAL</span>
            <span>V7.70</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParametricReport;
