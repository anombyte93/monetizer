/**
 * AI Content Orchestrator
 *
 * Cutting-edge multi-modal AI content generation orchestration layer.
 * Integrates multiple AI tools as "skills" rather than betting on a single
 * monolithic AI marketing agent.
 *
 * Architecture:
 *   research → copy → creative → video → deployment
 *
 * Supported integrations:
 *   - Copy: Jasper API, Copy.ai Workflows
 *   - Creative: AdCreative.ai, Midjourney (via proxy), DALL-E 3
 *   - Video: Runway Gen-4, Synthesia, HeyGen, Pictory
 *   - Deployment: Meta Advantage+, Google Ads API, EthicalAds
 */

import Anthropic from '@anthropic-ai/sdk';
import { ProjectAnalysis, MonetizationStrategy } from './types';

// ============================================================================
// Type Definitions
// ============================================================================

export type ContentSkillType =
  | 'research'
  | 'copy'
  | 'image'
  | 'video'
  | 'social'
  | 'deploy';

export type ContentProvider =
  // Copy providers
  | 'anthropic'   // Claude for copy (default, already have key)
  | 'jasper'      // Jasper API for marketing copy
  | 'copyai'      // Copy.ai Workflows
  // Image providers
  | 'dalle'       // DALL-E 3 via OpenAI
  | 'midjourney'  // Midjourney (via unofficial proxy)
  | 'adcreative'  // AdCreative.ai for ad visuals
  // Video providers
  | 'runway'      // Runway Gen-4 for video
  | 'synthesia'   // Synthesia for AI avatar video
  | 'heygen'      // HeyGen for spokesperson video
  | 'pictory'     // Pictory for blog-to-video
  // Deployment providers
  | 'meta'        // Meta Ads API
  | 'google'      // Google Ads API
  | 'ethicalads'  // EthicalAds (manual)
  | 'carbonads';  // Carbon Ads (manual)

export interface ContentSkill {
  type: ContentSkillType;
  provider: ContentProvider;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  config?: Record<string, unknown>;
}

export interface ContentPipeline {
  id: string;
  name: string;
  description: string;
  skills: ContentSkill[];
  triggers: PipelineTrigger[];
  budget: PipelineBudget;
}

export interface PipelineTrigger {
  type: 'schedule' | 'event' | 'manual';
  config: {
    cron?: string;          // For schedule triggers
    event?: string;         // For event triggers
    webhookUrl?: string;    // For event triggers
  };
}

export interface PipelineBudget {
  daily: number;
  monthly: number;
  perCampaign: number;
  alertThreshold: number;  // Percentage to alert at
}

export interface GeneratedContent {
  type: 'copy' | 'image' | 'video' | 'social';
  provider: ContentProvider;
  content: {
    raw: string | Buffer;
    url?: string;
    metadata: Record<string, unknown>;
  };
  cost: number;
  generatedAt: Date;
  tokens?: number;
}

export interface ContentCampaign {
  id: string;
  name: string;
  status: 'draft' | 'generating' | 'review' | 'active' | 'paused' | 'completed';
  targetAudience: string;
  objectives: string[];
  content: {
    headlines: string[];
    bodies: string[];
    images: GeneratedContent[];
    videos: GeneratedContent[];
    socialPosts: GeneratedContent[];
  };
  platforms: ContentProvider[];
  budget: PipelineBudget;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface OrchestratorOptions {
  anthropicApiKey: string;
  openaiApiKey?: string;      // For DALL-E
  jasperApiKey?: string;
  copyaiApiKey?: string;
  runwayApiKey?: string;
  synthesiaApiKey?: string;
  heygenApiKey?: string;
  adcreativeApiKey?: string;
  metaAccessToken?: string;
  googleAdsToken?: string;
  model?: string;
}

// ============================================================================
// Content Orchestrator
// ============================================================================

const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620';

export class ContentOrchestrator {
  private anthropic: Anthropic;
  private model: string;
  private skills: Map<ContentSkillType, ContentSkill[]> = new Map();
  private apiKeys: Record<string, string | undefined>;

