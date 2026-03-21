"""
Pydantic models for AquaSDG ML Service API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"


class InterventionType(str, Enum):
    BOREHOLE = "borehole"
    RAINWATER_HARVESTING = "rainwater_harvesting"
    SURFACE_WATER_TREATMENT = "surface_water_treatment"
    MANAGED_AQUIFER_RECHARGE = "managed_aquifer_recharge"
    PIPED_WATER_EXTENSION = "piped_water_extension"
    DESALINATION = "desalination"


class Coordinates(BaseModel):
    lat: float
    lng: float


class WaterAccess(BaseModel):
    safely_managed_pct: float = Field(..., ge=0, le=100)
    basic_pct: float = Field(..., ge=0, le=100)
    limited_pct: float = Field(..., ge=0, le=100)
    unimproved_pct: float = Field(..., ge=0, le=100)
    surface_water_pct: float = Field(..., ge=0, le=100)


class Region(BaseModel):
    id: str
    name: str
    country: str
    region_type: str
    coordinates: Coordinates
    population: int
    water_access: WaterAccess
    water_stress_index: float = Field(..., ge=0, le=1)
    flood_risk_score: float = Field(..., ge=0, le=1)
    drought_risk_score: float = Field(..., ge=0, le=1)
    climate_vulnerability: float = Field(..., ge=0, le=1)
    infrastructure_gap: float = Field(..., ge=0, le=1)
    groundwater_potential: str = Field(..., pattern="^(low|moderate|high)$")
    annual_rainfall_mm: float
    near_water_body: bool
    coastal: bool
    population_density: float


class RegionSummary(BaseModel):
    id: str
    name: str
    country: str
    region_type: str
    coordinates: Coordinates
    population: int
    risk_level: RiskLevel
    composite_risk_score: float
    water_access_pct: float
    flood_risk_score: float
    water_stress_index: float
    drought_risk_score: float
    climate_vulnerability: float
    infrastructure_gap: float
    sanitation_pct: float
    policy_index: float


class RiskPredictionRequest(BaseModel):
    region_id: str
    water_stress_index: Optional[float] = None
    flood_risk_score: Optional[float] = None
    climate_vulnerability: Optional[float] = None
    infrastructure_gap: Optional[float] = None
    safely_managed_pct: Optional[float] = None


class RiskPredictionResponse(BaseModel):
    region_id: str
    risk_level: RiskLevel
    composite_risk_score: float
    risk_factors: Dict[str, float]
    recommendation: str


class InterventionRecommendation(BaseModel):
    intervention_type: InterventionType
    name: str
    description: str
    suitability_score: float = Field(..., ge=0, le=1)
    estimated_cost_min: float
    estimated_cost_max: float
    population_served_min: int
    population_served_max: int
    reliability_score: float
    justification: str


class InterventionRequest(BaseModel):
    region_id: str
    budget_limit: Optional[float] = None
    priority_interventions: Optional[List[InterventionType]] = None


class InterventionResponse(BaseModel):
    region_id: str
    region_name: str
    country: str
    recommendations: List[InterventionRecommendation]


class SimulationAllocation(BaseModel):
    region_id: str
    region_name: str
    intervention_type: InterventionType
    allocation_amount: float
    estimated_population_served: int
    cost_effectiveness: float


class SimulationRequest(BaseModel):
    total_budget: float = Field(..., gt=0)
    time_horizon_years: int = Field(default=5, ge=1, le=20)
    target_regions: List[str]
    priority: str = Field(default="population", pattern="^(population|cost_effectiveness|sustainability)$")
    include_maintenance: bool = Field(default=True)


class SimulationResponse(BaseModel):
    total_budget: float
    time_horizon_years: int
    allocation: List[SimulationAllocation]
    total_population_served: int
    average_cost_per_person: float
    sustainability_score: float = Field(..., ge=0, le=100)
    impact_summary: Dict[str, Any]
    recommendations: List[str]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    regions_loaded: int
    groundsource_records_total: Optional[int] = None
    uptime_seconds: float


class GroundsourceRecord(BaseModel):
    record_index: int
    geometry_summary: str
    area_km2: float
    start_date: str
    end_date: str


class GroundsourceStats(BaseModel):
    total_records: int
    file_size_mb: float
    columns: List[str]
    sample_records: List[Dict[str, Any]]


class RegionInsight(BaseModel):
    type: str
    label: str
    value: str
    description: str
    impact_level: str # low, moderate, high, critical
    icon: str


class RegionCorrelation(BaseModel):
    factor_a: str
    factor_b: str
    relationship: str
    strength: float # 0 to 1
    description: str


class DeepInsightsResponse(BaseModel):
    region_id: str
    timestamp: str
    insights: List[RegionInsight]
    correlations: List[RegionCorrelation]
    resilience_score: float
    confidence_score: float


class ErrorResponse(BaseModel):
    error: str
    detail: str
    region_id: Optional[str] = None
