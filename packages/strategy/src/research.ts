import { Competitor, PricingBenchmark, ResearchResult } from './types';

type ChatRole = 'system' | 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface PerplexityChoice {
  message?: {
    content?: unknown;
    citations?: unknown;
  };
}

interface PerplexityResponse {
  choices?: PerplexityChoice[];
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'llama-3.1-sonar-small-128k-online';

export class MarketResearcher {
  private readonly apiKey: string;

  constructor(perplexityApiKey: string) {
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key is required to perform market research.');
    }

    this.apiKey = perplexityApiKey;
  }

  async research(query: string): Promise<ResearchResult> {
    if (!query?.trim()) {
      throw new Error('Query is required for market research.');
    }

    try {
      const { content, citations } = await this.callPerplexity([
        {
          role: 'system',
          content:
            'You are a concise market research assistant. Answer succinctly and include high-quality sources. ' +
            'Respond ONLY in JSON with the shape: {"answer": string, "sources": string[]}.',
        },
        { role: 'user', content: query },
      ]);

      const parsed = this.parseJsonContent<{ answer: unknown; sources?: unknown }>(content, 'research result');
      const answer =
        typeof parsed.answer === 'string' ? parsed.answer.trim() : String(parsed.answer ?? '').trim();

      if (!answer) {
        throw new Error('Perplexity did not return an answer.');
      }

      const sources = this.mergeSources(this.toStringArray(parsed.sources), citations);

      return { answer, sources };
    } catch (error) {
      this.handleError(error, 'Market research failed');
    }
  }

  async getCompetitors(productType: string): Promise<Competitor[]> {
    if (!productType?.trim()) {
      throw new Error('Product type is required to find competitors.');
    }

    try {
      const { content } = await this.callPerplexity([
        {
          role: 'system',
          content:
            'You are mapping the competitive landscape. Provide direct competitors and adjacent alternatives. ' +
            'Respond ONLY with a JSON array of competitors shaped as: ' +
            '[{ "name": string, "pricing": string, "strengths": string[], "weaknesses": string[], "marketShare": string }].',
        },
        {
          role: 'user',
          content: `List the top competitors for ${productType}. Focus on reputable, current products.`,
        },
      ]);

      const parsed = this.parseJsonContent<unknown>(content, 'competitor list');

      if (!Array.isArray(parsed)) {
        throw new Error('Competitor response was not an array.');
      }

      const competitors = this.normalizeCompetitors(parsed);

      if (!competitors.length) {
        throw new Error('No competitors returned from Perplexity.');
      }

      return competitors;
    } catch (error) {
      this.handleError(error, 'Competitor research failed');
    }
  }

  async getPricingBenchmarks(category: string): Promise<PricingBenchmark[]> {
    if (!category?.trim()) {
      throw new Error('Category is required to fetch pricing benchmarks.');
    }

    try {
      const { content } = await this.callPerplexity([
        {
          role: 'system',
          content:
            'You are gathering pricing benchmarks for software and APIs. ' +
            'Respond ONLY with a JSON array of pricing benchmarks shaped as: ' +
            '[{ "category": string, "lowEnd": number, "midRange": number, "highEnd": number, "notes": string }]. ' +
            'Use USD, and ensure numbers represent monthly pricing unless otherwise noted in "notes".',
        },
        {
          role: 'user',
          content: `Provide pricing benchmarks for ${category}. Include realistic ranges from current market data.`,
        },
      ]);

      const parsed = this.parseJsonContent<unknown>(content, 'pricing benchmarks');

      if (!Array.isArray(parsed)) {
        throw new Error('Pricing benchmark response was not an array.');
      }

      const benchmarks = this.normalizePricingBenchmarks(parsed);

      if (!benchmarks.length) {
        throw new Error('No pricing benchmarks returned from Perplexity.');
      }

      return benchmarks;
    } catch (error) {
      this.handleError(error, 'Pricing benchmark research failed');
    }
  }

  private async callPerplexity(messages: ChatMessage[]): Promise<{ content: string; citations: string[] }> {
    const requestBody = {
      model: PERPLEXITY_MODEL,
      messages,
      max_tokens: 800,
      temperature: 0.3,
    };

    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const suffix = errorText ? ` - ${errorText}` : '';
        throw new Error(`Perplexity API error (${response.status} ${response.statusText})${suffix}`);
      }

      const data = (await response.json()) as PerplexityResponse;
      const choice = data?.choices?.[0];
      const message = choice?.message;
      const content = this.extractContent(message?.content);

      if (!content) {
        throw new Error('Perplexity API returned an empty message.');
      }

      const citations = this.toStringArray(message?.citations);

      return { content, citations };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to call Perplexity API: ${message}`);
    }
  }

  private extractContent(content: unknown): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (part && typeof part === 'object' && 'text' in part) {
            return String((part as { text?: unknown }).text ?? '');
          }

          return '';
        })
        .join('\n')
        .trim();
    }

    if (content && typeof content === 'object' && 'text' in content) {
      return String((content as { text?: unknown }).text ?? '').trim();
    }

    return '';
  }

  private parseJsonContent<T>(content: string, context: string): T {
    try {
      const trimmed = content.trim();
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const jsonString = fenced ? fenced[1].trim() : trimmed;
      return JSON.parse(jsonString) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      throw new Error(`Failed to parse ${context} from Perplexity response: ${message}`);
    }
  }

  private normalizeCompetitors(list: any[]): Competitor[] {
    return list
      .map((item) => ({
        name: typeof item?.name === 'string' ? item.name.trim() : '',
        pricing: typeof item?.pricing === 'string' ? item.pricing.trim() : '',
        strengths: this.toStringArray(item?.strengths),
        weaknesses: this.toStringArray(item?.weaknesses),
        marketShare: typeof item?.marketShare === 'string' ? item.marketShare.trim() : undefined,
      }))
      .filter((competitor) => competitor.name && competitor.pricing);
  }

  private normalizePricingBenchmarks(list: any[]): PricingBenchmark[] {
    return list
      .map((item) => ({
        category: typeof item?.category === 'string' ? item.category.trim() : '',
        lowEnd: this.toNumber(item?.lowEnd),
        midRange: this.toNumber(item?.midRange),
        highEnd: this.toNumber(item?.highEnd),
        notes: typeof item?.notes === 'string' ? item.notes.trim() : undefined,
      }))
      .filter((benchmark) => benchmark.category);
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  private mergeSources(...sources: string[][]): string[] {
    const merged = sources.flat().filter(Boolean);
    return Array.from(new Set(merged));
  }

  private handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`${context}: ${message}`);
  }
}