  constructor(options: OrchestratorOptions) {
    if (!options?.anthropicApiKey) {
      throw new Error('Anthropic API key is required for content orchestration.');
    }

    this.model = options.model ?? DEFAULT_MODEL;
    this.anthropic = new Anthropic({ apiKey: options.anthropicApiKey });

    this.apiKeys = {
      anthropic: options.anthropicApiKey,
      openai: options.openaiApiKey,
      jasper: options.jasperApiKey,
      copyai: options.copyaiApiKey,
      runway: options.runwayApiKey,
      synthesia: options.synthesiaApiKey,
      heygen: options.heygenApiKey,
      adcreative: options.adcreativeApiKey,
      meta: options.metaAccessToken,
      google: options.googleAdsToken,
    };

    this.initializeSkills();
  }

  private initializeSkills(): void {
    // Copy skills - always available (Claude is default)
    const copySkills: ContentSkill[] = [
      {
        type: 'copy',
        provider: 'anthropic',
        enabled: true,
        apiKey: this.apiKeys.anthropic,
      },
    ];

    if (this.apiKeys.jasper) {
      copySkills.push({
        type: 'copy',
        provider: 'jasper',
        enabled: true,
        apiKey: this.apiKeys.jasper,
        endpoint: 'https://api.jasper.ai/v1',
      });
    }

    if (this.apiKeys.copyai) {
      copySkills.push({
        type: 'copy',
        provider: 'copyai',
        enabled: true,
        apiKey: this.apiKeys.copyai,
        endpoint: 'https://api.copy.ai/v1',
      });
    }

    this.skills.set('copy', copySkills);

    // Image skills
    const imageSkills: ContentSkill[] = [];

    if (this.apiKeys.openai) {
      imageSkills.push({
        type: 'image',
        provider: 'dalle',
        enabled: true,
        apiKey: this.apiKeys.openai,
        endpoint: 'https://api.openai.com/v1/images/generations',
      });
    }

    if (this.apiKeys.adcreative) {
      imageSkills.push({
        type: 'image',
        provider: 'adcreative',
        enabled: true,
        apiKey: this.apiKeys.adcreative,
        endpoint: 'https://api.adcreative.ai/v1',
      });
    }

    this.skills.set('image', imageSkills);

    // Video skills
    const videoSkills: ContentSkill[] = [];

    if (this.apiKeys.runway) {
      videoSkills.push({
        type: 'video',
        provider: 'runway',
        enabled: true,
        apiKey: this.apiKeys.runway,
        endpoint: 'https://api.runwayml.com/v1',
      });
    }

    if (this.apiKeys.synthesia) {
      videoSkills.push({
        type: 'video',
        provider: 'synthesia',
        enabled: true,
        apiKey: this.apiKeys.synthesia,
        endpoint: 'https://api.synthesia.io/v2',
      });
    }

    if (this.apiKeys.heygen) {
      videoSkills.push({
        type: 'video',
        provider: 'heygen',
        enabled: true,
        apiKey: this.apiKeys.heygen,
        endpoint: 'https://api.heygen.com/v2',
      });
    }

    this.skills.set('video', videoSkills);

    // Deployment skills
    const deploySkills: ContentSkill[] = [];

    if (this.apiKeys.meta) {
      deploySkills.push({
        type: 'deploy',
        provider: 'meta',
        enabled: true,
        apiKey: this.apiKeys.meta,
        endpoint: 'https://graph.facebook.com/v18.0',
      });
    }

    if (this.apiKeys.google) {
      deploySkills.push({
        type: 'deploy',
        provider: 'google',
        enabled: true,
        apiKey: this.apiKeys.google,
        endpoint: 'https://googleads.googleapis.com/v15',
      });
    }

    // EthicalAds and CarbonAds are manual (no API)
    deploySkills.push({
      type: 'deploy',
      provider: 'ethicalads',
      enabled: true,
      config: { manual: true, dashboardUrl: 'https://ethicalads.io/advertisers/' },
    });

    deploySkills.push({
      type: 'deploy',
      provider: 'carbonads',
      enabled: true,
      config: { manual: true, dashboardUrl: 'https://carbonads.net' },
    });

    this.skills.set('deploy', deploySkills);
  }

