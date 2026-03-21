"""
Intervention Recommendation Module for AquaSDG
Recommends water interventions based on region characteristics
"""
from typing import Dict, List, Tuple
from dataclasses import dataclass
from models import InterventionType, InterventionRecommendation
from data import COST_BENCHMARKS, INTERVENTION_TYPES


@dataclass
class InterventionScore:
    """Score for an intervention's suitability for a region"""
    intervention_type: InterventionType
    suitability_score: float
    justification: str
    estimated_cost_min: float
    estimated_cost_max: float
    population_served_min: int
    population_served_max: int


class InterventionRecommender:
    """
    Recommends water interventions based on region characteristics.
    
    Intervention Types:
    - Borehole/Groundwater Wells: High groundwater potential, low flood risk
    - Rainwater Harvesting: Moderate rainfall, small communities
    - Surface Water Treatment: Near rivers/lakes, moderate water stress
    - Managed Aquifer Recharge: High flood risk, good groundwater storage
    - Piped Water Extension: Near existing infrastructure, high population density
    - Desalination: Coastal regions, high water stress
    """
    
    @staticmethod
    def calculate_borehole_suitability(region: Dict) -> Tuple[float, str]:
        """
        Calculate suitability for borehole/groundwater wells.
        Best for: High groundwater potential, low flood risk
        """
        score = 0.0
        justifications = []
        
        # Groundwater potential assessment
        gw_potential = region.get("groundwater_potential", "low")
        if gw_potential == "high":
            score += 0.35
            justifications.append("Excellent groundwater potential")
        elif gw_potential == "moderate":
            score += 0.20
            justifications.append("Moderate groundwater potential")
        else:
            score -= 0.20
            justifications.append("Limited groundwater potential - high drilling costs expected")
        
        # Flood risk assessment (lower is better for boreholes)
        flood_risk = region.get("flood_risk_score", 0)
        if flood_risk < 0.3:
            score += 0.25
            justifications.append("Low flood risk - wells will remain accessible")
        elif flood_risk > 0.6:
            score -= 0.15
            justifications.append("High flood risk - wells may be contaminated during floods")
        
        # Drought risk (boreholes are resilient)
        drought_risk = region.get("drought_risk_score", 0)
        if drought_risk > 0.5:
            score += 0.15
            justifications.append("Boreholes provide drought resilience")
        
        # Population density (suitable for rural areas)
        pop_density = region.get("population_density", 0)
        if pop_density < 100:
            score += 0.15
            justifications.append("Well-suited for rural/low-density population")
        elif pop_density > 500:
            score -= 0.10
            justifications.append("Higher density may require multiple wells")
        
        # Water stress (boreholes help)
        water_stress = region.get("water_stress_index", 0)
        if water_stress > 0.6:
            score += 0.10
            justifications.append("Addresses high water stress")
        
        return max(0, min(1, score)), "; ".join(justifications) if justifications else "Standard suitability"
    
    @staticmethod
    def calculate_rainwater_suitability(region: Dict) -> Tuple[float, str]:
        """
        Calculate suitability for rainwater harvesting.
        Best for: Moderate rainfall, small communities
        """
        score = 0.0
        justifications = []
        
        # Rainfall assessment
        rainfall = region.get("annual_rainfall_mm", 0)
        if rainfall >= 800:
            score += 0.30
            justifications.append(f"Good annual rainfall ({rainfall}mm) for collection")
        elif rainfall >= 400:
            score += 0.15
            justifications.append(f"Moderate rainfall ({rainfall}mm) - seasonal collection possible")
        else:
            score -= 0.25
            justifications.append(f"Low rainfall ({rainfall}mm) - not sufficient for reliable harvesting")
        
        # Population/Community size
        pop_density = region.get("population_density", 0)
        if pop_density < 100:
            score += 0.25
            justifications.append("Ideal for small, dispersed communities")
        elif pop_density > 300:
            score -= 0.15
            justifications.append("Higher density requires extensive infrastructure")
        
        # Water stress
        water_stress = region.get("water_stress_index", 0)
        if water_stress > 0.4:
            score += 0.15
            justifications.append("Provides supplementary water during stress periods")
        
        # Flood risk (helps manage excess water)
        flood_risk = region.get("flood_risk_score", 0)
        if flood_risk > 0.5:
            score += 0.10
            justifications.append("Can help manage floodwater")
        
        # Climate vulnerability
        climate_vuln = region.get("climate_vulnerability", 0)
        if climate_vuln > 0.6:
            score += 0.10
            justifications.append("Builds climate resilience")
        
        return max(0, min(1, score)), "; ".join(justifications) if justifications else "Standard suitability"
    
    @staticmethod
    def calculate_surface_water_suitability(region: Dict) -> Tuple[float, str]:
        """
        Calculate suitability for surface water treatment.
        Best for: Near rivers/lakes, moderate water stress
        """
        score = 0.0
        justifications = []
        
        # Proximity to water body
        near_water = region.get("near_water_body", False)
        if near_water:
            score += 0.35
            justifications.append("Located near water body - source available")
        else:
            score -= 0.30
            justifications.append("No nearby surface water source")
        
        # Water stress (should be moderate)
        water_stress = region.get("water_stress_index", 0)
        if water_stress < 0.5:
            score += 0.20
            justifications.append("Low water stress - sustainable abstraction possible")
        elif water_stress > 0.7:
            score -= 0.15
            justifications.append("High water stress - may affect source reliability")
        
        # Population (better for larger communities)
        pop_density = region.get("population_density", 0)
        if pop_density > 100:
            score += 0.20
            justifications.append("Population density justifies treatment infrastructure")
        
        # Flood risk (needs protection)
        flood_risk = region.get("flood_risk_score", 0)
        if flood_risk < 0.4:
            score += 0.10
            justifications.append("Low flood risk - treatment plant stability")
        elif flood_risk > 0.7:
            score -= 0.10
            justifications.append("High flood risk - requires elevated infrastructure")
        
        return max(0, min(1, score)), "; ".join(justifications) if justifications else "Standard suitability"
    
    @staticmethod
    def calculate_mar_suitability(region: Dict) -> Tuple[float, str]:
        """
        Calculate suitability for Managed Aquifer Recharge.
        Best for: High flood risk, good groundwater storage
        """
        score = 0.0
        justifications = []
        
        # Flood risk (higher is better for MAR)
        flood_risk = region.get("flood_risk_score", 0)
        if flood_risk > 0.6:
            score += 0.35
            justifications.append("High flood risk - MAR can capture excess water")
        elif flood_risk > 0.3:
            score += 0.15
            justifications.append("Moderate flood risk - MAR provides flood mitigation")
        else:
            score -= 0.10
            justifications.append("Low flood risk - limited floodwater to capture")
        
        # Groundwater potential
        gw_potential = region.get("groundwater_potential", "low")
        if gw_potential == "high":
            score += 0.30
            justifications.append("Good aquifer storage capacity")
        elif gw_potential == "moderate":
            score += 0.15
            justifications.append("Moderate aquifer storage capacity")
        else:
            score -= 0.20
            justifications.append("Limited aquifer storage potential")
        
        # Rainfall
        rainfall = region.get("annual_rainfall_mm", 0)
        if rainfall > 1000:
            score += 0.15
            justifications.append(f"High rainfall ({rainfall}mm) provides recharge water")
        
        # Drought risk (MAR helps)
        drought_risk = region.get("drought_risk_score", 0)
        if drought_risk > 0.5:
            score += 0.15
            justifications.append("Provides drought buffer through stored groundwater")
        
        return max(0, min(1, score)), "; ".join(justifications) if justifications else "Standard suitability"
    
    @staticmethod
    def calculate_piped_water_suitability(region: Dict) -> Tuple[float, str]:
        """
        Calculate suitability for piped water extension.
        Best for: Near existing infrastructure, high population density
        """
        score = 0.0
        justifications = []
        
        # Current infrastructure
        infra_gap = region.get("infrastructure_gap", 1)
        if infra_gap < 0.4:
            score += 0.30
            justifications.append("Existing infrastructure nearby - extension feasible")
        elif infra_gap > 0.7:
            score -= 0.20
            justifications.append("Significant infrastructure gap - requires major investment")
        
        # Population density
        pop_density = region.get("population_density", 0)
        if pop_density > 300:
            score += 0.30
            justifications.append(f"High population density ({pop_density}/km²) - cost-effective")
        elif pop_density < 50:
            score -= 0.25
            justifications.append("Low population density - high per-capita cost")
        
        # Current water access
        safely_managed = region.get("water_access", {}).get("safely_managed_pct", 0)
        if safely_managed > 30:
            score += 0.15
            justifications.append("Existing managed water points - extend network")
        
        # Urban/peri-urban
        region_type = region.get("region_type", "")
        if "urban" in region_type.lower():
            score += 0.15
            justifications.append("Urban area - piped supply is appropriate")
        
        return max(0, min(1, score)), "; ".join(justifications) if justifications else "Standard suitability"
    
    @staticmethod
    def calculate_desalination_suitability(region: Dict) -> Tuple[float, str]:
        """
        Calculate suitability for desalination.
        Best for: Coastal regions, high water stress
        """
        score = 0.0
        justifications = []
        
        # Must be coastal
        coastal = region.get("coastal", False)
        if not coastal:
            return 0.0, "Not applicable - region is not coastal"
        
        score += 0.25
        justifications.append("Coastal location - seawater available")
        
        # Water stress
        water_stress = region.get("water_stress_index", 0)
        if water_stress > 0.6:
            score += 0.25
            justifications.append("High water stress - alternative source needed")
        elif water_stress < 0.3:
            score -= 0.10
            justifications.append("Low water stress - cheaper alternatives available")
        
        # Population
        population = region.get("population", 0)
        if population > 500000:
            score += 0.20
            justifications.append(f"Large population ({population:,}) - economies of scale")
        elif population < 50000:
            score -= 0.15
            justifications.append("Small population - high per-capita cost")
        
        # Groundwater potential (lower is better for desalination consideration)
        gw_potential = region.get("groundwater_potential", "moderate")
        if gw_potential == "low":
            score += 0.15
            justifications.append("Limited groundwater - desalination fills gap")
        
        # Urban setting
        region_type = region.get("region_type", "")
        if "urban" in region_type.lower():
            score += 0.10
            justifications.append("Urban area - demand concentration supports investment")
        
        return max(0, min(1, score)), "; ".join(justifications) if justifications else "Standard suitability"
    
    @classmethod
    def evaluate_all_interventions(cls, region: Dict) -> List[InterventionScore]:
        """
        Evaluate all intervention types for a region.
        """
        scores = []
        
        # Borehole
        score, justification = cls.calculate_borehole_suitability(region)
        costs = COST_BENCHMARKS["borehole"]
        scores.append(InterventionScore(
            intervention_type=InterventionType.BOREHOLE,
            suitability_score=score,
            justification=justification,
            estimated_cost_min=costs["min_cost"],
            estimated_cost_max=costs["max_cost"],
            population_served_min=costs["min_population_served"],
            population_served_max=costs["max_population_served"]
        ))
        
        # Rainwater Harvesting
        score, justification = cls.calculate_rainwater_suitability(region)
        costs = COST_BENCHMARKS["rainwater_harvesting"]
        population = region.get("population", 0)
        pop_density = region.get("population_density", 0)
        area_km2 = population / pop_density if pop_density > 0 else 1
        households = population / costs["avg_household_size"]
        scores.append(InterventionScore(
            intervention_type=InterventionType.RAINWATER_HARVESTING,
            suitability_score=score,
            justification=justification,
            estimated_cost_min=costs["min_cost_per_household"] * households * 0.1,  # 10% adoption
            estimated_cost_max=costs["max_cost_per_household"] * households * 0.3,  # 30% adoption
            population_served_min=int(households * costs["avg_household_size"] * 0.1),
            population_served_max=int(households * costs["avg_household_size"] * 0.3)
        ))
        
        # Surface Water Treatment
        score, justification = cls.calculate_surface_water_suitability(region)
        costs = COST_BENCHMARKS["surface_water_treatment"]
        scores.append(InterventionScore(
            intervention_type=InterventionType.SURFACE_WATER_TREATMENT,
            suitability_score=score,
            justification=justification,
            estimated_cost_min=costs["min_cost"],
            estimated_cost_max=costs["max_cost"],
            population_served_min=costs["min_population_served"],
            population_served_max=costs["max_population_served"]
        ))
        
        # Managed Aquifer Recharge
        score, justification = cls.calculate_mar_suitability(region)
        costs = COST_BENCHMARKS["managed_aquifer_recharge"]
        scores.append(InterventionScore(
            intervention_type=InterventionType.MANAGED_AQUIFER_RECHARGE,
            suitability_score=score,
            justification=justification,
            estimated_cost_min=costs["min_cost"],
            estimated_cost_max=costs["max_cost"],
            population_served_min=costs["min_population_served"],
            population_served_max=costs["max_population_served"]
        ))
        
        # Piped Water Extension
        score, justification = cls.calculate_piped_water_suitability(region)
        costs = COST_BENCHMARKS["piped_water_extension"]
        # Estimate based on population and infrastructure gap
        infra_gap = region.get("infrastructure_gap", 1)
        population = region.get("population", 0)
        piped_length_km = (population / 1000) * infra_gap * 10  # Rough estimate
        connection_cost = costs["connection_cost_min"] * population * 0.3
        scores.append(InterventionScore(
            intervention_type=InterventionType.PIPED_WATER_EXTENSION,
            suitability_score=score,
            justification=justification,
            estimated_cost_min=piped_length_km * costs["cost_per_meter_min"] * 1000 + connection_cost,
            estimated_cost_max=piped_length_km * costs["cost_per_meter_max"] * 1000 + connection_cost * 2,
            population_served_min=int(population * 0.3),
            population_served_max=int(population * 0.7)
        ))
        
        # Desalination
        score, justification = cls.calculate_desalination_suitability(region)
        costs = COST_BENCHMARKS["desalination"]
        if region.get("coastal", False):
            daily_capacity_m3 = region.get("population", 0) * 0.05  # 50 liters per person
            scores.append(InterventionScore(
                intervention_type=InterventionType.DESALINATION,
                suitability_score=score,
                justification=justification,
                estimated_cost_min=costs["capital_cost_per_m3_day"] * daily_capacity_m3 * 0.5,
                estimated_cost_max=costs["capital_cost_per_m3_day"] * daily_capacity_m3 * 1.5,
                population_served_min=costs["min_population_served"],
                population_served_max=int(daily_capacity_m3 * 20)  # 20 liters per person
            ))
        else:
            scores.append(InterventionScore(
                intervention_type=InterventionType.DESALINATION,
                suitability_score=0.0,
                justification=justification,
                estimated_cost_min=0,
                estimated_cost_max=0,
                population_served_min=0,
                population_served_max=0
            ))
        
        # Sort by suitability score
        scores.sort(key=lambda x: x.suitability_score, reverse=True)
        return scores


