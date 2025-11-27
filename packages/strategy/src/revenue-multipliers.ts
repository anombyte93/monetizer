/**
 * AI Revenue Multipliers
 *
 * Advanced AI-powered monetization strategies beyond advertising.
 * Each multiplier is a testable income stream that can be enabled independently.
 *
 * 1. Affiliate Intelligence - AI-optimized affiliate/referral recommendations
 * 2. Dynamic Pricing Optimizer - ML-based pricing experiments
 * 3. Lead Scoring & Outreach - AI-powered conversion optimization
 * 4. Sponsorship Matcher - Programmatic sponsorship opportunities
 * 5. Usage-Based Upsell Engine - Intelligent upgrade triggers
 */

import Anthropic from '@anthropic-ai/sdk';
import { ProjectAnalysis, MonetizationStrategy } from './types';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620';

// ============================================================================
// Type Definitions
// ============================================================================

export type RevenueMultiplierType =
  | 'affiliate'
  | 'pricing'
  | 'leads'
  | 'sponsorship'
  | 'upsell';

export interface RevenueMultiplier {
  type: RevenueMultiplierType;
  name: string;
  description: string;
  estimatedRevenueLift: string;
  implementationEffort: 'low' | 'medium' | 'high';
  timeToFirstRevenue: string;
  requirements: string[];
}

export interface AffiliateProgram {
  name: string;
  type: 'saas' | 'hosting' | 'tools' | 'education' | 'services';
  commission: string;
  cookieDuration: string;
  relevanceScore: number;
  signupUrl: string;
  integrationMethod: 'link' | 'api' | 'widget';
  estimatedEarnings: string;
  audienceMatch: string;
}

export interface PricingExperiment {
  id: string;
  name: string;
  hypothesis: string;
  variant: {
    originalPrice: number;
    testPrice: number;
    features: string[];
  };
  expectedLift: string;
  riskLevel: 'low' | 'medium' | 'high';
  duration: string;
  successMetric: string;
}

export interface LeadScore {
  userId: string;
  score: number; // 0-100
  tier: 'hot' | 'warm' | 'cold';
  signals: LeadSignal[];
  recommendedAction: string;
  predictedLTV: number;
  conversionProbability: number;
}

export interface LeadSignal {
  type: 'usage' | 'engagement' | 'intent' | 'firmographic';
  name: string;
  value: string | number;
  weight: number;
}

export interface SponsorshipOpportunity {
  type: 'docs' | 'cli' | 'newsletter' | 'readme' | 'community';
  placement: string;
  estimatedImpressions: string;
  suggestedCPM: number;
  suggestedFlat: number;
  matchingSponsors: SponsorMatch[];
}

export interface SponsorMatch {
  category: string;
  examples: string[];
  relevance: number;
  outreachTemplate: string;
}

export interface UpsellTrigger {
  trigger: string;
  condition: string;
  targetPlan: string;
  message: string;
  timing: 'immediate' | 'delayed' | 'scheduled';
  channel: 'in-app' | 'email' | 'cli';
  expectedConversion: string;
}

export interface RevenueMultiplierStrategy {
  multipliers: RevenueMultiplier[];
  affiliates: AffiliateProgram[];
  pricingExperiments: PricingExperiment[];
  upsellTriggers: UpsellTrigger[];
  sponsorships: SponsorshipOpportunity[];
  totalEstimatedLift: string;
  implementationOrder: string[];
}

export interface MultiplierOptions {
  anthropicApiKey: string;
  model?: string;
}

// ============================================================================
// Revenue Multiplier Generator
// ============================================================================

export class RevenueMultiplierGenerator {
  private anthropic: Anthropic;
  private model: string;

  constructor(options: MultiplierOptions) {
    if (!options?.anthropicApiKey) {
      throw new Error('Anthropic API key is required for revenue multiplier generation.');
    }
    this.model = options.model ?? DEFAULT_MODEL;
    this.anthropic = new Anthropic({ apiKey: options.anthropicApiKey });
  }