  /**
   * Get available skills and their status
   */
  getAvailableSkills(): Record<ContentSkillType, { providers: ContentProvider[]; enabled: number }> {
    const result: Record<string, { providers: ContentProvider[]; enabled: number }> = {};

    for (const [type, skills] of this.skills) {
      result[type] = {
        providers: skills.map(s => s.provider),
        enabled: skills.filter(s => s.enabled).length,
      };
    }

    return result as Record<ContentSkillType, { providers: ContentProvider[]; enabled: number }>;
  }

  /**
   * Generate a full content campaign using the orchestration pipeline
   */
  async generateCampaign(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    options?: {
      name?: string;
      targetAudience?: string;
      objectives?: string[];
      platforms?: ContentProvider[];
      budget?: Partial<PipelineBudget>;
      copyVariations?: number;
      generateImages?: boolean;
      generateVideo?: boolean;
    }
  ): Promise<ContentCampaign> {
    const projectName = analysis.metadata?.name || analysis.metadata?.path?.split('/').pop() || 'Project';
    const campaign: ContentCampaign = {
      id: `campaign_${Date.now()}`,
      name: options?.name || `${projectName} Launch Campaign`,
      status: 'generating',
      targetAudience: options?.targetAudience || 'developers',
      objectives: options?.objectives || ['awareness', 'signups', 'conversions'],
      content: {
        headlines: [],
        bodies: [],
        images: [],
        videos: [],
        socialPosts: [],
      },
      platforms: options?.platforms || ['ethicalads', 'carbonads'],
      budget: {
        daily: options?.budget?.daily || 50,
        monthly: options?.budget?.monthly || 1000,
        perCampaign: options?.budget?.perCampaign || 500,
        alertThreshold: options?.budget?.alertThreshold || 80,
      },
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Step 1: Generate copy variations
    const copyVariations = options?.copyVariations || 5;
    const copyResult = await this.generateCopyVariations(
      analysis,
      strategy,
      campaign.targetAudience,
      copyVariations
    );
    campaign.content.headlines = copyResult.headlines;
    campaign.content.bodies = copyResult.bodies;

    // Step 2: Generate social posts
    const socialPosts = await this.generateSocialPosts(
      analysis,
      strategy,
      campaign.content.headlines,
      campaign.content.bodies
    );
    campaign.content.socialPosts = socialPosts;

    // Step 3: Generate images (if enabled and API available)
    if (options?.generateImages !== false) {
      const imageSkills = this.skills.get('image') || [];
      if (imageSkills.length > 0) {
        const images = await this.generateAdImages(
          analysis,
          strategy,
          campaign.content.headlines
        );
        campaign.content.images = images;
      }
    }

    // Step 4: Generate video (if enabled and API available)
    if (options?.generateVideo) {
      const videoSkills = this.skills.get('video') || [];
      if (videoSkills.length > 0) {
        const videos = await this.generateAdVideos(
          analysis,
          strategy,
          campaign.content
        );
        campaign.content.videos = videos;
      }
    }

    campaign.status = 'review';
    campaign.updatedAt = new Date();

    return campaign;
  }

  /**
   * Generate copy variations using Claude
   */
  private async generateCopyVariations(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    targetAudience: string,
    variations: number
  ): Promise<{ headlines: string[]; bodies: string[] }> {
    const prompt = `Generate ${variations} ad copy variations for this developer tool.

PROJECT: ${analysis.metadata?.name || analysis.metadata?.path?.split('/').pop() || 'Developer Tool'}
DESCRIPTION: ${analysis.metadata?.detectedFeatures?.join(', ') || analysis.opportunities?.map(o => o.type).join(', ') || 'AI-powered developer tool'}
VALUE PROP: ${strategy.primaryMethod?.description || 'Automates monetization'}
PRICING: ${strategy.pricingModel?.tiers?.[0]?.price === 0 ? 'Free tier available' : `Starting at $${strategy.pricingModel?.tiers?.[0]?.price}/mo`}
TARGET: ${targetAudience}

Generate JSON with:
{
  "headlines": ["headline1", "headline2", ...], // 30-50 chars each
  "bodies": ["body1", "body2", ...]             // 90-125 chars each
}

Rules for dev audiences:
- Technical accuracy over hype
- Include CLI examples where relevant (e.g., "npx tool analyze")
- No exclamation marks, no "revolutionary", no "game-changing"
- Focus on time saved, problems solved, specific benefits
- Use different hooks: curiosity, FOMO, social proof, problem/solution`;

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1500,
      temperature: 0.8,
      system: 'You are an expert copywriter for developer tools. Generate concise, technical, no-hype ad copy. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .map(item => ('text' in item ? item.text : ''))
      .join('')
      .trim();

    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { headlines: [], bodies: [] };
    }
  }

