"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AlertTriangle,
  Droplets,
  Globe,
  X,
  Search,
  Loader2,
  TrendingUp,
  DollarSign,
  Target,
  FileText,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Building2,
  Database,
  Layers,
  Zap,
  Calendar,
  MapPin,
  Filter,
  Settings,
  Activity,
  Scale,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Lightbulb,
  LineChart,
  GitBranch,
  BookOpen,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Download,
  Share2,
  Key,
  CloudRain,
  Thermometer,
  Waves,
  Shield,
  Play,
  Sparkles,
  Info,
  LayoutGrid,
  Hammer,
  CheckCircle,
  Factory,
  Leaf,
  Users,
  Radio,
  Sun,
  Tent,
  TrendingDown,
  ClipboardList,
  Wrench,
  Gavel,
  Home,
  Eye,
  ShieldCheck,
  Building,
  Maximize2,
  Navigation,
  History as HistoryIcon
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GroundsourceExplorer } from '@/components/aquasdg/groundsource-explorer';

import {
  type Region,
  type IndicatorType,
  type RiskLevel,
  type Statistics,
  type ApiKeys
} from '@/lib/aquasdg/types';

import {
  formatPopulation,
  formatCurrency,
  getRiskMarkerColor,
  getColorForValue,
  RISK_LEVEL_CONFIG
} from '@/lib/aquasdg/utils';
import { cn } from '@/lib/utils';

// ============================================================
// ICON MAPPING FOR DYNAMIC INSIGHTS
// ============================================================
const ICON_MAP: Record<string, any> = {
  AlertTriangle,
  Droplets,
  Waves,
  Zap,
  Sparkles,
  Search,
  Activity,
  ShieldCheck,
  TrendingUp,
  Maximize2
};

// ============================================================
// TYPES & INTERFACES (Local Helpers Only)
// ============================================================

interface InfrastructureProject {
  id: string;
  title: string;
  type: string;
  description: string;
  budget: {
    estimated: number;
    breakdown: { category: string; amount: number; percentage: number }[];
  };
  timeline: {
    phases: { name: string; duration: string; milestones: string[] }[];
    totalDuration: string;
  };
  impact: {
    beneficiaries: number;
    waterAccessImprovement: number;
    riskReduction: number;
    sdgContribution: { target: string; contribution: string }[];
  };
  prerequisites: string[];
  risks: { risk: string; mitigation: string }[];
  successCases: { name: string; location: string; outcome: string }[];
  recommendedInterventions: string[];
}

// ============================================================
// CONFIGURATION
// ============================================================

