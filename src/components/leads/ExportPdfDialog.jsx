import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { FileText, ArrowRightLeft, FileCode } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

// Default Freight helper
const getFreightMexByDefault = (location) => {
  if (!location) return 20000;
  const loc = location.toLowerCase();
  
  if (loc.includes('nuevo león') || loc.includes('monterrey')) return 18000;
  if (loc.includes('jalisco') || loc.includes('guadalajara')) return 12000;
  if (loc.includes('ciudad de méxico') || loc.includes('cdmx') || loc.includes('estado de méxico')) return 15000;
  if (loc.includes('querétaro')) return 14000;
  if (loc.includes('guanajuato') || loc.includes('león')) return 13000;
  if (loc.includes('puebla')) return 16000;
  if (loc.includes('veracruz')) return 18000;
  
  if (loc.includes('sinaloa') || loc.includes('culiacán')) return 22000;
  if (loc.includes('chihuahua')) return 25000;
  if (loc.includes('coahuila') || loc.includes('saltillo')) return 22000;
  
  if (loc.includes('sonora') || loc.includes('hermosillo')) return 30000;
  if (loc.includes('baja california') || loc.includes('tijuana')) return 32000;
  if (loc.includes('yucatán') || loc.includes('mérida')) return 28000;
  
  return 20000;
};