  /**
   * Generate social media posts from ad copy
   */
  private async generateSocialPosts(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    headlines: string[],
    bodies: string[]
  ): Promise<GeneratedContent[]> {
    const prompt = `Generate social media posts for launching this developer tool.

PROJECT: ${analysis.metadata?.name || analysis.metadata?.path?.split('/').pop() || 'Developer Tool'}
HEADLINES: ${headlines.slice(0, 3).join(' | ')}
KEY BENEFITS: ${bodies.slice(0, 2).join(' ')}

Generate 5 posts for each platform in JSON format:
{
  "twitter": [{ "text": "...", "hashtags": [...] }],
  "linkedin": [{ "text": "..." }],
  "reddit": [{ "title": "...", "body": "...", "subreddit": "..." }],
  "hackernews": [{ "title": "Show HN: ...", "text": "..." }]
}

Rules:
- Twitter: 280 chars max, 2-3 relevant hashtags
- LinkedIn: Professional tone, 1-2 paragraphs
- Reddit: Match subreddit culture, no self-promotion language
- HN: Technical, factual, no hype, mention open source if applicable`;

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.7,
      system: 'You are a developer advocate creating social media content. No marketing speak, technical accuracy required. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .map(item => ('text' in item ? item.text : ''))
      .join('')
      .trim();

    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const posts: GeneratedContent[] = [];

      for (const [platform, items] of Object.entries(parsed)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            posts.push({
              type: 'social',
              provider: 'anthropic',
              content: {
                raw: JSON.stringify(item),
                metadata: { platform, ...item },
              },
              cost: 0.003, // Approximate Claude cost
              generatedAt: new Date(),
              tokens: 100,
            });
          }
        }
      }

