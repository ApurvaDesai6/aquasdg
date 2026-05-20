import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function riskColor(level: string): string {
  switch (level) {
    case "critical": return "#ef4444";
    case "high": return "#f59e0b";
    case "moderate": return "#06b6d4";
    case "low": return "#10b981";
    default: return "#64748b";
  }
}

export function riskBg(level: string): string {
  switch (level) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "moderate": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "low": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}
