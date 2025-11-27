import { AgentResult, AgentState } from './types';
import {
  createDeveloperAgent,
  createArchitectAgent,
  createResearcherAgent,
  createStrategistAgent,
  createValidatorAgent,
} from './agents';
import { BaseAgent } from './base-agent';

type AgentType = 'developer' | 'architect' | 'researcher' | 'strategist' | 'validator';

interface CoordinationResult {
  results: Record<AgentType, AgentResult>;
  consensus: string;
  confidence: number;
  validationPassed: boolean;
}

/**
 * Agent Coordinator
 * Orchestrates multiple agents to collaborate on monetization decisions
 */
export class AgentCoordinator {
  private agents: Record<AgentType, BaseAgent>;

  constructor() {
    this.agents = {
      developer: createDeveloperAgent(),
      architect: createArchitectAgent(),
      researcher: createResearcherAgent(),
      strategist: createStrategistAgent(),
      validator: createValidatorAgent(),
    };
  }

  async coordinate(task: string, context: any): Promise<CoordinationResult> {
    const state: AgentState = {
      messages: [{ role: 'user', content: task, timestamp: new Date() }],
      context,
      decisions: [],
    };

    const results: Record<string, AgentResult> = {};

    // Run primary agents in parallel
    const primaryAgents: AgentType[] = ['developer', 'architect', 'researcher', 'strategist'];
    const agentResults = await Promise.all(
      primaryAgents.map(async (type) => {
        const agent = this.agents[type];
        const result = await agent.act(state);
        return { type, result };
      })
    );

    for (const { type, result } of agentResults) {
      results[type] = result;
      state.decisions.push(`${type}: ${result.output.slice(0, 200)}`);
    }

    // Validate with the validator agent
    const validator = this.agents.validator;
    const validatorResult = await validator.act({
      ...state,
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: `Previous decisions:\n${state.decisions.join('\n')}`,
          timestamp: new Date(),
        },
      ],
    });
    results.validator = validatorResult;

    // Calculate consensus
    const avgConfidence = Object.values(results).reduce((sum, r) => sum + r.confidence, 0) / Object.keys(results).length;
    const validationPassed = validatorResult.confidence > 0.6;

    return {
      results: results as Record<AgentType, AgentResult>,
      consensus: this.synthesizeConsensus(results),
      confidence: avgConfidence,
      validationPassed,
    };
  }

  async coordinateSubset(
    task: string,
    context: any,
    agentTypes: AgentType[]
  ): Promise<Record<AgentType, AgentResult>> {
    const state: AgentState = {
      messages: [{ role: 'user', content: task, timestamp: new Date() }],
      context,
      decisions: [],
    };

    const results: Record<string, AgentResult> = {};

    const agentResults = await Promise.all(
      agentTypes.map(async (type) => {
        const agent = this.agents[type];
        const result = await agent.act(state);
        return { type, result };
      })
    );

    for (const { type, result } of agentResults) {
      results[type] = result;
    }

    return results as Record<AgentType, AgentResult>;
  }

  private synthesizeConsensus(results: Record<string, AgentResult>): string {
    const summaries = Object.entries(results)
      .map(([type, result]) => `${type}: ${result.output.split('\n')[0]}`)
      .join('\n');

    return `Agent consensus based on ${Object.keys(results).length} perspectives:\n${summaries}`;
  }
}