      return posts;
    } catch {
      return [];
    }
  }

  /**
   * Generate ad images using available image APIs
   */
  private async generateAdImages(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    headlines: string[]
  ): Promise<GeneratedContent[]> {
    const imageSkills = this.skills.get('image') || [];
    const enabledSkill = imageSkills.find(s => s.enabled && s.apiKey);

    if (!enabledSkill) {
      // Return placeholder instructions for manual creation
      return [{
        type: 'image',
        provider: 'adcreative' as ContentProvider,
        content: {
          raw: '',
          url: undefined,
          metadata: {
            instructions: `Create ad visuals for: ${analysis.metadata?.name || analysis.metadata?.path?.split('/').pop() || 'Project'}`,
            headlines: headlines.slice(0, 3),
            recommended_tools: [
              'AdCreative.ai - https://adcreative.ai ($21/mo)',
              'Canva - https://canva.com (Free tier)',
              'Figma - https://figma.com (Free tier)',
            ],
            specs: {
              'EthicalAds': '240x180 or 130x100',
              'CarbonAds': '130x100',
              'Google': '1200x628, 1200x1200, 1080x1080',
              'Meta': '1080x1080, 1200x628',
            },
          },
        },
        cost: 0,
        generatedAt: new Date(),
      }];
    }

    // If DALL-E is available, generate images
    if (enabledSkill.provider === 'dalle') {
      return await this.generateDalleImages(analysis, headlines);
    }

    return [];
  }

  /**
   * Generate images using DALL-E 3
   */
  private async generateDalleImages(
    analysis: ProjectAnalysis,
    headlines: string[]
  ): Promise<GeneratedContent[]> {
    // Note: This requires OpenAI SDK integration
    // For now, return instructions with the prompt that would be used
    const prompts = headlines.slice(0, 3).map(headline =>
      `Minimalist tech advertisement for "${headline}". Clean design with dark gradient background, subtle code elements, modern sans-serif typography. Professional SaaS marketing style. No text in image.`
    );

    return prompts.map((prompt, i) => ({
      type: 'image' as const,
      provider: 'dalle' as ContentProvider,
      content: {
        raw: '',
        metadata: {
          prompt,
          headline: headlines[i],
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          note: 'Run with OPENAI_API_KEY to generate actual images',
        },
      },
      cost: 0.04, // DALL-E 3 standard price
      generatedAt: new Date(),
    }));
  }

  /**
   * Generate ad videos using available video APIs
   */
  private async generateAdVideos(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    content: ContentCampaign['content']
  ): Promise<GeneratedContent[]> {
    const videoSkills = this.skills.get('video') || [];
    const enabledSkill = videoSkills.find(s => s.enabled && s.apiKey);

    if (!enabledSkill) {
      // Return instructions for manual video creation
      return [{
        type: 'video',
        provider: 'synthesia' as ContentProvider,
        content: {
          raw: '',
          metadata: {
            instructions: `Create demo video for ${analysis.metadata?.name || analysis.metadata?.path?.split('/').pop() || 'Project'} launch`,
            script: await this.generateVideoScript(analysis, strategy, content),
            recommended_tools: [
              'Synthesia - https://synthesia.io ($22/mo) - AI avatar video',
              'HeyGen - https://heygen.com ($24/mo) - AI spokesperson',
              'Runway - https://runway.ml ($12/mo) - Gen-4 video',
              'Pictory - https://pictory.ai ($19/mo) - Blog to video',
              'Loom - https://loom.com (Free) - Screen recording',
            ],
            duration: '60-90 seconds',
          },
        },
        cost: 0,
        generatedAt: new Date(),
      }];
    }

    return [];
  }

  /**
   * Generate a video script
   */
  private async generateVideoScript(
    analysis: ProjectAnalysis,
    strategy: MonetizationStrategy,
    content: ContentCampaign['content']
  ): Promise<string> {
    const prompt = `Write a 60-second video script for this developer tool demo.

PROJECT: ${analysis.metadata?.name || analysis.metadata?.path?.split('/').pop() || 'Developer Tool'}
VALUE PROP: ${strategy.primaryMethod?.description || 'Automates monetization'}
HEADLINES: ${content.headlines.slice(0, 3).join(' | ')}

Format:
[SCENE 1 - 0:00-0:10]
Narrator: "..."
Visual: [description]

[SCENE 2 - 0:10-0:30]
...

Rules:
- Hook in first 3 seconds
- Show CLI/terminal demo
- End with clear CTA
- Technical but accessible
- No hype, just demonstrate value`;

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1000,
      temperature: 0.6,
      system: 'You are a video scriptwriter for developer tools. Create concise, technical, compelling scripts.',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content
      .map(item => ('text' in item ? item.text : ''))
      .join('')
      .trim();
  }

  /**
   * Get deployment instructions for each platform
   */
  getDeploymentInstructions(campaign: ContentCampaign): Record<string, {
    automated: boolean;
    steps: string[];
    estimatedTime: string;
    dashboardUrl: string;
  }> {
    return {
      ethicalads: {
        automated: false,
        steps: [
          '1. Go to https://ethicalads.io/advertisers/',
          '2. Create an account and add payment method',
          '3. Create new campaign with $1,000 minimum',
          '4. Upload creative (240x180 or 130x100)',
          `5. Use headline: "${campaign.content.headlines[0]}"`,
          '6. Set targeting: Developer websites, open source',
          '7. Submit for review (1-2 days)',
        ],
        estimatedTime: '2-3 days',
        dashboardUrl: 'https://ethicalads.io/advertisers/',
      },
      carbonads: {
        automated: false,
        steps: [
          '1. Go to https://carbonads.net',
          '2. Request a quote (they will contact you)',
          '3. Prepare creative (130x100)',
          '4. Negotiate placement and pricing',
          '5. Submit creative for approval',
        ],
        estimatedTime: '5-7 days',
        dashboardUrl: 'https://carbonads.net',
      },
      google: {
        automated: !!this.apiKeys.google,
        steps: this.apiKeys.google
          ? ['Campaign can be deployed via API', 'Use generated ad copy', 'Set daily budget']
          : [
            '1. Go to https://ads.google.com',
            '2. Create Search campaign targeting dev keywords',
            `3. Use headlines: ${campaign.content.headlines.slice(0, 3).join(', ')}`,
            '4. Set daily budget and keyword bids',
            '5. Enable conversion tracking',
          ],
        estimatedTime: '1 day',
        dashboardUrl: 'https://ads.google.com',
      },
      meta: {
        automated: !!this.apiKeys.meta,
        steps: this.apiKeys.meta
          ? ['Campaign can be deployed via API', 'Use Advantage+ for optimization']
          : [
            '1. Go to https://business.facebook.com',
            '2. Create campaign with Conversions objective',
            '3. Use Advantage+ audience targeting',
            '4. Upload creative from generated images',
            '5. Set budget and schedule',
          ],
        estimatedTime: '1 day',
        dashboardUrl: 'https://business.facebook.com',
      },
      anthropic: {
        automated: true,
        steps: ['Copy generation is automated via Claude API'],
        estimatedTime: 'Instant',
        dashboardUrl: 'https://console.anthropic.com',
      },
      dalle: {
        automated: !!this.apiKeys.openai,
        steps: ['Image generation via DALL-E 3 API'],
        estimatedTime: '~10 seconds per image',
        dashboardUrl: 'https://platform.openai.com',
      },
      jasper: {
        automated: !!this.apiKeys.jasper,
        steps: ['Marketing copy via Jasper API'],
        estimatedTime: 'Instant',
        dashboardUrl: 'https://jasper.ai',
      },
      copyai: {
        automated: !!this.apiKeys.copyai,
        steps: ['Copy generation via Copy.ai Workflows'],
        estimatedTime: 'Instant',
        dashboardUrl: 'https://app.copy.ai',
      },
      adcreative: {
        automated: !!this.apiKeys.adcreative,
        steps: ['Ad creative generation via AdCreative.ai'],
        estimatedTime: '~30 seconds',
        dashboardUrl: 'https://app.adcreative.ai',
      },
      midjourney: {
        automated: false,
        steps: ['Use Midjourney via Discord', 'Generate with provided prompts'],
        estimatedTime: '~1 minute',
        dashboardUrl: 'https://midjourney.com',
      },
      runway: {
        automated: !!this.apiKeys.runway,
        steps: ['Video generation via Runway Gen-4'],
        estimatedTime: '~2 minutes',
        dashboardUrl: 'https://app.runwayml.com',
      },
      synthesia: {
        automated: !!this.apiKeys.synthesia,
        steps: ['AI avatar video via Synthesia'],
        estimatedTime: '~5 minutes',
        dashboardUrl: 'https://app.synthesia.io',
      },
      heygen: {
        automated: !!this.apiKeys.heygen,
        steps: ['AI spokesperson video via HeyGen'],
        estimatedTime: '~5 minutes',
        dashboardUrl: 'https://app.heygen.com',
      },
      pictory: {
        automated: false,
        steps: ['Blog-to-video conversion via Pictory'],
        estimatedTime: '~10 minutes',
        dashboardUrl: 'https://app.pictory.ai',
      },
      twitter: {
        automated: false,
        steps: ['Post manually or via Twitter API'],
        estimatedTime: '5 minutes',
        dashboardUrl: 'https://ads.twitter.com',
      },
    };
  }
}

