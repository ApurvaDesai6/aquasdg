import { NextRequest, NextResponse } from 'next/server';

interface RegionData {
  id: string;
  name: string;
  country: string;
  population: number;
  indicators: {
    water_access: number;
    sanitation: number;
    water_stress: number;
    flood_risk: number;
    drought_risk: number;
    composite_risk: number;
    policy_vector: number;
  };
  riskLevel: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, interventions, budget, apiKey } = body as {
      region: RegionData;
      interventions: string[];
      budget: number;
      apiKey?: string;
    };

    if (!region) {
      return NextResponse.json({ error: 'Region data required' }, { status: 400 });
    }

    // Generate comprehensive policy plan
    const plan = generatePolicyPlan(region, interventions, budget, apiKey);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Policy plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate policy plan' },
      { status: 500 }
    );
  }
}

function generatePolicyPlan(
  region: RegionData,
  interventions: string[],
  budget: number,
  apiKey?: string
): string {
  const interventionNames: Record<string, string> = {
    water_infrastructure: 'Water Infrastructure Development',
    flood_defense: 'Flood Defense Systems',
    sanitation_systems: 'Sanitation Infrastructure',
    drought_resilience: 'Drought Resilience Programs',
    policy_enhancement: 'Policy Framework Strengthening'
  };

  const selectedInterventions = interventions
    .map(id => interventionNames[id])
    .filter(Boolean);

  const formatCurrency = (n: number) => {
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const formatPopulation = (n: number) => {
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return `
# Water Security Intervention Plan
## ${region.name}, ${region.country}

### Executive Summary

This comprehensive intervention plan addresses critical water security challenges in ${region.name} through strategic infrastructure development, policy enhancement, and community engagement. The plan targets ${formatPopulation(region.population)} residents currently facing water access rates of ${region.indicators.water_access}% and composite risk scores of ${region.indicators.composite_risk}%.

### Current Situation Analysis

**Risk Profile:**
- **Composite Risk Score:** ${region.indicators.composite_risk}% (${region.riskLevel.toUpperCase()} LEVEL)
- **Water Access:** ${region.indicators.water_access}% of population with safely managed water
- **Sanitation:** ${region.indicators.sanitation}% with safe sanitation facilities
- **Water Stress Index:** ${region.indicators.water_stress}% (ratio of withdrawal to renewable resources)
- **Flood Risk:** ${region.indicators.flood_risk}%
- **Drought Risk:** ${region.indicators.drought_risk}%
- **Policy Vector:** ${region.indicators.policy_vector}% (governance strength)

**Critical Gaps Identified:**
1. Infrastructure deficit limiting water distribution
2. Climate vulnerability to flood and drought cycles
3. Institutional capacity constraints
4. Limited community-level water management systems

### Selected Interventions

${selectedInterventions.length > 0 ? selectedInterventions.map((intervention, i) => `
#### ${i + 1}. ${intervention}

**Rationale:** Based on the risk profile and gap analysis, this intervention directly addresses critical water security needs.

**Expected Impact:**
- Improved water access for target population
- Enhanced resilience to climate shocks
- Sustainable operation and maintenance capacity

`).join('\n') : `
#### Comprehensive Multi-Sector Approach

Based on the risk profile, a combination of interventions is recommended:
1. Water Infrastructure Development
2. Flood Defense Systems
3. Sanitation Infrastructure
4. Drought Resilience Programs
5. Policy Framework Strengthening
`}

### Budget Allocation

**Total Estimated Budget:** ${formatCurrency(budget || 5000000)}

**Budget Breakdown:**
- Infrastructure Development: 45% (${formatCurrency((budget || 5000000) * 0.45)})
- Capacity Building: 20% (${formatCurrency((budget || 5000000) * 0.20)})
- Community Engagement: 15% (${formatCurrency((budget || 5000000) * 0.15)})
- Monitoring & Evaluation: 10% (${formatCurrency((budget || 5000000) * 0.10)})
- Contingency: 10% (${formatCurrency((budget || 5000000) * 0.10)})

### Implementation Timeline

**Phase 1: Preparation (Months 1-6)**
- Detailed needs assessment and baseline survey
- Stakeholder consultation and alignment
- Detailed engineering design
- Procurement and contracting

**Phase 2: Construction (Months 7-24)**
- Civil works for water infrastructure
- Installation of treatment systems
- Distribution network development
- Quality assurance and testing

**Phase 3: Capacity Building (Months 18-30)**
- Staff training programs
- Community education campaigns
- Management system establishment
- Operation & maintenance training

**Phase 4: Handover & Sustainability (Months 30-36)**
- Operational handover to local authorities
- Performance monitoring setup
- Long-term maintenance agreements
- Impact evaluation

### Expected Outcomes

**Immediate (0-12 months):**
- Construction initiated on priority infrastructure
- Community mobilization completed
- Management committees established

**Medium-term (12-24 months):**
- Water access increased by 25-35%
- Waterborne disease incidence reduced by 40%
- Community management systems operational

**Long-term (24-36 months):**
- Sustainable water access for ${formatPopulation(region.population * 0.8)} beneficiaries
- 50% reduction in climate vulnerability
- Strong institutional capacity for ongoing management

### Key Performance Indicators

| Indicator | Baseline | Target | Timeline |
|-----------|----------|--------|----------|
| Water Access (%) | ${region.indicators.water_access}% | ${Math.min(95, region.indicators.water_access + 35)}% | 36 months |
| Sanitation Access (%) | ${region.indicators.sanitation}% | ${Math.min(95, region.indicators.sanitation + 30)}% | 36 months |
| Population Served | 0 | ${formatPopulation(region.population * 0.8)} | 24 months |
| System Uptime | N/A | 95% | Ongoing |

### Risk Mitigation

**Technical Risks:**
- Geological surveys before construction
- Quality assurance protocols
- Backup systems for critical infrastructure

**Financial Risks:**
- Multi-source funding strategy
- Contingency budget allocation
- Cost-sharing with communities

**Institutional Risks:**
- Capacity building programs
- Clear governance structures
- Performance-based contracts

### Sustainability Plan

1. **Financial Sustainability:**
   - User fee structures based on ability to pay
   - Cross-subsidization mechanisms
   - Reserve fund for major maintenance

2. **Technical Sustainability:**
   - Local technician training
   - Spare parts supply chain
   - Preventive maintenance protocols

3. **Institutional Sustainability:**
   - Clear roles and responsibilities
   - Regular performance monitoring
   - Adaptive management approach

### Monitoring & Evaluation Framework

**Data Collection:**
- Monthly operational reports
- Quarterly water quality testing
- Annual beneficiary surveys

**Reporting:**
- Monthly progress reports to stakeholders
- Quarterly financial reports
- Annual impact assessment

**Evaluation:**
- Mid-term evaluation at 18 months
- Final evaluation at 36 months
- Post-project sustainability review at 48 months

---

*This plan was generated by AquaSDG's AI-powered policy intelligence system. For implementation support, contact the relevant government agencies and development partners listed in the stakeholder mapping section.*

**Generated:** ${new Date().toISOString()}
**Region ID:** ${region.id}
**Classification:** ${region.riskLevel.toUpperCase()} PRIORITY
`;
}
