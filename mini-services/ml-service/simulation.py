"""
Budget Simulation Engine for AquaSDG
Optimizes allocation across interventions and calculates projected impact
"""
from typing import Dict, List, Tuple
from dataclasses import dataclass
import math
from models import SimulationAllocation, SimulationResponse, InterventionType
from data import COST_BENCHMARKS
from classifier import RiskClassifier
from interventions import InterventionRecommender


@dataclass
class AllocationCandidate:
    """Candidate allocation for optimization"""
    region_id: str
    region_name: str
    intervention_type: InterventionType
    cost: float
    population_served: int
    cost_effectiveness: float
    suitability_score: float
    risk_priority: float


class BudgetSimulationEngine:
    """
    Simulates budget allocation and impact for water interventions.
    
    Optimization priorities:
    - population: Maximize population served
    - cost_effectiveness: Maximize cost-effectiveness ratio
    - sustainability: Balance impact with long-term sustainability
    """
    
    def __init__(self, regions_data: Dict[str, Dict]):
        """
        Initialize with regions data.
        
        Args:
            regions_data: Dictionary mapping region_id to region data
        """
        self.regions_data = regions_data
    
    def get_maintenance_cost(self, intervention_type: InterventionType, capital_cost: float) -> float:
        """
        Calculate annual maintenance cost for an intervention.
        """
        type_key = intervention_type.value
        if type_key in COST_BENCHMARKS:
            maintenance_pct = COST_BENCHMARKS[type_key].get("maintenance_annual_pct", 0.05)
            return capital_cost * maintenance_pct
        return capital_cost * 0.05
    
    def calculate_population_impact(
        self,
        region: Dict,
        intervention_type: InterventionType,
        budget_allocation: float
    ) -> Tuple[int, float]:
        """
        Calculate population served and cost-effectiveness for an allocation.
        
        Returns:
            Tuple of (population_served, cost_per_person)
        """
        type_key = intervention_type.value
        costs = COST_BENCHMARKS.get(type_key, {})
        
        if not costs:
            return 0, float('inf')
        
        if intervention_type == InterventionType.BOREHOLE:
            # Calculate number of boreholes that can be funded
            avg_cost = (costs["min_cost"] + costs["max_cost"]) / 2
            num_boreholes = budget_allocation // avg_cost
            avg_pop_per_borehole = (costs["min_population_served"] + costs["max_population_served"]) / 2
            population_served = int(num_boreholes * avg_pop_per_borehole)
            
        elif intervention_type == InterventionType.RAINWATER_HARVESTING:
            avg_cost_per_household = (costs["min_cost_per_household"] + costs["max_cost_per_household"]) / 2
            num_households = budget_allocation // avg_cost_per_household
            population_served = int(num_households * costs["avg_household_size"])
            
        elif intervention_type == InterventionType.SURFACE_WATER_TREATMENT:
            avg_cost = (costs["min_cost"] + costs["max_cost"]) / 2
            num_plants = budget_allocation // avg_cost
            avg_pop_per_plant = (costs["min_population_served"] + costs["max_population_served"]) / 2
            population_served = int(num_plants * avg_pop_per_plant)
            
        elif intervention_type == InterventionType.MANAGED_AQUIFER_RECHARGE:
            avg_cost = (costs["min_cost"] + costs["max_cost"]) / 2
            num_systems = budget_allocation // avg_cost
            avg_pop_per_system = (costs["min_population_served"] + costs["max_population_served"]) / 2
            population_served = int(num_systems * avg_pop_per_system)
            
        elif intervention_type == InterventionType.PIPED_WATER_EXTENSION:
            # Simplified: assume 20% of budget for pipes, 80% for connections
            connection_cost = (costs["connection_cost_min"] + costs["connection_cost_max"]) / 2
            population_served = int((budget_allocation * 0.8) // connection_cost)
            
        elif intervention_type == InterventionType.DESALINATION:
            # Capital cost per m3/day capacity
            daily_capacity = budget_allocation // costs["capital_cost_per_m3_day"]
            # Assume 20 liters per person per day from desalination
            population_served = int(daily_capacity * 20)
        else:
            population_served = 0
        
        # Cost per person
        cost_per_person = budget_allocation / population_served if population_served > 0 else float('inf')
        
        return population_served, cost_per_person
    
    def generate_allocation_candidates(
        self,
        target_regions: List[str],
        priority: str = "population"
    ) -> List[AllocationCandidate]:
        """
        Generate all possible allocation candidates for target regions.
        """
        candidates = []
        
        for region_id in target_regions:
            region = self.regions_data.get(region_id)
            if not region:
                continue
            
            # Get risk classification for priority weighting
            risk_level, composite_score, _ = RiskClassifier.classify_region(region)
            risk_priority = {"critical": 4, "high": 3, "moderate": 2, "low": 1}.get(risk_level.value, 1)
            
            # Get intervention scores
            scores = InterventionRecommender.evaluate_all_interventions(region)
            
            for score in scores:
                if score.suitability_score < 0.1:
                    continue  # Skip very low suitability
                
                # Use mid-range estimates
                cost = (score.estimated_cost_min + score.estimated_cost_max) / 2
                population = (score.population_served_min + score.population_served_max) / 2
                
                # Calculate cost-effectiveness
                cost_effectiveness = population / cost if cost > 0 else 0
                
                candidates.append(AllocationCandidate(
                    region_id=region_id,
                    region_name=region.get("name", "Unknown"),
                    intervention_type=score.intervention_type,
                    cost=cost,
                    population_served=int(population),
                    cost_effectiveness=cost_effectiveness,
                    suitability_score=score.suitability_score,
                    risk_priority=risk_priority
                ))
        
        # Sort candidates by priority
        if priority == "population":
            candidates.sort(key=lambda x: x.population_served, reverse=True)
        elif priority == "cost_effectiveness":
            candidates.sort(key=lambda x: x.cost_effectiveness, reverse=True)
        elif priority == "sustainability":
            candidates.sort(key=lambda x: (x.risk_priority, x.suitability_score), reverse=True)
        
        return candidates
    
    def optimize_allocation(
        self,
        total_budget: float,
        target_regions: List[str],
        priority: str = "population",
        include_maintenance: bool = True,
        time_horizon_years: int = 5
    ) -> List[AllocationCandidate]:
        """
        Optimize budget allocation across interventions.
        
        Uses a greedy approach with priority weighting.
        """
        candidates = self.generate_allocation_candidates(target_regions, priority)
        
        # Filter candidates by minimum cost threshold
        min_cost = total_budget * 0.01  # Minimum 1% of budget per allocation
        candidates = [c for c in candidates if c.cost >= min_cost]
        
        allocated_regions = set()
        allocations = []
        remaining_budget = total_budget
        
        # First pass: allocate to highest priority regions
        for candidate in candidates:
            if remaining_budget < candidate.cost:
                continue
            
            # Limit one major intervention per region in first pass
            if candidate.region_id in allocated_regions:
                continue
            
            # Adjust for maintenance costs if needed
            effective_cost = candidate.cost
            if include_maintenance:
                maintenance_cost = self.get_maintenance_cost(
                    candidate.intervention_type, 
                    candidate.cost
                ) * time_horizon_years
                effective_cost += maintenance_cost * 0.3  # Discount future maintenance
            
            if effective_cost > remaining_budget:
                # Try to scale down the intervention
                scale_factor = remaining_budget / effective_cost
                population_served = int(candidate.population_served * scale_factor)
                effective_cost = remaining_budget
            else:
                population_served = candidate.population_served
            
            if population_served > 0:
                allocations.append(AllocationCandidate(
                    region_id=candidate.region_id,
                    region_name=candidate.region_name,
                    intervention_type=candidate.intervention_type,
                    cost=effective_cost,
                    population_served=population_served,
                    cost_effectiveness=population_served / effective_cost if effective_cost > 0 else 0,
                    suitability_score=candidate.suitability_score,
                    risk_priority=candidate.risk_priority
                ))
                
                remaining_budget -= effective_cost
                allocated_regions.add(candidate.region_id)
        
        # Second pass: allocate remaining budget to secondary interventions
        for candidate in candidates:
            if remaining_budget < min_cost:
                break
            
            # Skip already allocated combinations
            existing = [a for a in allocations if a.region_id == candidate.region_id]
            if len(existing) >= 2:  # Max 2 interventions per region
                continue
            
            if candidate.cost > remaining_budget:
                scale_factor = remaining_budget / candidate.cost
                population_served = int(candidate.population_served * scale_factor)
                effective_cost = remaining_budget
            else:
                population_served = candidate.population_served
                effective_cost = candidate.cost
            
            if population_served > 0:
                allocations.append(AllocationCandidate(
                    region_id=candidate.region_id,
                    region_name=candidate.region_name,
                    intervention_type=candidate.intervention_type,
                    cost=effective_cost,
                    population_served=population_served,
                    cost_effectiveness=population_served / effective_cost if effective_cost > 0 else 0,
                    suitability_score=candidate.suitability_score,
                    risk_priority=candidate.risk_priority
                ))
                
                remaining_budget -= effective_cost
        
        return allocations, remaining_budget
    
    def calculate_sustainability_score(
        self,
        allocations: List[AllocationCandidate],
        time_horizon_years: int,
        include_maintenance: bool
    ) -> float:
        """
        Calculate sustainability score for the allocation plan.
        
        Factors:
        - Maintenance affordability (30%)
        - Infrastructure lifespan (25%)
        - Climate resilience (25%)
        - Community capacity (20%)
        """
        if not allocations:
            return 0.0
        
        total_cost = sum(a.cost for a in allocations)
        
        # Maintenance affordability
        total_maintenance = 0
        for allocation in allocations:
            maintenance = self.get_maintenance_cost(
                allocation.intervention_type,
                allocation.cost
            )
            total_maintenance += maintenance
        
        maintenance_ratio = total_maintenance / (total_cost / time_horizon_years) if total_cost > 0 else 1
        maintenance_score = max(0, min(100, 100 * (1 - maintenance_ratio)))
        
        # Infrastructure lifespan score
        lifespan_scores = []
        for allocation in allocations:
            type_key = allocation.intervention_type.value
            lifespan = COST_BENCHMARKS.get(type_key, {}).get("lifespan_years", 20)
            # Score based on how lifespan compares to time horizon
            lifespan_score = min(100, (lifespan / time_horizon_years) * 50)
            lifespan_scores.append(lifespan_score)
        avg_lifespan_score = sum(lifespan_scores) / len(lifespan_scores) if lifespan_scores else 50
        
        # Climate resilience (based on suitability scores)
        suitability_scores = [a.suitability_score for a in allocations]
        avg_suitability = sum(suitability_scores) / len(suitability_scores) if suitability_scores else 0.5
        resilience_score = avg_suitability * 100
        
        # Community capacity (based on risk priority - higher risk needs more support)
        risk_priorities = [a.risk_priority for a in allocations]
        avg_risk = sum(risk_priorities) / len(risk_priorities) if risk_priorities else 2
        capacity_score = min(100, avg_risk * 25)  # Higher risk = more support needed = lower score
        capacity_score = 100 - capacity_score  # Invert
        
        # Weighted average
        sustainability_score = (
            maintenance_score * 0.30 +
            avg_lifespan_score * 0.25 +
            resilience_score * 0.25 +
            capacity_score * 0.20
        )
        
        return round(sustainability_score, 2)
    
    def generate_recommendations(
        self,
        allocations: List[AllocationCandidate],
        total_budget: float,
        remaining_budget: float
    ) -> List[str]:
        """
        Generate strategic recommendations based on simulation results.
        """
        recommendations = []
        
        # Budget utilization
        utilization = (total_budget - remaining_budget) / total_budget if total_budget > 0 else 0
        if utilization < 0.7:
            recommendations.append(
                f"Budget utilization is low ({utilization:.0%}). Consider expanding target regions "
                "or reducing minimum allocation thresholds."
            )
        elif utilization > 0.95:
            recommendations.append(
                "Budget is nearly fully allocated. Consider adding contingency reserve "
                "for unexpected costs."
            )
        
        # Intervention diversity
        intervention_types = set(a.intervention_type for a in allocations)
        if len(intervention_types) < 3:
            recommendations.append(
                "Limited intervention diversity. Consider including multiple intervention types "
                "for risk mitigation and climate resilience."
            )
        
        # High-risk regions coverage
        high_risk_count = sum(1 for a in allocations if a.risk_priority >= 3)
        if high_risk_count > 0:
            recommendations.append(
                f"Plan includes {high_risk_count} high-risk region allocations. "
                "Ensure adequate monitoring and maintenance provisions."
            )
        
        # Cost-effectiveness
        if allocations:
            avg_cost_effectiveness = sum(a.cost_effectiveness for a in allocations) / len(allocations)
            if avg_cost_effectiveness < 0.01:  # Less than 1 person per $100
                recommendations.append(
                    "Average cost-effectiveness is low. Review intervention selection "
                    "for more cost-effective alternatives."
                )
        
        # Remaining budget
        if remaining_budget > total_budget * 0.1:
            recommendations.append(
                f"Remaining budget (${remaining_budget:,.0f}) could fund additional "
                "small-scale interventions or reserve for maintenance."
            )
        
        return recommendations
    
    def run_simulation(
        self,
        total_budget: float,
        time_horizon_years: int,
        target_regions: List[str],
        priority: str = "population",
        include_maintenance: bool = True
    ) -> SimulationResponse:
        """
        Run complete budget simulation.
        
        Args:
            total_budget: Total available budget
            time_horizon_years: Planning horizon in years
            target_regions: List of region IDs to target
            priority: Optimization priority ("population", "cost_effectiveness", "sustainability")
            include_maintenance: Whether to include maintenance costs
            
        Returns:
            SimulationResponse with allocation plan and impact metrics
        """
        # Optimize allocation
        allocations, remaining_budget = self.optimize_allocation(
            total_budget=total_budget,
            target_regions=target_regions,
            priority=priority,
            include_maintenance=include_maintenance,
            time_horizon_years=time_horizon_years
        )
        
        # Convert to response format
        allocation_list = [
            SimulationAllocation(
                region_id=a.region_id,
                region_name=a.region_name,
                intervention_type=a.intervention_type,
                allocation_amount=round(a.cost, 2),
                estimated_population_served=a.population_served,
                cost_effectiveness=round(a.cost_effectiveness, 4)
            )
            for a in allocations
        ]
        
        # Calculate totals
        total_population_served = sum(a.population_served for a in allocations)
        total_allocated = sum(a.cost for a in allocations)
        avg_cost_per_person = total_allocated / total_population_served if total_population_served > 0 else 0
        
        # Calculate sustainability score
        sustainability_score = self.calculate_sustainability_score(
            allocations, time_horizon_years, include_maintenance
        )
        
        # Impact summary
        impact_summary = {
            "total_regions_served": len(set(a.region_id for a in allocations)),
            "interventions_by_type": {},
            "budget_utilization_pct": round((total_allocated / total_budget) * 100, 1) if total_budget > 0 else 0,
            "remaining_budget": round(remaining_budget, 2),
            "risk_level_distribution": {
                "critical": sum(1 for a in allocations if a.risk_priority == 4),
                "high": sum(1 for a in allocations if a.risk_priority == 3),
                "moderate": sum(1 for a in allocations if a.risk_priority == 2),
                "low": sum(1 for a in allocations if a.risk_priority == 1)
            }
        }
        
        # Group by intervention type
        for allocation in allocations:
            type_key = allocation.intervention_type.value
            if type_key not in impact_summary["interventions_by_type"]:
                impact_summary["interventions_by_type"][type_key] = {
                    "count": 0,
                    "total_cost": 0,
                    "total_population": 0
                }
            impact_summary["interventions_by_type"][type_key]["count"] += 1
            impact_summary["interventions_by_type"][type_key]["total_cost"] += allocation.cost
            impact_summary["interventions_by_type"][type_key]["total_population"] += allocation.population_served
        
        # Generate recommendations
        recommendations = self.generate_recommendations(allocations, total_budget, remaining_budget)
        
        return SimulationResponse(
            total_budget=total_budget,
            time_horizon_years=time_horizon_years,
            allocation=allocation_list,
            total_population_served=total_population_served,
            average_cost_per_person=round(avg_cost_per_person, 2),
            sustainability_score=sustainability_score,
            impact_summary=impact_summary,
            recommendations=recommendations
        )