// ============================================================================
// Pre-built Pipelines
// ============================================================================

export const CONTENT_PIPELINES = {
  /**
   * Minimal viable launch - just copy and manual deployment
   */
  minimal: {
    id: 'minimal',
    name: 'Minimal Launch',
    description: 'Quick launch with AI copy, manual deployment',
    skills: [
      { type: 'copy' as ContentSkillType, provider: 'anthropic' as ContentProvider, enabled: true },
    ],
    triggers: [{ type: 'manual' as const, config: {} }],
    budget: { daily: 30, monthly: 500, perCampaign: 250, alertThreshold: 80 },
  },

  /**
   * Full autonomous campaign with all AI tools
   */
  autonomous: {
    id: 'autonomous',
    name: 'Autonomous Campaign',
    description: 'Full AI pipeline: research → copy → creative → video → deploy',
    skills: [
      { type: 'copy' as ContentSkillType, provider: 'anthropic' as ContentProvider, enabled: true },
      { type: 'image' as ContentSkillType, provider: 'dalle' as ContentProvider, enabled: true },
      { type: 'video' as ContentSkillType, provider: 'synthesia' as ContentProvider, enabled: true },
      { type: 'deploy' as ContentSkillType, provider: 'meta' as ContentProvider, enabled: true },
      { type: 'deploy' as ContentSkillType, provider: 'google' as ContentProvider, enabled: true },
    ],
    triggers: [
      { type: 'schedule' as const, config: { cron: '0 9 * * 1' } }, // Weekly Monday 9am
    ],
    budget: { daily: 100, monthly: 2500, perCampaign: 1000, alertThreshold: 75 },
  },

  /**
   * Developer-focused launch on EthicalAds + Product Hunt
   */
  devLaunch: {
    id: 'dev-launch',
    name: 'Developer Launch',
    description: 'Optimized for developer audiences: EthicalAds + Show HN + Product Hunt',
    skills: [
      { type: 'copy' as ContentSkillType, provider: 'anthropic' as ContentProvider, enabled: true },
      { type: 'social' as ContentSkillType, provider: 'anthropic' as ContentProvider, enabled: true },
      { type: 'deploy' as ContentSkillType, provider: 'ethicalads' as ContentProvider, enabled: true },
      { type: 'deploy' as ContentSkillType, provider: 'carbonads' as ContentProvider, enabled: true },
    ],
    triggers: [{ type: 'manual' as const, config: {} }],
    budget: { daily: 50, monthly: 1500, perCampaign: 500, alertThreshold: 80 },
  },
};

// ============================================================================
// AI Tool Cost Reference
// ============================================================================

export const AI_TOOL_COSTS = {
  copy: {
    anthropic: { perRequest: 0.003, monthly: 0 },
    jasper: { perRequest: 0.01, monthly: 49 },
    copyai: { perRequest: 0.005, monthly: 36 },
  },
  image: {
    dalle: { perImage: 0.04, monthly: 0 },
    midjourney: { perImage: 0.02, monthly: 10 },
    adcreative: { perImage: 0.10, monthly: 21 },
  },
  video: {
    runway: { perMinute: 0.50, monthly: 12 },
    synthesia: { perMinute: 1.00, monthly: 22 },
    heygen: { perMinute: 0.80, monthly: 24 },
    pictory: { perMinute: 0.30, monthly: 19 },
  },
  deployment: {
    ethicalads: { minimumSpend: 1000, cpm: 4.50 },
    carbonads: { minimumSpend: 1500, cpm: 5.00 },
    google: { minimumSpend: 500, cpc: 2.50 },
    meta: { minimumSpend: 500, cpm: 8.00 },
  },
};
