/**
 * @monetizer/analyzer
 * Project and repository analysis engine
 */

export { ProjectAnalyzer, analyzeProject } from './analyzer';
export { detectTechStack } from './stack-detector';
export { analyzeGit, getActivitySummary } from './git-analyzer';
export { analyzeCode, getCodeSummary } from './code-metrics';
export { detectMonetization, getMonetizationSummary } from './monetization-signals';
export * from './types';
