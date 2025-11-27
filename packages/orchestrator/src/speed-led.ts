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
 * Speed-Led Orchestrator
 * Prioritizes fast shipping, MVP approach. Faster but may cut corners.
 */
export class SpeedLedOrchestrator extends BaseOrchestrator {
  protected readonly orchestratorType: OrchestratorType = 'speed-led';

  protected definePhases(): PhaseDefinition[] {
    return [
      {
        name: 'quick-assessment',
        focus: 'Rapid analysis of what exists and what can ship fast',
        outputs: ['mvp-scope', 'quick-wins'],
      },
      {
        name: 'mvp-definition',
        focus: 'Define minimum viable product for monetization',
        outputs: ['mvp-features', 'cut-list'],
      },
      {
        name: 'rapid-implementation',
        focus: 'Fast-track core features needed for revenue',
        outputs: ['implementation-checklist', 'shortcuts'],
      },
      {
        name: 'launch-prep',
        focus: 'Prepare for immediate launch with basic infrastructure',
        outputs: ['launch-checklist', 'go-live-plan'],
      },
    ];
  }

  protected executePhase(phase: PhaseDefinition, analysis: AnalysisInput): PhaseComputation {
    const normalized = this.normalizeAnalysis(analysis);
    const baseConfidence = this.deriveConfidence(analysis, 0.75);

    switch (phase.name) {
      case 'quick-assessment':
        return {
          insights: [
            'Speed-first approach: ship in days, not weeks',
            `${normalized.opportunities.length} quick-win opportunities found`,
          ],
          recommendations: [
            'Focus on one revenue stream first',
            'Skip non-essential features',
            'Use existing services (Stripe, Auth0) vs building',
          ],
          risks: [
            'Technical debt will accumulate',
            'May need significant refactoring later',
          ],
          confidence: baseConfidence,
        };

      case 'mvp-definition':
        return {
          insights: ['MVP = smallest thing that generates revenue'],
          recommendations: [
            'Core feature + payment = MVP',
            'Cut: advanced analytics, admin dashboard, multi-tenancy',
            'Keep: basic auth, single payment tier, core functionality',
            normalized.monetizationIdeas[0] || 'Start with simplest pricing',
          ],
          risks: ['Over-scoping MVP delays launch'],
          confidence: baseConfidence + 0.1,
          artifacts: ['mvp-scope.md'],
        };

      case 'rapid-implementation':
        return {
          insights: ['Use shortcuts that can be replaced later'],
          recommendations: [
            'Day 1-2: Stripe Checkout integration',
            'Day 3: Basic feature gating',
            'Day 4: Landing page with pricing',
            'Day 5: Soft launch to small audience',
          ],
          risks: [
            'Bugs more likely without thorough testing',
            'Customer support load may be high initially',
          ],
          confidence: baseConfidence,
        };

      case 'launch-prep':
        return {
          insights: ['Done is better than perfect'],
          recommendations: [
            'Set up basic error monitoring (Sentry)',
            'Create simple support email',
            'Prepare launch announcement',
            'Have rollback plan ready',
          ],
          risks: ['Post-launch issues without proper monitoring'],
          confidence: baseConfidence + 0.15,
          artifacts: ['launch-checklist.md', 'rollback-plan.md'],
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
