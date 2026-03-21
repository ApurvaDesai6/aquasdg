import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface AnalysisRequest {
  type: 'analysis' | 'interventions' | 'policy-brief' | 'implementation-plan';
  data: any;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { type, data, apiKey } = body;

    // If no API key, return mock response
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - add API key for full AI analysis',
        result: generateMockResponse(type, data)
      });
    }

    // Use AI SDK for real analysis
    const zai = await ZAI.create();
    
    let prompt = '';
    switch (type) {
      case 'analysis':
        prompt = buildAnalysisPrompt(data);
        break;
      case 'interventions':
        prompt = buildInterventionsPrompt(data);
        break;
      case 'policy-brief':
        prompt = buildPolicyBriefPrompt(data);
        break;
      case 'implementation-plan':
        prompt = buildImplementationPlanPrompt(data);
        break;
      default:
        prompt = buildAnalysisPrompt(data);
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Senior Water Security & Infrastructure Specialist. Your expertise covers SDG 6, GCF (Green Climate Fund) proposal standards, and World Bank infrastructure frameworks.
          
          Your objective is to provide professional, bankable, and highly detailed reports for water security projects in developing nations.
          
          Guidelines:
          1. STRUCTURE: Use professional headers, executive summaries, and technical tables.
          2. DATA-DRIVEN: Reference the provided regional metrics (water access, risk scores, population) as the primary evidence base.
          3. STANDARDS: Align recommendations with international best practices (e.g., Integrated Water Resources Management - IWRM).
          4. TONE: Authoritative, technical, yet accessible to policy makers.
          5. FORMATTING: Use Markdown extensively for readability. Use bolding for key metrics.
          
          Include sections on:
          - Climate Resilience (how the project handles floods/droughts)
          - Socio-Economic Impact (gender equality, health, economy)
          - Stakeholder Engagement (local communities, NGOs, government)
          - Technical Feasibility & Scalability`
        },
        {
          role: 'user',
          content: `${prompt}
          
          Data Context:
          ${JSON.stringify({
            regions: data.selectedRegions || data.regions?.slice(0, 3),
            interventions: data.selectedInterventions,
            budget: data.budget,
            phase: data.currentPhase
          }, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const result = completion.choices[0]?.message?.content || 'No analysis generated';

    return NextResponse.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Policy AI error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate analysis'
    }, { status: 500 });
  }
}

function buildAnalysisPrompt(data: any): string {
  return `Analyze the following water security situation and provide a comprehensive assessment:

Selected Regions: ${JSON.stringify(data.selectedRegions || [], null, 2)}
Region Data: ${JSON.stringify(data.regions?.slice(0, 5) || [], null, 2)}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Risk Factors (bulleted list)
3. Affected Population Analysis
4. Urgency Assessment (Critical/High/Medium/Low)
5. Recommended Immediate Actions
6. Data Gaps and Recommendations for Further Research

Format your response in clear sections with markdown headers.`;
}

function buildInterventionsPrompt(data: any): string {
  return `Based on the following intervention planning data, provide optimized recommendations:

Selected Interventions: ${JSON.stringify(data.selectedInterventions || [], null, 2)}
Budget: $${data.budget?.toLocaleString() || 'Not specified'}
Selected Regions: ${JSON.stringify(data.regions || [], null, 2)}

Please provide:
1. Intervention Prioritization (rank by impact/cost ratio)
2. Budget Allocation Recommendations
3. Implementation Sequence
4. Expected Outcomes and Metrics
5. Risk Mitigation Strategies
6. Alternative Intervention Options

Format your response in clear sections with markdown headers.`;
}

function buildPolicyBriefPrompt(data: any): string {
  return `Draft a policy brief based on the following water security planning data:

Current Phase: ${data.currentPhase}
Selected Regions: ${JSON.stringify(data.selectedRegions || [], null, 2)}
Selected Interventions: ${JSON.stringify(data.selectedInterventions || [], null, 2)}

Please create a policy brief with:
1. Executive Summary
2. Background and Context
3. Problem Statement
4. Proposed Solutions
5. Implementation Framework
6. Resource Requirements
7. Expected Outcomes
8. Recommendations for Decision Makers

Format as a professional policy brief suitable for government and donor audiences.`;
}

function buildImplementationPlanPrompt(data: any): string {
  return `Create a detailed implementation plan based on:

${JSON.stringify(data, null, 2)}

Please provide:
1. Implementation Phases (quarterly breakdown)
2. Key Milestones and Deliverables
3. Resource Requirements by Phase
4. Risk Management Plan
5. Monitoring and Evaluation Framework
6. Sustainability Strategy

Format as a structured implementation plan with timelines and responsibilities.`;
}

function generateMockResponse(type: string, data: any): any {
  switch (type) {
    case 'analysis':
      return {
        executiveSummary: 'Analysis of selected regions indicates significant water security challenges requiring immediate intervention.',
        riskFactors: [
          'High water stress levels exceeding 60% in most regions',
          'Limited access to safe drinking water (<50%)',
          'Inadequate sanitation infrastructure',
          'Climate vulnerability affecting water availability'
        ],
        urgencyLevel: 'High',
        immediateActions: [
          'Conduct detailed baseline assessment',
          'Engage local stakeholders',
          'Secure emergency water supply',
          'Initiate infrastructure planning'
        ]
      };
    case 'interventions':
      return {
        prioritizedInterventions: [
          { name: 'Water Infrastructure', priority: 1, impact: 'High', cost: '$75/person' },
          { name: 'Sanitation Systems', priority: 2, impact: 'High', cost: '$55/person' },
          { name: 'Policy Enhancement', priority: 3, impact: 'Medium', cost: '$15/person' }
        ],
        budgetRecommendation: 'Allocate 60% to infrastructure, 25% to capacity building, 15% to monitoring',
        implementationSequence: 'Phase 1: Planning, Phase 2: Procurement, Phase 3: Construction, Phase 4: Monitoring'
      };
    case 'policy-brief':
      return {
        title: 'Water Security Policy Brief',
        summary: 'This brief outlines the critical water security challenges facing the selected regions and proposes evidence-based interventions.',
        recommendations: [
          'Increase budget allocation for water infrastructure',
          'Strengthen institutional coordination',
          'Implement community-based management approaches',
          'Establish monitoring and evaluation frameworks'
        ]
      };
    default:
      return {
        message: 'Analysis generated successfully (demo mode)',
        data: data
      };
  }
}
