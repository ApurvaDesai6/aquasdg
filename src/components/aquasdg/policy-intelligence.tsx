'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Target,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Building2,
  Globe,
  TrendingUp,
  BarChart3,
  Zap,
  BookOpen,
  Sparkles,
  Loader2,
  Settings,
  Download,
  Share2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Circle,
  Clock,
  MapPin,
  Scale,
  Shield,
  Droplets,
  Thermometer,
  Waves,
  Mail,
  MessageSquare,
  Linkedin,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================
// TYPES
// ============================================================

interface PolicyIntelligenceProps {
  regions: any[];
  selectedRegion: any | null;
  apiKeys: { gemini: string; googleCloud: string };
  onOpenSettings: () => void;
  onRegionClick: (region: any) => void;
  className?: string;
}

type WorkflowPhase = 'situation' | 'planning' | 'stakeholders' | 'implementation' | 'monitoring';

interface InterventionOption {
  id: string;
  name: string;
  description: string;
  estimatedCost: number;
  timeline: string;
  impact: string;
  icon: any;
}

interface Stakeholder {
  name: string;
  type: 'government' | 'ngo' | 'funding' | 'community';
  role: string;
  engagement: 'high' | 'medium' | 'low';
}

// ============================================================
// INTERVENTION OPTIONS
// ============================================================