  /**
   * Generate comprehensive revenue multiplier strategy
   */
  async generateStrategy(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    options?: {
      currentMRR?: number;
      targetMRR?: number;
      enabledMultipliers?: RevenueMultiplierType[];
    }
  ): Promise<RevenueMultiplierStrategy> {
    const prompt = this.buildStrategyPrompt(analysis, strategy, options);
    const response = await this.callClaude(prompt);
    return this.parseStrategyResponse(response);
  }

  /**
   * Generate AI-optimized affiliate program recommendations
   */
  async generateAffiliatePrograms(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy
  ): Promise<AffiliateProgram[]> {
    const prompt = `Recommend affiliate programs for this developer tool.

PROJECT TYPE: ${analysis.techStack?.frameworks?.join(', ') || 'General dev tool'}
TARGET AUDIENCE: ${strategy.marketResearch?.targetAudience?.join(', ') || 'Developers'}
TECH STACK: ${analysis.techStack?.languages?.join(', ') || 'Various'}

Generate 10 highly relevant affiliate programs in JSON array:
[
  {
    "name": "Program Name",
    "type": "saas" | "hosting" | "tools" | "education" | "services",
    "commission": "30% recurring" or "$50 per sale",
    "cookieDuration": "90 days",
    "relevanceScore": 0.95 (0-1 how relevant to audience),
    "signupUrl": "https://...",
    "integrationMethod": "link" | "api" | "widget",
    "estimatedEarnings": "$500-2000/mo at 1000 users",
    "audienceMatch": "Why this matches your users"
  }
]

Focus on:
- High-commission SaaS with recurring revenue (Vercel, Railway, Supabase, etc.)
- Dev tools your audience actually uses
- Services with good conversion rates for developers
- Education platforms (courses, bootcamps)
- Hosting/infrastructure (DigitalOcean, AWS, etc.)

Sort by relevanceScore descending.`;

    const response = await this.callClaude(prompt);
    return this.parseJSONArray(response);
  }

  /**
   * Generate pricing experiments to test
   */
  async generatePricingExperiments(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    currentPricing?: { tier: string; price: number }[]
  ): Promise<PricingExperiment[]> {
    const pricing = currentPricing || strategy.pricingModel?.tiers?.map(t => ({
      tier: t.name,
      price: t.price,
    })) || [];

    const prompt = `Generate pricing experiments for this developer tool.

CURRENT PRICING:
${pricing.map(p => `- ${p.tier}: $${p.price}/mo`).join('\n')}

PROJECT VALUE: ${strategy.primaryMethod?.description || 'Developer productivity'}
MARKET: ${strategy.marketResearch?.marketSize || 'Developer tools market'}

Generate 5 pricing experiments in JSON array:
[
  {
    "id": "exp_001",
    "name": "Experiment Name",
    "hypothesis": "What we're testing and why",
    "variant": {
      "originalPrice": 12,
      "testPrice": 19,
      "features": ["Features included at this price"]
    },
    "expectedLift": "+15-25% revenue",
    "riskLevel": "low" | "medium" | "high",
    "duration": "2 weeks",
    "successMetric": "Conversion rate stays above 3%"
  }
]

Experiment types to include:
1. Price point test (test higher anchor price)
2. Feature gating test (move feature to higher tier)
3. Annual discount test (yearly vs monthly)
4. Usage limit test (change thresholds)
5. Decoy pricing test (add middle tier)

Be specific about expected outcomes.`;

    const response = await this.callClaude(prompt);
    return this.parseJSONArray(response);
  }

