import { create } from "zustand";
import type { Region } from "@/lib/api";

interface AppState {
  selectedRegion: Region | null;
  setSelectedRegion: (region: Region | null) => void;
  activePanel: "map" | "simulation" | "policy";
  setActivePanel: (panel: "map" | "simulation" | "policy") => void;
  filterRiskLevel: string | null;
  setFilterRiskLevel: (level: string | null) => void;
  filterCountry: string | null;
  setFilterCountry: (country: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedRegion: null,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  activePanel: "map",
  setActivePanel: (panel) => set({ activePanel: panel }),
  filterRiskLevel: null,
  setFilterRiskLevel: (level) => set({ filterRiskLevel: level }),
  filterCountry: null,
  setFilterCountry: (country) => set({ filterCountry: country }),
}));
