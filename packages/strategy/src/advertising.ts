import Anthropic from '@anthropic-ai/sdk';
import { ProjectAnalysis, MonetizationStrategy } from './types';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620';

export interface AdCopy {
  platform: 'ethicalads' | 'carbonads' | 'google' | 'meta' | 'twitter';
  headline: string;
  body: string;
  cta: string;
  targetAudience: string;
  estimatedCPC: string;
  hook: string;
}

export interface AdCampaign {
  name: string;
  budget: number;
  duration: string;
  platforms: AdPlatformStrategy[];
  totalEstimatedReach: string;
  expectedROI: string;
}

export interface AdPlatformStrategy {
  platform: string;
  recommended: boolean;
  minimumSpend: number;
  expectedCPC: string;
  expectedCTR: string;
  audienceMatch: 'high' | 'medium' | 'low';
  setupSteps: string[];
  adVariations: AdCopy[];
}

export interface AdvertisingStrategy {
  recommendedBudget: {
    minimum: number;
    optimal: number;
    aggressive: number;
  };
  platforms: AdPlatformStrategy[];
  aiTools: AIAdTool[];
  timeline: AdTimeline;
  metrics: AdMetrics;
}

export interface AIAdTool {
  name: string;
  purpose: string;
  monthlyCost: string;
  url: string;
  recommended: boolean;
}

export interface AdTimeline {
  week1: string[];
  week2to4: string[];
  month2to3: string[];
  ongoing: string[];
}

export interface AdMetrics {
  targetCAC: number;
  maxCAC: number;
  expectedConversionRate: string;
  breakEvenClicks: number;
}

export interface AdGeneratorOptions {
  anthropicApiKey: string;
  model?: string;
}

export class AdCopyGenerator {
  private anthropic: Anthropic;
  private model: string;

  constructor(options: AdGeneratorOptions) {
    if (!options?.anthropicApiKey) {
      throw new Error('Anthropic API key is required for ad generation.');
    }
    this.model = options.model ?? DEFAULT_MODEL;
    this.anthropic = new Anthropic({ apiKey: options.anthropicApiKey });
  }

  async generateAdvertisingStrategy(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    options?: { monthlyBudget?: number; targetAudience?: string }
  ): Promise<AdvertisingStrategy> {
    const prompt = this.buildStrategyPrompt(analysis, strategy, options);
    const response = await this.callClaude(prompt);
    return this.parseStrategyResponse(response);
  }

  async generateAdCopy(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    platform: AdCopy['platform'],
    variations: number = 5
  ): Promise<AdCopy[]> {
    const prompt = this.buildAdCopyPrompt(analysis, strategy, platform, variations);
    const response = await this.callClaude(prompt);
    return this.parseAdCopyResponse(response, platform);
  }

  private async callClaude(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.7, // Higher creativity for ad copy
      system: `You are an expert digital advertising strategist specializing in developer tools and SaaS products.
You understand EthicalAds, Carbon Ads, Google Ads, and Meta advertising deeply.
For developer audiences, you know that:
- EthicalAds and Carbon Ads are most effective (pre-qualified dev audience)
- Technical accuracy matters more than hype
- Show don't tell - code snippets and CLI examples convert well
- Developers hate clickbait - be direct and honest
Generate actionable, specific advertising strategies with realistic budgets and expectations.
Respond with valid JSON only.`,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .map((item) => ('text' in item ? item.text : ''))
      .join('')
      .trim();

    if (!text) throw new Error('Empty response from Claude');
    return text;
  }

  private buildStrategyPrompt(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    options?: { monthlyBudget?: number; targetAudience?: string }
  ): string {
    const budget = options?.monthlyBudget ?? 500;
    const audience = options?.targetAudience ?? 'developers';

    return `Generate a comprehensive advertising strategy for this developer tool.

PROJECT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

MONETIZATION STRATEGY:
- Primary method: ${strategy.primaryMethod?.name}
- Pricing: ${JSON.stringify(strategy.pricingModel?.tiers?.map(t => ({ name: t.name, price: t.price })))}

CONSTRAINTS:
- Monthly ad budget: $${budget}
- Target audience: ${audience}
- Goal: Maximize trial signups and conversions to paid

Return JSON with this structure:
{
  "recommendedBudget": {
    "minimum": number (smallest effective spend),
    "optimal": number (best ROI point),
    "aggressive": number (growth mode)
  },
  "platforms": [
    {
      "platform": "ethicalads" | "carbonads" | "google" | "meta" | "twitter",
      "recommended": boolean,
      "minimumSpend": number,
      "expectedCPC": "$X.XX",
      "expectedCTR": "X.X%",
      "audienceMatch": "high" | "medium" | "low",
      "setupSteps": ["step1", "step2", ...],
      "adVariations": [
        {
          "platform": string,
          "headline": string (max 30 chars for Google, 40 for others),
          "body": string (max 90 chars for Google, 125 for others),
          "cta": string,
          "targetAudience": string,
          "estimatedCPC": string,
          "hook": string (the psychological trigger)
        }
      ]
    }
  ],
  "aiTools": [
    {
      "name": string,
      "purpose": string,
      "monthlyCost": "$XX/mo",
      "url": string,
      "recommended": boolean
    }
  ],
  "timeline": {
    "week1": ["action1", "action2"],
    "week2to4": ["action1", "action2"],
    "month2to3": ["action1", "action2"],
    "ongoing": ["action1", "action2"]
  },
  "metrics": {
    "targetCAC": number (ideal cost to acquire customer),
    "maxCAC": number (maximum acceptable CAC based on LTV),
    "expectedConversionRate": "X%",
    "breakEvenClicks": number
  }
}

For dev tools, prioritize EthicalAds and Carbon Ads over Meta/Google.
Include at least 3 ad variations per recommended platform.
Be realistic about CPCs ($0.50-$3 for dev networks, $2-$10 for Google/Meta).`;
  }

