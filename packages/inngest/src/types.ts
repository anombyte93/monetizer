export type Insight = {
  title: string;
  details: string;
  confidence: number;
};

export type AnalyzeProjectInput = {
  projectId: string;
  repositoryUrl?: string;
  description?: string;
  objectives?: string[];
  priority?: 'low' | 'medium' | 'high';
};

export type AnalyzeProjectOutput = {
  projectId: string;
  summary: string;
  insights: Insight[];
  recommendedNextActions: string[];
  status: 'queued' | 'in_progress' | 'completed';
  durationMs: number;
};

export type GenerateStrategyInput = {
  projectId: string;
  goals: string[];
  constraints?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
  maxAttempts?: number;
};

export type StrategyExperiment = {
  name: string;
  hypothesis: string;
  successMetric: string;
  owner?: string;
};

export type GenerateStrategyOutput = {
  projectId: string;
  strategySummary: string;
  experiments: StrategyExperiment[];
  attemptCount: number;
};

export type ResearchMarketInput = {
  projectId: string;
  audience: string;
  topics: string[];
  throttleMs?: number;
  maxSources?: number;
};

export type ResearchMarketOutput = {
  projectId: string;
  insights: Array<{
    topic: string;
    summary: string;
    sources: string[];
    signalStrength: number;
  }>;
  rateLimitMs: number;
};

export type AgentDescriptor = {
  id: string;
  role: string;
  capabilities: string[];
};

export type OrchestrateAgentsInput = {
  projectId: string;
  objective: string;
  agents: AgentDescriptor[];
  syncWindow?: string;
};

export type OrchestrateAgentsOutput = {
  projectId: string;
  coordinationPlan: Array<{
    step: string;
    owner: string;
    dependencies?: string[];
    status: 'planned' | 'running' | 'complete';
  }>;
  finalStatus: 'completed' | 'blocked' | 'in_progress';
};

export type WorkflowEvents = {
  'monetizer/project.analyze': { data: AnalyzeProjectInput };
  'monetizer/strategy.generate': { data: GenerateStrategyInput };
  'monetizer/market.research': { data: ResearchMarketInput };
  'monetizer/agents.orchestrate': { data: OrchestrateAgentsInput };
};

export type WorkflowEventName = keyof WorkflowEvents;
