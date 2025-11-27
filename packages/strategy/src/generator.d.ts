import { GenerateOptions, MonetizationStrategy, ProjectAnalysis, StrategyGeneratorOptions } from './types';
export declare class StrategyGenerator {
    private anthropic;
    private model;
    private baseOptions;
    constructor(options: StrategyGeneratorOptions);
    generate(analysis: ProjectAnalysis, options?: GenerateOptions): Promise<MonetizationStrategy>;
    private callClaude;
    private buildPrompt;
    private parseJsonResponse;
    private composeStrategy;
    private normalizeImplementationPlan;
    private normalizeConfidence;
    private toNumber;
    private validateStrategy;
}
//# sourceMappingURL=generator.d.ts.map