  /**
   * Generate upsell triggers based on usage patterns
   */
  async generateUpsellTriggers(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy
  ): Promise<UpsellTrigger[]> {
    const prompt = `Generate intelligent upsell triggers for this developer tool.

PRICING TIERS:
${strategy.pricingModel?.tiers?.map(t => `- ${t.name}: $${t.price}/mo - ${t.features?.slice(0, 3).join(', ')}`).join('\n') || 'Free, Pro, Team'}

PROJECT FEATURES: ${analysis.opportunities?.map(o => o.type).join(', ') || 'CLI, API, Dashboard'}

Generate 8 upsell triggers in JSON array:
[
  {
    "trigger": "Usage threshold reached",
    "condition": "user.analyses >= 8 AND user.plan == 'free'",
    "targetPlan": "pro",
    "message": "You've used 8 of 10 free analyses. Upgrade to Pro for unlimited.",
    "timing": "immediate" | "delayed" | "scheduled",
    "channel": "in-app" | "email" | "cli",
    "expectedConversion": "5-8%"
  }
]

Include triggers for:
1. Usage limits (approaching/exceeding)
2. Feature discovery (tried premium feature)
3. Team growth (invited collaborators)
4. Time-based (trial ending, anniversary)
5. Success moments (after completing key action)
6. Competitive (user has competitor tool)
7. Expansion (new projects, more usage)
8. Re-engagement (returning after absence)`;

    const response = await this.callClaude(prompt);
    return this.parseJSONArray(response);
  }

  /**
   * Generate sponsorship opportunities
   */
  async generateSponsorships(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    monthlyUsers?: number
  ): Promise<SponsorshipOpportunity[]> {
    const users = monthlyUsers || 1000;

    const prompt = `Generate sponsorship opportunities for this developer tool.

MONTHLY USERS: ~${users}
PROJECT TYPE: ${analysis.techStack?.frameworks?.join(', ') || 'Developer tool'}
SURFACES: CLI output, documentation, README, community

Generate sponsorship opportunities in JSON array:
[
  {
    "type": "docs" | "cli" | "newsletter" | "readme" | "community",
    "placement": "Where the sponsorship appears",
    "estimatedImpressions": "5,000/month",
    "suggestedCPM": 15,
    "suggestedFlat": 500,
    "matchingSponsors": [
      {
        "category": "Developer Tools",
        "examples": ["Vercel", "Railway", "Supabase"],
        "relevance": 0.9,
        "outreachTemplate": "Cold email template for this sponsor type"
      }
    ]
  }
]

Include:
1. CLI "Powered by" sponsor slot
2. Documentation sidebar sponsor
3. README sponsor section
4. Newsletter sponsor (if applicable)
5. Community/Discord sponsor

For each, suggest 2-3 sponsor categories with outreach templates.`;

    const response = await this.callClaude(prompt);
    return this.parseJSONArray(response);
  }

  /**
   * Calculate lead score for a user
   */
  calculateLeadScore(signals: LeadSignal[]): LeadScore {
    let totalScore = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      totalScore += signal.weight * (typeof signal.value === 'number' ? signal.value : 50);
      totalWeight += signal.weight;
    }

    const score = Math.min(100, Math.round(totalScore / totalWeight));
    const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

    const actions: Record<string, string> = {
      hot: 'Trigger sales outreach within 24h, offer premium trial extension',
      warm: 'Send personalized email sequence, surface upgrade prompt in-app',
      cold: 'Add to nurture sequence, track for re-engagement triggers',
    };

