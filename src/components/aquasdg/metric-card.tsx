'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'cyan' | 'teal' | 'amber' | 'rose' | 'emerald';
  delay?: number;
}

const colorClasses = {
  cyan: {
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
  },
  teal: {
    bg: 'bg-teal-500/10',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'cyan',
  delay = 0,
}: MetricCardProps) {
  const colors = colorClasses[color] || colorClasses.cyan;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={`relative overflow-hidden border ${colors.border} hover:shadow-lg transition-shadow duration-300`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && trendValue && (
                <div className={`flex items-center gap-1 text-xs ${
                  trend === 'up' ? 'text-emerald-600' : 
                  trend === 'down' ? 'text-rose-600' : 
                  'text-muted-foreground'
                }`}>
                  {getTrendIcon()}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
