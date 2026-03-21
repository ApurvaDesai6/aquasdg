import { IndicatorType, RiskLevel, Region } from './types';

export const RISK_LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; textColor: string }> = {
  normal: { label: 'Normal', color: '#10b981', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/50', textColor: 'text-emerald-400' },
  watch: { label: 'Watch', color: '#84cc16', bgColor: 'bg-lime-500/20', borderColor: 'border-lime-500/50', textColor: 'text-lime-400' },
  warning: { label: 'Warning', color: '#f59e0b', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/50', textColor: 'text-amber-400' },
  danger: { label: 'Danger', color: '#ef4444', bgColor: 'bg-rose-500/20', borderColor: 'border-rose-500/50', textColor: 'text-rose-400' },
  low: { label: 'Low', color: '#10b981', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/50', textColor: 'text-emerald-400' },
  moderate: { label: 'Moderate', color: '#84cc16', bgColor: 'bg-lime-500/20', borderColor: 'border-lime-500/50', textColor: 'text-lime-400' },
  high: { label: 'High', color: '#f59e0b', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/50', textColor: 'text-amber-400' },
  critical: { label: 'Critical', color: '#ef4444', bgColor: 'bg-rose-500/20', borderColor: 'border-rose-500/50', textColor: 'text-rose-400' }
};

export function formatPopulation(n: number): string {
  if (!n) return '0';
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

export function formatCurrency(n: number): string {
  if (!n) return '$0';
  if (n >= 1000000000) return `$${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export function getRiskMarkerColor(riskLevel: string): string {
  const normalizedLevel = riskLevel?.toLowerCase() || 'normal';
  if (normalizedLevel === 'low') return RISK_LEVEL_CONFIG.normal.color;
  if (normalizedLevel === 'moderate') return RISK_LEVEL_CONFIG.watch.color;
  if (normalizedLevel === 'high') return RISK_LEVEL_CONFIG.warning.color;
  if (normalizedLevel === 'critical') return RISK_LEVEL_CONFIG.danger.color;
  return RISK_LEVEL_CONFIG[normalizedLevel]?.color || RISK_LEVEL_CONFIG.normal.color;
}

export function getColorForValue(value: number, indicator: string): string {
  // Simplified color logic based on thresholds
  // In a full implementation, this would use INDICATOR_CONFIG.colorScale
  const colors = ['#ef4444', '#f59e0b', '#84cc16', '#10b981'];
  const isBetterHigh = indicator === 'water_access' || indicator === 'policy_vector' || indicator === 'sanitation';
  
  const idx = value >= 75 ? 3 : value >= 50 ? 2 : value >= 25 ? 1 : 0;
  return isBetterHigh ? colors[idx] : colors[3 - idx];
}
