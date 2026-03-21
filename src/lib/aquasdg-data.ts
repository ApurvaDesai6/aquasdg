// AquaSDG: Mock Data for Freshwater Access Intelligence Platform

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface Region {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  adminLevel1?: string;
  latitude: number;
  longitude: number;
  population: number;
  areaKm2: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  basicWaterAccess: number; // %
  safelyManagedAccess: number; // %
  waterStressIndex: number; // 0-5 WRI Aqueduct
  groundwaterPotential: number; // 0-1
  floodRiskScore: number; // 0-100
  climateVulnerability: number; // 0-1
  droughtRiskScore: number; // 0-100
  infrastructureGap: number; // 0-1
}

export interface GlobalMetrics {
  totalRegions: number;
  criticalRegions: number;
  highRiskRegions: number;
  moderateRiskRegions: number;
  lowRiskRegions: number;
  totalPopulationAtRisk: number;
  avgWaterStress: number;
  avgFloodRisk: number;
  avgDroughtRisk: number;
}

export interface SimulationResult {
  allocationBreakdown: {
    interventionType: string;
    amount: number;
    percentage: number;
    regionsImpacted: number;
    populationServed: number;
  }[];
  projectedImpact: {
    waterAccessIncrease: number;
    populationServed: number;
    sustainabilityScore: number;
    costPerPerson: number;
  };
  costEffectivenessRanking: {
    regionId: string;
    regionName: string;
    impactScore: number;
    costEfficiency: number;
  }[];
}

export interface Recommendation {
  regionId: string;
  executiveSummary: string;
  prioritizedActions: {
    priority: number;
    action: string;
    impact: string;
    estimatedCost: number;
    timeline: string;
  }[];
  budgetBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  riskFactors: {
    factor: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }[];
  sdg6Alignment: {
    target: string;
    currentStatus: string;
    projectedImprovement: string;
  }[];
}

