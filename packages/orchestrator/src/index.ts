/**
 * @monetizer/orchestrator
 * 3-Path Parallel Workflow Orchestration System
 *
 * Three orchestrator types for different monetization approaches:
 * - DeveloperLed: Quality-first, robust implementation
 * - SpeedLed: MVP-first, fast shipping
 * - ResearchLed: Market-first, thorough validation
 */

// Base class
export { BaseOrchestrator } from './base';

// Concrete orchestrators
export { DeveloperLedOrchestrator } from './developer-led';
export { SpeedLedOrchestrator } from './speed-led';
export { ResearchLedOrchestrator } from './research-led';

// Types
export * from './types';

// Factory function to create orchestrator by type
import { OrchestratorConfig, OrchestratorType } from './types';
import { DeveloperLedOrchestrator } from './developer-led';
import { SpeedLedOrchestrator } from './speed-led';
import { ResearchLedOrchestrator } from './research-led';

export function createOrchestrator(config: OrchestratorConfig) {
  switch (config.type) {
    case 'developer-led':
      return new DeveloperLedOrchestrator(config);
    case 'speed-led':
      return new SpeedLedOrchestrator(config);
    case 'research-led':
      return new ResearchLedOrchestrator(config);
    default:
      throw new Error(`Unknown orchestrator type: ${config.type}`);
  }
}

// Parallel execution helper
export async function runParallelOrchestrators(
  analysis: any,
  projectName: string,
  types: OrchestratorType[] = ['developer-led', 'speed-led', 'research-led']
) {
  const orchestrators = types.map(type =>
    createOrchestrator({ type, projectName })
  );

  const results = await Promise.all(
    orchestrators.map(o => o.start(analysis))
  );

  return {
    results,
    fastest: results.reduce((a, b) =>
      a.metrics.timeSpentMs < b.metrics.timeSpentMs ? a : b
    ),
    mostConfident: results.reduce((a, b) => {
      const aAvg = Object.values(a.phaseResults).reduce((sum, p) => sum + p.confidence, 0) / Object.keys(a.phaseResults).length;
      const bAvg = Object.values(b.phaseResults).reduce((sum, p) => sum + p.confidence, 0) / Object.keys(b.phaseResults).length;
      return aAvg > bAvg ? a : b;
    }),
  };
}