    return {
      userId: 'calculated',
      score,
      tier,
      signals,
      recommendedAction: actions[tier],
      predictedLTV: score * 12, // Simple LTV estimate
      conversionProbability: score / 100,
    };
  }

  private buildStrategyPrompt(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    options?: {
      currentMRR?: number;
      targetMRR?: number;
      enabledMultipliers?: RevenueMultiplierType[];
    }
  ): string {
    const currentMRR = options?.currentMRR || 0;
    const targetMRR = options?.targetMRR || 5000;

    return `Generate a comprehensive revenue multiplier strategy for this developer tool.

PROJECT:
- Type: ${analysis.techStack?.frameworks?.join(', ') || 'Developer tool'}
- Tech: ${analysis.techStack?.languages?.join(', ') || 'Various'}
- Pricing: ${strategy.pricingModel?.tiers?.map(t => `${t.name}=$${t.price}`).join(', ') || 'Free/Pro/Team'}

GOALS:
- Current MRR: $${currentMRR}
- Target MRR: $${targetMRR}
- Gap to close: $${targetMRR - currentMRR}

Generate JSON:
{
  "multipliers": [
    {
      "type": "affiliate" | "pricing" | "leads" | "sponsorship" | "upsell",
      "name": "Multiplier Name",
      "description": "What it does",
      "estimatedRevenueLift": "$500-1500/mo",
      "implementationEffort": "low" | "medium" | "high",
      "timeToFirstRevenue": "1 week",
      "requirements": ["What's needed to implement"]
    }
  ],
  "affiliates": [top 5 affiliate programs],
  "pricingExperiments": [top 3 experiments],
  "upsellTriggers": [top 5 triggers],
  "sponsorships": [top 3 opportunities],
  "totalEstimatedLift": "$X-Y/mo combined",
  "implementationOrder": ["Which to do first", "second", "etc"]
}

Prioritize by:
1. Revenue potential vs effort ratio
2. Time to first dollar
3. Compounding effects (things that improve over time)`;
  }

  private async callClaude(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 3000,
      temperature: 0.6,
      system: `You are an expert in developer tool monetization and growth.
You understand affiliate marketing, pricing psychology, lead scoring, and sponsorship sales.
For dev tools specifically, you know:
- Developers hate intrusive monetization but respond to genuine value
- Recurring affiliate commissions compound better than one-time
- Usage-based upsells convert better than time-based
- Sponsorships work best when contextually relevant
Generate specific, actionable strategies with realistic revenue estimates.
Respond with valid JSON only.`,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .map(item => ('text' in item ? item.text : ''))
      .join('')
      .trim();

    if (!text) throw new Error('Empty response from Claude');
    return text;
  }

  private parseStrategyResponse(content: string): RevenueMultiplierStrategy {
    try {
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new Error('Failed to parse revenue multiplier strategy');
    }
  }

  private parseJSONArray<T>(content: string): T[] {
    try {
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
}

// ============================================================================
// Pre-built Revenue Multiplier Recommendations
// ============================================================================

export const REVENUE_MULTIPLIER_CATALOG: RevenueMultiplier[] = [
  {
    type: 'affiliate',
    name: 'Developer Tool Affiliates',
    description: 'Earn recurring commissions recommending tools your users already need (hosting, databases, auth)',
    estimatedRevenueLift: '$200-2000/mo per 1000 users',
    implementationEffort: 'low',
    timeToFirstRevenue: '1-2 weeks',
    requirements: ['Affiliate account signup', 'Add links to docs/CLI', 'Track conversions'],
  },
  {
    type: 'pricing',
    name: 'Dynamic Price Testing',
    description: 'A/B test pricing points, tiers, and annual discounts to find optimal revenue point',
    estimatedRevenueLift: '+15-40% revenue lift',
    implementationEffort: 'medium',
    timeToFirstRevenue: '2-4 weeks',
    requirements: ['Feature flags', 'Analytics', 'Billing flexibility'],
  },
  {
    type: 'leads',
    name: 'AI Lead Scoring',
    description: 'Score users by conversion probability, trigger personalized upgrade paths',
    estimatedRevenueLift: '+20-35% conversion rate',
    implementationEffort: 'medium',
    timeToFirstRevenue: '2-3 weeks',
    requirements: ['Usage tracking', 'CRM/database', 'Email automation'],
  },
  {
    type: 'sponsorship',
    name: 'Programmatic Sponsorships',
    description: 'Sell sponsor slots in docs, CLI output, and community spaces',
    estimatedRevenueLift: '$500-5000/mo at 10k users',
    implementationEffort: 'low',
    timeToFirstRevenue: '1-2 weeks',
    requirements: ['Sponsorship page', 'Rate card', 'Outreach templates'],
  },
  {
    type: 'upsell',
    name: 'Intelligent Upsell Engine',
    description: 'Trigger upgrade prompts at optimal moments based on usage patterns',
    estimatedRevenueLift: '+25-50% upgrade rate',
    implementationEffort: 'medium',
    timeToFirstRevenue: '1-2 weeks',
    requirements: ['Usage metering', 'In-app messaging', 'Email triggers'],
  },
];

// ============================================================================
// High-Value Affiliate Programs for Dev Tools
// ============================================================================

export const DEV_TOOL_AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    name: 'Vercel',
    type: 'hosting',
    commission: '$50-500 per conversion',
    cookieDuration: '90 days',
    relevanceScore: 0.95,
    signupUrl: 'https://vercel.com/partners',
    integrationMethod: 'link',
    estimatedEarnings: '$500-2000/mo',
    audienceMatch: 'Frontend/fullstack devs deploying apps',
  },
  {
    name: 'Railway',
    type: 'hosting',
    commission: '25% recurring for 12 months',
    cookieDuration: '90 days',
    relevanceScore: 0.93,
    signupUrl: 'https://railway.app/affiliate',
    integrationMethod: 'link',
    estimatedEarnings: '$300-1500/mo',
    audienceMatch: 'Devs deploying backends, databases',
  },
  {
    name: 'Supabase',
    type: 'saas',
    commission: '10% recurring',
    cookieDuration: '60 days',
    relevanceScore: 0.90,
    signupUrl: 'https://supabase.com/partners',
    integrationMethod: 'link',
    estimatedEarnings: '$200-1000/mo',
    audienceMatch: 'Devs needing auth, database, realtime',
  },
  {
    name: 'DigitalOcean',
    type: 'hosting',
    commission: '$200 per qualified signup',
    cookieDuration: '90 days',
    relevanceScore: 0.88,
    signupUrl: 'https://www.digitalocean.com/partners',
    integrationMethod: 'link',
    estimatedEarnings: '$400-2000/mo',
    audienceMatch: 'Devs needing VPS, Kubernetes',
  },
  {
    name: 'Stripe',
    type: 'saas',
    commission: '$5-15 per activated account',
    cookieDuration: '90 days',
    relevanceScore: 0.85,
    signupUrl: 'https://stripe.com/partners',
    integrationMethod: 'api',
    estimatedEarnings: '$100-500/mo',
    audienceMatch: 'Devs adding payments to apps',
  },
  {
    name: 'Clerk',
    type: 'saas',
    commission: '20% recurring',
    cookieDuration: '90 days',
    relevanceScore: 0.82,
    signupUrl: 'https://clerk.com/partners',
    integrationMethod: 'link',
    estimatedEarnings: '$200-800/mo',
    audienceMatch: 'Devs needing auth/user management',
  },
  {
    name: 'Linear',
    type: 'saas',
    commission: '20% recurring for 12 months',
    cookieDuration: '60 days',
    relevanceScore: 0.80,
    signupUrl: 'https://linear.app/partners',
    integrationMethod: 'link',
    estimatedEarnings: '$100-600/mo',
    audienceMatch: 'Dev teams needing project management',
  },
  {
    name: 'Algolia',
    type: 'saas',
    commission: '10% recurring',
    cookieDuration: '90 days',
    relevanceScore: 0.75,
    signupUrl: 'https://www.algolia.com/partners',
    integrationMethod: 'link',
    estimatedEarnings: '$200-1000/mo',
    audienceMatch: 'Devs adding search to apps',
  },
];

