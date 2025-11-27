import {
  AnalysisInput,
  NormalizedAnalysis,
  OrchestratorConfig,
  OrchestratorType,
  PhaseDefinition,
  PhaseResult,
  WorkflowResult,
  WorkflowState,
} from './types';

type PhaseComputation = Omit<PhaseResult, 'phase' | 'durationMs'>;

export abstract class BaseOrchestrator<TAnalysis extends AnalysisInput = AnalysisInput> {
  protected readonly phases: PhaseDefinition[];
  protected readonly workflowState: WorkflowState;
  protected analysisSnapshot?: TAnalysis;

  protected abstract readonly orchestratorType: OrchestratorType;

  constructor(protected readonly config: OrchestratorConfig) {
    this.phases = this.definePhases();
    this.workflowState = {
      status: 'idle',
      currentPhase: null,
      completedPhases: [],
      pendingPhases: this.phases.map((phase) => phase.name),
      metrics: { timeSpentMs: 0, phaseTimings: {} },
      phaseResults: {},
    };
  }

  async start(analysis: TAnalysis): Promise<WorkflowResult> {
    if (this.workflowState.status === 'running') {
      throw new Error('Workflow already running');
    }

    if (this.workflowState.status === 'completed' || this.workflowState.status === 'failed') {
      this.resetState();
    }

    this.analysisSnapshot = analysis;
    this.workflowState.status = 'running';
    this.workflowState.metrics.startedAt = this.workflowState.metrics.startedAt ?? new Date();

    return this.runFromPhase(this.workflowState.completedPhases.length);
  }

  pause(): void {
    if (this.workflowState.status !== 'running') {
      throw new Error('Cannot pause unless the workflow is running');
    }

    this.workflowState.status = 'paused';
    this.workflowState.metrics.pausedAt = new Date();
  }

  async resume(): Promise<WorkflowResult> {
    if (this.workflowState.status !== 'paused') {
      throw new Error('Cannot resume unless the workflow is paused');
    }

    this.workflowState.status = 'running';
    return this.runFromPhase(this.workflowState.completedPhases.length);
  }

  getStatus(): WorkflowState {
    return {
      ...this.workflowState,
      completedPhases: [...this.workflowState.completedPhases],
      pendingPhases: [...this.workflowState.pendingPhases],
      metrics: { ...this.workflowState.metrics, phaseTimings: { ...this.workflowState.metrics.phaseTimings } },
      phaseResults: { ...this.workflowState.phaseResults },
    };
  }

  protected abstract definePhases(): PhaseDefinition[];

  protected abstract executePhase(phase: PhaseDefinition, analysis: TAnalysis): Promise<PhaseComputation> | PhaseComputation;

  protected deriveConfidence(analysis: TAnalysis, weight: number): number {
    const informativeFields = ['findings', 'opportunities', 'monetizationIdeas', 'techStack', 'competitors', 'audience'];
    const signalScore = informativeFields.reduce((score, key) => {
      const value = analysis[key as keyof TAnalysis];
      if (Array.isArray(value) && value.length > 0) {
        return score + 1;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return score + 0.5;
      }
      return score;
    }, 0);

    const normalized = Math.min(1, (signalScore / informativeFields.length) * weight + 0.35);
    return Number(normalized.toFixed(2));
  }

