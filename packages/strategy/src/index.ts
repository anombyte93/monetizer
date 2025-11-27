/**
 * @monetizer/strategy
 * AI-powered monetization strategy generator
 */

export { StrategyGenerator } from './generator';
export { MarketResearcher } from './research';
export { AdCopyGenerator, DEV_TOOL_AD_RECOMMENDATIONS } from './advertising';
export {
  ContentOrchestrator,
  CONTENT_PIPELINES,
  AI_TOOL_COSTS,
} from './content-orchestrator';
export {
  RevenueMultiplierGenerator,
  REVENUE_MULTIPLIER_CATALOG,
  DEV_TOOL_AFFILIATE_PROGRAMS,
  LEAD_SCORING_WEIGHTS,
} from './revenue-multipliers';
export * from './types';
export type {
  AdCopy,
  AdCampaign,
  AdPlatformStrategy,
  AdvertisingStrategy,
  AIAdTool,
  AdTimeline,
  AdMetrics,
} from './advertising';
export type {
  ContentSkillType,
  ContentProvider,
  ContentSkill,
  ContentPipeline,
  PipelineTrigger,
  PipelineBudget,
  GeneratedContent,
  ContentCampaign,
  CampaignMetrics,
  OrchestratorOptions,
} from './content-orchestrator';
export type {
  RevenueMultiplierType,
  RevenueMultiplier,
  AffiliateProgram,
  PricingExperiment,
  LeadScore,
  LeadSignal,
  SponsorshipOpportunity,
  SponsorMatch,
  UpsellTrigger,
  RevenueMultiplierStrategy,
  MultiplierOptions,
} from './revenue-multipliers';