const INTERVENTION_OPTIONS: InterventionOption[] = [
  {
    id: 'water_infrastructure',
    name: 'Water Infrastructure Development',
    description: 'Construction of water treatment plants, distribution networks, and storage facilities',
    estimatedCost: 5000000,
    timeline: '24-36 months',
    impact: 'High - Direct improvement to water access',
    icon: Droplets
  },
  {
    id: 'flood_defense',
    name: 'Flood Defense Systems',
    description: 'Levees, drainage systems, early warning systems, and flood-resistant infrastructure',
    estimatedCost: 8000000,
    timeline: '18-30 months',
    impact: 'High - Reduces flood damage by up to 70%',
    icon: Waves
  },
  {
    id: 'sanitation_systems',
    name: 'Sanitation Infrastructure',
    description: 'Sewage treatment, latrines, and hygiene education programs',
    estimatedCost: 3000000,
    timeline: '12-24 months',
    impact: 'Medium-High - Reduces waterborne diseases',
    icon: Shield
  },
  {
    id: 'drought_resilience',
    name: 'Drought Resilience Programs',
    description: 'Water harvesting, groundwater recharge, and drought-resistant crops',
    estimatedCost: 4000000,
    timeline: '12-18 months',
    impact: 'Medium - Long-term sustainability improvement',
    icon: Thermometer
  },
  {
    id: 'policy_enhancement',
    name: 'Policy Framework Strengthening',
    description: 'Regulatory reform, capacity building, and institutional strengthening',
    estimatedCost: 500000,
    timeline: '6-12 months',
    impact: 'Medium - Enables sustainable governance',
    icon: Scale
  }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatPopulation(n: number): string {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  if (n >= 1000000000) return `$${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

// ============================================================
// WORKFLOW PHASES
// ============================================================

const PHASES: { id: WorkflowPhase; name: string; icon: any; description: string }[] = [
  { id: 'situation', name: 'Situation Analysis', icon: Target, description: 'Assess current risks and needs' },
  { id: 'planning', name: 'Intervention Planning', icon: Zap, description: 'Design intervention strategies' },
  { id: 'stakeholders', name: 'Stakeholder Mapping', icon: Users, description: 'Identify partners and resources' },
  { id: 'implementation', name: 'Implementation Roadmap', icon: Calendar, description: 'Create action timeline' },
  { id: 'monitoring', name: 'Monitoring & Evaluation', icon: BarChart3, description: 'Define success metrics' }
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PolicyIntelligence({
  regions,
  selectedRegion,
  apiKeys,
  onOpenSettings,
  onRegionClick,
  className
}: PolicyIntelligenceProps) {
  const [activePhase, setActivePhase] = useState<WorkflowPhase>('situation');
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [budgetAllocation, setBudgetAllocation] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  
  // Computed values
  const highRiskRegions = useMemo(() => {
    return [...regions]
      .filter(r => r.riskLevel === 'danger' || r.riskLevel === 'warning' || r.riskLevel === 'critical' || r.riskLevel === 'high')
      .sort((a, b) => b.indicators.composite_risk - a.indicators.composite_risk)
      .slice(0, 10);
  }, [regions]);
  
  const affectedPopulation = useMemo(() => {
    return highRiskRegions.reduce((sum, r) => sum + r.population, 0);
  }, [highRiskRegions]);
  
  const totalBudget = useMemo(() => {
    return Object.values(budgetAllocation).reduce((sum, v) => sum + v, 0);
  }, [budgetAllocation]);
  
  // Generate AI analysis
  const handleGeneratePlan = useCallback(async () => {
    if (!selectedRegion && highRiskRegions.length === 0) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/policy-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: selectedRegion || highRiskRegions[0],
          interventions: selectedInterventions,
          budget: totalBudget,
          apiKey: apiKeys.gemini || apiKeys.googleCloud
        })
      });
      
      const data = await res.json();
      setGeneratedPlan(data.plan);
    } catch (e) {
      console.error('Failed to generate plan:', e);
      // Fallback plan
      setGeneratedPlan(`
## Water Security Intervention Plan for ${selectedRegion?.name || highRiskRegions[0]?.name}

### Executive Summary
This comprehensive intervention plan addresses critical water security challenges through strategic infrastructure development and policy enhancement.

### Priority Interventions
${selectedInterventions.map(id => {
  const intervention = INTERVENTION_OPTIONS.find(i => i.id === id);
  return `- **${intervention?.name}**: ${intervention?.description}`;
}).join('\n')}

### Budget Allocation
Total Estimated Budget: ${formatCurrency(totalBudget || 5000000)}

### Timeline
Implementation is projected over 24-36 months with phased delivery.

### Expected Impact
- Improved water access for ${formatPopulation(affectedPopulation)} people
- Reduction in waterborne disease incidence by 40-60%
- Enhanced climate resilience for vulnerable communities
      `);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedRegion, highRiskRegions, selectedInterventions, totalBudget, apiKeys, affectedPopulation]);
  
  // Toggle intervention
  const toggleIntervention = useCallback((id: string) => {
    setSelectedInterventions(prev => {
      if (prev.includes(id)) {
        const newSet = prev.filter(i => i !== id);
        const newBudget = { ...budgetAllocation };
        delete newBudget[id];
        setBudgetAllocation(newBudget);
        return newSet;
      }
      const intervention = INTERVENTION_OPTIONS.find(i => i.id === id);
      if (intervention) {
        setBudgetAllocation(prev => ({
          ...prev,
          [id]: intervention.estimatedCost
        }));
      }
      return [...prev, id];
    });
  }, [budgetAllocation]);

  return (
    <div className={cn("h-full flex flex-col bg-slate-950", className)}>
      {/* Phase Stepper */}
      <div className="border-b border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between w-full px-4">
          {PHASES.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = activePhase === phase.id;
            const isPast = PHASES.findIndex(p => p.id === activePhase) > index;
            
            return (
              <div key={phase.id} className="flex items-center">
                <button
                  onClick={() => setActivePhase(phase.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-cyan-500/20 border border-cyan-500/50' 
                      : isPast 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-cyan-500 text-white' 
                      : isPast 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-cyan-400' : isPast ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {phase.name}
                  </span>
                </button>
                {index < PHASES.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main Content */}
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <div className="p-8 pb-32 w-full px-6">
            <AnimatePresence mode="wait">
            {/* Phase 1: Situation Analysis */}
            {activePhase === 'situation' && (
              <motion.div
                key="situation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Target className="w-6 h-6 text-cyan-400" />
                      Situation Analysis
                    </h2>
                    <p className="text-slate-400 mt-1">Assess current risks, affected populations, and root causes</p>
                  </div>
                  {!apiKeys.gemini && !apiKeys.googleCloud && (
                    <Button onClick={onOpenSettings} variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Add API Key for AI Analysis
                    </Button>
                  )}
                </div>
                
                {/* Risk Overview */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500 uppercase mb-1">High Risk Regions</div>
                      <div className="text-3xl font-bold text-rose-400">{highRiskRegions.length}</div>
                      <div className="text-xs text-slate-400 mt-1">Requiring immediate action</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500 uppercase mb-1">Affected Population</div>
                      <div className="text-3xl font-bold text-amber-400">{formatPopulation(affectedPopulation)}</div>
                      <div className="text-xs text-slate-400 mt-1">People at risk</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500 uppercase mb-1">Avg. Water Access</div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {highRiskRegions.length > 0 
                          ? Math.round(highRiskRegions.reduce((sum, r) => sum + r.indicators.water_access, 0) / highRiskRegions.length)
                          : 0}%
                      </div>
                      <div className="text-xs text-slate-400 mt-1">SDG 6.1 baseline</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500 uppercase mb-1">Est. Investment Need</div>
                      <div className="text-3xl font-bold text-emerald-400">{formatCurrency(highRiskRegions.length * 5000000)}</div>
                      <div className="text-xs text-slate-400 mt-1">Infrastructure gap</div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Priority Regions List */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      Priority Regions Analysis
                    </CardTitle>
                    <CardDescription>Regions ranked by composite risk score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {highRiskRegions.map((region, i) => (
                        <div 
                          key={region.id}
                          className={`flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer ${
                            selectedRegion?.id === region.id 
                              ? 'bg-cyan-500/20 border border-cyan-500/50' 
                              : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-700/50'
                          }`}
                          onClick={() => onRegionClick(region)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            i < 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            <span className="text-sm font-bold">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{region.name}</div>
                            <div className="text-sm text-slate-400">{region.country} • {formatPopulation(region.population)}</div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-xs text-slate-500">Water Access</div>
                              <div className="text-sm font-medium text-cyan-400">{region.indicators.water_access}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Flood Risk</div>
                              <div className="text-sm font-medium text-amber-400">{region.indicators.flood_risk}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Drought Risk</div>
                              <div className="text-sm font-medium text-orange-400">{region.indicators.drought_risk}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Composite</div>
                              <div className="text-sm font-medium text-rose-400">{region.indicators.composite_risk}%</div>
                            </div>
                          </div>
                          <Badge className={`
                            ${region.riskLevel === 'danger' || region.riskLevel === 'critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : ''}
                            ${region.riskLevel === 'warning' || region.riskLevel === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : ''}
                          `}>
                            {region.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Root Cause Analysis */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      Root Cause Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { cause: 'Infrastructure Gap', severity: 85, impact: 'Critical - Limited distribution networks' },
                        { cause: 'Climate Vulnerability', severity: 72, impact: 'High - Drought and flood cycles' },
                        { cause: 'Governance Weakness', severity: 65, impact: 'Medium - Policy implementation gaps' },
                        { cause: 'Financial Constraints', severity: 78, impact: 'High - Limited public investment' }
                      ].map((item, i) => (
                        <div key={i} className="p-4 rounded-lg bg-slate-700/30 border border-slate-700/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-white">{item.cause}</span>
                            <Badge className={`
                              ${item.severity > 70 ? 'bg-rose-500/20 text-rose-400' : ''}
                              ${item.severity <= 70 && item.severity > 50 ? 'bg-amber-500/20 text-amber-400' : ''}
                              ${item.severity <= 50 ? 'bg-emerald-500/20 text-emerald-400' : ''}
                            `}>
                              {item.severity}% severity
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-400">{item.impact}</div>
                          <Progress value={item.severity} className="h-1.5 mt-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setActivePhase('planning')}
                    className="bg-cyan-600 hover:bg-cyan-500"
                  >
                    Continue to Planning
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Phase 2: Intervention Planning */}
            {activePhase === 'planning' && (
              <motion.div
                key="planning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-cyan-400" />
                    Intervention Planning
                  </h2>
                  <p className="text-slate-400 mt-1">Select and configure intervention strategies</p>
                </div>
                
                {/* Intervention Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {INTERVENTION_OPTIONS.map((intervention) => {
                    const Icon = intervention.icon;
                    const isSelected = selectedInterventions.includes(intervention.id);
                    
                    return (
                      <Card 
                        key={intervention.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-cyan-500/10 border-cyan-500/50' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => toggleIntervention(intervention.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                            }`}>
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{intervention.name}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                                )}
                              </div>
                              <p className="text-sm text-slate-400 mt-1">{intervention.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="text-emerald-400">{formatCurrency(intervention.estimatedCost)}</span>
                                <span className="text-amber-400">{intervention.timeline}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Budget Allocation */}
                {selectedInterventions.length > 0 && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        Budget Allocation
                      </CardTitle>
                      <CardDescription>
                        Total Estimated: {formatCurrency(totalBudget || selectedInterventions.length * 5000000)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedInterventions.map(id => {
                          const intervention = INTERVENTION_OPTIONS.find(i => i.id === id);
                          if (!intervention) return null;
                          
                          return (
                            <div key={id} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{intervention.name}</span>
                                <span className="text-white font-medium">{formatCurrency(budgetAllocation[id] || intervention.estimatedCost)}</span>
                              </div>
                              <Input
                                type="range"
                                min={intervention.estimatedCost * 0.5}
                                max={intervention.estimatedCost * 2}
                                value={budgetAllocation[id] || intervention.estimatedCost}
                                onChange={(e) => setBudgetAllocation(prev => ({
                                  ...prev,
                                  [id]: parseInt(e.target.value)
                                }))}
                                className="w-full"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Impact Projection */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      Projected Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-slate-700/30">
                        <div className="text-3xl font-bold text-cyan-400">{formatPopulation(affectedPopulation)}</div>
                        <div className="text-xs text-slate-400 mt-1">Potential Beneficiaries</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-slate-700/30">
                        <div className="text-3xl font-bold text-emerald-400">+35%</div>
                        <div className="text-xs text-slate-400 mt-1">Water Access Improvement</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-slate-700/30">
                        <div className="text-3xl font-bold text-amber-400">-40%</div>
                        <div className="text-xs text-slate-400 mt-1">Risk Reduction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActivePhase('situation')}>
                    Back to Analysis
                  </Button>
                  <Button 
                    className="bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-lg shadow-cyan-500/20"
                    onClick={() => setActivePhase('stakeholders')}
                    disabled={selectedInterventions.length === 0}
                  >
                    Continue to Stakeholders
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Phase 3: Stakeholder Mapping */}
            {activePhase === 'stakeholders' && (
              <motion.div
                key="stakeholders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Users className="w-6 h-6 text-cyan-400" />
                    Stakeholder Mapping
                  </h2>
                  <p className="text-slate-400 mt-1">Identify partners, funding sources, and engagement strategies</p>
                </div>
                
                {/* Stakeholder Categories */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Government Agencies */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        Government Agencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { name: 'Ministry of Water Resources', role: 'Lead Agency', engagement: 'high', link: 'https://water.gov' },
                        { name: 'Ministry of Health', role: 'Sanitation Coordination', engagement: 'medium', link: 'https://health.gov' },
                        { name: 'Ministry of Finance', role: 'Budget Allocation', engagement: 'high', link: 'https://finance.gov' },
                        { name: 'Local Government Units', role: 'Implementation', engagement: 'high', link: 'https://lgu.gov' }
                      ].map((agency, i) => (
                        <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-700/30 border border-slate-700/50 hover:border-blue-500/30 transition-all gap-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-white">{agency.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{agency.role}</div>
                            </div>
                            <Badge className={`
                              ${agency.engagement === 'high' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}
                            `}>
                              {agency.engagement}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-slate-800/50 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" asChild>
                              <a href={agency.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-slate-800/50 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  {/* NGO Partners */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="w-4 h-4 text-green-400" />
                        NGO Partners
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { name: 'UNICEF WASH Programme', role: 'Technical Support', engagement: 'high', link: 'https://unicef.org/wash' },
                        { name: 'WaterAid', role: 'Community Mobilization', engagement: 'high', link: 'https://wateraid.org' },
                        { name: 'World Bank Water', role: 'Financing', engagement: 'medium', link: 'https://worldbank.org/water' },
                        { name: 'WHO', role: 'Health Standards', engagement: 'medium', link: 'https://who.int' }
                      ].map((ngo, i) => (
                        <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-700/30 border border-slate-700/50 hover:border-cyan-500/30 transition-all gap-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-white">{ngo.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{ngo.role}</div>
                            </div>
                            <Badge className={`
                              ${ngo.engagement === 'high' ? 'bg-emerald-500/20 text-emerald-400 border-none' : 'bg-amber-500/20 text-amber-400 border-none'}
                            `}>
                              {ngo.engagement}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-slate-800/50 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" asChild>
                              <a href={ngo.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-slate-800/50 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-slate-800/50 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                              <Linkedin className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  {/* Funding Sources */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        Funding Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { name: 'World Bank IDA', amount: '$50M', status: 'Available' },
                        { name: 'Green Climate Fund', amount: '$25M', status: 'Proposal Stage' },
                        { name: 'Bilateral Aid (USAID)', amount: '$15M', status: 'Discussions' },
                        { name: 'National Budget', amount: '$10M', status: 'Allocated' }
                      ].map((fund, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                          <div>
                            <div className="text-sm font-medium text-white">{fund.name}</div>
                            <div className="text-xs text-emerald-400">{fund.amount}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {fund.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  {/* Community Engagement */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-4 h-4 text-purple-400" />
                        Community Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { name: 'Local Water Committees', role: 'Operation & Maintenance', status: 'To Establish' },
                        { name: 'Women\'s Groups', role: 'Hygiene Education', status: 'Active' },
                        { name: 'Youth Volunteers', role: 'Awareness Campaigns', status: 'To Mobilize' },
                        { name: 'Traditional Leaders', role: 'Community Buy-in', status: 'Engaged' }
                      ].map((group, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-700/30">
                          <div>
                            <div className="text-sm font-medium text-white">{group.name}</div>
                            <div className="text-xs text-slate-400">{group.role}</div>
                          </div>
                          <Badge className={`
                            ${group.status === 'Active' || group.status === 'Engaged' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-300'}
                          `}>
                            {group.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActivePhase('planning')}>
                    Back to Planning
                  </Button>
                  <Button 
                    onClick={() => setActivePhase('implementation')}
                    className="bg-cyan-600 hover:bg-cyan-500"
                  >
                    Continue to Implementation
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Phase 4: Implementation Roadmap */}
            {activePhase === 'implementation' && (
              <motion.div
                key="implementation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-cyan-400" />
                    Implementation Roadmap
                  </h2>
                  <p className="text-slate-400 mt-1">Timeline and milestones for project execution</p>
                </div>
                
                {/* Timeline */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Project Timeline (36 Months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
                      
                      {/* Phases */}
                      {[
                        { phase: 'Phase 1: Preparation', duration: 'Months 1-6', status: 'pending', milestones: ['Needs Assessment', 'Stakeholder Alignment', 'Detailed Design', 'Procurement'] },
                        { phase: 'Phase 2: Construction', duration: 'Months 7-24', status: 'pending', milestones: ['Site Preparation', 'Infrastructure Installation', 'Quality Assurance', 'Testing'] },
                        { phase: 'Phase 3: Capacity Building', duration: 'Months 18-30', status: 'pending', milestones: ['Staff Training', 'Community Education', 'Management Systems', 'Documentation'] },
                        { phase: 'Phase 4: Handover & M&E', duration: 'Months 30-36', status: 'pending', milestones: ['Operational Handover', 'Performance Baseline', 'M&E Framework', 'Final Reporting'] }
                      ].map((phase, i) => (
                        <div key={i} className="relative pl-16 pb-8 last:pb-0">
                          <div className="absolute left-4 w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                            <Circle className="w-2 h-2 text-slate-400" />
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-white">{phase.phase}</span>
                              <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {phase.milestones.map((m, j) => (
                                <Badge key={j} variant="secondary" className="text-xs">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Resource Requirements */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-cyan-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">150+</div>
                          <div className="text-xs text-slate-400">Personnel Required</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-amber-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">25</div>
                          <div className="text-xs text-slate-400">Partner Organizations</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-purple-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">36</div>
                          <div className="text-xs text-slate-400">Months Duration</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    className="border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/80 shadow-sm"
                    onClick={() => setActivePhase('stakeholders')}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Review Stakeholders
                  </Button>
                  <Button 
                    onClick={() => setActivePhase('monitoring')}
                    className="bg-cyan-600 hover:bg-cyan-500"
                  >
                    Continue to M&E
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Phase 5: Monitoring & Evaluation */}
            {activePhase === 'monitoring' && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-cyan-400" />
                      Monitoring & Evaluation
                    </h2>
                    <p className="text-slate-400 mt-1">Define success metrics and reporting frameworks</p>
                  </div>
                  <Button 
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || (selectedInterventions.length === 0 && !selectedRegion)}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Full Report
                      </>
                    )}
                  </Button>
                </div>
                
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base">Output Indicators</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { metric: 'Water points constructed', target: '500', unit: 'units' },
                        { metric: 'Pipelines installed', target: '150', unit: 'km' },
                        { metric: 'Staff trained', target: '200', unit: 'people' },
                        { metric: 'Communities reached', target: '100', unit: 'communities' }
                      ].map((kpi, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-700/30">
                          <span className="text-sm text-slate-300">{kpi.metric}</span>
                          <span className="font-medium text-cyan-400">{kpi.target} {kpi.unit}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base">Outcome Indicators</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { metric: 'Population with safe water access', target: '+35%', baseline: '25%' },
                        { metric: 'Reduction in waterborne diseases', target: '-40%', baseline: 'Baseline' },
                        { metric: 'Household water expenditure', target: '-25%', baseline: '$15/mo' },
                        { metric: 'Women\'s time collecting water', target: '-50%', baseline: '4 hrs/day' }
                      ].map((kpi, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-700/30">
                          <span className="text-sm text-slate-300">{kpi.metric}</span>
                          <div className="text-right">
                            <span className="font-medium text-emerald-400">{kpi.target}</span>
                            <span className="text-xs text-slate-500 ml-2">(from {kpi.baseline})</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Generated Plan */}
                {generatedPlan && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        Generated Intervention Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-slate-300 text-sm bg-slate-900/50 p-4 rounded-lg">
                          {generatedPlan}
                        </pre>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button variant="outline">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                  <Button 
                    variant="ghost" 
                    className="border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/80 shadow-sm"
                    onClick={() => setActivePhase('implementation')}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Review Implementation
                  </Button>
                  <Button className="bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-lg shadow-cyan-500/20">
                    <Download className="w-4 h-4 mr-2" />
                    Download Final Report (PDF)
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

export default PolicyIntelligence;