const INDICATOR_CONFIG: Record<IndicatorType | 'overall', { 
  id: string; 
  name: string; 
  sdg_target: string; 
  description: string; 
  unit: string; 
  category: string; 
  colorScale: string[]; 
  icon: any;
  nuancedMetrics: { label: string; key: string; icon: any; color: string }[];
}> = {
  overall: {
    id: 'overall', name: 'Overall/Total', sdg_target: 'SDG 6/13',
    description: 'Comprehensive water security overview', unit: 'Index', category: 'total',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: LayoutGrid,
    nuancedMetrics: [
      { label: 'Composite Risk', key: 'composite_risk', icon: Activity, color: 'text-cyan-400' },
      { label: 'Water Access', key: 'water_access', icon: Droplets, color: 'text-blue-400' },
      { label: 'Sanitation', key: 'sanitation', icon: Waves, color: 'text-indigo-400' },
      { label: 'Water Stress', key: 'water_stress', icon: Zap, color: 'text-amber-400' }
    ]
  },
  composite_risk: {
    id: 'composite_risk', name: 'Composite Risk', sdg_target: '6.1-6.6',
    description: 'Overall water security risk assessment', unit: '%', category: 'risk',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: Activity,
    nuancedMetrics: [
      { label: 'Hazard Level', key: 'flood_risk', icon: AlertTriangle, color: 'text-rose-400' },
      { label: 'Vulnerability', key: 'climate_vulnerability', icon: Thermometer, color: 'text-orange-400' },
      { label: 'Capacity Gap', key: 'infrastructure_gap', icon: Building2, color: 'text-cyan-400' },
      { label: 'Policy Strength', key: 'policy_vector', icon: Scale, color: 'text-emerald-400' }
    ]
  },
  water_access: { 
    id: 'water_access', name: 'Water Access', sdg_target: '6.1.1',
    description: 'Percentage of population with safely managed services', unit: '%', category: 'access',
    colorScale: ['#ef4444', '#f59e0b', '#84cc16', '#10b981'], icon: Droplets,
    nuancedMetrics: [
      { label: 'Rural Access', key: 'water_access', icon: Map, color: 'text-blue-400' },
      { label: 'Urban Access', key: 'water_access', icon: Building2, color: 'text-cyan-400' },
      { label: 'Infra Coverage', key: 'infrastructure_gap', icon: Hammer, color: 'text-indigo-400' },
      { label: 'Reliability', key: 'policy_vector', icon: CheckCircle2, color: 'text-emerald-400' }
    ]
  },
  sanitation: {
    id: 'sanitation', name: 'Sanitation', sdg_target: '6.2.1',
    description: 'Percentage of population with safely managed sanitation', unit: '%', category: 'access',
    colorScale: ['#ef4444', '#f59e0b', '#84cc16', '#10b981'], icon: Waves,
    nuancedMetrics: [
      { label: 'Waste Treatment', key: 'sanitation', icon: Filter, color: 'text-indigo-400' },
      { label: 'Hygiene Facilities', key: 'sanitation', icon: Sparkles, color: 'text-blue-400' },
      { label: 'Open Defecation', key: 'sanitation', icon: AlertCircle, color: 'text-rose-400' },
      { label: 'Policy Framework', key: 'policy_vector', icon: Scale, color: 'text-slate-400' }
    ]
  },
  water_stress: { 
    id: 'water_stress', name: 'Water Stress', sdg_target: '6.4.2',
    description: 'Freshwater withdrawal as proportion is available resources', unit: '%', category: 'resource',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: Zap,
    nuancedMetrics: [
      { label: 'Withdrawal Intensity', key: 'water_stress', icon: ArrowUpRight, color: 'text-amber-400' },
      { label: 'Renewal Rate', key: 'water_stress', icon: RefreshCw, color: 'text-emerald-400' },
      { label: 'Industrial Usage', key: 'water_stress', icon: Factory, color: 'text-blue-400' },
      { label: 'Agri Withdrawal', key: 'water_stress', icon: Leaf, color: 'text-orange-400' }
    ]
  },
  flood_risk: { 
    id: 'flood_risk', name: 'Flood Hazard', sdg_target: '13.1.1',
    description: 'Combined fluvial and pluvial flood risk score', unit: '0-100', category: 'risk',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: Activity,
    nuancedMetrics: [
      { label: 'Exposure Index', key: 'flood_risk', icon: Users, color: 'text-rose-400' },
      { label: 'Warning Systems', key: 'policy_vector', icon: Radio, color: 'text-cyan-400' },
      { label: 'Drainage Capacity', key: 'infrastructure_gap', icon: Waves, color: 'text-blue-400' },
      { label: 'Return Period', key: 'flood_risk', icon: Calendar, color: 'text-slate-400' }
    ]
  },
  drought_risk: { 
    id: 'drought_risk', name: 'Drought Hazard', sdg_target: '6.4',
    description: 'Drought hazard and vulnerability assessment', unit: '0-100', category: 'risk',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: CloudRain,
    nuancedMetrics: [
      { label: 'Moisture Deficit', key: 'drought_risk', icon: Sun, color: 'text-orange-400' },
      { label: 'Storage Capacity', key: 'infrastructure_gap', icon: Tent, color: 'text-amber-400' },
      { label: 'Agri Vulnerability', key: 'climate_vulnerability', icon: Leaf, color: 'text-rose-400' },
      { label: 'Resilience Index', key: 'policy_vector', icon: Shield, color: 'text-emerald-400' }
    ]
  },
  climate_vulnerability: { 
    id: 'climate_vulnerability', name: 'Climate Vuln.', sdg_target: '13.b',
    description: 'Sensitivity to climate-induced water variability', unit: 'index', category: 'climate',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: Thermometer,
    nuancedMetrics: [
      { label: 'Temp. Sensitivity', key: 'climate_vulnerability', icon: Thermometer, color: 'text-rose-400' },
      { label: 'Rainfall Volatility', key: 'climate_vulnerability', icon: CloudRain, color: 'text-blue-400' },
      { label: 'Economic Exposure', key: 'climate_vulnerability', icon: TrendingDown, color: 'text-amber-400' },
      { label: 'Adaptation Plan', key: 'policy_vector', icon: ClipboardList, color: 'text-emerald-400' }
    ]
  },
  infrastructure_gap: { 
    id: 'infrastructure_gap', name: 'Infra. Gap', sdg_target: '9.a',
    description: 'Deficit in required water storage and delivery assets', unit: 'index', category: 'infrastructure',
    colorScale: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'], icon: Building2,
    nuancedMetrics: [
      { label: 'Storage Deficit', key: 'infrastructure_gap', icon: Database, color: 'text-amber-400' },
      { label: 'Network Integrity', key: 'infrastructure_gap', icon: GitBranch, color: 'text-cyan-400' },
      { label: 'Investment Needs', key: 'infrastructure_gap', icon: DollarSign, color: 'text-emerald-400' },
      { label: 'Maintenance Backlog', key: 'infrastructure_gap', icon: Wrench, color: 'text-rose-400' }
    ]
  },
  policy_vector: {
    id: 'policy_vector', name: 'Policy Vector', sdg_target: '6.a, 6.b',
    description: 'Water governance and policy framework strength', unit: '0-100', category: 'governance',
    colorScale: ['#ef4444', '#f59e0b', '#84cc16', '#10b981'], icon: Scale,
    nuancedMetrics: [
      { label: 'Legal Framework', key: 'policy_vector', icon: Gavel, color: 'text-indigo-400' },
      { label: 'Institutional Cap.', key: 'policy_vector', icon: Building, color: 'text-blue-400' },
      { label: 'Transp. Index', key: 'policy_vector', icon: Eye, color: 'text-emerald-400' },
      { label: 'Enforcement level', key: 'policy_vector', icon: ShieldCheck, color: 'text-cyan-400' }
    ]
  }
};