// Generate realistic mock data for 50+ regions
export const regions: Region[] = [
  // Critical Risk Regions (Sub-Saharan Africa & South Asia)
  {
    id: 'region-001',
    name: 'Somali Region',
    country: 'Ethiopia',
    countryCode: 'ETH',
    adminLevel1: 'Somali',
    latitude: 6.857,
    longitude: 44.639,
    population: 5820000,
    areaKm2: 279252,
    riskLevel: 'critical',
    riskScore: 94.2,
    basicWaterAccess: 23.4,
    safelyManagedAccess: 8.2,
    waterStressIndex: 4.8,
    groundwaterPotential: 0.15,
    floodRiskScore: 45.3,
    climateVulnerability: 0.89,
    droughtRiskScore: 92.1,
    infrastructureGap: 0.91
  },
  {
    id: 'region-002',
    name: 'Gedo Region',
    country: 'Somalia',
    countryCode: 'SOM',
    adminLevel1: 'Gedo',
    latitude: 3.504,
    longitude: 42.235,
    population: 1230000,
    areaKm2: 45012,
    riskLevel: 'critical',
    riskScore: 96.8,
    basicWaterAccess: 18.3,
    safelyManagedAccess: 4.5,
    waterStressIndex: 4.9,
    groundwaterPotential: 0.08,
    floodRiskScore: 38.7,
    climateVulnerability: 0.95,
    droughtRiskScore: 97.3,
    infrastructureGap: 0.94
  },
  {
    id: 'region-003',
    name: 'Khost Province',
    country: 'Afghanistan',
    countryCode: 'AFG',
    adminLevel1: 'Khost',
    latitude: 33.339,
    longitude: 69.917,
    population: 756000,
    areaKm2: 4156,
    riskLevel: 'critical',
    riskScore: 91.5,
    basicWaterAccess: 28.7,
    safelyManagedAccess: 12.1,
    waterStressIndex: 4.5,
    groundwaterPotential: 0.22,
    floodRiskScore: 52.4,
    climateVulnerability: 0.84,
    droughtRiskScore: 85.6,
    infrastructureGap: 0.88
  },
  {
    id: 'region-004',
    name: 'Helmund Province',
    country: 'Afghanistan',
    countryCode: 'AFG',
    adminLevel1: 'Helmund',
    latitude: 32.107,
    longitude: 64.428,
    population: 1450000,
    areaKm2: 58584,
    riskLevel: 'critical',
    riskScore: 93.7,
    basicWaterAccess: 21.5,
    safelyManagedAccess: 6.8,
    waterStressIndex: 4.7,
    groundwaterPotential: 0.18,
    floodRiskScore: 42.8,
    climateVulnerability: 0.87,
    droughtRiskScore: 91.2,
    infrastructureGap: 0.92
  },
  {
    id: 'region-005',
    name: 'Maradi Region',
    country: 'Niger',
    countryCode: 'NER',
    adminLevel1: 'Maradi',
    latitude: 13.502,
    longitude: 7.106,
    population: 3450000,
    areaKm2: 41796,
    riskLevel: 'critical',
    riskScore: 89.4,
    basicWaterAccess: 32.1,
    safelyManagedAccess: 11.3,
    waterStressIndex: 4.3,
    groundwaterPotential: 0.25,
    floodRiskScore: 48.9,
    climateVulnerability: 0.82,
    droughtRiskScore: 88.5,
    infrastructureGap: 0.85
  },
  {
    id: 'region-006',
    name: 'Tillaberi Region',
    country: 'Niger',
    countryCode: 'NER',
    adminLevel1: 'Tillaberi',
    latitude: 14.207,
    longitude: 1.457,
    population: 2890000,
    areaKm2: 97381,
    riskLevel: 'critical',
    riskScore: 90.2,
    basicWaterAccess: 29.8,
    safelyManagedAccess: 9.7,
    waterStressIndex: 4.4,
    groundwaterPotential: 0.21,
    floodRiskScore: 51.2,
    climateVulnerability: 0.85,
    droughtRiskScore: 86.9,
    infrastructureGap: 0.87
  },
  {
    id: 'region-007',
    name: 'Bakool Region',
    country: 'Somalia',
    countryCode: 'SOM',
    adminLevel1: 'Bakool',
    latitude: 4.512,
    longitude: 44.048,
    population: 367000,
    areaKm2: 26962,
    riskLevel: 'critical',
    riskScore: 95.1,
    basicWaterAccess: 15.2,
    safelyManagedAccess: 3.8,
    waterStressIndex: 4.95,
    groundwaterPotential: 0.06,
    floodRiskScore: 35.4,
    climateVulnerability: 0.93,
    droughtRiskScore: 95.8,
    infrastructureGap: 0.96
  },
  {
    id: 'region-008',
    name: 'Galmudug State',
    country: 'Somalia',
    countryCode: 'SOM',
    adminLevel1: 'Galguduud',
    latitude: 5.339,
    longitude: 46.823,
    population: 892000,
    areaKm2: 46126,
    riskLevel: 'critical',
    riskScore: 94.8,
    basicWaterAccess: 19.7,
    safelyManagedAccess: 5.2,
    waterStressIndex: 4.85,
    groundwaterPotential: 0.09,
    floodRiskScore: 41.6,
    climateVulnerability: 0.91,
    droughtRiskScore: 94.2,
    infrastructureGap: 0.93
  },
  {
    id: 'region-009',
    name: 'Sindh Province Rural',
    country: 'Pakistan',
    countryCode: 'PAK',
    adminLevel1: 'Sindh',
    latitude: 26.045,
    longitude: 68.418,
    population: 12500000,
    areaKm2: 140914,
    riskLevel: 'critical',
    riskScore: 88.6,
    basicWaterAccess: 38.2,
    safelyManagedAccess: 15.4,
    waterStressIndex: 4.2,
    groundwaterPotential: 0.35,
    floodRiskScore: 78.5,
    climateVulnerability: 0.79,
    droughtRiskScore: 72.3,
    infrastructureGap: 0.82
  },
  {
    id: 'region-010',
    name: 'Balochistan Rural',
    country: 'Pakistan',
    countryCode: 'PAK',
    adminLevel1: 'Balochistan',
    latitude: 29.287,
    longitude: 66.268,
    population: 6800000,
    areaKm2: 347190,
    riskLevel: 'critical',
    riskScore: 92.3,
    basicWaterAccess: 25.6,
    safelyManagedAccess: 8.9,
    waterStressIndex: 4.6,
    groundwaterPotential: 0.12,
    floodRiskScore: 32.8,
    climateVulnerability: 0.86,
    droughtRiskScore: 93.5,
    infrastructureGap: 0.89
  },
  {
    id: 'region-011',
    name: 'Chad Lake Region',
    country: 'Chad',
    countryCode: 'TCD',
    adminLevel1: 'Lac',
    latitude: 13.412,
    longitude: 14.532,
    population: 678000,
    areaKm2: 22320,
    riskLevel: 'critical',
    riskScore: 91.8,
    basicWaterAccess: 22.4,
    safelyManagedAccess: 7.1,
    waterStressIndex: 4.55,
    groundwaterPotential: 0.19,
    floodRiskScore: 62.4,
    climateVulnerability: 0.88,
    droughtRiskScore: 88.7,
    infrastructureGap: 0.90
  },
  {
    id: 'region-012',
    name: 'Kanem Region',
    country: 'Chad',
    countryCode: 'TCD',
    adminLevel1: 'Kanem',
    latitude: 15.034,
    longitude: 15.428,
    population: 456000,
    areaKm2: 114520,
    riskLevel: 'critical',
    riskScore: 93.4,
    basicWaterAccess: 18.9,
    safelyManagedAccess: 5.4,
    waterStressIndex: 4.75,
    groundwaterPotential: 0.11,
    floodRiskScore: 28.6,
    climateVulnerability: 0.91,
    droughtRiskScore: 94.1,
    infrastructureGap: 0.93
  },

  // High Risk Regions
  {
    id: 'region-013',
    name: 'Gaza Province',
    country: 'Mozambique',
    countryCode: 'MOZ',
    adminLevel1: 'Gaza',
    latitude: -23.987,
    longitude: 33.645,
    population: 1420000,
    areaKm2: 75334,
    riskLevel: 'high',
    riskScore: 78.5,
    basicWaterAccess: 42.3,
    safelyManagedAccess: 18.6,
    waterStressIndex: 3.8,
    groundwaterPotential: 0.32,
    floodRiskScore: 58.7,
    climateVulnerability: 0.72,
    droughtRiskScore: 68.4,
    infrastructureGap: 0.76
  },
  {
    id: 'region-014',
    name: 'Cabuia Delgado',
    country: 'Mozambique',
    countryCode: 'MOZ',
    adminLevel1: 'Cabo Delgado',
    latitude: -12.345,
    longitude: 40.567,
    population: 2340000,
    areaKm2: 82625,
    riskLevel: 'high',
    riskScore: 76.8,
    basicWaterAccess: 45.7,
    safelyManagedAccess: 21.2,
    waterStressIndex: 3.6,
    groundwaterPotential: 0.38,
    floodRiskScore: 62.3,
    climateVulnerability: 0.68,
    droughtRiskScore: 64.2,
    infrastructureGap: 0.72
  },
  {
    id: 'region-015',
    name: 'Rajasthan Rural',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Rajasthan',
    latitude: 27.023,
    longitude: 74.218,
    population: 45600000,
    areaKm2: 342239,
    riskLevel: 'high',
    riskScore: 72.4,
    basicWaterAccess: 52.8,
    safelyManagedAccess: 28.5,
    waterStressIndex: 3.4,
    groundwaterPotential: 0.42,
    floodRiskScore: 28.4,
    climateVulnerability: 0.62,
    droughtRiskScore: 74.6,
    infrastructureGap: 0.68
  },
  {
    id: 'region-016',
    name: 'Madhya Pradesh Rural',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Madhya Pradesh',
    latitude: 23.478,
    longitude: 78.956,
    population: 52000000,
    areaKm2: 308252,
    riskLevel: 'high',
    riskScore: 68.9,
    basicWaterAccess: 58.4,
    safelyManagedAccess: 32.1,
    waterStressIndex: 3.2,
    groundwaterPotential: 0.45,
    floodRiskScore: 42.6,
    climateVulnerability: 0.58,
    droughtRiskScore: 62.8,
    infrastructureGap: 0.64
  },
  {
    id: 'region-017',
    name: 'Bihar Rural',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Bihar',
    latitude: 25.678,
    longitude: 85.234,
    population: 68000000,
    areaKm2: 94163,
    riskLevel: 'high',
    riskScore: 71.2,
    basicWaterAccess: 55.6,
    safelyManagedAccess: 26.8,
    waterStressIndex: 3.5,
    groundwaterPotential: 0.52,
    floodRiskScore: 85.4,
    climateVulnerability: 0.65,
    droughtRiskScore: 42.3,
    infrastructureGap: 0.70
  },
  {
    id: 'region-018',
    name: 'Northern Province',
    country: 'Zambia',
    countryCode: 'ZMB',
    adminLevel1: 'Northern',
    latitude: -9.456,
    longitude: 31.234,
    population: 1890000,
    areaKm2: 147826,
    riskLevel: 'high',
    riskScore: 74.6,
    basicWaterAccess: 48.2,
    safelyManagedAccess: 22.4,
    waterStressIndex: 3.7,
    groundwaterPotential: 0.42,
    floodRiskScore: 52.8,
    climateVulnerability: 0.66,
    droughtRiskScore: 58.4,
    infrastructureGap: 0.73
  },
  {
    id: 'region-019',
    name: 'Eastern Province',
    country: 'Zambia',
    countryCode: 'ZMB',
    adminLevel1: 'Eastern',
    latitude: -13.567,
    longitude: 32.345,
    population: 2150000,
    areaKm2: 51476,
    riskLevel: 'high',
    riskScore: 72.8,
    basicWaterAccess: 51.4,
    safelyManagedAccess: 24.6,
    waterStressIndex: 3.5,
    groundwaterPotential: 0.38,
    floodRiskScore: 48.6,
    climateVulnerability: 0.64,
    droughtRiskScore: 62.5,
    infrastructureGap: 0.71
  },
  {
    id: 'region-020',
    name: 'Tabora Region',
    country: 'Tanzania',
    countryCode: 'TZA',
    adminLevel1: 'Tabora',
    latitude: -5.023,
    longitude: 32.845,
    population: 2890000,
    areaKm2: 76151,
    riskLevel: 'high',
    riskScore: 75.2,
    basicWaterAccess: 46.8,
    safelyManagedAccess: 19.8,
    waterStressIndex: 3.6,
    groundwaterPotential: 0.35,
    floodRiskScore: 45.2,
    climateVulnerability: 0.68,
    droughtRiskScore: 66.8,
    infrastructureGap: 0.74
  },
  {
    id: 'region-021',
    name: 'Dodoma Region',
    country: 'Tanzania',
    countryCode: 'TZA',
    adminLevel1: 'Dodoma',
    latitude: -6.163,
    longitude: 35.751,
    population: 2450000,
    areaKm2: 41311,
    riskLevel: 'high',
    riskScore: 73.8,
    basicWaterAccess: 49.2,
    safelyManagedAccess: 21.5,
    waterStressIndex: 3.5,
    groundwaterPotential: 0.32,
    floodRiskScore: 38.4,
    climateVulnerability: 0.66,
    droughtRiskScore: 68.2,
    infrastructureGap: 0.72
  },
  {
    id: 'region-022',
    name: 'Mwanza Region',
    country: 'Tanzania',
    countryCode: 'TZA',
    adminLevel1: 'Mwanza',
    latitude: -2.516,
    longitude: 32.917,
    population: 3120000,
    areaKm2: 19592,
    riskLevel: 'high',
    riskScore: 71.6,
    basicWaterAccess: 52.8,
    safelyManagedAccess: 24.2,
    waterStressIndex: 3.4,
    groundwaterPotential: 0.28,
    floodRiskScore: 52.8,
    climateVulnerability: 0.62,
    droughtRiskScore: 58.6,
    infrastructureGap: 0.69
  },
  {
    id: 'region-023',
    name: 'Sikasso Region',
    country: 'Mali',
    countryCode: 'MLI',
    adminLevel1: 'Sikasso',
    latitude: 11.345,
    longitude: -7.234,
    population: 3250000,
    areaKm2: 71390,
    riskLevel: 'high',
    riskScore: 76.4,
    basicWaterAccess: 45.2,
    safelyManagedAccess: 18.4,
    waterStressIndex: 3.7,
    groundwaterPotential: 0.38,
    floodRiskScore: 48.6,
    climateVulnerability: 0.70,
    droughtRiskScore: 64.2,
    infrastructureGap: 0.75
  },
  {
    id: 'region-024',
    name: 'Mopti Region',
    country: 'Mali',
    countryCode: 'MLI',
    adminLevel1: 'Mopti',
    latitude: 14.456,
    longitude: -4.123,
    population: 2450000,
    areaKm2: 79751,
    riskLevel: 'high',
    riskScore: 79.2,
    basicWaterAccess: 42.6,
    safelyManagedAccess: 16.8,
    waterStressIndex: 3.9,
    groundwaterPotential: 0.28,
    floodRiskScore: 58.4,
    climateVulnerability: 0.74,
    droughtRiskScore: 72.6,
    infrastructureGap: 0.78
  },
  {
    id: 'region-025',
    name: 'Hauts-Bassins',
    country: 'Burkina Faso',
    countryCode: 'BFA',
    adminLevel1: 'Hauts-Bassins',
    latitude: 11.567,
    longitude: -4.345,
    population: 1980000,
    areaKm2: 25669,
    riskLevel: 'high',
    riskScore: 74.8,
    basicWaterAccess: 48.4,
    safelyManagedAccess: 20.2,
    waterStressIndex: 3.6,
    groundwaterPotential: 0.35,
    floodRiskScore: 42.8,
    climateVulnerability: 0.67,
    droughtRiskScore: 66.4,
    infrastructureGap: 0.73
  },
  {
    id: 'region-026',
    name: 'Centre-Nord',
    country: 'Burkina Faso',
    countryCode: 'BFA',
    adminLevel1: 'Centre-Nord',
    latitude: 13.234,
    longitude: -1.567,
    population: 1560000,
    areaKm2: 9645,
    riskLevel: 'high',
    riskScore: 77.4,
    basicWaterAccess: 44.2,
    safelyManagedAccess: 17.6,
    waterStressIndex: 3.8,
    groundwaterPotential: 0.26,
    floodRiskScore: 38.6,
    climateVulnerability: 0.72,
    droughtRiskScore: 74.8,
    infrastructureGap: 0.76
  },
  {
    id: 'region-027',
    name: 'Anosy Region',
    country: 'Madagascar',
    countryCode: 'MDG',
    adminLevel1: 'Anosy',
    latitude: -25.028,
    longitude: 46.987,
    population: 789000,
    areaKm2: 19312,
    riskLevel: 'high',
    riskScore: 78.6,
    basicWaterAccess: 41.8,
    safelyManagedAccess: 15.2,
    waterStressIndex: 3.9,
    groundwaterPotential: 0.22,
    floodRiskScore: 62.4,
    climateVulnerability: 0.76,
    droughtRiskScore: 58.2,
    infrastructureGap: 0.77
  },
  {
    id: 'region-028',
    name: 'Androy Region',
    country: 'Madagascar',
    countryCode: 'MDG',
    adminLevel1: 'Androy',
    latitude: -25.167,
    longitude: 45.234,
    population: 756000,
    areaKm2: 19317,
    riskLevel: 'high',
    riskScore: 80.2,
    basicWaterAccess: 38.4,
    safelyManagedAccess: 12.8,
    waterStressIndex: 4.1,
    groundwaterPotential: 0.15,
    floodRiskScore: 45.6,
    climateVulnerability: 0.82,
    droughtRiskScore: 78.4,
    infrastructureGap: 0.80
  },
  {
    id: 'region-029',
    name: 'Western Province',
    country: 'Kenya',
    countryCode: 'KEN',
    adminLevel1: 'Western',
    latitude: 0.524,
    longitude: 34.456,
    population: 4230000,
    areaKm2: 8285,
    riskLevel: 'high',
    riskScore: 72.4,
    basicWaterAccess: 52.6,
    safelyManagedAccess: 24.8,
    waterStressIndex: 3.4,
    groundwaterPotential: 0.38,
    floodRiskScore: 58.4,
    climateVulnerability: 0.62,
    droughtRiskScore: 52.6,
    infrastructureGap: 0.71
  },
  {
    id: 'region-030',
    name: 'Turkana County',
    country: 'Kenya',
    countryCode: 'KEN',
    adminLevel1: 'Turkana',
    latitude: 3.312,
    longitude: 35.568,
    population: 926000,
    areaKm2: 77218,
    riskLevel: 'high',
    riskScore: 82.6,
    basicWaterAccess: 36.8,
    safelyManagedAccess: 11.2,
    waterStressIndex: 4.2,
    groundwaterPotential: 0.18,
    floodRiskScore: 32.4,
    climateVulnerability: 0.80,
    droughtRiskScore: 86.4,
    infrastructureGap: 0.82
  },

  // Moderate Risk Regions
  {
    id: 'region-031',
    name: 'Ashanti Region',
    country: 'Ghana',
    countryCode: 'GHA',
    adminLevel1: 'Ashanti',
    latitude: 6.745,
    longitude: -1.623,
    population: 5430000,
    areaKm2: 24389,
    riskLevel: 'moderate',
    riskScore: 54.2,
    basicWaterAccess: 68.4,
    safelyManagedAccess: 38.6,
    waterStressIndex: 2.4,
    groundwaterPotential: 0.58,
    floodRiskScore: 42.6,
    climateVulnerability: 0.45,
    droughtRiskScore: 38.4,
    infrastructureGap: 0.52
  },
  {
    id: 'region-032',
    name: 'Northern Region',
    country: 'Ghana',
    countryCode: 'GHA',
    adminLevel1: 'Northern',
    latitude: 9.456,
    longitude: -0.876,
    population: 2890000,
    areaKm2: 70764,
    riskLevel: 'moderate',
    riskScore: 58.6,
    basicWaterAccess: 62.8,
    safelyManagedAccess: 32.4,
    waterStressIndex: 2.8,
    groundwaterPotential: 0.48,
    floodRiskScore: 52.4,
    climateVulnerability: 0.52,
    droughtRiskScore: 48.6,
    infrastructureGap: 0.58
  },
  {
    id: 'region-033',
    name: 'Oueme Department',
    country: 'Benin',
    countryCode: 'BEN',
    adminLevel1: 'Oueme',
    latitude: 6.567,
    longitude: 2.634,
    population: 1230000,
    areaKm2: 1815,
    riskLevel: 'moderate',
    riskScore: 52.8,
    basicWaterAccess: 68.2,
    safelyManagedAccess: 36.8,
    waterStressIndex: 2.3,
    groundwaterPotential: 0.52,
    floodRiskScore: 58.6,
    climateVulnerability: 0.48,
    droughtRiskScore: 32.4,
    infrastructureGap: 0.51
  },
  {
    id: 'region-034',
    name: 'Atlantique Department',
    country: 'Benin',
    countryCode: 'BEN',
    adminLevel1: 'Atlantique',
    latitude: 6.678,
    longitude: 2.234,
    population: 1670000,
    areaKm2: 3008,
    riskLevel: 'moderate',
    riskScore: 54.4,
    basicWaterAccess: 65.8,
    safelyManagedAccess: 34.2,
    waterStressIndex: 2.5,
    groundwaterPotential: 0.48,
    floodRiskScore: 62.4,
    climateVulnerability: 0.46,
    droughtRiskScore: 28.6,
    infrastructureGap: 0.53
  },
  {
    id: 'region-035',
    name: 'Central Region',
    country: 'Uganda',
    countryCode: 'UGA',
    adminLevel1: 'Central',
    latitude: 0.324,
    longitude: 32.567,
    population: 9870000,
    areaKm2: 61454,
    riskLevel: 'moderate',
    riskScore: 56.2,
    basicWaterAccess: 64.6,
    safelyManagedAccess: 32.8,
    waterStressIndex: 2.6,
    groundwaterPotential: 0.52,
    floodRiskScore: 48.6,
    climateVulnerability: 0.48,
    droughtRiskScore: 42.8,
    infrastructureGap: 0.55
  },
  {
    id: 'region-036',
    name: 'Eastern Region',
    country: 'Uganda',
    countryCode: 'UGA',
    adminLevel1: 'Eastern',
    latitude: 1.234,
    longitude: 34.123,
    population: 10500000,
    areaKm2: 39479,
    riskLevel: 'moderate',
    riskScore: 58.8,
    basicWaterAccess: 62.4,
    safelyManagedAccess: 30.2,
    waterStressIndex: 2.8,
    groundwaterPotential: 0.45,
    floodRiskScore: 52.8,
    climateVulnerability: 0.52,
    droughtRiskScore: 48.4,
    infrastructureGap: 0.58
  },
  {
    id: 'region-037',
    name: 'Lusaka Province',
    country: 'Zambia',
    countryCode: 'ZMB',
    adminLevel1: 'Lusaka',
    latitude: -15.456,
    longitude: 28.234,
    population: 3450000,
    areaKm2: 21896,
    riskLevel: 'moderate',
    riskScore: 52.4,
    basicWaterAccess: 68.8,
    safelyManagedAccess: 38.4,
    waterStressIndex: 2.4,
    groundwaterPotential: 0.48,
    floodRiskScore: 38.6,
    climateVulnerability: 0.42,
    droughtRiskScore: 42.4,
    infrastructureGap: 0.51
  },
  {
    id: 'region-038',
    name: 'Copperbelt Province',
    country: 'Zambia',
    countryCode: 'ZMB',
    adminLevel1: 'Copperbelt',
    latitude: -13.034,
    longitude: 27.567,
    population: 2340000,
    areaKm2: 31328,
    riskLevel: 'moderate',
    riskScore: 54.6,
    basicWaterAccess: 66.4,
    safelyManagedAccess: 35.6,
    waterStressIndex: 2.5,
    groundwaterPotential: 0.42,
    floodRiskScore: 42.8,
    climateVulnerability: 0.44,
    droughtRiskScore: 38.6,
    infrastructureGap: 0.54
  },
  {
    id: 'region-039',
    name: 'Kigali Province',
    country: 'Rwanda',
    countryCode: 'RWA',
    adminLevel1: 'Kigali',
    latitude: -1.956,
    longitude: 30.067,
    population: 1560000,
    areaKm2: 730,
    riskLevel: 'moderate',
    riskScore: 48.6,
    basicWaterAccess: 72.4,
    safelyManagedAccess: 42.8,
    waterStressIndex: 2.1,
    groundwaterPotential: 0.55,
    floodRiskScore: 48.6,
    climateVulnerability: 0.38,
    droughtRiskScore: 32.8,
    infrastructureGap: 0.48
  },
  {
    id: 'region-040',
    name: 'Southern Province',
    country: 'Rwanda',
    countryCode: 'RWA',
    adminLevel1: 'Southern',
    latitude: -2.567,
    longitude: 29.678,
    population: 2890000,
    areaKm2: 6118,
    riskLevel: 'moderate',
    riskScore: 52.4,
    basicWaterAccess: 68.6,
    safelyManagedAccess: 38.2,
    waterStressIndex: 2.4,
    groundwaterPotential: 0.52,
    floodRiskScore: 52.4,
    climateVulnerability: 0.42,
    droughtRiskScore: 38.4,
    infrastructureGap: 0.52
  },
  {
    id: 'region-041',
    name: 'Maharashtra Rural',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Maharashtra',
    latitude: 19.234,
    longitude: 73.456,
    population: 62000000,
    areaKm2: 307713,
    riskLevel: 'moderate',
    riskScore: 58.4,
    basicWaterAccess: 64.2,
    safelyManagedAccess: 34.6,
    waterStressIndex: 2.8,
    groundwaterPotential: 0.38,
    floodRiskScore: 42.8,
    climateVulnerability: 0.48,
    droughtRiskScore: 52.4,
    infrastructureGap: 0.56
  },
  {
    id: 'region-042',
    name: 'Karnataka Rural',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Karnataka',
    latitude: 15.345,
    longitude: 75.678,
    population: 52000000,
    areaKm2: 191791,
    riskLevel: 'moderate',
    riskScore: 56.2,
    basicWaterAccess: 66.8,
    safelyManagedAccess: 36.2,
    waterStressIndex: 2.6,
    groundwaterPotential: 0.42,
    floodRiskScore: 38.6,
    climateVulnerability: 0.46,
    droughtRiskScore: 48.6,
    infrastructureGap: 0.54
  },
  {
    id: 'region-043',
    name: 'Bengal Delta Region',
    country: 'Bangladesh',
    countryCode: 'BGD',
    adminLevel1: 'Khulna',
    latitude: 22.845,
    longitude: 89.534,
    population: 15600000,
    areaKm2: 22274,
    riskLevel: 'moderate',
    riskScore: 62.4,
    basicWaterAccess: 58.6,
    safelyManagedAccess: 28.4,
    waterStressIndex: 2.4,
    groundwaterPotential: 0.65,
    floodRiskScore: 88.6,
    climateVulnerability: 0.58,
    droughtRiskScore: 28.4,
    infrastructureGap: 0.62
  },
  {
    id: 'region-044',
    name: 'Chittagong Division',
    country: 'Bangladesh',
    countryCode: 'BGD',
    adminLevel1: 'Chittagong',
    latitude: 22.356,
    longitude: 91.784,
    population: 28900000,
    areaKm2: 34454,
    riskLevel: 'moderate',
    riskScore: 58.6,
    basicWaterAccess: 62.4,
    safelyManagedAccess: 32.6,
    waterStressIndex: 2.2,
    groundwaterPotential: 0.58,
    floodRiskScore: 72.4,
    climateVulnerability: 0.52,
    droughtRiskScore: 32.6,
    infrastructureGap: 0.58
  },
  {
    id: 'region-045',
    name: 'Central Province',
    country: 'Sri Lanka',
    countryCode: 'LKA',
    adminLevel1: 'Central',
    latitude: 7.456,
    longitude: 80.678,
    population: 2680000,
    areaKm2: 5674,
    riskLevel: 'moderate',
    riskScore: 48.2,
    basicWaterAccess: 74.6,
    safelyManagedAccess: 45.8,
    waterStressIndex: 1.8,
    groundwaterPotential: 0.58,
    floodRiskScore: 48.6,
    climateVulnerability: 0.36,
    droughtRiskScore: 28.4,
    infrastructureGap: 0.48
  },
  {
    id: 'region-046',
    name: 'Eastern Province',
    country: 'Sri Lanka',
    countryCode: 'LKA',
    adminLevel1: 'Eastern',
    latitude: 8.234,
    longitude: 81.456,
    population: 1670000,
    areaKm2: 9975,
    riskLevel: 'moderate',
    riskScore: 52.6,
    basicWaterAccess: 68.4,
    safelyManagedAccess: 38.2,
    waterStressIndex: 2.2,
    groundwaterPotential: 0.52,
    floodRiskScore: 58.4,
    climateVulnerability: 0.42,
    droughtRiskScore: 38.6,
    infrastructureGap: 0.52
  },

  // Low Risk Regions
  {
    id: 'region-047',
    name: 'KwaZulu-Natal',
    country: 'South Africa',
    countryCode: 'ZAF',
    adminLevel1: 'KwaZulu-Natal',
    latitude: -28.567,
    longitude: 30.678,
    population: 11500000,
    areaKm2: 94361,
    riskLevel: 'low',
    riskScore: 32.4,
    basicWaterAccess: 82.6,
    safelyManagedAccess: 58.4,
    waterStressIndex: 1.2,
    groundwaterPotential: 0.62,
    floodRiskScore: 38.6,
    climateVulnerability: 0.28,
    droughtRiskScore: 32.4,
    infrastructureGap: 0.32
  },
  {
    id: 'region-048',
    name: 'Western Cape',
    country: 'South Africa',
    countryCode: 'ZAF',
    adminLevel1: 'Western Cape',
    latitude: -33.924,
    longitude: 18.424,
    population: 7120000,
    areaKm2: 129462,
    riskLevel: 'low',
    riskScore: 28.6,
    basicWaterAccess: 88.4,
    safelyManagedAccess: 68.2,
    waterStressIndex: 0.8,
    groundwaterPotential: 0.58,
    floodRiskScore: 28.4,
    climateVulnerability: 0.22,
    droughtRiskScore: 48.6,
    infrastructureGap: 0.28
  },
  {
    id: 'region-049',
    name: 'Gauteng Province',
    country: 'South Africa',
    countryCode: 'ZAF',
    adminLevel1: 'Gauteng',
    latitude: -26.271,
    longitude: 28.112,
    population: 15800000,
    areaKm2: 18178,
    riskLevel: 'low',
    riskScore: 24.8,
    basicWaterAccess: 92.6,
    safelyManagedAccess: 74.8,
    waterStressIndex: 0.6,
    groundwaterPotential: 0.42,
    floodRiskScore: 32.8,
    climateVulnerability: 0.18,
    droughtRiskScore: 28.4,
    infrastructureGap: 0.24
  },
  {
    id: 'region-050',
    name: 'North-West Province',
    country: 'South Africa',
    countryCode: 'ZAF',
    adminLevel1: 'North West',
    latitude: -26.567,
    longitude: 25.678,
    population: 4120000,
    areaKm2: 104882,
    riskLevel: 'low',
    riskScore: 36.2,
    basicWaterAccess: 78.4,
    safelyManagedAccess: 52.6,
    waterStressIndex: 1.4,
    groundwaterPotential: 0.52,
    floodRiskScore: 28.6,
    climateVulnerability: 0.32,
    droughtRiskScore: 42.8,
    infrastructureGap: 0.36
  },
  {
    id: 'region-051',
    name: 'Tamil Nadu',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Tamil Nadu',
    latitude: 11.127,
    longitude: 78.657,
    population: 78000000,
    areaKm2: 130058,
    riskLevel: 'low',
    riskScore: 38.4,
    basicWaterAccess: 76.8,
    safelyManagedAccess: 48.6,
    waterStressIndex: 1.6,
    groundwaterPotential: 0.48,
    floodRiskScore: 42.6,
    climateVulnerability: 0.32,
    droughtRiskScore: 38.4,
    infrastructureGap: 0.38
  },
  {
    id: 'region-052',
    name: 'Kerala',
    country: 'India',
    countryCode: 'IND',
    adminLevel1: 'Kerala',
    latitude: 10.356,
    longitude: 76.542,
    population: 35600000,
    areaKm2: 38863,
    riskLevel: 'low',
    riskScore: 28.6,
    basicWaterAccess: 86.4,
    safelyManagedAccess: 62.8,
    waterStressIndex: 0.8,
    groundwaterPotential: 0.72,
    floodRiskScore: 58.4,
    climateVulnerability: 0.22,
    droughtRiskScore: 22.8,
    infrastructureGap: 0.28
  },
  {
    id: 'region-053',
    name: 'Greater Accra',
    country: 'Ghana',
    countryCode: 'GHA',
    adminLevel1: 'Greater Accra',
    latitude: 5.567,
    longitude: -0.234,
    population: 5450000,
    areaKm2: 3245,
    riskLevel: 'low',
    riskScore: 34.2,
    basicWaterAccess: 82.4,
    safelyManagedAccess: 56.8,
    waterStressIndex: 1.4,
    groundwaterPotential: 0.48,
    floodRiskScore: 48.6,
    climateVulnerability: 0.26,
    droughtRiskScore: 28.4,
    infrastructureGap: 0.34
  },
  {
    id: 'region-054',
    name: 'Abidjan District',
    country: "Cote d'Ivoire",
    countryCode: 'CIV',
    adminLevel1: 'Abidjan',
    latitude: 5.345,
    longitude: -4.024,
    population: 5670000,
    areaKm2: 2119,
    riskLevel: 'low',
    riskScore: 32.6,
    basicWaterAccess: 84.2,
    safelyManagedAccess: 58.4,
    waterStressIndex: 1.2,
    groundwaterPotential: 0.62,
    floodRiskScore: 52.8,
    climateVulnerability: 0.24,
    droughtRiskScore: 22.6,
    infrastructureGap: 0.32
  },
  {
    id: 'region-055',
    name: 'Littoral Region',
    country: 'Cameroon',
    countryCode: 'CMR',
    adminLevel1: 'Littoral',
    latitude: 4.056,
    longitude: 9.784,
    population: 3560000,
    areaKm2: 20249,
    riskLevel: 'low',
    riskScore: 36.8,
    basicWaterAccess: 78.6,
    safelyManagedAccess: 52.4,
    waterStressIndex: 1.4,
    groundwaterPotential: 0.68,
    floodRiskScore: 48.6,
    climateVulnerability: 0.28,
    droughtRiskScore: 24.8,
    infrastructureGap: 0.36
  },
  {
    id: 'region-056',
    name: 'Centre Region',
    country: 'Cameroon',
    countryCode: 'CMR',
    adminLevel1: 'Centre',
    latitude: 4.234,
    longitude: 11.567,
    population: 4230000,
    areaKm2: 68953,
    riskLevel: 'low',
    riskScore: 38.4,
    basicWaterAccess: 76.4,
    safelyManagedAccess: 48.6,
    waterStressIndex: 1.6,
    groundwaterPotential: 0.58,
    floodRiskScore: 42.8,
    climateVulnerability: 0.30,
    droughtRiskScore: 28.6,
    infrastructureGap: 0.38
  }
];