// ============================================================================
// Lead Scoring Weights
// ============================================================================

export const LEAD_SCORING_WEIGHTS = {
  usage: {
    analyses_run: { weight: 0.2, thresholds: { low: 1, medium: 5, high: 10 } },
    strategies_generated: { weight: 0.25, thresholds: { low: 1, medium: 3, high: 5 } },
    features_explored: { weight: 0.15, thresholds: { low: 2, medium: 5, high: 8 } },
  },
  engagement: {
    days_active: { weight: 0.15, thresholds: { low: 1, medium: 3, high: 7 } },
    return_visits: { weight: 0.1, thresholds: { low: 1, medium: 3, high: 5 } },
    docs_visited: { weight: 0.05, thresholds: { low: 1, medium: 5, high: 10 } },
  },
  intent: {
    pricing_page_views: { weight: 0.3, thresholds: { low: 1, medium: 2, high: 3 } },
    upgrade_modal_opens: { weight: 0.35, thresholds: { low: 1, medium: 2, high: 3 } },
    enterprise_interest: { weight: 0.4, thresholds: { low: 0, medium: 1, high: 1 } },
  },
  firmographic: {
    company_size: { weight: 0.2, thresholds: { low: 1, medium: 10, high: 50 } },
    funding_stage: { weight: 0.15, thresholds: { low: 0, medium: 1, high: 2 } },
  },
};
