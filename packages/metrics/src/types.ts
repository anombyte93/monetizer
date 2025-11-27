/**
 * A single workflow execution event captured for later aggregation.
 */
export interface MetricEvent {
  orchestrator: string;
  workflowId?: string;
  /**
   * Elapsed time for the workflow in milliseconds.
   */
  timeSpentMs: number;
  /**
   * Confidence score between 0 and 1.
   */
  confidence: number;
  /**
   * Count of recommendations generated in the run.
   */
  recommendationsCount: number;
  /**
   * Count of risks identified in the run.
   */
  riskCount: number;
  timestamp?: Date;
}

/**
 * Aggregated metrics for a single orchestrator across one or more runs.
 */
export interface WorkflowMetrics {
  orchestrator: string;
  runs: number;
  totalTimeMs: number;
  averageTimeMs: number;
  averageConfidence: number;
  totalRecommendations: number;
  averageRecommendations: number;
  totalRisks: number;
  averageRisks: number;
}

/**
 * Outcome of comparing multiple orchestrator workflows.
 */
export interface ComparisonResult {
  winner: string | null;
  reasoning: string;
  rankings: Array<{
    orchestrator: string;
    score: number;
    metrics: WorkflowMetrics;
  }>;
}