  private buildAdCopyPrompt(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    platform: AdCopy['platform'],
    variations: number
  ): string {
    const platformSpecs: Record<string, { headline: number; body: number; style: string }> = {
      ethicalads: { headline: 50, body: 150, style: 'technical, honest, dev-focused' },
      carbonads: { headline: 50, body: 150, style: 'minimal, clean, developer-friendly' },
      google: { headline: 30, body: 90, style: 'direct, keyword-rich, action-oriented' },
      meta: { headline: 40, body: 125, style: 'benefit-focused, social proof' },
      twitter: { headline: 50, body: 200, style: 'conversational, hashtag-aware' },
    };

    const spec = platformSpecs[platform];

    return `Generate ${variations} ad copy variations for ${platform.toUpperCase()}.

PROJECT: ${analysis.metadata?.name || 'Developer Tool'}
VALUE PROP: ${strategy.primaryMethod?.description || 'AI-powered developer tool'}
PRICING: ${strategy.pricingModel?.tiers?.[0]?.price === 0 ? 'Free tier available' : `Starting at $${strategy.pricingModel?.tiers?.[0]?.price}/mo`}

PLATFORM SPECS:
- Max headline: ${spec.headline} chars
- Max body: ${spec.body} chars
- Style: ${spec.style}

Return JSON array:
[
  {
    "platform": "${platform}",
    "headline": "string (max ${spec.headline} chars)",
    "body": "string (max ${spec.body} chars)",
    "cta": "string",
    "targetAudience": "string",
    "estimatedCPC": "$X.XX",
    "hook": "string (psychological trigger: curiosity/fear/aspiration/social-proof/urgency)"
  }
]

Generate ${variations} DIFFERENT variations using different hooks and angles.
For devs: use code snippets in body when possible (e.g., "npx tool analyze").
Avoid: hype words, exclamation marks, "revolutionary", "game-changing".
Include: specific benefits, numbers, technical terms that resonate.`;
  }

  private parseStrategyResponse(content: string): AdvertisingStrategy {
    try {
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new Error('Failed to parse advertising strategy response');
    }
  }

  private parseAdCopyResponse(content: string, platform: string): AdCopy[] {
    try {
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new Error('Failed to parse ad copy response');
    }
  }
}

// Pre-built advertising recommendations for dev tools
export const DEV_TOOL_AD_RECOMMENDATIONS = {
  platforms: {
    ethicalads: {
      url: 'https://ethicalads.io',
      minimumSpend: 1000,
      cpmRange: '$3-$6',
      bestFor: 'Open source, privacy-focused dev tools',
      setupTime: '1-2 days',
    },
    carbonads: {
      url: 'https://carbonads.net',
      minimumSpend: 1500,
      cpmRange: 'Custom quote',
      bestFor: 'Developer tools with broad appeal',
      setupTime: '3-5 days (approval required)',
    },
    google: {
      url: 'https://ads.google.com',
      minimumSpend: 500,
      cpcRange: '$2-$10',
      bestFor: 'High-intent search traffic',
      setupTime: '1 day',
    },
  },
  aiTools: {
    adcreative: {
      name: 'AdCreative.ai',
      url: 'https://adcreative.ai',
      cost: '$21-$141/mo',
      bestFor: 'Generating visual ad creatives at scale',
    },
    copyai: {
      name: 'Copy.ai',
      url: 'https://copy.ai',
      cost: '$36-$186/mo',
      bestFor: 'Ad copy variations and landing page copy',
    },
    jasper: {
      name: 'Jasper',
      url: 'https://jasper.ai',
      cost: '$39-$99/mo',
      bestFor: 'Full marketing campaigns with brand voice',
    },
  },
  bootstrapperBudget: {
    minimum: 500,
    recommended: 1500,
    allocation: {
      ethicalads: 0.4, // 40% to dev-focused networks
      carbonads: 0.3,
      google: 0.2,
      aiTools: 0.1,
    },
  },
};
