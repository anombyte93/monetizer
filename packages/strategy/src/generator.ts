import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import {
  AIProvider,
  GenerateOptions,
  ImplementationPlan,
  MonetizationStrategy,
  ProjectAnalysis,
  RevenueProjections,
  StrategyGeneratorOptions,
  StrategyType,
} from './types';

const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20240620';
const DEFAULT_OPENAI_MODEL = 'gpt-4o';

export class StrategyGenerator {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private provider: AIProvider;
  private model: string;
  private baseOptions: StrategyGeneratorOptions;

  constructor(options: StrategyGeneratorOptions) {
    // Determine which provider to use
    if (options.provider) {
      this.provider = options.provider;
    } else if (options.anthropicApiKey) {
      this.provider = 'anthropic';
    } else if (options.openaiApiKey) {
      this.provider = 'openai';
    } else {
      throw new Error('Either Anthropic or OpenAI API key is required to generate strategies.');
    }

    this.baseOptions = options;

    // Initialize the appropriate client
    if (this.provider === 'anthropic') {
      if (!options.anthropicApiKey) {
        throw new Error('Anthropic API key is required when using Anthropic provider.');
      }
      this.anthropic = new Anthropic({ apiKey: options.anthropicApiKey });
      this.model = options.model ?? DEFAULT_ANTHROPIC_MODEL;
    } else {
      if (!options.openaiApiKey) {
        throw new Error('OpenAI API key is required when using OpenAI provider.');
      }
      this.openai = new OpenAI({ apiKey: options.openaiApiKey });
      this.model = options.model ?? DEFAULT_OPENAI_MODEL;
    }
  }

  async generate(analysis: ProjectAnalysis, options?: GenerateOptions): Promise<MonetizationStrategy> {
    if (!analysis) {
      throw new Error('Project analysis is required to generate a monetization strategy.');
    }

    const generationOptions = {
      includeResearch: options?.includeResearch ?? this.baseOptions.includeResearch ?? false,
      preferredMethod: options?.preferredMethod ?? this.baseOptions.preferredMethod,
      targetMRR: options?.targetMRR ?? this.baseOptions.targetRevenue,
      constraints: options?.constraints,
    };

    const prompt = this.buildPrompt(analysis, generationOptions);
    const responseText = await this.callAI(prompt);
    const rawStrategy = this.parseJsonResponse(responseText);
    const strategy = this.composeStrategy(rawStrategy, analysis, generationOptions.includeResearch);

    this.validateStrategy(strategy);

    return strategy;
  }

  private async callAI(prompt: string): Promise<string> {
    const systemPrompt =
      'You are an expert software product monetization strategist. ' +
      'Generate concise, actionable strategies with clear pricing, implementation phases, and revenue projections. ' +
      'Respond with a single valid JSON object that matches the requested structure. Do not include any prose or commentary.';

    if (this.provider === 'anthropic' && this.anthropic) {
      return this.callAnthropic(prompt, systemPrompt);
    } else if (this.openai) {
      return this.callOpenAI(prompt, systemPrompt);
    }

    throw new Error('No AI provider configured');
  }

