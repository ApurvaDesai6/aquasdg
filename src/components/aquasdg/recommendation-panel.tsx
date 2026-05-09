'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Loader2, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { AIRecommendation, RegionSummary } from '@/lib/aquasdg/types';

interface RecommendationPanelProps {
  selectedRegion: RegionSummary | null;
  onGenerateRecommendation: (regionId: string) => Promise<AIRecommendation | null>;
  recommendation: AIRecommendation | null;
  isLoading: boolean;
}

export function RecommendationPanel({
  selectedRegion,
  onGenerateRecommendation,
  recommendation,
  isLoading,
}: RecommendationPanelProps) {
  const handleGenerate = async () => {
    if (selectedRegion) {
      await onGenerateRecommendation(selectedRegion.id);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  if (!selectedRegion) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="h-full min-h-80 flex items-center justify-center">
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Select a region from the map or table to generate AI recommendations
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Recommendations
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {selectedRegion.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Region Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-cyan-500" />
              <span className="font-medium">{selectedRegion.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{selectedRegion.country}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Population:</span>
                <span className="ml-1 font-medium">
                  {(selectedRegion.population / 1000000).toFixed(1)}M
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Water Access:</span>
                <span className="ml-1 font-medium">
                  {selectedRegion.water_access_pct.toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Risk:</span>
                <span className="ml-1 font-medium capitalize">
                  {selectedRegion.risk_level}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Recommendations...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Recommendations
              </>
            )}
          </Button>

          {/* Recommendation Results */}
          <AnimatePresence mode="wait">
            {recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Separator />

                {/* Executive Summary */}
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-500" />
                    Executive Summary
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {recommendation.executive_summary}
                  </p>
                </div>

                {/* Prioritized Actions */}
                {recommendation.prioritized_actions?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Prioritized Actions</div>
                    <div className="space-y-2">
                      {recommendation.prioritized_actions.slice(0, 4).map((action, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center font-bold">
                            {action.priority || i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{action.action}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {action.timeline}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {action.estimated_cost}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget Breakdown */}
                {recommendation.budget_breakdown && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recommended Budget Allocation</div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Recommended:</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(recommendation.budget_breakdown.total_recommended)}
                      </span>
                    </div>
                    {recommendation.budget_breakdown.allocations?.slice(0, 3).map((alloc, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{alloc.category}</span>
                          <span>{formatCurrency(alloc.amount)}</span>
                        </div>
                        <Progress value={alloc.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk Factors */}
                {recommendation.risk_factors?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Risk Factors
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.risk_factors.slice(0, 4).map((factor, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* SDG 6 Alignment */}
                {recommendation.sdg6_alignment && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      SDG 6 Alignment
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Current</p>
                        <p className="font-bold text-lg">
                          {recommendation.sdg6_alignment.current_access_pct}%
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Projected</p>
                        <p className="font-bold text-lg text-emerald-600">
                          {recommendation.sdg6_alignment.projected_access_pct}%
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={recommendation.sdg6_alignment.gap_reduction} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {recommendation.sdg6_alignment.gap_reduction}% gap reduction projected
                    </p>
                  </div>
                )}

                {/* Next Steps */}
                {recommendation.next_steps?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Next Steps</div>
                    {recommendation.next_steps.slice(0, 3).map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
