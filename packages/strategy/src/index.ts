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