  private async callAnthropic(prompt: string, systemPrompt: string): Promise<string> {
    try {
      const response = await this.anthropic!.messages.create({
        model: this.model,
        max_tokens: 1800,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = (response.content ?? [])
        .map((item) => ('text' in item ? item.text : ''))
        .join('')
        .trim();

      if (!textContent) {
        throw new Error('Anthropic returned an empty response.');
      }

      return textContent;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate strategy with Anthropic: ${message}`);
    }
  }

  private async callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
    try {
      const response = await this.openai!.chat.completions.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = response.choices[0]?.message?.content?.trim() ?? '';

      if (!textContent) {
        throw new Error('OpenAI returned an empty response.');
      }

      return textContent;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate strategy with OpenAI: ${message}`);
    }
  }

  private buildPrompt(
    analysis: ProjectAnalysis,
    options: {
      includeResearch: boolean;
      preferredMethod?: StrategyType;
      targetMRR?: number;
      constraints?: GenerateOptions['constraints'];
    }
  ): string {
    const preferenceNotes = [
      options.preferredMethod ? `Preferred method: ${options.preferredMethod}` : null,
      options.targetMRR ? `Target monthly recurring revenue: $${options.targetMRR}` : null,
      options.constraints?.maxTimeToLaunch ? `Max time to launch: ${options.constraints.maxTimeToLaunch}` : null,
      options.constraints?.budget ? `Budget: $${options.constraints.budget}` : null,
      options.constraints?.teamSize ? `Team size: ${options.constraints.teamSize}` : null,
      options.includeResearch ? 'Include optional marketResearch section if helpful.' : null,
    ]
      .filter(Boolean)
      .join('\n');

    const schema = `Return JSON with:
{
  "primaryMethod": { "type": "saas|api|freemium|sponsorship|marketplace|licensing", "name": string, "description": string, "pros": string[], "cons": string[], "timeToRevenue": string, "requiredFeatures": string[] },
  "alternativeMethods": StrategyMethod[],
  "pricingModel": { "type": "tiered|usage|freemium|flat|sponsorship", "currency": "USD" | string, "tiers": [ { "name": string, "price": number, "billingPeriod": "monthly|yearly|one-time|per-use", "features": string[], "limits": Record<string, number|string> }, ... ], "recommendedStartingTier": string },
  "implementationPlan": { "totalDuration": string, "phases": [ { "name": string, "duration": string, "tasks": [ { "title": string, "description": string, "estimatedHours": number, "priority": "critical|high|medium|low", "skills": string[] } ], "deliverables": string[], "dependencies": string[] } ], "criticalPath": string[], "risks": [ { "description": string, "probability": "High|Medium|Low", "impact": "High|Medium|Low", "mitigation": string } ] },
  "projections": { "month1": number, "month3": number, "month6": number, "month12": number, "breakEvenMonths": number, "assumptions": string[] },
  "reasoning": string,
  "confidence": number${options.includeResearch ? ', "marketResearch": { "competitors": [ { "name": string, "pricing": string, "strengths": string[], "weaknesses": string[], "marketShare": string } ], "marketSize": string, "targetAudience": string[], "pricingBenchmarks": [ { "category": string, "lowEnd": number, "midRange": number, "highEnd": number, "notes": string } ], "trends": string[], "sources": string[] }' : ''}
}`;

    return [
      'You will receive a project analysis JSON. Generate a monetization strategy tailored to the project capabilities.',
      'Requirements:',
      '- Provide one primary monetization method plus 1-3 strong alternatives.',
      '- Pricing tiers must be realistic and progressive for early-stage products.',
      '- Implementation phases should be execution-ready with tasks and deliverables.',
      '- Revenue projections should be conservative and note key assumptions.',
      '- Confidence is a 0-1 float.',
      preferenceNotes || 'No additional preferences.',
      'Output must be valid JSON only. Do not wrap in Markdown code fences.',
      'Project analysis:',
      JSON.stringify(analysis, null, 2),
      'JSON schema:',
      schema,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private parseJsonResponse(content: string): any {
    try {
      const trimmed = content.trim();
      const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
      const jsonString = fenced ? fenced[1].trim() : trimmed.replace(/```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      throw new Error(`AI response could not be parsed as JSON: ${message}`);
    }
  }

  private composeStrategy(
    partial: any,
    analysis: ProjectAnalysis,
    includeResearch: boolean
  ): MonetizationStrategy {
    const implementationPlan = this.normalizeImplementationPlan(partial?.implementationPlan);

    const projections: RevenueProjections = {
      month1: this.toNumber(partial?.projections?.month1),
      month3: this.toNumber(partial?.projections?.month3),
      month6: this.toNumber(partial?.projections?.month6),
      month12: this.toNumber(partial?.projections?.month12),
      breakEvenMonths: this.toNumber(partial?.projections?.breakEvenMonths),
      assumptions: partial?.projections?.assumptions ?? [],
    };

    return {
      id: randomUUID(),
      generatedAt: new Date().toISOString(),
      projectPath: analysis.metadata?.path ?? 'unknown',
      primaryMethod: partial?.primaryMethod,
      alternativeMethods: partial?.alternativeMethods ?? [],
      pricingModel: partial?.pricingModel,
      implementationPlan,
      projections,
      reasoning: partial?.reasoning ?? '',
      confidence: this.normalizeConfidence(partial?.confidence),
      marketResearch: includeResearch ? partial?.marketResearch : undefined,
    };
  }

  private normalizeImplementationPlan(plan?: ImplementationPlan): ImplementationPlan {
    const safePlan: ImplementationPlan = {
      totalDuration: plan?.totalDuration ?? '6-8 weeks',
      phases: Array.isArray(plan?.phases) ? plan!.phases : [],
      criticalPath: plan?.criticalPath ?? [],
      risks: plan?.risks ?? [],
    };

    safePlan.phases = safePlan.phases.map((phase) => ({
      ...phase,
      tasks: (phase.tasks ?? []).map((task) => ({
        ...task,
        id: task.id ?? randomUUID(),
        estimatedHours: this.toNumber(task.estimatedHours, 8),
      })),
      deliverables: phase.deliverables ?? [],
      dependencies: phase.dependencies ?? [],
    }));

    safePlan.risks = safePlan.risks ?? [];
    safePlan.criticalPath = safePlan.criticalPath ?? [];

    return safePlan;
  }

  private normalizeConfidence(confidence: unknown): number {
    const value = typeof confidence === 'number' ? confidence : Number(confidence);
    if (Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
    return 0.6;
  }

  private toNumber(value: unknown, fallback = 0): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  private validateStrategy(strategy: MonetizationStrategy): void {
    if (!strategy.primaryMethod?.type || !strategy.primaryMethod?.name) {
      throw new Error('Generated strategy is missing a primary monetization method.');
    }

    if (!strategy.pricingModel?.tiers?.length) {
      throw new Error('Generated strategy is missing pricing tiers.');
    }

    if (!strategy.implementationPlan?.phases?.length) {
      throw new Error('Generated strategy is missing implementation phases.');
    }

    if (!strategy.projections) {
      throw new Error('Generated strategy is missing revenue projections.');
    }
  }
}