def get_intervention_recommendations(
    region: Dict,
    budget_limit: float = None,
    priority_interventions: List[InterventionType] = None
) -> List[InterventionRecommendation]:
    """
    Get intervention recommendations for a region.
    
    Args:
        region: Region data dictionary
        budget_limit: Optional budget constraint
        priority_interventions: Optional list of preferred intervention types
        
    Returns:
        List of intervention recommendations sorted by suitability
    """
    scores = InterventionRecommender.evaluate_all_interventions(region)
    
    recommendations = []
    for score in scores:
        # Filter by priority if specified
        if priority_interventions and score.intervention_type not in priority_interventions:
            continue
        
        # Filter by budget if specified
        if budget_limit and score.estimated_cost_min > budget_limit:
            continue
        
        intervention_info = INTERVENTION_TYPES.get(score.intervention_type.value, {})
        
        recommendations.append(InterventionRecommendation(
            intervention_type=score.intervention_type,
            name=intervention_info.get("name", score.intervention_type.value),
            description=intervention_info.get("description", ""),
            suitability_score=score.suitability_score,
            estimated_cost_min=score.estimated_cost_min,
            estimated_cost_max=score.estimated_cost_max,
            population_served_min=score.population_served_min,
            population_served_max=score.population_served_max,
            reliability_score=intervention_info.get("reliability_score", 0.5),
            justification=score.justification
        ))
    
    return recommendations
