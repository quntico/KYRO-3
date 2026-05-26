import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

import {
  Calculator,
  DollarSign,
  TrendingUp,
  Globe,
  Ship,
  Truck,
  Percent,
  Wrench,
  ArrowRightLeft,
  CalendarDays,
  FileText
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import ExportPdfDialog from './ExportPdfDialog';

const getFreightMexByDefault = (locationStr) => {
  if (!locationStr) return 20000;
  const loc = locationStr.toLowerCase();
  
  if (loc.includes('nuevo león') || loc.includes('monterrey')) return 25000;
  if (loc.includes('jalisco') || loc.includes('guadalajara')) return 15000;
  if (loc.includes('ciudad de méxico') || loc.includes('cdmx') || loc.includes('estado de méxico') || loc.includes('edomex')) return 18000;
  if (loc.includes('querétaro')) return 16000;
  if (loc.includes('puebla')) return 20000;
  if (loc.includes('colima') || loc.includes('manzanillo')) return 5000;
  if (loc.includes('coahuila') || loc.includes('saltillo') || loc.includes('torreón')) return 24000;
  if (loc.includes('chihuahua')) return 28000;
  if (loc.includes('sonora') || loc.includes('hermosillo')) return 30000;
  if (loc.includes('baja california') || loc.includes('tijuana')) return 32000;
  if (loc.includes('yucatán') || loc.includes('mérida')) return 28000;
  
  return 20000;
};

const formatNumberWithCommas = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const parseNumberFromCommas = (str) => {
  if (!str) return '';
  const cleaned = str.replace(/[^0-9.]/g, '');
  return cleaned;
};

const LeadQuoteCalculator = ({ isOpen, onClose, location, machine, onApply, clientName, clientCompany }) => {
  const { theme } = useTheme();

  // Inputs
  const [costChina, setCostChina] = useState(() => machine?.costChina || 0);
  const [incoterm, setIncoterm] = useState(() => machine?.incoterm || 'FOB');
  const [freightLandChina, setFreightLandChina] = useState(() => machine?.freightLandChina || 0);
  const [freightSea, setFreightSea] = useState(() => machine?.freightSea || 0);
  const [freightMex, setFreightMex] = useState(() => {
    if (machine?.freightMex !== undefined) return machine.freightMex;
    return getFreightMexByDefault(location);
  });
  const [costTech, setCostTech] = useState(() => machine?.costTech || 0);
  const [exchangeRate, setExchangeRate] = useState(() => machine?.exchangeRate || 18.0);
  const [divideByTwo, setDivideByTwo] = useState(() => machine?.divideByTwo || false);
  const [salePrice, setSalePrice] = useState(() => machine?.salePrice || machine?.price || 0);
  const [focusedField, setFocusedField] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const tempMachineForExport = useMemo(() => {
    return {
      ...machine,
      costChina: parseFloat(costChina) || 0,
      incoterm: incoterm,
      freightLandChina: parseFloat(freightLandChina) || 0,
      freightSea: parseFloat(freightSea) || 0,
      freightMex: parseFloat(freightMex) || 0,
      costTech: parseFloat(costTech) || 0,
      exchangeRate: parseFloat(exchangeRate) || 18.0,
      divideByTwo: divideByTwo,
      salePrice: parseFloat(salePrice) || 0
    };
  }, [machine, costChina, incoterm, freightLandChina, freightSea, freightMex, costTech, exchangeRate, divideByTwo, salePrice]);

  const getInputValue = useCallback((field, rawValue) => {
    if (focusedField === field) {
      return rawValue || '';
    }
    return formatNumberWithCommas(rawValue);
  }, [focusedField]);

  // Sync inputs state when machine changes
  useEffect(() => {
    if (machine) {
      setCostChina(machine.costChina || 0);
      setIncoterm(machine.incoterm || 'FOB');
      setFreightLandChina(machine.freightLandChina || 0);
      setFreightSea(machine.freightSea || 0);
      setFreightMex(machine.freightMex !== undefined ? machine.freightMex : getFreightMexByDefault(location));
      setCostTech(machine.costTech || 0);
      setExchangeRate(machine.exchangeRate || 18.0);
      setDivideByTwo(machine.divideByTwo || false);
      setSalePrice(machine.salePrice || machine.price || 0);
    }
  }, [machine, location]);

  // Calculations
  const calculations = useMemo(() => {
    const cChina = parseFloat(costChina) || 0;
    const fLandChina = parseFloat(freightLandChina) || 0;
    const fSea = parseFloat(freightSea) || 0;
    const fMex = parseFloat(freightMex) || 0;
    const cTech = parseFloat(costTech) || 0;
    const tc = parseFloat(exchangeRate) || 1;
    const pVentaUSD = parseFloat(salePrice) || 0;

    // Incrementables = Costo China + Flete Terrestre China + Flete Maritimo
    const incrementablesUSD = cChina + fLandChina + fSea;
    
    // Impuestos = 20% de (Incrementables)
    const taxesUSD = incrementablesUSD * 0.20;
    const taxesMXN = taxesUSD * tc;

    // Convert MXN items to USD
    const fMexUSD = fMex / tc;
    const cTechUSD = cTech / tc;

    // Costo Total
    const totalCostUSD = cChina + fLandChina + fSea + taxesUSD + fMexUSD + cTechUSD;
    const totalCostMXN = totalCostUSD * tc;

    // Utility (Profit)
    let profitUSD = pVentaUSD - totalCostUSD;
    if (divideByTwo) {
      profitUSD = profitUSD / 2;
    }
    const profitMXN = profitUSD * tc;

    // IVA (16%)
    const salePriceMXN = pVentaUSD * tc;
    
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
      
      // IVA breakdowns
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
  }, [costChina, freightLandChina, freightSea, freightMex, costTech, exchangeRate, divideByTwo, salePrice]);

  const handleApply = () => {
    // Copy the final calculated Selling Price (pVentaUSD) and Commission (profitUSD) to the lead form row!
    onApply({
      ...machine,
      price: parseFloat(salePrice) || 0,
      commission: parseFloat(calculations.profitUSD.toFixed(2)) || 0,
      
      costChina: parseFloat(costChina) || 0,
      incoterm: incoterm,
      freightLandChina: parseFloat(freightLandChina) || 0,
      freightSea: parseFloat(freightSea) || 0,
      freightMex: parseFloat(freightMex) || 0,
      costTech: parseFloat(costTech) || 0,
      exchangeRate: parseFloat(exchangeRate) || 18.0,
      divideByTwo: divideByTwo,
      salePrice: parseFloat(salePrice) || 0
    });
    onClose();
  };

  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const activeCompany = clientCompany || 'Sin Empresa';
    const activeContact = clientName || 'Sin Contacto';
    const activeLocation = location || 'No especificada';
    const activeMachine = machine?.name || 'Proyecto General';
    const dateStr = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Page Header Background
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

    // Decorative line
    doc.setFillColor(234, 179, 8);
    doc.rect(15, 26, 180, 1, 'F');

    // Info details
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
    
    // Bottom border line for section header
    doc.setDrawColor(234, 179, 8);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;

    // Draw Cost Table Grid
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
      { name: "Costo Base en China", currency: "USD", val: costChina, usdVal: costChina },
      { name: `Flete Terrestre China (${incoterm})`, currency: "USD", val: freightLandChina, usdVal: freightLandChina },
      { name: "Flete Marítimo Internacional", currency: "USD", val: freightSea, usdVal: freightSea },
      { name: "Incrementables Totales", currency: "USD", val: calculations.incrementablesUSD, usdVal: calculations.incrementablesUSD },
      { name: "Impuesto de Importación Arancelario (20%)", currency: "USD", val: calculations.taxesUSD, usdVal: calculations.taxesUSD },
      { name: "Flete Terrestre Nacional (Manzanillo)", currency: "MXN", val: freightMex, usdVal: parseFloat(freightMex) / parseFloat(exchangeRate) },
      { name: "Costo Técnico y de Instalación", currency: "MXN", val: costTech, usdVal: parseFloat(costTech) / parseFloat(exchangeRate) }
    ];

    doc.setFont("helvetica", "normal");
    costRows.forEach((row, rIdx) => {
      // Zebra striping
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
    doc.text(`$ ${formatCurrencyPDF(exchangeRate)} MXN por USD`, 85, y + 6.5);

    y += 18;

    // SECTION 3: INGENIERÍA FINANCIERA COMPARATIVA (VENTA VS COSTO VS UTILIDAD)
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. RESUMEN FINANCIERO Y MARGEN DE UTILIDAD NETA", 15, y);
    doc.setDrawColor(234, 179, 8);
    doc.line(15, y + 2, 195, y + 2);

    y += 10;

    // Three Column Dashboard Card
    // 1. Venta Total
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
    doc.setTextColor(255, 255, 255);
    doc.text(`$ ${formatCurrencyPDF(salePrice)}`, 48, y + 14);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceIVA_USD)}`, 48, y + 20);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceMXN)}`, 48, y + 28);
    doc.text(`$ ${formatCurrencyPDF(calculations.salePriceIVA_MXN)}`, 48, y + 34);

    doc.setFillColor(234, 179, 8); // Gold total footer inside card
    doc.rect(15, y + 39, 56, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON IVA (USD):", 18, y + 43);
    doc.text(`$${formatCurrencyPDF(calculations.salePriceTotal_USD)}`, 46, y + 43);

    // 2. Costo Total
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
    doc.setTextColor(255, 255, 255);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostUSD)}`, 110, y + 14);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostIVA_USD)}`, 110, y + 20);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostMXN)}`, 110, y + 28);
    doc.text(`$ ${formatCurrencyPDF(calculations.totalCostIVA_MXN)}`, 110, y + 34);

    doc.setFillColor(226, 232, 240); // Silver footer
    doc.rect(77, y + 39, 56, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON IVA (USD):", 80, y + 43);
    doc.text(`$${formatCurrencyPDF(calculations.totalCostTotal_USD)}`, 108, y + 43);

    // 3. Utilidad Neto (USD & MXN)
    doc.setFillColor(22, 101, 52); // Dark Green for Profit Card
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
    doc.setTextColor(255, 255, 255);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitUSD)}`, 172, y + 14);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitIVA_USD)}`, 172, y + 20);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitMXN)}`, 172, y + 28);
    doc.text(`$ ${formatCurrencyPDF(calculations.profitIVA_MXN)}`, 172, y + 34);

    doc.setFillColor(74, 222, 128); // Bright Green footer
    doc.rect(139, y + 39, 56, 6, 'F');
    doc.setTextColor(21, 76, 38);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON IVA (USD):", 142, y + 43);
    doc.text(`$${formatCurrencyPDF(calculations.profitTotal_USD)}`, 170, y + 43);

    y += 54;

    // SECTION 4: NET MARGIN AND FINAL RESULTS IN BOLD COLORS
    doc.setFillColor(254, 252, 232); // gold tint banner
    doc.rect(15, y, 180, 24, 'F');
    doc.setDrawColor(254, 240, 138);
    doc.rect(15, y, 180, 24, 'S');

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(113, 63, 18);
    doc.text("ESTATUS DE LA UTILIDAD NETAMENTE ESTIMADA:", 20, y + 6);
    
    if (divideByTwo) {
      doc.setFillColor(234, 179, 8);
      doc.rect(20, y + 9, 32, 4.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("DIVIDIDO AL 50% (÷2)", 22, y + 12.5);
    } else {
      doc.setFillColor(71, 85, 105);
      doc.rect(20, y + 9, 32, 4.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("ESTRUCTURA COMPLETA (100%)", 21, y + 12.5);
    }

    doc.setFontSize(9);
    doc.setTextColor(113, 63, 18);
    doc.text(`Utilidad Neta en Dólares:`, 65, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text(`$${formatCurrencyPDF(calculations.profitUSD)} USD`, 65, y + 15);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Con IVA: $${formatCurrencyPDF(calculations.profitTotal_USD)} USD`, 65, y + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(113, 63, 18);
    doc.text(`Utilidad Neta en Pesos:`, 130, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text(`$${formatCurrencyPDF(calculations.profitMXN)} MXN`, 130, y + 15);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Con IVA: $${formatCurrencyPDF(calculations.profitTotal_MXN)} MXN`, 130, y + 20);

    y += 34;

    // Disclaimer and Signatures area
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("Nota de Confidencialidad: Este documento contiene proyecciones financieras exclusivas para fines de toma de decisiones internas", 15, y);
    doc.text("del equipo comercial de KYRO. No debe ser compartido en ninguna circunstancia con el cliente final ni con terceros ajenos.", 15, y + 3.5);

    // Bottom border bar
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 287, 210, 10, 'F');

    // Save File
    const sanitizedFilename = `Radiografia_Interna_${activeCompany.replace(/[^a-z0-9]/gi, '_')}_${activeMachine.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(sanitizedFilename);
  }, [clientCompany, clientName, location, machine, costChina, incoterm, freightLandChina, freightSea, freightMex, costTech, exchangeRate, divideByTwo, salePrice, calculations]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-[850px] max-h-[92vh] flex flex-col p-0 overflow-hidden border-0 glass-bevel shadow-2xl ${theme === 'nova' ? 'bg-[#0a0f1d]/95 text-white' : ''}`}>
        <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-white/[0.03] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              <Calculator className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white tracking-tight uppercase">
                Cotizador e Ingeniería Financiera
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs">
                Cálculo inteligente de incrementables, impuestos arancelarios, fletes y utilidad para <span className="text-primary font-bold">{machine?.name || 'Máquina'}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-black/10 custom-scrollbar">
          
          {/* Ubicación de Lada Alert */}
          {location && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary/90 font-medium">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Ubicación detectada por LADA: <strong className="uppercase">{location}</strong>. Flete Manzanillo precalculado automáticamente.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* INPUTS PANEL */}
            <div className="space-y-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
              <h3 className="text-xs font-black tracking-widest text-white/40 uppercase mb-2 flex items-center gap-1.5 font-mono">
                <Globe className="w-3.5 h-3.5 text-primary" /> CONFIGURACIÓN DE COSTOS
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="costChina" className="text-white/70 text-xs font-bold">Costo en China (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="costChina"
                      type="text"
                      value={getInputValue('costChina', costChina)}
                      onFocus={() => setFocusedField('costChina')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setCostChina(parseNumberFromCommas(e.target.value))}
                      placeholder="0.00"
                      className="pl-8 bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="incoterm" className="text-white/70 text-xs font-bold">Incoterm</Label>
                  <Input
                    id="incoterm"
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value.toUpperCase())}
                    placeholder="Ej: FOB"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="freightLandChina" className="text-white/70 text-xs font-bold">Flete Terrestre China (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="freightLandChina"
                      type="text"
                      value={getInputValue('freightLandChina', freightLandChina)}
                      onFocus={() => setFocusedField('freightLandChina')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setFreightLandChina(parseNumberFromCommas(e.target.value))}
                      placeholder="0.00"
                      className="pl-8 bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="freightSea" className="text-white/70 text-xs font-bold">Flete Marítimo (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="freightSea"
                      type="text"
                      value={getInputValue('freightSea', freightSea)}
                      onFocus={() => setFocusedField('freightSea')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setFreightSea(parseNumberFromCommas(e.target.value))}
                      placeholder="0.00"
                      className="pl-8 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="freightMex" className="text-white/70 text-xs font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-primary" /> Flete Mex (Manzanillo) (MXN)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 text-xs font-bold font-mono">$</span>
                    <Input
                      id="freightMex"
                      type="text"
                      value={getInputValue('freightMex', freightMex)}
                      onFocus={() => setFocusedField('freightMex')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setFreightMex(parseNumberFromCommas(e.target.value))}
                      placeholder="0.00"
                      className="pl-8 bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="costTech" className="text-white/70 text-xs font-bold flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-yellow-500" /> Costo Técnico / Inst. (MXN)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 text-xs font-bold font-mono">$</span>
                    <Input
                      id="costTech"
                      type="text"
                      value={getInputValue('costTech', costTech)}
                      onFocus={() => setFocusedField('costTech')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setCostTech(parseNumberFromCommas(e.target.value))}
                      placeholder="0.00"
                      className="pl-8 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="exchangeRate" className="text-white/70 text-xs font-bold flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-primary" /> Tipo de Cambio (TC)
                  </Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.01"
                    value={exchangeRate || ''}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    placeholder="18.00"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="salePrice" className="text-white/70 text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" /> Precio Venta (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="salePrice"
                      type="text"
                      value={getInputValue('salePrice', salePrice)}
                      onFocus={() => setFocusedField('salePrice')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setSalePrice(parseNumberFromCommas(e.target.value))}
                      placeholder="0.00"
                      className="pl-8 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 mt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/80">Dividir Utilidad / Comisión entre 2</span>
                  <span className="text-[10px] text-white/40">Divide el margen final neto al 50%</span>
                </div>
                <div
                  onClick={() => setDivideByTwo(prev => !prev)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${divideByTwo ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${divideByTwo ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </div>
              </div>

            </div>

            {/* RESULTS PANEL */}
            <div className="space-y-4 flex flex-col justify-between">
              
              <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-6 rounded-2xl border border-white/10 space-y-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black tracking-widest text-white/40 uppercase mb-4 flex items-center gap-1.5 font-mono">
                    <Percent className="w-3.5 h-3.5 text-primary" /> DESGLOSE E IMPUESTOS
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-white/60">Incrementables (USD):</span>
                      <span className="font-bold text-white font-mono">${calculations.incrementablesUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-white/60 flex items-center gap-1">
                        Impuestos Arancelarios (20%):
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-yellow-500 font-mono">${calculations.taxesUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</span>
                        <span className="text-[10px] text-white/40 font-mono">${calculations.taxesMXN.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} MXN</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-white/60">Costo Total de Importación:</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-white font-mono">${calculations.totalCostUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</span>
                        <span className="text-[10px] text-white/40 font-mono">${calculations.totalCostMXN.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} MXN</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Profit Block */}
                <div className="bg-primary/10 border border-primary/20 p-5 rounded-xl space-y-2 mt-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-full bg-primary/5 -skew-x-12 translate-x-8" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-primary/70 font-mono font-black">
                        UTILIDAD NETAMENTE ESTIMADA
                      </span>
                      {divideByTwo && (
                        <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ml-1.5">
                          Dividido ÷ 2
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 font-bold uppercase">Más IVA (+16%)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="border-r border-primary/20 pr-2">
                      <span className="text-[10px] text-white/50 block">Pesos (MXN)</span>
                      <span className={`text-xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)] font-mono`}>
                        {calculations.profitUSD >= 0 ? '' : '-'}${Math.abs(calculations.profitMXN).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      <span className="text-[9px] text-white/30 block mt-0.5">Con IVA: ${calculations.profitTotal_MXN.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>

                    <div className="pl-2">
                      <span className="text-[10px] text-white/50 block">Dólares (USD)</span>
                      <span className={`text-xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)] font-mono`}>
                        {calculations.profitUSD >= 0 ? '' : '-'}${Math.abs(calculations.profitUSD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      <span className="text-[9px] text-white/30 block mt-0.5">Con IVA: ${calculations.profitTotal_USD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* TABLE OF TOTALS & IVA SUMMARY */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black tracking-widest text-white/40 uppercase flex items-center gap-1.5 font-mono">
              <Percent className="w-3.5 h-3.5 text-primary" /> RESUMEN DE IMPUESTOS IVA (+16% MÁS IVA)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Venta Card */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">1. PRECIO DE VENTA</span>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Subtotal (USD):</span>
                    <span className="font-bold text-white font-mono">${parseFloat(salePrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 border-b border-white/5 pb-1">
                    <span>IVA (16%):</span>
                    <span className="font-mono">${calculations.salePriceIVA_USD.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-primary pt-1">
                    <span>Total con IVA:</span>
                    <span className="font-mono">${calculations.salePriceTotal_USD.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              {/* Costo Card */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">2. COSTO TOTAL</span>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Subtotal (USD):</span>
                    <span className="font-bold text-white font-mono">${calculations.totalCostUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 border-b border-white/5 pb-1">
                    <span>IVA (16%):</span>
                    <span className="font-mono">${calculations.totalCostIVA_USD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-white pt-1">
                    <span>Total con IVA:</span>
                    <span className="font-mono">${calculations.totalCostTotal_USD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              {/* Utilidad Card */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">3. UTILIDAD NETO</span>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Subtotal (USD):</span>
                    <span className="font-bold text-white font-mono">${calculations.profitUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Subtotal (MXN):</span>
                    <span className="font-bold text-white font-mono">${calculations.profitMXN.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 border-b border-white/5 pb-1">
                    <span>IVA (16% USD):</span>
                    <span className="font-mono">${calculations.profitIVA_USD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 border-b border-white/5 pb-1">
                    <span>IVA (16% MXN):</span>
                    <span className="font-mono">${calculations.profitIVA_MXN.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-green-400 pt-1">
                    <span>Total con IVA (USD):</span>
                    <span className="font-mono">${calculations.profitTotal_USD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-green-400 pt-1">
                    <span>Total con IVA (MXN):</span>
                    <span className="font-mono">${calculations.profitTotal_MXN.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <DialogFooter className="p-6 border-t border-white/10 bg-white/[0.03] flex-shrink-0 flex items-center justify-between sm:justify-between gap-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border-white/10 text-white/70 hover:bg-white/5"
          >
            Cancelar
          </Button>

          <Button
            onClick={() => setIsExportDialogOpen(true)}
            className="bg-primary hover:bg-primary/80 text-black font-black uppercase tracking-wider text-xs px-5 h-9 flex items-center gap-1.5 shadow-[0_4px_15px_rgba(234,179,8,0.2)] border-0"
          >
            <FileText className="w-4 h-4 text-black" />
            Radiografía Interna (PDF)
          </Button>

          <Button
            onClick={handleApply}
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-black uppercase tracking-widest px-8 shadow-[0_4px_20px_rgba(var(--primary),0.3)]"
          >
            Aplicar Cotización
          </Button>
        </DialogFooter>

        <ExportPdfDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          clientCompany={clientCompany}
          clientName={clientName}
          location={location}
          machine={tempMachineForExport}
        />
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(LeadQuoteCalculator);
