export type OrchestratorType = 'developer-led' | 'speed-led' | 'research-led';

export interface OrchestratorConfig {
  type: OrchestratorType;
  projectName: string;
  repoUrl?: string;
  targetAudience?: string;
  timeBudgetMinutes?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
}

export interface AnalysisInput {
  repoName?: string;
  summary?: string;
  findings?: string[];
  risks?: string[];
  opportunities?: string[];
  monetizationIdeas?: string[];
  techStack?: string[];
  constraints?: string[];
  audience?: string[];
  competitors?: string[];
  differentiators?: string[];
  metrics?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface NormalizedAnalysis {
  projectName: string;
  summary: string;
  opportunities: string[];
  risks: string[];
  monetizationIdeas: string[];
  techStack: string[];
  constraints: string[];
  audience: string[];
  competitors: string[];
  differentiators: string[];
  metrics: Record<string, number | string>;
}

export interface PhaseDefinition {
  name: string;
  focus: string;
  outputs: string[];
}

export interface PhaseResult {
  phase: string;
  insights: string[];
  recommendations: string[];
  risks: string[];
  confidence: number;
  durationMs: number;
  artifacts?: string[];
}

export interface WorkflowMetrics {
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  timeSpentMs: number;
  phaseTimings: Record<string, number>;
}

export interface WorkflowState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  currentPhase: string | null;
  completedPhases: string[];
  pendingPhases: string[];
  metrics: WorkflowMetrics;
  phaseResults: Record<string, PhaseResult>;
  error?: string;
}

export interface WorkflowResult {
  orchestrator: OrchestratorType;
  status: WorkflowState['status'];
  summary: string;
  highlights: string[];
  recommendations: string[];
  risks: string[];
  metrics: WorkflowMetrics;
  phaseResults: Record<string, PhaseResult>;
}
