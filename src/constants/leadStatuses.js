import {
    Phone, Mail, Video, FileText, Send, FileSearch, Calendar, Gem, MessageSquare, Sparkles,
    // Technical / Site Actions
    Wrench, Hammer, HardHat, Ruler, PenTool, Clipboard, ClipboardList, ClipboardCheck, Scale, Box, Package, Layers, Component, Cpu, Database, Scan, Printer,
    // Travel / Logistics
    MapPin, Navigation, Car, Truck, Plane, Building2, Home, Landmark, Flag, Target, Compass,
    // Documents / Layouts
    FileCode, FileImage, FileSpreadsheet, FileSignature, Folder, FolderOpen, Files, Paperclip, Layout, LayoutDashboard, Grid, Maximize, Minimize,
    // Communication / Outreach
    Megaphone, Bell, Inbox, Smartphone, Headphones, Mic, Radio, Share2, AtSign, Globe,
    // Sales / Business
    DollarSign, CreditCard, Wallet, Banknote, Briefcase, TrendingUp, BarChart, PieChart, Activity, Award, Star, ThumbsUp, Medal, Crown,
    // Time / Planning
    Clock, Timer, AlarmClock, CalendarClock, Hourglass, CalendarDays, CalendarCheck,
    // Status / Misc
    CheckCircle, XCircle, AlertTriangle, AlertCircle, Info, HelpCircle, Lock, Unlock, Shield, Key, Eye, Search, Filter, Settings, Zap, Flame, Snowflake, Sun, Moon, Anchor, Coffee, Gift
} from 'lucide-react';

export const DEFAULT_STATUSES = [
    { id: '1', type: 'Llamada', label: 'Llamada', icon: 'Phone', color: 'text-blue-400' },
    { id: '2', type: 'Correo', label: 'Correo', icon: 'Mail', color: 'text-orange-400' },
    { id: '3', type: 'Zoom', label: 'Zoom', icon: 'Video', color: 'text-purple-400' },
    { id: '4', type: 'Cotizar', label: 'Cotizar', icon: 'FileText', color: 'text-cyan-400' },
    { id: '5', type: 'Cotización Enviada', label: 'Cotización Enviada', icon: 'Send', color: 'text-blue-400' },
    { id: '6', type: 'Revisión de Cotización', label: 'Revisión de Cotización', icon: 'FileSearch', color: 'text-orange-400' },
    { id: '7', type: 'Cita', label: 'Cita', icon: 'Calendar', color: 'text-purple-400' },
    { id: '8', type: 'Próximo a Cierre', label: 'Próximo a Cierre', icon: 'Gem', color: 'text-teal-400' },
    { id: '9', type: 'WhatsApp', label: 'WhatsApp', icon: 'MessageSquare', color: 'text-green-400' },
    { id: '10', type: 'Otro', label: 'Otro', icon: 'Sparkles', color: 'text-yellow-400' },
];

export const ICON_MAP = {
    Phone, Mail, Video, FileText, Send, FileSearch, Calendar, Gem, MessageSquare, Sparkles,
    Wrench, Hammer, HardHat, Ruler, PenTool, Clipboard, ClipboardList, ClipboardCheck, Scale, Box, Package, Layers, Component, Cpu, Database, Scan, Printer,
    MapPin, Navigation, Car, Truck, Plane, Building2, Home, Landmark, Flag, Target, Compass,
    FileCode, FileImage, FileSpreadsheet, FileSignature, Folder, FolderOpen, Files, Paperclip, Layout, LayoutDashboard, Grid, Maximize, Minimize,
    Megaphone, Bell, Inbox, Smartphone, Headphones, Mic, Radio, Share2, AtSign, Globe,
    DollarSign, CreditCard, Wallet, Banknote, Briefcase, TrendingUp, BarChart, PieChart, Activity, Award, Star, ThumbsUp, Medal, Crown,
    Clock, Timer, AlarmClock, CalendarClock, Hourglass, CalendarDays, CalendarCheck,
    CheckCircle, XCircle, AlertTriangle, AlertCircle, Info, HelpCircle, Lock, Unlock, Shield, Key, Eye, Search, Filter, Settings, Zap, Flame, Snowflake, Sun, Moon, Anchor, Coffee, Gift
};
