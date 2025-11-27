import { ComparisonResult, MetricEvent, WorkflowMetrics } from './types';
import { compareWorkflows } from './comparison';

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export class MetricsCollector {
  private events: MetricEvent[] = [];

  constructor(initialEvents: MetricEvent[] = []) {
    initialEvents.forEach((event) => this.track(event));
  }

  track(event: MetricEvent): void {
    const normalized: MetricEvent = {
      ...event,
      timeSpentMs: Math.max(0, event.timeSpentMs),
      confidence: clamp(event.confidence, 0, 1),
      recommendationsCount: Math.max(0, event.recommendationsCount),
      riskCount: Math.max(0, event.riskCount),
      timestamp: event.timestamp ?? new Date(),
    };

    this.events.push(normalized);
  }

  getMetrics(orchestrator?: string): WorkflowMetrics[] {
    const filtered = orchestrator
      ? this.events.filter((event) => event.orchestrator === orchestrator)
      : this.events;

    const grouped = new Map<string, MetricEvent[]>();

    filtered.forEach((event) => {
      const existing = grouped.get(event.orchestrator) ?? [];
      existing.push(event);
      grouped.set(event.orchestrator, existing);
    });

    return Array.from(grouped.entries()).map<WorkflowMetrics>(([orchestratorName, orchestratorEvents]) => {
      const runs = orchestratorEvents.length;
      const totalTimeMs = orchestratorEvents.reduce((sum, event) => sum + event.timeSpentMs, 0);
      const totalConfidence = orchestratorEvents.reduce((sum, event) => sum + event.confidence, 0);
      const totalRecommendations = orchestratorEvents.reduce((sum, event) => sum + event.recommendationsCount, 0);
      const totalRisks = orchestratorEvents.reduce((sum, event) => sum + event.riskCount, 0);

      return {
        orchestrator: orchestratorName,
        runs,
        totalTimeMs,
        averageTimeMs: runs === 0 ? 0 : totalTimeMs / runs,
        averageConfidence: runs === 0 ? 0 : totalConfidence / runs,
        totalRecommendations,
        averageRecommendations: runs === 0 ? 0 : totalRecommendations / runs,
        totalRisks,
        averageRisks: runs === 0 ? 0 : totalRisks / runs,
      };
    });
  }

  compare(): ComparisonResult {
    const metrics = this.getMetrics();
    return compareWorkflows(metrics);
  }
}
