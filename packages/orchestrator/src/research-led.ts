import { BaseOrchestrator } from './base';
import { AnalysisInput, OrchestratorType, PhaseDefinition } from './types';

type PhaseComputation = {
  insights: string[];
  recommendations: string[];
  risks: string[];
  confidence: number;
  artifacts?: string[];
};

/**
 * Research-Led Orchestrator
 * Prioritizes market research, competitor analysis. Most thorough.
 */
export class ResearchLedOrchestrator extends BaseOrchestrator {
  protected readonly orchestratorType: OrchestratorType = 'research-led';

  protected definePhases(): PhaseDefinition[] {
    return [
      {
        name: 'market-analysis',
        focus: 'Deep dive into market size, trends, and dynamics',
        outputs: ['market-report', 'tam-sam-som'],
      },
      {
        name: 'competitor-mapping',
        focus: 'Comprehensive competitor analysis and positioning',
        outputs: ['competitor-matrix', 'differentiation-strategy'],
      },
      {
        name: 'customer-research',
        focus: 'Understand target customers and their willingness to pay',
        outputs: ['customer-personas', 'pricing-sensitivity'],
      },
      {
        name: 'pricing-strategy',
        focus: 'Data-driven pricing based on market benchmarks',
        outputs: ['pricing-model', 'revenue-projections'],
      },
      {
        name: 'go-to-market',
        focus: 'Develop comprehensive GTM strategy',
        outputs: ['gtm-plan', 'channel-strategy'],
      },
      {
        name: 'validation-plan',
        focus: 'Design experiments to validate assumptions',
        outputs: ['hypothesis-list', 'experiment-plan'],
      },
    ];
  }

  protected executePhase(phase: PhaseDefinition, analysis: AnalysisInput): PhaseComputation {
    const normalized = this.normalizeAnalysis(analysis);
    const baseConfidence = this.deriveConfidence(analysis, 0.85);

    switch (phase.name) {
      case 'market-analysis':
        return {
          insights: [
            'Market research reduces launch risk significantly',
            `Target audience: ${normalized.audience.join(', ') || 'Needs definition'}`,
          ],
          recommendations: [
            'Define TAM/SAM/SOM before pricing',
            'Identify market trends and timing',
            'Research regulatory requirements',
          ],
          risks: ['Market may be smaller than assumed'],
          confidence: baseConfidence,
          artifacts: ['market-analysis.md'],
        };

      case 'competitor-mapping':
        return {
          insights: [
            `${normalized.competitors.length} competitors identified`,
            `Differentiators: ${normalized.differentiators.join(', ') || 'Need to define'}`,
          ],
          recommendations: [
            'Create feature comparison matrix',
            'Identify gaps in competitor offerings',
            'Study competitor pricing models',
            ...normalized.competitors.slice(0, 2).map(c => `Analyze: ${c}`),
          ],
          risks: ['Well-funded competitors may respond aggressively'],
          confidence: baseConfidence,
          artifacts: ['competitor-matrix.xlsx'],
        };

      case 'customer-research':
        return {
          insights: ['Understanding WTP (willingness to pay) is critical'],
          recommendations: [
            'Conduct 5-10 customer discovery interviews',
            'Create detailed customer personas',
            'Map customer journey and pain points',
            'Survey potential customers on pricing',
          ],
          risks: ['Building for wrong customer segment'],
          confidence: baseConfidence - 0.05,
        };

      case 'pricing-strategy':
        return {
          insights: ['Pricing is the #1 lever for revenue growth'],
          recommendations: [
            'Use value-based pricing, not cost-plus',
            'Research competitor price points',
            'Consider psychological pricing ($29 vs $30)',
            'Plan for price increases over time',
          ],
          risks: ['Pricing too low leaves money on table'],
          confidence: baseConfidence + 0.1,
          artifacts: ['pricing-model.xlsx'],
        };

      case 'go-to-market':
        return {
          insights: ['Distribution strategy is as important as product'],
          recommendations: [
            'Identify primary acquisition channels',
            'Plan content marketing strategy',
            'Consider partnerships and integrations',
            'Set up attribution tracking',
          ],
          risks: ['CAC may be higher than projected'],
          confidence: baseConfidence,
          artifacts: ['gtm-plan.md'],
        };

      case 'validation-plan':
        return {
          insights: ['Validate assumptions before scaling investment'],
          recommendations: [
            'Run landing page test to gauge interest',
            'Offer pre-sales or waitlist',
            'A/B test pricing page variations',
            'Track conversion funnel metrics',
          ],
          risks: ['Confirmation bias in interpreting results'],
          confidence: baseConfidence + 0.05,
          artifacts: ['experiment-plan.md', 'metrics-dashboard.json'],
        };

      default:
        return {
          insights: [],
          recommendations: [],
          risks: [],
          confidence: 0.5,
        };
    }
  }
}
