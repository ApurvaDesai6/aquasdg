'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  Users, 
  Droplets,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RegionSummary, RiskLevel } from '@/lib/aquasdg/types';

interface RegionsTableProps {
  regions: RegionSummary[];
  onRegionSelect: (region: RegionSummary) => void;
}

const riskColors: Record<RiskLevel, string> = {
  critical: 'bg-rose-500 hover:bg-rose-600',
  high: 'bg-amber-500 hover:bg-amber-600',
  moderate: 'bg-yellow-500 hover:bg-yellow-600',
  low: 'bg-emerald-500 hover:bg-emerald-600',
};

type SortField = 'name' | 'risk_score' | 'population' | 'water_access';
type SortDirection = 'asc' | 'desc';

export function RegionsTable({ regions, onRegionSelect }: RegionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Get unique countries
  const countries = useMemo(() => {
    return [...new Set(regions.map(r => r.country))].sort();
  }, [regions]);

  // Filter and sort regions
  const filteredRegions = useMemo(() => {
    let result = [...regions];

    // Apply filters
    if (riskFilter !== 'all') {
      result = result.filter(r => r.risk_level === riskFilter);
    }
    if (countryFilter !== 'all') {
      result = result.filter(r => r.country === countryFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'risk_score':
          comparison = a.composite_risk_score - b.composite_risk_score;
          break;
        case 'population':
          comparison = a.population - b.population;
          break;
        case 'water_access':
          comparison = a.water_access_pct - b.water_access_pct;
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result.slice(0, 10); // Show top 10
  }, [regions, sortField, sortDirection, riskFilter, countryFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Top At-Risk Regions</CardTitle>
            <div className="flex gap-2">
              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | 'all')}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Region
                      {renderSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('risk_score')}
                  >
                    <div className="flex items-center gap-1">
                      Risk
                      {renderSortIcon('risk_score')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('population')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Pop.
                      {renderSortIcon('population')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('water_access')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Access
                      {renderSortIcon('water_access')}
                    </div>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegions.map((region, index) => (
                  <motion.tr
                    key={region.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onRegionSelect(region)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-500" />
                        <span className="font-medium">{region.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {region.country}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={`${riskColors[region.risk_level]} text-white capitalize border-0`}>
                          {region.risk_level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {region.composite_risk_score.toFixed(0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {(region.population / 1000000).toFixed(1)}M
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Droplets className="h-3 w-3 text-muted-foreground" />
                        {region.water_access_pct.toFixed(0)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegionSelect(region);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
