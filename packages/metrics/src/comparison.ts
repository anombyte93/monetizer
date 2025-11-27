import { ComparisonResult, WorkflowMetrics } from './types';

const SCORE_WEIGHTS = {
  confidence: 0.4,
  recommendations: 0.3,
  time: 0.2,
  risks: 0.1,
} as const;

function normalize(value: number, min: number, max: number, inverted = false): number {
  if (max === min) {
    return 1;
  }

  const clamped = Math.min(Math.max(value, min), max);
  const normalized = (clamped - min) / (max - min);
  return inverted ? 1 - normalized : normalized;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  return `${minutes}m ${remainderSeconds.toFixed(0)}s`;
}

function getRange(values: number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }

  return values.reduce(
    (acc, value) => ({
      min: Math.min(acc.min, value),
      max: Math.max(acc.max, value),
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );
}

export function compareWorkflows(workflows: WorkflowMetrics[]): ComparisonResult {
  if (workflows.length === 0) {
    return {
      winner: null,
      reasoning: 'No workflow metrics available to compare.',
      rankings: [],
    };
  }

  const timeRange = getRange(workflows.map((workflow) => workflow.averageTimeMs));
  const confidenceRange = getRange(workflows.map((workflow) => workflow.averageConfidence));
  const recommendationRange = getRange(workflows.map((workflow) => workflow.averageRecommendations));
  const riskRange = getRange(workflows.map((workflow) => workflow.averageRisks));

  const rankings = workflows
    .map((metrics) => {
      const score =
        SCORE_WEIGHTS.confidence * normalize(metrics.averageConfidence, confidenceRange.min, confidenceRange.max) +
        SCORE_WEIGHTS.recommendations *
          normalize(metrics.averageRecommendations, recommendationRange.min, recommendationRange.max) +
        SCORE_WEIGHTS.time * normalize(metrics.averageTimeMs, timeRange.min, timeRange.max, true) +
        SCORE_WEIGHTS.risks * normalize(metrics.averageRisks, riskRange.min, riskRange.max, true);

      return {
        orchestrator: metrics.orchestrator,
        score,
        metrics,
      };
    })
    .sort((a, b) => b.score - a.score);

  const winner = rankings[0];

  if (!winner) {
    return {
      winner: null,
      reasoning: 'Unable to determine a winner.',
      rankings: [],
    };
  }

  const reasonSegments = [
    `${winner.orchestrator} led with ${winner.metrics.averageConfidence.toFixed(2)} avg confidence`,
    `${winner.metrics.averageRecommendations.toFixed(1)} recommendations/run`,
    `and ${winner.metrics.averageRisks.toFixed(1)} risks/run`,
    `while averaging ${formatDuration(winner.metrics.averageTimeMs)} per run.`,
  ];

  const secondPlace = rankings[1];
  if (secondPlace) {
    const gap = (winner.score - secondPlace.score) * 100;
    reasonSegments.push(
      `Score margin over next best (${secondPlace.orchestrator}) was ${gap.toFixed(1)} points on the weighted scale.`,
    );
  }

  return {
    winner: winner.orchestrator,
    reasoning: reasonSegments.join(' '),
    rankings,
  };
}
