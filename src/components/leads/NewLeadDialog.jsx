import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { toast } from '@/components/ui/use-toast';
import { UploadCloud, File, X, PlusCircle, Trash2, DollarSign, Link as LinkIcon, Calculator, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import LeadQuoteCalculator from './LeadQuoteCalculator';
import ExportPdfDialog from './ExportPdfDialog';

const detectLocationFromPhone = (phoneStr) => {
  if (!phoneStr) return '';
  const cleaned = phoneStr.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+') && !cleaned.startsWith('+52')) {
    if (cleaned.startsWith('+1')) return 'USA / Canadá';
    if (cleaned.startsWith('+34')) return 'España';
    if (cleaned.startsWith('+54')) return 'Argentina';
    if (cleaned.startsWith('+57')) return 'Colombia';
    if (cleaned.startsWith('+56')) return 'Chile';
    if (cleaned.startsWith('+58')) return 'Venezuela';
    if (cleaned.startsWith('+502')) return 'Guatemala';
    if (cleaned.startsWith('+503')) return 'El Salvador';
    if (cleaned.startsWith('+504')) return 'Honduras';
    if (cleaned.startsWith('+505')) return 'Nicaragua';
    if (cleaned.startsWith('+506')) return 'Costa Rica';
    if (cleaned.startsWith('+507')) return 'Panamá';
    if (cleaned.startsWith('+51')) return 'Perú';
    if (cleaned.startsWith('+593')) return 'Ecuador';
    if (cleaned.startsWith('+591')) return 'Bolivia';
    if (cleaned.startsWith('+595')) return 'Paraguay';
    if (cleaned.startsWith('+598')) return 'Uruguay';
    return 'Internacional';
  }

  let localNum = cleaned;
  if (localNum.startsWith('+52')) {
    localNum = localNum.slice(3);
  } else if (localNum.startsWith('52') && localNum.length > 10) {
    localNum = localNum.slice(2);
  }
  if (localNum.startsWith('01')) {
    localNum = localNum.slice(2);
  }
  
  if (localNum.length < 2) return '';

  const lada2 = localNum.slice(0, 2);
  if (lada2 === '81') return 'Nuevo León, México';
  if (lada2 === '33') return 'Jalisco, México';
  if (lada2 === '55' || lada2 === '56') return 'Ciudad de México, México';

  if (localNum.length < 3) return 'México';
  const lada3 = localNum.slice(0, 3);
  const ladasMap = {
    '449': 'Aguascalientes, México',
    '646': 'Baja California, México', '653': 'Baja California, México', '658': 'Baja California, México', '661': 'Baja California, México', '664': 'Baja California, México', '665': 'Baja California, México', '686': 'Baja California, México',
    '612': 'Baja California Sur, México', '613': 'Baja California Sur, México', '624': 'Baja California Sur, México',
    '981': 'Campeche, México', '982': 'Campeche, México', '996': 'Campeche, México',
    '961': 'Chiapas, México', '962': 'Chiapas, México', '963': 'Chiapas, México', '964': 'Chiapas, México', '965': 'Chiapas, México', '966': 'Chiapas, México', '967': 'Chiapas, México', '968': 'Chiapas, México', '916': 'Chiapas, México', '919': 'Chiapas, México', '992': 'Chiapas, México', '994': 'Chiapas, México',
    '614': 'Chihuahua, México', '621': 'Chihuahua, México', '622': 'Chihuahua, México', '625': 'Chihuahua, México', '626': 'Chihuahua, México', '627': 'Chihuahua, México', '628': 'Chihuahua, México', '629': 'Chihuahua, México', '635': 'Chihuahua, México', '636': 'Chihuahua, México', '639': 'Chihuahua, México', '648': 'Chihuahua, México', '649': 'Chihuahua, México', '656': 'Chihuahua, México', '659': 'Chihuahua, México',
    '844': 'Coahuila, México', '842': 'Coahuila, México', '861': 'Coahuila, México', '862': 'Coahuila, México', '866': 'Coahuila, México', '867': 'Coahuila, México', '869': 'Coahuila, México', '871': 'Coahuila, México', '872': 'Coahuila, México', '873': 'Coahuila, México', '877': 'Coahuila, México', '878': 'Coahuila, México',
    '312': 'Colima, México', '313': 'Colima, México', '314': 'Colima, México',
    '618': 'Durango, México', '671': 'Durango, México', '674': 'Durango, México', '675': 'Durango, México', '676': 'Durango, México', '677': 'Durango, México',
    '477': 'Guanajuato, México', '472': 'Guanajuato, México', '473': 'Guanajuato, México', '461': 'Guanajuato, México', '462': 'Guanajuato, México', '464': 'Guanajuato, México', '466': 'Guanajuato, México', '468': 'Guanajuato, México', '469': 'Guanajuato, México', '411': 'Guanajuato, México', '412': 'Guanajuato, México', '413': 'Guanajuato, México', '415': 'Guanajuato, México', '417': 'Guanajuato, México', '418': 'Guanajuato, México', '419': 'Guanajuato, México', '428': 'Guanajuato, México', '445': 'Guanajuato, México', '479': 'Guanajuato, México',
    '744': 'Guerrero, México', '745': 'Guerrero, México', '747': 'Guerrero, México', '754': 'Guerrero, México', '755': 'Guerrero, México', '756': 'Guerrero, México', '757': 'Guerrero, México', '758': 'Guerrero, México', '767': 'Guerrero, México', '733': 'Guerrero, México', '736': 'Guerrero, México', '727': 'Guerrero, México', '741': 'Guerrero, México', '742': 'Guerrero, México',
    '771': 'Hidalgo, México', '772': 'Hidalgo, México', '773': 'Hidalgo, México', '774': 'Hidalgo, México', '775': 'Hidalgo, México', '776': 'Hidalgo, México', '778': 'Hidalgo, México', '779': 'Hidalgo, México', '738': 'Hidalgo, México', '743': 'Hidalgo, México', '748': 'Hidalgo, México', '759': 'Hidalgo, México', '761': 'Hidalgo, México', '763': 'Hidalgo, México', '789': 'Hidalgo, México', '791': 'Hidalgo, México',
    '315': 'Jalisco, México', '316': 'Jalisco, México', '317': 'Jalisco, México', '321': 'Jalisco, México', '322': 'Jalisco, México', '341': 'Jalisco, México', '342': 'Jalisco, México', '343': 'Jalisco, México', '344': 'Jalisco, México', '345': 'Jalisco, México', '346': 'Jalisco, México', '347': 'Jalisco, México', '348': 'Jalisco, México', '349': 'Jalisco, México', '354': 'Jalisco, México', '357': 'Jalisco, México', '358': 'Jalisco, México', '371': 'Jalisco, México', '372': 'Jalisco, México', '373': 'Jalisco, México', '374': 'Jalisco, México', '375': 'Jalisco, México', '376': 'Jalisco, México', '377': 'Jalisco, México', '378': 'Jalisco, México', '381': 'Jalisco, México', '382': 'Jalisco, México', '384': 'Jalisco, México', '385': 'Jalisco, México', '386': 'Jalisco, México', '387': 'Jalisco, México', '388': 'Jalisco, México', '391': 'Jalisco, México', '392': 'Jalisco, México', '393': 'Jalisco, México', '395': 'Jalisco, México', '431': 'Jalisco, México', '437': 'Jalisco, México', '457': 'Jalisco, México', '474': 'Jalisco, México', '475': 'Jalisco, México', '495': 'Jalisco, México', '496': 'Jalisco, México',
    '443': 'Michoacán, México', '351': 'Michoacán, México', '352': 'Michoacán, México', '353': 'Michoacán, México', '354': 'Michoacán, México', '355': 'Michoacán, México', '356': 'Michoacán, México', '359': 'Michoacán, México', '383': 'Michoacán, México', '425': 'Michoacán, México', '426': 'Michoacán, México', '434': 'Michoacán, México', '435': 'Michoacán, México', '436': 'Michoacán, México', '438': 'Michoacán, México', '447': 'Michoacán, México', '451': 'Michoacán, México', '452': 'Michoacán, México', '453': 'Michoacán, México', '454': 'Michoacán, México', '455': 'Michoacán, México', '456': 'Michoacán, México', '459': 'Michoacán, México', '711': 'Michoacán, México', '715': 'Michoacán, México', '753': 'Michoacán, México', '786': 'Michoacán, México',
    '777': 'Morelos, México', '734': 'Morelos, México', '735': 'Morelos, México', '737': 'Morelos, México', '739': 'Morelos, México', '751': 'Morelos, México',
    '311': 'Nayarit, México', '319': 'Nayarit, México', '323': 'Nayarit, México', '324': 'Nayarit, México', '325': 'Nayarit, México', '327': 'Nayarit, México', '329': 'Nayarit, México', '389': 'Nayarit, México',
    '821': 'Nuevo León, México', '823': 'Nuevo León, México', '824': 'Nuevo León, México', '825': 'Nuevo León, México', '826': 'Nuevo León, México', '828': 'Nuevo León, México', '829': 'Nuevo León, México', '892': 'Nuevo León, México',
    '951': 'Oaxaca, México', '953': 'Oaxaca, México', '954': 'Oaxaca, México', '958': 'Oaxaca, México', '971': 'Oaxaca, México', '972': 'Oaxaca, México', '995': 'Oaxaca, México', '236': 'Oaxaca, México', '274': 'Oaxaca, México', '281': 'Oaxaca, México', '283': 'Oaxaca, México', '287': 'Oaxaca, México', '952': 'Oaxaca, México',
    '223': 'Puebla, México', '224': 'Puebla, México', '227': 'Puebla, México', '231': 'Puebla, México', '232': 'Puebla, México', '233': 'Puebla, México', '238': 'Puebla, México', '243': 'Puebla, México', '244': 'Puebla, México', '248': 'Puebla, México', '249': 'Puebla, México', '275': 'Puebla, México', '276': 'Puebla, México', '282': 'Puebla, México', '746': 'Puebla, México', '764': 'Puebla, México', '776': 'Puebla, México', '797': 'Puebla, México',
    '441': 'Querétaro, México', '448': 'Querétaro, México', '427': 'Querétaro, México',
    '984': 'Quintana Roo, México', '983': 'Quintana Roo, México', '998': 'Quintana Roo, México', '987': 'Quintana Roo, México',
    '444': 'San Luis Potosí, México', '481': 'San Luis Potosí, México', '482': 'San Luis Potosí, México', '483': 'San Luis Potosí, México', '485': 'San Luis Potosí, México', '487': 'San Luis Potosí, México', '488': 'San Luis Potosí, México', '489': 'San Luis Potosí, México', '458': 'San Luis Potosí, México',
    '667': 'Sinaloa, México', '668': 'Sinaloa, México', '669': 'Sinaloa, México', '687': 'Sinaloa, México', '694': 'Sinaloa, México', '695': 'Sinaloa, México', '696': 'Sinaloa, México', '697': 'Sinaloa, México', '698': 'Sinaloa, México', '672': 'Sinaloa, México', '673': 'Sinaloa, México', '679': 'Sinaloa, México',
    '662': 'Sonora, México', '623': 'Sonora, México', '631': 'Sonora, México', '632': 'Sonora, México', '633': 'Sonora, México', '634': 'Sonora, México', '637': 'Sonora, México', '638': 'Sonora, México', '641': 'Sonora, México', '642': 'Sonora, México', '643': 'Sonora, México', '644': 'Sonora, México', '645': 'Sonora, México', '647': 'Sonora, México', '651': 'Sonora, México',
    '993': 'Tabasco, México', '913': 'Tabasco, México', '914': 'Tabasco, México', '917': 'Tabasco, México', '932': 'Tabasco, México', '933': 'Tabasco, México', '934': 'Tabasco, México', '936': 'Tabasco, México', '937': 'Tabasco, México',
    '834': 'Tamaulipas, México', '831': 'Tamaulipas, México', '832': 'Tamaulipas, México', '833': 'Tamaulipas, México', '835': 'Tamaulipas, México', '836': 'Tamaulipas, México', '841': 'Tamaulipas, México', '868': 'Tamaulipas, México', '891': 'Tamaulipas, México', '897': 'Tamaulipas, México', '899': 'Tamaulipas, México',
    '246': 'Tlaxcala, México', '241': 'Tlaxcala, México', '247': 'Tlaxcala, México',
    '229': 'Veracruz, México', '228': 'Veracruz, México', '271': 'Veracruz, México', '272': 'Veracruz, México', '273': 'Veracruz, México', '278': 'Veracruz, México', '284': 'Veracruz, México', '285': 'Veracruz, México', '288': 'Veracruz, México', '782': 'Veracruz, México', '783': 'Veracruz, México', '784': 'Veracruz, México', '785': 'Veracruz, México', '921': 'Veracruz, México', '922': 'Veracruz, México', '923': 'Veracruz, México', '924': 'Veracruz, México', '235': 'Veracruz, México',
    '985': 'Yucatán, México', '986': 'Yucatán, México', '988': 'Yucatán, México', '991': 'Yucatán, México', '997': 'Yucatán, México',
    '492': 'Zacatecas, México', '493': 'Zacatecas, México', '498': 'Zacatecas, México', '463': 'Zacatecas, México', '467': 'Zacatecas, México', '478': 'Zacatecas, México', '494': 'Zacatecas, México', '499': 'Zacatecas, México'
  };

  return ladasMap[lada3] || 'México';
};