const ExportPdfDialog = ({
  isOpen,
  onClose,
  clientCompany,
  clientName,
  location,
  machine,
}) => {
  const { theme } = useTheme();

  // Extract machine variables with safe defaults
  const activeCompany = clientCompany || 'Sin Empresa';
  const activeContact = clientName || 'Sin Contacto';
  const activeLocation = location || 'No especificada';
  const activeMachine = machine?.name || 'Proyecto General';

  const defaultCostChina = machine?.costChina || 0;
  const defaultIncoterm = machine?.incoterm || 'FOB';
  const defaultFreightLandChina = machine?.freightLandChina || 0;
  const defaultFreightSea = machine?.freightSea || 0;
  const defaultFreightMex = machine?.freightMex !== undefined ? machine.freightMex : getFreightMexByDefault(location);
  const defaultCostTech = machine?.costTech || 0;
  const defaultExchangeRate = machine?.exchangeRate || 18.0;
  const defaultDivideByTwo = machine?.divideByTwo || false;
  const defaultSalePrice = machine?.salePrice || machine?.price || 0;

  // States
  const [exchangeRate, setExchangeRate] = useState(defaultExchangeRate);
  const [filename, setFilename] = useState('');

  // Prefill filename and exchange rate
  useEffect(() => {
    if (isOpen) {
      setExchangeRate(defaultExchangeRate);
      const sanitizedCompany = activeCompany.replace(/[^a-z0-9]/gi, '_');
      const sanitizedMachine = activeMachine.replace(/[^a-z0-9]/gi, '_');
      setFilename(`Radiografia_Interna_${sanitizedCompany}_${sanitizedMachine}`);
    }
  }, [isOpen, defaultExchangeRate, activeCompany, activeMachine]);

  // Recalculations using the dynamic exchangeRate in modal
  const calculations = useMemo(() => {
    const pCompraUSD = parseFloat(defaultCostChina) || 0;
    const incotermUpper = String(defaultIncoterm || 'FOB').toUpperCase();
    
    let incrementablesUSD = 0;
    if (incotermUpper === 'EXW') {
      incrementablesUSD = (parseFloat(defaultFreightLandChina) || 0) + (parseFloat(defaultFreightSea) || 0);
    } else if (incotermUpper === 'FOB') {
      incrementablesUSD = parseFloat(defaultFreightSea) || 0;
    }

    const currentTC = parseFloat(exchangeRate) || 1.0;
    const taxesUSD = (pCompraUSD + incrementablesUSD) * 0.20;
    const taxesMXN = taxesUSD * currentTC;
    
    const freightMexUSD = (parseFloat(defaultFreightMex) || 0) / currentTC;
    const costTechUSD = (parseFloat(defaultCostTech) || 0) / currentTC;
    
    const totalCostUSD = pCompraUSD + incrementablesUSD + taxesUSD + freightMexUSD + costTechUSD;
    const totalCostMXN = totalCostUSD * currentTC;
    
    const pVentaUSD = parseFloat(defaultSalePrice) || 0;
    let profitUSD = pVentaUSD - totalCostUSD;
    if (defaultDivideByTwo) {
      profitUSD = profitUSD / 2;
    }
    const profitMXN = profitUSD * currentTC;
    const salePriceMXN = pVentaUSD * currentTC;

    // IVA breakdowns
    const salePriceIVA_USD = pVentaUSD * 0.16;
    const salePriceIVA_MXN = salePriceMXN * 0.16;
    const totalCostIVA_USD = totalCostUSD * 0.16;
    const totalCostIVA_MXN = totalCostMXN * 0.16;
    const profitIVA_USD = profitUSD * 0.16;
    const profitIVA_MXN = profitMXN * 0.16;

    return {
      incrementablesUSD,
      taxesUSD,
      taxesMXN,
      totalCostUSD,
      totalCostMXN,
      profitUSD,
      profitMXN,
      salePriceMXN,
      salePriceIVA_USD,
      salePriceIVA_MXN,
      salePriceTotal_USD: pVentaUSD + salePriceIVA_USD,
      salePriceTotal_MXN: salePriceMXN + salePriceIVA_MXN,
      totalCostIVA_USD,
      totalCostIVA_MXN,
      totalCostTotal_USD: totalCostUSD + totalCostIVA_USD,
      totalCostTotal_MXN: totalCostMXN + totalCostIVA_MXN,
      profitIVA_USD,
      profitIVA_MXN,
      profitTotal_USD: profitUSD + profitIVA_USD,
      profitTotal_MXN: profitMXN + profitIVA_MXN,
    };
  }, [defaultCostChina, defaultIncoterm, defaultFreightLandChina, defaultFreightSea, defaultFreightMex, defaultCostTech, exchangeRate, defaultDivideByTwo, defaultSalePrice]);

  const handleExport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const dateStr = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const currentTC = parseFloat(exchangeRate) || 1.0;

    // Header Background
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 38, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KYRO 2.1  |  RADIOGRAFÍA INTERNA", 15, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(234, 179, 8); // Gold color
    doc.text("INGENIERÍA FINANCIERA Y ESTRUCTURA DE UTILIDADES COMERCIALES", 15, 22);

    // Decorative gold line
    doc.setFillColor(234, 179, 8);
    doc.rect(15, 26, 180, 1, 'F');

    // Details header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Generado: ${dateStr}`, 15, 32);
    doc.text("DOCUMENTO INTERNO CONFIDENCIAL", 140, 32);

    let y = 48;

    // SECTION 1: CLIENT INFORMATION
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 28, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 28, 'S');

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("INFORMACIÓN GENERAL DEL PROSPECTO", 20, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Empresa / Cuenta:`, 20, y + 13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(String(activeCompany), 60, y + 13);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Contacto Directo:`, 20, y + 19);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(String(activeContact), 60, y + 19);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Ubicación / Destino:`, 20, y + 25);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(String(activeLocation), 60, y + 25);

    y += 36;

    // SECTION 2: COSTOS E INCREMENTABLES BASE (USD & MXN)
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("1. ESTRUCTURA DE COSTOS E INCREMENTABLES", 15, y);
    
    doc.setDrawColor(234, 179, 8);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;

    // Draw grid header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Concepto / Variable Comercial", 18, y);
    doc.text("Moneda de Entrada", 90, y);
    doc.text("Monto Base", 140, y);
    doc.text("Monto en USD", 170, y);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 3, 195, y + 3);
    y += 8;

    const formatCurrencyPDF = (val) => {
      const num = parseFloat(val) || 0;
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const costRows = [
      { name: "Costo Base en China", currency: "USD", val: defaultCostChina, usdVal: defaultCostChina },
      { name: `Flete Terrestre China (${defaultIncoterm})`, currency: "USD", val: defaultFreightLandChina, usdVal: defaultFreightLandChina },
      { name: "Flete Marítimo Internacional", currency: "USD", val: defaultFreightSea, usdVal: defaultFreightSea },
      { name: "Incrementables Totales", currency: "USD", val: calculations.incrementablesUSD, usdVal: calculations.incrementablesUSD },
      { name: "Impuesto de Importación Arancelario (20%)", currency: "USD", val: calculations.taxesUSD, usdVal: calculations.taxesUSD },
      { name: "Flete Terrestre Nacional (Manzanillo)", currency: "MXN", val: defaultFreightMex, usdVal: parseFloat(defaultFreightMex) / currentTC },
      { name: "Costo Técnico y de Instalación", currency: "MXN", val: defaultCostTech, usdVal: parseFloat(defaultCostTech) / currentTC }
    ];

    doc.setFont("helvetica", "normal");
    costRows.forEach((row, rIdx) => {
      if (rIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 4, 180, 6, 'F');
      }
      doc.setTextColor(71, 85, 105);
      doc.text(row.name, 18, y);
      doc.text(row.currency, 90, y);
      
      const prefix = row.currency === "USD" ? "$" : "Mex$";
      doc.text(`${prefix} ${formatCurrencyPDF(row.val)}`, 140, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`$ ${formatCurrencyPDF(row.usdVal)}`, 170, y);
      doc.setFont("helvetica", "normal");
      
      y += 6;
    });

    // Tipo de Cambio Info Card
    y += 2;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 10, 'S');

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("TIPO DE CAMBIO (TC) PACTADO:", 20, y + 6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); // red exchange rate
    doc.text(`$ ${formatCurrencyPDF(currentTC)} MXN por USD`, 85, y + 6.5);

    y += 18;

    // SECTION 3: INGENIERÍA FINANCIERA COMPARATIVA
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. RESUMEN FINANCIERO Y MARGEN DE UTILIDAD NETA", 15, y);
    doc.setDrawColor(234, 179, 8);
    doc.line(15, y + 2, 195, y + 2);

    y += 10;

    // 1. Venta Total Card
    doc.setFillColor(30, 41, 59);
    doc.rect(15, y, 56, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("1. PRECIO DE VENTA", 18, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text("Subtotal (USD):", 18, y + 14);
    doc.text("IVA 16% (USD):", 18, y + 20);
    doc.text("Subtotal (MXN):", 18, y + 28);
    doc.text("IVA 16% (MXN):", 18, y + 34);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`$ ${formatCurrencyPDF(defaultSalePrice)}`, 48, y + 14);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceIVA_USD)}`, 48, y + 20);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceMXN)}`, 48, y + 28);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceIVA_MXN)}`, 48, y + 34);

    doc.setFillColor(234, 179, 8);
    doc.rect(15, y + 39, 56, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON IVA:", 17, y + 43);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceTotal_USD)}`, 48, y + 43);

    // 2. Costo Total Card
    doc.setFillColor(71, 85, 105);
    doc.rect(77, y, 56, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("2. COSTO TOTAL", 80, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text("Subtotal (USD):", 80, y + 14);
    doc.text("IVA 16% (USD):", 80, y + 20);
    doc.text("Subtotal (MXN):", 80, y + 28);
    doc.text("IVA 16% (MXN):", 80, y + 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostUSD)}`, 110, y + 14);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostIVA_USD)}`, 110, y + 20);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostMXN)}`, 110, y + 28);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostIVA_MXN)}`, 110, y + 34);

    doc.setFillColor(226, 232, 240);
    doc.rect(77, y + 39, 56, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON IVA:", 79, y + 43);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostTotal_USD)}`, 110, y + 43);

    // 3. Utilidad Card
    doc.setFillColor(22, 101, 52);
    doc.rect(139, y, 56, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("3. UTILIDAD NETO COMERCIAL", 142, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(187, 247, 208);
    doc.text("Subtotal (USD):", 142, y + 14);
    doc.text("IVA 16% (USD):", 142, y + 20);
    doc.text("Subtotal (MXN):", 142, y + 28);
    doc.text("IVA 16% (MXN):", 142, y + 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitUSD)}`, 172, y + 14);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitIVA_USD)}`, 172, y + 20);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitMXN)}`, 172, y + 28);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitIVA_MXN)}`, 172, y + 34);

    doc.setFillColor(74, 222, 128);
    doc.rect(139, y + 39, 56, 6, 'F');
    doc.setTextColor(21, 76, 38);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON IVA:", 141, y + 43);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitTotal_USD)}`, 172, y + 43);

    y += 54;

    // SECTION 4: NET MARGIN Banner
    doc.setFillColor(47, 55, 70);
    doc.rect(15, y, 180, 24, 'F');
    doc.setDrawColor(71, 85, 105);
    doc.rect(15, y, 180, 24, 'S');

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("ESTATUS DE LA UTILIDAD NETAMENTE ESTIMADA:", 20, y + 6);
    
    if (defaultDivideByTwo) {
      doc.setFillColor(234, 179, 8);
      doc.rect(20, y + 9, 32, 4.5, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.text("DIVIDIDO AL 50% (÷2)", 22, y + 12.5);
    } else {
      doc.setFillColor(226, 232, 240);
      doc.rect(20, y + 9, 32, 4.5, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.text("ESTRUCTURA COMPLETA (100%)", 21, y + 12.5);
    }

    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Utilidad Neta en Dólares:`, 65, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitUSD)} USD`, 65, y + 15);
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Con IVA: $ ${formatCurrencyPDF(calculations.profitTotal_USD)} USD`, 65, y + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Utilidad Neta en Pesos:`, 130, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitMXN)} MXN`, 130, y + 15);
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Con IVA: $ ${formatCurrencyPDF(calculations.profitTotal_MXN)} MXN`, 130, y + 20);

    y += 34;

    // Disclaimer
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("Nota de Confidencialidad: Este documento contiene proyecciones financieras exclusivas para fines de toma de decisiones internas", 15, y);
    doc.text("del equipo comercial de KYRO. No debe ser compartido en ninguna circunstancia con el cliente final ni con terceros ajenos.", 15, y + 3.5);

    // Bottom strip
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 287, 210, 10, 'F');

    // Save File
    const finalFilename = filename ? `${filename.trim()}.pdf` : `Radiografia_Interna_${activeCompany}_${activeMachine}.pdf`;
    doc.save(finalFilename);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-[460px] p-0 overflow-hidden border-0 glass-bevel shadow-2xl ${theme === 'nova' ? 'bg-[#0a0f1d]/95 text-white' : 'bg-slate-900 text-white'}`}>
        <DialogHeader className="p-5 pb-3 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-md font-bold uppercase tracking-wide text-white">
                Exportar Radiografía Interna
              </DialogTitle>
              <DialogDescription className="text-white/60 text-[11px] mt-0.5">
                Personaliza el Tipo de Cambio y el nombre del archivo PDF antes de su descarga.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pdfExchangeRate" className="text-white/70 text-xs font-bold flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-primary" /> Tipo de Cambio (TC) Pactado
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 text-xs font-bold font-mono">$</span>
              <Input
                id="pdfExchangeRate"
                type="number"
                step="0.01"
                value={exchangeRate || ''}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                placeholder="18.00"
                className="pl-8 bg-white/5 border-white/10 text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pdfFilename" className="text-white/70 text-xs font-bold flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-primary" /> Nombre del Archivo Exportado
            </Label>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
              <Input
                id="pdfFilename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Nombre_de_archivo"
                className="bg-transparent border-0 focus-visible:ring-0 p-0 text-white font-mono h-8 text-xs flex-grow"
              />
              <span className="text-white/40 text-xs font-mono">.pdf</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-white/10 bg-white/[0.03] flex items-center gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:bg-white/5 text-xs h-9"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleExport}
            className="bg-primary hover:bg-primary/80 text-black font-black uppercase tracking-wider text-xs px-5 h-9 flex items-center gap-1.5 shadow-[0_4px_15px_rgba(234,179,8,0.2)]"
          >
            <FileText className="w-4 h-4 text-black" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(ExportPdfDialog);