  protected normalizeAnalysis(analysis: TAnalysis): NormalizedAnalysis {
    const toArray = (value?: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item)).map((item) => item.trim()).filter((item) => item.length > 0);
      }

      if (typeof value === 'string') {
        return value
          .split(/[,;\n]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }

      return [];
    };

    const metrics: Record<string, number | string> = {};

    if (analysis.metrics && typeof analysis.metrics === 'object') {
      Object.entries(analysis.metrics as Record<string, number | string>).forEach(([key, value]) => {
        metrics[key] = value;
      });
    }

    return {
      projectName: analysis.repoName ?? this.config.projectName,
      summary: analysis.summary ?? '',
      opportunities: toArray(analysis.opportunities),
      risks: toArray(analysis.risks ?? analysis.constraints),
      monetizationIdeas: toArray(analysis.monetizationIdeas ?? analysis.opportunities),
      techStack: toArray(analysis.techStack),
      constraints: toArray(analysis.constraints),
      audience: toArray(analysis.audience ?? this.config.targetAudience),
      competitors: toArray(analysis.competitors),
      differentiators: toArray(analysis.differentiators ?? analysis.findings),
      metrics,
    };
  }

  protected summaryFromRecommendations(recommendations: string[]): string {
    if (recommendations.length === 0) {
      return `Orchestrator ${this.config.projectName} completed with no recommendations generated.`;
    }

    const primary = recommendations[0];
    const remainder = recommendations.length - 1;
    const suffix = remainder > 0 ? ` and ${remainder} additional action item${remainder === 1 ? '' : 's'}` : '';
    return `${this.config.projectName}: prioritize "${primary}"${suffix}.`;
  }

  private async runFromPhase(startIndex: number): Promise<WorkflowResult> {
    if (!this.analysisSnapshot) {
      throw new Error('Analysis input required before starting the workflow');
    }

    for (let index = startIndex; index < this.phases.length; index += 1) {
      if (this.workflowState.status === 'paused') {
        break;
      }

      const phase = this.phases[index];
      this.workflowState.currentPhase = phase.name;
      this.workflowState.pendingPhases = this.phases.slice(index + 1).map((item) => item.name);

      const startedAt = Date.now();

      try {
        const rawResult = await this.executePhase(phase, this.analysisSnapshot);
        const durationMs = Date.now() - startedAt;
        const phaseResult: PhaseResult = {
          ...rawResult,
          phase: phase.name,
          durationMs,
        };

        this.workflowState.phaseResults[phase.name] = phaseResult;
        this.workflowState.completedPhases.push(phase.name);
        this.workflowState.metrics.timeSpentMs += durationMs;
        this.workflowState.metrics.phaseTimings[phase.name] = durationMs;
      } catch (error) {
        this.workflowState.status = 'failed';
        this.workflowState.error =
          error instanceof Error ? error.message : 'Unknown workflow failure encountered during execution';
        return this.buildResult();
      }
    }

    if (this.workflowState.status === 'running') {
      this.workflowState.status = 'completed';
      this.workflowState.metrics.completedAt = new Date();
      this.workflowState.currentPhase = null;
      this.workflowState.pendingPhases = [];
    }

    return this.buildResult();
  }

  private buildResult(): WorkflowResult {
    const recommendations = this.collectOrderedLists('recommendations');
    const risks = this.collectOrderedLists('risks');
    const highlights = this.collectHighlights();
    const summary = this.resolveSummary(recommendations);

    return {
      orchestrator: this.orchestratorType,
      status: this.workflowState.status,
      summary,
      highlights,
      recommendations,
      risks,
      metrics: { ...this.workflowState.metrics, phaseTimings: { ...this.workflowState.metrics.phaseTimings } },
      phaseResults: { ...this.workflowState.phaseResults },
    };
  }

  private collectOrderedLists(key: 'recommendations' | 'risks'): string[] {
    const collected = Object.values(this.workflowState.phaseResults).flatMap((result) => result[key]);
    return Array.from(new Set(collected));
  }

  private collectHighlights(): string[] {
    return Object.values(this.workflowState.phaseResults).flatMap((result) =>
      result.insights.map((insight) => `${result.phase}: ${insight}`),
    );
  }

  private resolveSummary(recommendations: string[]): string {
    if (this.workflowState.status === 'failed' && this.workflowState.error) {
      return `${this.config.projectName}: workflow failed after ${this.workflowState.completedPhases.length} phase(s) - ${this.workflowState.error}`;
    }

    if (this.workflowState.status === 'paused') {
      return `${this.config.projectName}: paused after ${this.workflowState.completedPhases.length} phase(s)`;
    }

    return this.summaryFromRecommendations(recommendations);
  }

  private resetState(): void {
    this.workflowState.status = 'idle';
    this.workflowState.currentPhase = null;
    this.workflowState.completedPhases = [];
    this.workflowState.pendingPhases = this.phases.map((phase) => phase.name);
    this.workflowState.metrics = { timeSpentMs: 0, phaseTimings: {} };
    this.workflowState.phaseResults = {};
    this.workflowState.error = undefined;
  }
}