const formatUSD = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '';
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD`;
};

const parseUSD = (str) => {
  if (!str) return '';
  const cleaned = str.replace(/[^0-9.]/g, '');
  return cleaned;
};

const NewLeadDialog = ({ open, onOpenChange, onSubmit }) => {
  const { theme } = useTheme();
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [files, setFiles] = useState([]);
  const [machines, setMachines] = useState([{ name: '', price: '', commission: '' }]);
  const [notes, setNotes] = useState('');
  const [dynamicQuotationUrl, setDynamicQuotationUrl] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [calcMachineIndex, setCalcMachineIndex] = useState(null);
  const [pdfExportMachineIndex, setPdfExportMachineIndex] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const fileInputRef = useRef(null);

  const resetForm = useCallback(() => {
    setCompany('');
    setName('');
    setPosition('');
    setEmail('');
    setPhone('');
    setSource('');
    setFiles([]);
    setMachines([{ name: '', price: '', commission: '' }]);
    setNotes('');
    setDynamicQuotationUrl('');
    setClientCode('');
    setPdfExportMachineIndex(null);
  }, []);

  const handleOpenChange = useCallback((isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  }, [onOpenChange, resetForm]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles = [...files];

      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newFiles.push({ url: event.target.result, fileName: file.name });
          if (newFiles.length === files.length + selectedFiles.length) {
            setFiles(newFiles);
          }
        };
        reader.readAsDataURL(file);
      });

      toast({
        title: "Archivos seleccionados",
        description: `${selectedFiles.length} archivo(s) listos para subirse.`,
      });
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const newFiles = [...files];

    droppedFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFiles.push({ url: e.target.result, fileName: file.name });
          if (newFiles.length === files.length + droppedFiles.filter(f => f.type === 'application/pdf').length) {
            setFiles(newFiles);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [files]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!company || !name) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Por favor, completa el nombre de la empresa y del contacto." });
      return;
    }
    onSubmit({ company, name, position, email, phone, source, machines, quotations: files, notes, dynamic_quotation_url: dynamicQuotationUrl, clientCode });
  }, [company, name, position, email, phone, source, machines, files, notes, dynamicQuotationUrl, clientCode, onSubmit]);

  const onMachineChange = (index, field, value) => {
    const newMachines = [...machines];
    newMachines[index][field] = value;
    setMachines(newMachines);
  };

  const addMachine = () => {
    setMachines([...machines, { name: '', price: '', commission: '' }]);
  };

  const removeMachine = (index) => {
    setMachines(machines.filter((_, i) => i !== index));
  };

  const getInputValue = useCallback((index, field, rawValue) => {
    if (focusedField && focusedField.index === index && focusedField.field === field) {
      return rawValue || '';
    }
    return formatUSD(rawValue);
  }, [focusedField]);

  const { totalSaleAmount, totalCommission } = useMemo(() => {
    return machines.reduce((acc, machine) => {
      acc.totalSaleAmount += Number(machine.price) || 0;
      acc.totalCommission += (Number(machine.commission) || Number(machine.estimated_commission) || 0);
      return acc;
    }, { totalSaleAmount: 0, totalCommission: 0 });
  }, [machines]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`sm:max-w-2xl ${theme === 'nova' ? 'glass-bevel' : ''}`}>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Prospecto</DialogTitle>
          <DialogDescription>
            Completa los detalles para crear una nueva oportunidad de venta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6 max-h-[70vh] overflow-y-auto px-6 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nombre de la empresa" className={theme === 'nova' ? 'bg-white/5' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Contacto</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del contacto principal" className={theme === 'nova' ? 'bg-white/5' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Puesto</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ej: Gerente de Compras" className={theme === 'nova' ? 'bg-white/5' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className={theme === 'nova' ? 'bg-white/5' : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setPhone(val);
                  const loc = detectLocationFromPhone(val);
                  if (loc) {
                    setSource(loc);
                  }
                }}
                placeholder="Teléfono de contacto"
                className={theme === 'nova' ? 'bg-white/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Origen / Ubicación</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ej: Nuevo León, México"
                className={theme === 'nova' ? 'bg-white/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dynamic_quotation_url" className="flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-primary" />
                URL Cotización Dinámica
              </Label>
              <Input
                id="dynamic_quotation_url"
                value={dynamicQuotationUrl}
                onChange={(e) => setDynamicQuotationUrl(e.target.value)}
                placeholder="https://cotizacion.ejemplo.com/..."
                className={theme === 'nova' ? 'bg-white/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_code" className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Número de Cliente / Cotización
              </Label>
              <Input
                id="client_code"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                placeholder="Ej: C-1002"
                className={theme === 'nova' ? 'bg-white/5' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Máquinas/Proyectos</Label>
            <div className="space-y-2">
              {machines.map((machine, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                  <Input
                    value={machine.name}
                    onChange={(e) => onMachineChange(index, 'name', e.target.value)}
                    placeholder="Nombre de la máquina"
                    className="flex-1"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={getInputValue(index, 'price', machine.price)}
                      onFocus={() => setFocusedField({ index, field: 'price' })}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => onMachineChange(index, 'price', parseUSD(e.target.value))}
                      placeholder="Precio"
                      className="w-36 pl-7"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-40">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={getInputValue(index, 'estimated_commission', machine.estimated_commission)}
                        onFocus={() => setFocusedField({ index, field: 'estimated_commission' })}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => onMachineChange(index, 'estimated_commission', parseUSD(e.target.value))}
                        placeholder="Comisión Est."
                        className="pl-7 text-xs h-8"
                        title="Comisión Estimada (Manual)"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={formatUSD(machine.commission)}
                        readOnly
                        placeholder="Comisión Calc."
                        className="pl-7 text-xs h-8 bg-muted/40 cursor-not-allowed border-dashed border-white/20 text-green-400 font-bold"
                        title="Comisión Calculada (Cotizador)"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      setCalcMachineIndex(index);
                    }}
                    className="text-primary hover:bg-primary/10 h-10 w-10 flex-shrink-0"
                    title="Calcular costos y utilidad"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setPdfExportMachineIndex(index);
                    }}
                    className="bg-primary hover:bg-primary/80 text-black h-10 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider flex-shrink-0"
                    title="Exportar Radiografía Interna a PDF"
                  >
                    <FileText className="w-4 h-4 text-black" />
                    PDF
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeMachine(index)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addMachine}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Agregar otra máquina
            </Button>
          </div>

          <div className="space-y-4 bg-secondary p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Venta Total</span>
              <span className="text-2xl font-bold text-primary">${(totalSaleAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Comisión Total</span>
              <span className="text-xl font-bold text-yellow-400">${(totalCommission || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="notes" className="text-primary font-bold tracking-widest text-xs uppercase flex items-center gap-2">
              <PlusCircle className="w-3 h-3" />
              SEGUIMIENTO INICIAL
            </Label>
            
            <div className="space-y-4">
              {notes && (
                <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 px-1">
                    <X className="w-2.5 h-2.5" />
                    <span>REGISTRO INICIAL</span>
                    <span className="ml-auto font-bold text-primary/90 uppercase tracking-tighter">AHORA</span>
                  </div>
                  <div className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {notes}
                    </p>
                  </div>
                </div>
              )}

              <div className="relative group">
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe aquí el primer avance o comentario del cliente..."
                  className={`min-h-[100px] transition-all duration-300 resize-none rounded-xl ${
                    theme === 'nova' 
                      ? 'bg-black/40 border-primary/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-inner' 
                      : 'bg-secondary border-muted'
                  }`}
                />
                <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-primary/20 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity">
                  <PlusCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic px-1">
                Este mensaje se guardará como el primer registro en la bitácora de seguimiento.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cotizaciones (PDF)</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta PDFs aquí, o haz clic para seleccionar</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" multiple />
            <div className="mt-2 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                  <div className="flex items-center gap-2 truncate">
                    <File className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground truncate">{file.fileName}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => removeFile(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Crear Prospecto</Button>
        </DialogFooter>
      </DialogContent>
      {calcMachineIndex !== null && (
        <LeadQuoteCalculator
          isOpen={calcMachineIndex !== null}
          onClose={() => setCalcMachineIndex(null)}
          location={source}
          clientName={name}
          clientCompany={company}
          machine={machines[calcMachineIndex]}
          onApply={(updatedMachine) => {
            setMachines(prev => {
              const updated = [...prev];
              updated[calcMachineIndex] = updatedMachine;
              return updated;
            });
          }}
        />
      )}
      {pdfExportMachineIndex !== null && (
        <ExportPdfDialog
          isOpen={pdfExportMachineIndex !== null}
          onClose={() => setPdfExportMachineIndex(null)}
          clientCompany={company}
          clientName={name}
          location={source}
          machine={machines[pdfExportMachineIndex]}
        />
      )}
    </Dialog>
  );
};

export default NewLeadDialog;