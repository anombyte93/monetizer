/**
 * Monetization Strategy Types
 * Core types for AI-powered strategy generation
 */

// Input: Project Analysis from @monetizer/analyzer
export interface ProjectAnalysis {
  techStack: TechStack;
  structure: ProjectStructure;
  potential: MonetizationPotential;
  opportunities: Opportunity[];
  metadata?: {
    path: string;
    analyzedAt: string;
    name?: string;
    description?: string;
    detectedFeatures?: string[];
  };
}

export interface TechStack {
  runtime: string | null;
  languages: string[];
  frameworks: string[];
  database: string | null;
  hasAPI: boolean;
  hasUI: boolean;
}

export interface ProjectStructure {
  hasTests: boolean;
  hasDocumentation: boolean;
  hasCICD: boolean;
  hasDocker: boolean;
  linesOfCode: number;
  fileCount: number;
}

export interface MonetizationPotential {
  score: number; // 1-10
  readiness: 'High' | 'Medium' | 'Low';
  factors: {
    techStack: string;
    maturity: string;
    infrastructure: string;
  };
}

export interface Opportunity {
  type: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  estimatedEffort: 'Low' | 'Medium' | 'High';
  potentialRevenue: string;
}

// Output: Generated Strategy
export interface MonetizationStrategy {
  id: string;
  generatedAt: string;
  projectPath: string;

  // Core strategy
  primaryMethod: StrategyMethod;
  alternativeMethods: StrategyMethod[];

  // Pricing
  pricingModel: PricingModel;

  // Implementation
  implementationPlan: ImplementationPlan;

  // Revenue projections
  projections: RevenueProjections;

  // AI reasoning
  reasoning: string;
  confidence: number;

  // Research data (optional, from Perplexity)
  marketResearch?: MarketResearch;
}

export type StrategyType = 'saas' | 'api' | 'freemium' | 'sponsorship' | 'marketplace' | 'licensing';

export interface StrategyMethod {
  type: StrategyType;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  timeToRevenue: string;
  requiredFeatures: string[];
}

export interface PricingModel {
  type: 'tiered' | 'usage' | 'freemium' | 'flat' | 'sponsorship';
  currency: string;
  tiers: PricingTier[];
  recommendedStartingTier?: string;
}

export interface PricingTier {
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'one-time' | 'per-use';
  features: string[];
  limits?: Record<string, number | string>;
  recommended?: boolean;
}

export interface ImplementationPlan {
  totalDuration: string;
  phases: ImplementationPhase[];
  criticalPath: string[];
  risks: Risk[];
}

export interface ImplementationPhase {
  name: string;
  duration: string;
  tasks: Task[];
  deliverables: string[];
  dependencies: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  skills: string[];
}

export interface Risk {
  description: string;
  probability: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface RevenueProjections {
  month1: number;
  month3: number;
  month6: number;
  month12: number;
  breakEvenMonths: number;
  assumptions: string[];
}

export interface MarketResearch {
  competitors: Competitor[];
  marketSize: string;
  targetAudience: string[];
  pricingBenchmarks: PricingBenchmark[];
  trends: string[];
  sources: string[];
}

export interface Competitor {
  name: string;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: string;
}

export interface PricingBenchmark {
  category: string;
  lowEnd: number;
  midRange: number;
  highEnd: number;
  notes?: string;
}

export interface ResearchResult {
  answer: string;
  sources: string[];
}

// Generator options
export interface StrategyGeneratorOptions {
  anthropicApiKey: string;
  perplexityApiKey?: string;
  model?: string;
  includeResearch?: boolean;
  targetRevenue?: number;
  preferredMethod?: StrategyType;
}

export interface GenerateOptions {
  includeResearch?: boolean;
  preferredMethod?: StrategyType;
  targetMRR?: number;
  constraints?: {
    maxTimeToLaunch?: string;
    budget?: number;
    teamSize?: number;
  };
}