import { PolicyIntelligence } from '@/components/aquasdg/policy-intelligence';

// Dynamic import for MapView to avoid SSR issues with maplibre-gl
const MapView = dynamic(() => import('@/components/aquasdg/map-view'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900/50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Initializing Risk Map...</span>
      </div>
    </div>
  )
});

// ============================================================
// COMPONENTS
// ============================================================

function SettingsModal({ 
  isOpen, 
  onClose, 
  apiKeys, 
  onSaveKeys 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  apiKeys: ApiKeys;
  onSaveKeys: (keys: ApiKeys) => void;
}) {
  const [keys, setKeys] = useState(apiKeys);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            API Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure API keys for live data and AI analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Google Cloud API Key
            </label>
            <Input
              type="password"
              placeholder="Enter your Google Cloud API key"
              value={keys.googleCloud}
              onChange={(e) => setKeys({ ...keys, googleCloud: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enables FloodHub, Groundsource, and Gemini AI integration
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Groq API Key (Alternative)
            </label>
            <Input
              type="password"
              placeholder="gsk_..."
              value={keys.gemini}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">
              For AI-powered project analysis and recommendations
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 mb-2">Google Cloud Setup Guide (2025):</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">1. Frontend (Gemini/ML Analysis)</h5>
                <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                  <li>Go to **APIs & Services → Credentials**</li>
                  <li>Create **API Key** and paste it above</li>
                  <li>Enable **Generative Language API** in Library</li>
                </ol>
              </div>
              
              <div>
                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">2. Backend (Data Pipelining & Earth Engine)</h5>
                <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                  <li>Go to **IAM & Admin → Service Accounts**</li>
                  <li>Create account & download **JSON Key**</li>
                  <li>Save as `secrets/service-account.json` in ML service</li>
                  <li>**CRITICAL**: Register project at **[earthengine.google.com/register](https://code.earthengine.google.com/register)**</li>
                </ol>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-700/50">
              <a 
                href="https://console.cloud.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open Google Cloud Console
              </a>
              <a 
                href="https://code.earthengine.google.com/register" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Register for Earth Engine Access
              </a>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => { onSaveKeys(keys); onClose(); }}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500"
            >
              Save Keys
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LiveDataSource({ 
  title, 
  status, 
  lastUpdated, 
  recordCount,
  url 
}: { 
  title: string; 
  status: 'live' | 'demo' | 'error';
  lastUpdated: string;
  recordCount?: string;
  url?: string;
}) {
  const statusConfig = {
    live: { color: 'text-emerald-400', icon: CheckCircle2, label: 'Live' },
    demo: { color: 'text-amber-400', icon: AlertCircle, label: 'Demo' },
    error: { color: 'text-rose-400', icon: AlertTriangle, label: 'Error' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs text-slate-500">{lastUpdated}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {recordCount && (
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
            {recordCount}
          </Badge>
        )}
        <Badge className={`${config.color} bg-transparent border-0 text-xs`}>
          {config.label}
        </Badge>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function IndicatorSwitcher({ 
  selected, 
  onChange 
}: { 
  selected: IndicatorType | 'overall'; 
  onChange: (v: IndicatorType | 'overall') => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-black text-slate-500 uppercase tracking-widest px-1 mb-1 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5" />
        SDG Indicator Layer
      </div>
      <Select value={selected} onValueChange={(val) => onChange(val as IndicatorType | 'overall')}>
        <SelectTrigger className="w-full bg-slate-800/50 border-slate-700/50 text-slate-100 ring-offset-slate-950 focus:ring-cyan-500/50">
          <SelectValue placeholder="Select indicator..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
          {Object.entries(INDICATOR_CONFIG).map(([id, config]) => (
            <SelectItem 
              key={id} 
              value={id}
              className="focus:bg-cyan-500/20 focus:text-cyan-400 text-slate-100"
            >
              <div className="flex items-center gap-2">
                <config.icon className="w-4 h-4 text-cyan-500" />
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs">{config.name}</span>
                  <span className="text-[10px] text-slate-500 leading-none">{config.sdg_target}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RiskLevelFilter({ 
  selected, 
  onChange,
  counts 
}: { 
  selected: RiskLevel; 
  onChange: (v: RiskLevel) => void;
  counts: Record<string, number>;
}) {
  const levels: RiskLevel[] = ['all', 'normal', 'watch', 'warning', 'danger'];
  
  const normalizeCount = (level: string): number => {
    if (level === 'normal' || level === 'low') return (counts['normal'] || 0) + (counts['low'] || 0);
    if (level === 'watch' || level === 'moderate') return (counts['watch'] || 0) + (counts['moderate'] || 0);
    if (level === 'warning' || level === 'high') return (counts['warning'] || 0) + (counts['high'] || 0);
    if (level === 'danger' || level === 'critical') return (counts['danger'] || 0) + (counts['critical'] || 0);
    return counts[level] || 0;
  };
  
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
        <Filter className="w-3.5 h-3.5" />
        Risk Level Filter
      </label>
      <div className="flex flex-wrap gap-1.5">
        {levels.map(level => {
          const config = level === 'all' 
            ? { label: 'All', color: '#64748b', bgColor: 'bg-slate-500/20', borderColor: 'border-slate-500/50', textColor: 'text-slate-400' }
            : RISK_LEVEL_CONFIG[level];
          const count = level === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : normalizeCount(level);
          const isActive = selected === level;
          
          if (!config) return null;
          
          return (
            <button
              key={level}
              onClick={() => onChange(level)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive 
                  ? `${config.bgColor} ${config.borderColor} border ${config.textColor}` 
                  : 'bg-slate-800/30 border border-slate-700/30 text-slate-500 hover:bg-slate-800/50'
              }`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              {config.label}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ indicator }: { indicator: IndicatorType }) {
  const config = INDICATOR_CONFIG[indicator];
  const isReversed = config.category === 'access' || indicator === 'policy_vector';
  const labels = isReversed ? ['Low', '', '', 'High'] : ['Low', '', '', 'High'];
  const colors = isReversed ? [...config.colorScale].reverse() : config.colorScale;
  
  return (
    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        {(() => { const Icon = config.icon; return <Icon className="w-4 h-4 text-cyan-400" />; })()}
        <div className="text-xs font-medium text-slate-300">{config.name}</div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-500">{labels[0]}</span>
        <div className="flex-1 h-2.5 rounded-full overflow-hidden flex">
          {colors.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-[10px] text-slate-500">{labels[3]}</span>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">
        SDG {config.sdg_target} • {config.description}
      </div>
    </div>
  );
}

function ProjectAnalysisModal({
  isOpen,
  onClose,
  region,
  project,
  isLoading,
  apiKeys
}: {
  isOpen: boolean;
  onClose: () => void;
  region: Region | null;
  project: InfrastructureProject | null;
  isLoading: boolean;
  apiKeys: ApiKeys;
}) {
  if (!region) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Infrastructure Project Analysis
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            AI-generated infrastructure proposal for {region.name}, {region.country}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
            <span className="text-sm text-slate-400">Generating project analysis...</span>
            <span className="text-xs text-slate-500 mt-1">
              Using {apiKeys.gemini || apiKeys.googleCloud ? 'AI Analysis' : 'Pattern-based analysis'}
            </span>
          </div>
        ) : project ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 p-2">
              {/* Project Header */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-lg p-4 border border-cyan-500/30">
                <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                <p className="text-sm text-slate-400">{project.description}</p>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-500">Est. Budget</div>
                  <div className="text-xl font-bold text-emerald-400">{formatCurrency(project.budget.estimated)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-500">Beneficiaries</div>
                  <div className="text-xl font-bold text-cyan-400">{formatPopulation(project.impact.beneficiaries)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="text-xl font-bold text-amber-400">{project.timeline.totalDuration}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-500">Risk Reduction</div>
                  <div className="text-xl font-bold text-rose-400">{project.impact.riskReduction.toFixed(0)}%</div>
                </div>
              </div>
              
              {/* Budget Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Budget Breakdown
                </h4>
                <div className="space-y-2">
                  {project.budget.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{item.category}</span>
                          <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Implementation Timeline
                </h4>
                <div className="space-y-3">
                  {project.timeline.phases.map((phase, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{phase.name}</span>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{phase.duration}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {phase.milestones.map((m, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* SDG Contribution */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  SDG 6 Contribution
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {project.impact.sdgContribution.map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs mb-1">SDG {item.target}</Badge>
                      <p className="text-xs text-slate-400">{item.contribution}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Success Cases */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Comparable Success Cases
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {project.successCases.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs text-slate-500 mb-1">{c.location}</div>
                      <div className="text-xs text-emerald-400">{c.outcome}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recommended Interventions */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Recommended Interventions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.recommendedInterventions.map((int, i) => (
                    <Badge key={i} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {int}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : null}
        
        {project && (
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-700 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-500">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RegionDetailPanel({ 
  region, 
  onClose,
  onAnalyze,
  selectedIndicator
}: { 
  region: Region | null; 
  onClose: () => void;
  onAnalyze: () => void;
  selectedIndicator: IndicatorType | 'overall';
}) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (region) {
      setLoading(true);
      fetch(`http://localhost:3001/api/regions/${region.id}/insights`)
        .then(res => res.json())
        .then(data => {
          setInsights(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch insights:", err);
          setLoading(false);
        });
    }
  }, [region]);

  if (!region) return null;
  
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 bottom-0 w-[400px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-800 z-40 flex flex-col"
    >
      <div className="p-4 border-b border-slate-800 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{region.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${RISK_LEVEL_CONFIG[region.riskLevel].bgColor} ${RISK_LEVEL_CONFIG[region.riskLevel].borderColor} ${RISK_LEVEL_CONFIG[region.riskLevel].textColor}`}>
              {RISK_LEVEL_CONFIG[region.riskLevel].label}
            </Badge>
            <span className="text-sm text-slate-400">{region.country}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase">Population</div>
              <div className="text-lg font-semibold text-white">{formatPopulation(region.population)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase">ISO Code</div>
              <div className="text-lg font-semibold text-white">{region.iso3}</div>
            </div>
          </div>
          
          {/* ML Intelligence Dashboard */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Scientific Assessment</h3>
              {insights && (
                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
                  Confidence: {insights.confidence_score * 100}%
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin mb-2" />
                <span className="text-[10px] text-slate-500 uppercase font-bold">Correlating Patterns...</span>
              </div>
            ) : insights ? (
              <div className="space-y-3">
                {/* Resilience Score Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-lg">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Systemic Resilience</span>
                    <span className="text-2xl font-black text-white font-mono">{insights.resilience_score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        insights.resilience_score > 70 ? "bg-emerald-500" : 
                        insights.resilience_score > 40 ? "bg-amber-500" : "bg-rose-500"
                      )} 
                      style={{ width: `${insights.resilience_score}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    {insights.resilience_score > 60 ? "Current infrastructure provides adequate buffer against near-term climate variability." : "Critical vulnerabilities detected in primary water supply redundancy."}
                  </p>
                </div>

                {/* Deep Insights List */}
                <div className="space-y-2">
                  {insights.insights.map((insight: any, i: number) => {
                    const Icon = ICON_MAP[insight.icon] || Sparkles;
                    return (
                      <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 flex gap-3 group hover:border-cyan-500/30 transition-colors">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          insight.impact_level === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                          insight.impact_level === 'high' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-200">{insight.label}</span>
                            <span className="text-[10px] font-mono text-slate-500">{insight.value}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Correlations Section */}
                <div className="pt-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">ML Field Correlations</h4>
                  <div className="space-y-2">
                    {insights.correlations.map((corr: any, i: number) => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-slate-700">{corr.factor_a}</Badge>
                          <Activity className="w-3 h-3 text-slate-600" />
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-slate-700">{corr.factor_b}</Badge>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-500/70">{corr.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-500 uppercase">Awaiting detailed inference stream</span>
              </div>
            )}
          </div>

          {/* Verified Groundsource Events - Evidence-based Data */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <HistoryIcon className="w-3.5 h-3.5 text-cyan-500" />
              Verified Groundsource Events
              {region.floodEvents && region.floodEvents.length > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-400 text-[9px] h-4 border-none">
                  {region.floodEvents.length} Recent
                </Badge>
              )}
            </h3>
            
            <div className="space-y-2">
              {region.floodEvents && region.floodEvents.length > 0 ? (
                region.floodEvents.slice(0, 5).map((event, i) => (
                  <div key={event.id || i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 space-y-2 group hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(event.eventDate).toLocaleDateString()}</span>
                        <span className="text-xs font-bold text-slate-200">Flood Inundation Detected</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-rose-500/50 text-rose-400 bg-rose-500/10">
                        Severity: {(event.severity * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" />
                        {event.affectedAreaKm2.toFixed(1)} km²
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {event.dataSource}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-slate-800 text-center">
                  <ShieldCheck className="w-6 h-6 text-slate-700 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">No recent events detected</p>
                  <p className="text-[9px] text-slate-600 mt-1 uppercase">Continuous monitoring active</p>
                </div>
              )}
              
              {region.floodEvents && region.floodEvents.length > 5 && (
                <Button variant="ghost" className="w-full h-8 text-[10px] text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-widest">
                  View full event history
                </Button>
              )}
            </div>
          </div>

          <div className="h-4"></div>
          
          {/* AI Analysis Button - Redesigned to be more subtle and professional */}
          <div className="pt-4 border-t border-slate-800/50">
            <Button 
              onClick={onAnalyze}
              className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/50 shadow-lg transition-all group"
            >
              <Sparkles className="w-4 h-4 mr-2 text-cyan-400 opacity-70 group-hover:opacity-100" />
              <span className="text-xs font-bold uppercase tracking-widest">Generate Comprehensive Assessment</span>
              <ChevronRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </Button>
            <p className="text-[9px] text-center text-slate-600 uppercase tracking-[0.2em] mt-3 font-medium">
              Powered by Infrastructure Intelligence Engine
            </p>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

// ============================================================
// MAP COMPONENT WITH MARKERS
// ============================================================

// Policy Intelligence Tab Moved

// ============================================================
// Policy Intelligence implementation is now imported from @/components/aquasdg/policy-intelligence

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AquaSDGPlatform() {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'policy' | 'explorer'>('map');
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [regions, setRegions] = useState<Region[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    googleCloud: '',
    gemini: ''
  });
  
  // UI State
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType | 'overall'>('composite_risk');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Analysis State
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisProject, setAnalysisProject] = useState<InfrastructureProject | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  
  // Load API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('aqua-sdg-api-keys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);
  
  // Save API keys
  const handleSaveApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('aqua-sdg-api-keys', JSON.stringify(keys));
  }, []);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [regionsRes, statsRes] = await Promise.all([
          fetch('http://localhost:3001/api/regions?XTransformPort=3001&limit=200'),
          fetch('http://localhost:3001/api/statistics?XTransformPort=3001')
        ]);
        
        if (!regionsRes.ok) throw new Error('Failed to fetch regions');
        
        const rawRegions = await regionsRes.json();
        const rawStats = await statsRes.json();
        
        const transformedRegions: Region[] = rawRegions.map((r: any) => {
          return {
            id: r.id,
            name: r.name,
            country: r.country,
            iso3: r.id.split('-')[0].toUpperCase(),
            adminLevel: r.region_type || 'sub-national',
            coordinates: r.coordinates,
            population: r.population,
            indicators: {
              water_access: r.water_access_pct || 0,
              sanitation: r.sanitation_pct || 0,
              water_stress: r.water_stress_index || 0,
              flood_risk: r.flood_risk_score || 0,
              drought_risk: r.drought_risk_score || 0,
              composite_risk: r.composite_risk_score || 0,
              policy_vector: r.policy_index || 0,
              climate_vulnerability: r.climate_vulnerability || 0,
              infrastructure_gap: r.infrastructure_gap || 0
            },
            riskLevel: r.risk_level || 'low',
            sources: ['ML Service - Groundsource Ingested'],
            lastUpdated: new Date().toISOString(),
            floodEvents: r.floodEvents || []
          };
        });
        
        setRegions(transformedRegions);
        setStatistics({
          total_regions: rawStats.total_regions || transformedRegions.length,
          countries: rawStats.countries || new Set(transformedRegions.map(r => r.country)).size,
          total_population: rawStats.total_population || transformedRegions.reduce((sum: number, r: Region) => sum + r.population, 0),
          averages: {
            water_access: rawStats.average_safely_managed_pct || Math.round(transformedRegions.reduce((sum: number, r: Region) => sum + r.indicators.water_access, 0) / transformedRegions.length),
            sanitation: 0,
            water_stress: 0,
            flood_risk: 0
          },
          risk_distribution: rawStats.risk_level_distribution || {},
          data_sources: [
            { name: 'ML Risk Model', url: 'http://localhost:3001', description: 'Risk classification' },
            { name: 'SDG 6 Data Portal', url: 'https://sdg6data.org', description: 'UN SDG 6 indicators' },
            { name: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', description: 'Water risk atlas' }
          ]
        });
        
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to data services');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Analyze region - generate infrastructure project
  const handleAnalyzeRegion = useCallback(async () => {
    if (!selectedRegion) return;
    
    setAnalysisLoading(true);
    setAnalysisModalOpen(true);
    
    try {
      const res = await fetch('http://localhost:3001/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: {
            regionId: selectedRegion.id,
            regionName: selectedRegion.name,
            country: selectedRegion.country,
            population: selectedRegion.population,
            indicators: selectedRegion.indicators
          },
          apiKey: apiKeys.gemini || apiKeys.googleCloud
        })
      });
      
      const data = await res.json();
      setAnalysisProject(data.project);
    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedRegion, apiKeys]);

  const handleSyncData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/sync', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Refresh local data
        const regionsRes = await fetch('http://localhost:3001/api/regions?XTransformPort=3001&limit=200');
        const rawRegions = await regionsRes.json();
        
        // Transformed regions
        const transformed: Region[] = rawRegions.map((r: any) => ({
          ...r,
          coordinates: { lat: r.latitude, lng: r.longitude },
          indicators: {
            composite_risk: r.riskScore,
            water_access: r.safelyManagedAccess,
            water_stress: r.waterStressIndex,
            flood_risk: r.floodRiskScore,
            drought_risk: r.droughtRiskScore,
            climate_vulnerability: r.climateVulnerability
          }
        }));
        
        setRegions(transformed);
      }
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Filtered regions
  const filteredRegions = useMemo(() => {
    let result = regions;
    
    if (selectedRiskLevel !== 'all') {
      result = result.filter(r => {
        const level = r.riskLevel;
        if (selectedRiskLevel === 'normal') return level === 'normal' || level === 'low';
        if (selectedRiskLevel === 'watch') return level === 'watch' || level === 'moderate';
        if (selectedRiskLevel === 'warning') return level === 'warning' || level === 'high';
        if (selectedRiskLevel === 'danger') return level === 'danger' || level === 'critical';
        return true;
      });
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.country.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [regions, selectedRiskLevel, searchQuery]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white antialiased flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading Water Security Intelligence...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white antialiased flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4 text-sm">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-cyan-600 hover:bg-cyan-500">
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className="h-screen bg-slate-950 text-slate-100 antialiased flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-sm flex items-center px-4 shrink-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white">AquaSDG</span>
              <span className="text-[10px] text-slate-500">Water Security Intelligence Platform</span>
            </div>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <Button
              variant={activeTab === 'map' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('map')}
              className={activeTab === 'map' ? 'bg-cyan-600 hover:bg-cyan-500' : 'text-slate-400'}
            >
              <Globe className="w-4 h-4 mr-2" />
              Risk Map
            </Button>
            <Button
              variant={activeTab === 'policy' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('policy')}
              className={activeTab === 'policy' ? 'bg-cyan-600 hover:bg-cyan-500' : 'text-slate-400'}
            >
              <Zap className="w-4 h-4 mr-2" />
              Policy Intelligence
            </Button>
            <Button
              variant={activeTab === 'explorer' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('explorer')}
              className={activeTab === 'explorer' ? 'bg-cyan-600 hover:bg-cyan-500' : 'text-slate-400'}
            >
              <Database className="w-4 h-4 mr-2" />
              Data Center
            </Button>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>{filteredRegions.length} regions</span>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex flex-1 min-h-0 relative">
          {activeTab === 'map' ? (
            <>
              {/* Left Panel */}
              <AnimatePresence mode="wait">
                {leftPanelOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 340, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-r border-slate-800/50 bg-slate-900/30 flex flex-col shrink-0 overflow-hidden"
                  >
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            placeholder="Search regions, countries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-sm text-slate-200 w-full"
                          />
                        </div>
                        
                        {/* Indicator Switcher */}
                        <IndicatorSwitcher 
                          selected={selectedIndicator} 
                          onChange={setSelectedIndicator} 
                        />
                        
                        {/* Risk Level Filter */}
                        <RiskLevelFilter 
                          selected={selectedRiskLevel} 
                          onChange={setSelectedRiskLevel}
                          counts={statistics?.risk_distribution || {}}
                        />
                        
                        {/* Legend */}
                        <Legend indicator={selectedIndicator} />
                        
                        {/* Contextual Intelligence Panel */}
                        {/* Scrollable Region List */}
                        <div className="space-y-3 pt-4 border-t border-slate-800/50">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                            <Navigation className="w-3.5 h-3.5 text-cyan-500" />
                            Region Explorer
                          </h4>
                          <div className="space-y-2">
                            {filteredRegions.map(region => (
                              <button
                                key={region.id}
                                onClick={() => setSelectedRegion(region)}
                                className={cn(
                                  "w-full p-3 rounded-xl border transition-all text-left group",
                                  selectedRegion?.id === region.id 
                                    ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-900/20" 
                                    : "bg-slate-800/20 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                                )}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{region.country}</span>
                                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{region.name}</span>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] px-1.5 h-4 border-none capitalize font-bold"
                                    style={{ 
                                      backgroundColor: `${getRiskMarkerColor(region.riskLevel)}22`, 
                                      color: getRiskMarkerColor(region.riskLevel) 
                                    }}
                                  >
                                    {region.riskLevel}
                                  </Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Status</span>
                                    <span className="text-[10px] font-mono font-bold text-cyan-400">{(region.indicators as any).composite_risk.toFixed(1)}% Risk</span>
                                  </div>
                                  {region.floodEvents && region.floodEvents.length > 0 && (
                                    <div className="flex items-center gap-1 text-[8px] text-rose-400 font-bold uppercase tracking-widest">
                                      <Activity className="w-2.5 h-2.5 animate-pulse" />
                                      Live Event
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    
                    <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 shrink-0">
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" />
                          Live Data Intelligence
                        </h4>
                        <div className="space-y-2">
                          <LiveDataSource
                            title="Google Groundsource"
                            status="live"
                            lastUpdated="2.6M events • Real-time"
                            recordCount="2.6M events"
                          />
                          <LiveDataSource
                            title="ML Risk Model"
                            status="live"
                            lastUpdated={new Date().toLocaleString()}
                            recordCount={`${regions.length} regions`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
              
              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="absolute left-2 top-2 z-30 bg-slate-800/80 hover:bg-slate-700"
              >
                {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              
              {/* Map Area */}
              <div className="flex-1 relative">
                <MapView 
                  regions={filteredRegions} 
                  selectedIndicator={selectedIndicator}
                  onRegionClick={setSelectedRegion}
                />
              </div>
              
              {/* Region Detail Panel */}
              <AnimatePresence>
                {/* Detail Panel */}
              {selectedRegion && (
                  <RegionDetailPanel 
                    region={selectedRegion}
                    selectedIndicator={selectedIndicator}
                    onClose={() => setSelectedRegion(null)}
                    onAnalyze={() => {
                      setActiveTab('policy');
                      setLeftPanelOpen(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </>
          ) : activeTab === 'policy' ? (
            <PolicyIntelligence
              className="flex-1"
              regions={regions}
              selectedRegion={selectedRegion}
              apiKeys={apiKeys}
              onOpenSettings={() => setSettingsOpen(true)}
              onRegionClick={(region: any) => {
                setSelectedRegion(region);
                setActiveTab('map');
              }}
            />
          ) : (
            <div className="flex-1 overflow-hidden">
              <GroundsourceExplorer />
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="h-10 border-t border-slate-800/50 bg-slate-900/95 flex items-center px-4 text-[10px] text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span>© 2024 AquaSDG</span>
            <span>•</span>
            <span>Data: Google Groundsource, FloodHub, SDG 6 Portal</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span>{regions.length} regions • {statistics?.countries || 0} countries</span>
          </div>
        </footer>
        
        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          apiKeys={apiKeys}
          onSaveKeys={handleSaveApiKeys}
        />
        
        {/* Analysis Modal */}
        <ProjectAnalysisModal
          isOpen={analysisModalOpen}
          onClose={() => setAnalysisModalOpen(false)}
          region={selectedRegion}
          project={analysisProject}
          isLoading={analysisLoading}
          apiKeys={apiKeys}
        />
      </div>
    </TooltipProvider>
  );
}
