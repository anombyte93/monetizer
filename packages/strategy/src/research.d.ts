import { Competitor, PricingBenchmark, ResearchResult } from './types';
export declare class MarketResearcher {
    private readonly apiKey;
    constructor(perplexityApiKey: string);
    research(query: string): Promise<ResearchResult>;
    getCompetitors(productType: string): Promise<Competitor[]>;
    getPricingBenchmarks(category: string): Promise<PricingBenchmark[]>;
    private callPerplexity;
    private extractContent;
    private parseJsonContent;
    private normalizeCompetitors;
    private normalizePricingBenchmarks;
    private toStringArray;
    private toNumber;
    private mergeSources;
    private handleError;
}
//# sourceMappingURL=research.d.ts.map