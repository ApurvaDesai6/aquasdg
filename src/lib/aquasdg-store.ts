// AquaSDG: Zustand Store for State Management
import { create } from 'zustand';
import type { Region, SimulationResult, Recommendation, RiskLevel } from './aquasdg-data';

interface AquaSDGState {
  // Selected region
  selectedRegion: Region | null;
  setSelectedRegion: (region: Region | null) => void;

  // Active tab
  activeTab: 'map' | 'analytics' | 'simulations' | 'reports';
  setActiveTab: (tab: 'map' | 'analytics' | 'simulations' | 'reports') => void;

  // Simulation parameters
  budget: number;
  setBudget: (budget: number) => void;
  timeHorizon: number;
  setTimeHorizon: (years: number) => void;
  regionFilter: RiskLevel | 'all';
  setRegionFilter: (filter: RiskLevel | 'all') => void;

  // Simulation results
  simulationResult: SimulationResult | null;
  setSimulationResult: (result: SimulationResult | null) => void;
  isSimulating: boolean;
  setIsSimulating: (loading: boolean) => void;

  // Recommendation
  recommendation: Recommendation | null;
  setRecommendation: (rec: Recommendation | null) => void;
  isGeneratingRecommendation: boolean;
  setIsGeneratingRecommendation: (loading: boolean) => void;

  // Map state
  hoveredRegion: Region | null;
  setHoveredRegion: (region: Region | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  selectedRegion: null,
  activeTab: 'map' as const,
  budget: 10000000,
  timeHorizon: 3,
  regionFilter: 'all' as const,
  simulationResult: null,
  isSimulating: false,
  recommendation: null,
  isGeneratingRecommendation: false,
  hoveredRegion: null
};

export const useAquaSDGStore = create<AquaSDGState>((set) => ({
  ...initialState,

  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  setBudget: (budget) => set({ budget }),
  setTimeHorizon: (years) => set({ timeHorizon: years }),
  setRegionFilter: (filter) => set({ regionFilter: filter }),

  setSimulationResult: (result) => set({ simulationResult: result }),
  setIsSimulating: (loading) => set({ isSimulating: loading }),

  setRecommendation: (rec) => set({ recommendation: rec }),
  setIsGeneratingRecommendation: (loading) => set({ isGeneratingRecommendation: loading }),

  setHoveredRegion: (region) => set({ hoveredRegion: region }),

  reset: () => set(initialState)
}));