// Calculate global metrics from regions data
export function calculateGlobalMetrics(): GlobalMetrics {
  const critical = regions.filter(r => r.riskLevel === 'critical').length;
  const high = regions.filter(r => r.riskLevel === 'high').length;
  const moderate = regions.filter(r => r.riskLevel === 'moderate').length;
  const low = regions.filter(r => r.riskLevel === 'low').length;

  const totalPopAtRisk = regions
    .filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high')
    .reduce((sum, r) => sum + r.population, 0);

  const avgWaterStress = regions.reduce((sum, r) => sum + r.waterStressIndex, 0) / regions.length;
  const avgFloodRisk = regions.reduce((sum, r) => sum + r.floodRiskScore, 0) / regions.length;
  const avgDroughtRisk = regions.reduce((sum, r) => sum + r.droughtRiskScore, 0) / regions.length;

  return {
    totalRegions: regions.length,
    criticalRegions: critical,
    highRiskRegions: high,
    moderateRiskRegions: moderate,
    lowRiskRegions: low,
    totalPopulationAtRisk: totalPopAtRisk,
    avgWaterStress: Number(avgWaterStress.toFixed(2)),
    avgFloodRisk: Number(avgFloodRisk.toFixed(2)),
    avgDroughtRisk: Number(avgDroughtRisk.toFixed(2))
  };
}

// Get top at-risk regions
export function getTopAtRiskRegions(limit: number = 10): Region[] {
  return [...regions]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

// Get regions by risk level
export function getRegionsByRiskLevel(level: RiskLevel): Region[] {
  return regions.filter(r => r.riskLevel === level);
}

// Risk distribution data for charts
export function getRiskDistribution() {
  return [
    { level: 'Critical', count: regions.filter(r => r.riskLevel === 'critical').length, color: '#dc2626' },
    { level: 'High', count: regions.filter(r => r.riskLevel === 'high').length, color: '#ea580c' },
    { level: 'Moderate', count: regions.filter(r => r.riskLevel === 'moderate').length, color: '#ca8a04' },
    { level: 'Low', count: regions.filter(r => r.riskLevel === 'low').length, color: '#16a34a' }
  ];
}

// Generate simulation results
export function generateSimulationResult(
  budget: number,
  timeHorizon: number,
  regionFilter?: string
): SimulationResult {
  const targetRegions = regionFilter
    ? regions.filter(r => r.riskLevel === regionFilter || r.id === regionFilter)
    : getTopAtRiskRegions(20);

  const avgCostPerPerson = 45; // USD
  const totalPopulationServed = Math.floor((budget / avgCostPerPerson) * 0.85);
  const projectedImprovement = Number((budget / 10000000 * 2.5 * timeHorizon).toFixed(1));

  return {
    allocationBreakdown: [
      {
        interventionType: 'Borehole Wells',
        amount: budget * 0.35,
        percentage: 35,
        regionsImpacted: Math.floor(targetRegions.length * 0.8),
        populationServed: Math.floor(totalPopulationServed * 0.35)
      },
      {
        interventionType: 'Rainwater Harvesting',
        amount: budget * 0.20,
        percentage: 20,
        regionsImpacted: Math.floor(targetRegions.length * 0.6),
        populationServed: Math.floor(totalPopulationServed * 0.20)
      },
      {
        interventionType: 'Water Treatment Systems',
        amount: budget * 0.18,
        percentage: 18,
        regionsImpacted: Math.floor(targetRegions.length * 0.5),
        populationServed: Math.floor(totalPopulationServed * 0.18)
      },
      {
        interventionType: 'Pipeline Extension',
        amount: budget * 0.15,
        percentage: 15,
        regionsImpacted: Math.floor(targetRegions.length * 0.4),
        populationServed: Math.floor(totalPopulationServed * 0.15)
      },
      {
        interventionType: 'Capacity Building',
        amount: budget * 0.12,
        percentage: 12,
        regionsImpacted: targetRegions.length,
        populationServed: Math.floor(totalPopulationServed * 0.12)
      }
    ],
    projectedImpact: {
      waterAccessIncrease: projectedImprovement,
      populationServed: totalPopulationServed,
      sustainabilityScore: Number((0.72 + timeHorizon * 0.04).toFixed(2)),
      costPerPerson: avgCostPerPerson
    },
    costEffectivenessRanking: targetRegions.slice(0, 10).map((region, index) => ({
      regionId: region.id,
      regionName: `${region.name}, ${region.country}`,
      impactScore: Number((95 - index * 5 + Math.random() * 3).toFixed(1)),
      costEfficiency: Number((0.8 + Math.random() * 0.15).toFixed(2))
    }))
  };
}

// Generate AI recommendation for a region
export function generateRecommendation(regionId: string): Recommendation | null {
  const region = regions.find(r => r.id === regionId);
  if (!region) return null;

  const budgetEstimate = Math.floor(region.population * 0.01 * region.infrastructureGap * 100);

  return {
    regionId: region.id,
    executiveSummary: `${region.name} faces critical water access challenges with only ${region.basicWaterAccess.toFixed(1)}% of the population having basic water access. The region's water stress index of ${region.waterStressIndex.toFixed(1)}/5.0 and drought risk score of ${region.droughtRiskScore.toFixed(1)}/100 indicate severe climate vulnerability. Immediate intervention is required to prevent humanitarian crisis and achieve SDG 6 targets by 2030.`,
    prioritizedActions: [
      {
        priority: 1,
        action: 'Emergency Water Point Construction',
        impact: 'Immediate access for 50,000+ people',
        estimatedCost: budgetEstimate * 0.25,
        timeline: '6 months'
      },
      {
        priority: 2,
        action: 'Groundwater Assessment & Borehole Drilling',
        impact: 'Long-term sustainable water source',
        estimatedCost: budgetEstimate * 0.30,
        timeline: '12 months'
      },
      {
        priority: 3,
        action: 'Rainwater Harvesting Infrastructure',
        impact: 'Climate-resilient water storage',
        estimatedCost: budgetEstimate * 0.15,
        timeline: '9 months'
      },
      {
        priority: 4,
        action: 'Community Water Management Training',
        impact: 'Sustainable operations & maintenance',
        estimatedCost: budgetEstimate * 0.10,
        timeline: 'Ongoing'
      },
      {
        priority: 5,
        action: 'Water Quality Monitoring System',
        impact: 'Health risk reduction',
        estimatedCost: budgetEstimate * 0.08,
        timeline: '6 months'
      }
    ],
    budgetBreakdown: [
      { category: 'Infrastructure', amount: budgetEstimate * 0.55, percentage: 55 },
      { category: 'Capacity Building', amount: budgetEstimate * 0.18, percentage: 18 },
      { category: 'Monitoring & Evaluation', amount: budgetEstimate * 0.12, percentage: 12 },
      { category: 'Emergency Response', amount: budgetEstimate * 0.10, percentage: 10 },
      { category: 'Contingency', amount: budgetEstimate * 0.05, percentage: 5 }
    ],
    riskFactors: [
      {
        factor: 'Climate Variability',
        severity: region.climateVulnerability > 0.7 ? 'high' : region.climateVulnerability > 0.4 ? 'medium' : 'low',
        mitigation: 'Implement climate-resilient water sources and storage systems'
      },
      {
        factor: 'Infrastructure Sustainability',
        severity: region.infrastructureGap > 0.7 ? 'high' : region.infrastructureGap > 0.4 ? 'medium' : 'low',
        mitigation: 'Establish community ownership and maintenance protocols'
      },
      {
        factor: 'Groundwater Depletion',
        severity: region.groundwaterPotential < 0.3 ? 'high' : region.groundwaterPotential < 0.5 ? 'medium' : 'low',
        mitigation: 'Regular aquifer monitoring and sustainable extraction rates'
      },
      {
        factor: 'Political Instability',
        severity: region.riskScore > 85 ? 'high' : region.riskScore > 60 ? 'medium' : 'low',
        mitigation: 'Partner with local organizations and maintain contingency plans'
      }
    ],
    sdg6Alignment: [
      {
        target: '6.1 - Safe and Affordable Drinking Water',
        currentStatus: `${region.basicWaterAccess.toFixed(1)}% basic access`,
        projectedImprovement: `${(region.basicWaterAccess + 15).toFixed(1)}% by Year 3`
      },
      {
        target: '6.2 - Sanitation and Hygiene',
        currentStatus: `${(region.basicWaterAccess * 0.7).toFixed(1)}% basic sanitation`,
        projectedImprovement: `${(region.basicWaterAccess * 0.7 + 12).toFixed(1)}% by Year 3`
      },
      {
        target: '6.3 - Water Quality',
        currentStatus: 'Limited monitoring capacity',
        projectedImprovement: 'Full coverage monitoring system'
      },
      {
        target: '6.4 - Water Use Efficiency',
        currentStatus: `Stress index: ${region.waterStressIndex.toFixed(1)}/5.0`,
        projectedImprovement: `Target: ${(region.waterStressIndex * 0.8).toFixed(1)}/5.0`
      },
      {
        target: '6.a - International Cooperation',
        currentStatus: 'Coordinating with UN Water',
        projectedImprovement: 'Expand partnerships with WASH organizations'
      }
    ]
  };
}
