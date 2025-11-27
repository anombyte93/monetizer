import { ChatAnthropic } from '@langchain/anthropic';
import { AgentConfig, AgentMessage, AgentResult, AgentState } from './types';

/**
 * Base Agent class for LangGraph-style agent implementation
 * All specialized agents extend this class
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected model: ChatAnthropic;
  protected systemPrompt: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.model = new ChatAnthropic({
      modelName: config.model || 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
    });
    this.systemPrompt = this.getSystemPrompt();
  }

  protected abstract getSystemPrompt(): string;

  async think(state: AgentState): Promise<AgentMessage> {
    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...state.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await this.model.invoke(messages);
    const content = typeof response.content === 'string'
      ? response.content
      : response.content.map((c: any) => c.text || '').join('');

    return {
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
  }

  async act(state: AgentState): Promise<AgentResult> {
    const thought = await this.think(state);

    return {
      output: thought.content,
      confidence: this.assessConfidence(thought.content),
      reasoning: `${this.config.role} analysis based on ${state.messages.length} inputs`,
    };
  }

  async reflect(result: AgentResult): Promise<string> {
    const reflectionPrompt = `Review this output and identify improvements:
${result.output}

Confidence: ${result.confidence}
Reasoning: ${result.reasoning}

What could be improved?`;

    const response = await this.model.invoke([
      { role: 'system', content: 'You are reviewing agent output for quality.' },
      { role: 'user', content: reflectionPrompt },
    ]);

    return typeof response.content === 'string'
      ? response.content
      : response.content.map((c: any) => c.text || '').join('');
  }

  protected assessConfidence(output: string): number {
    const length = output.length;
    const hasStructure = output.includes('\n') || output.includes('-');
    const hasNumbers = /\d/.test(output);

    let confidence = 0.5;
    if (length > 200) confidence += 0.1;
    if (length > 500) confidence += 0.1;
    if (hasStructure) confidence += 0.1;
    if (hasNumbers) confidence += 0.1;

    return Math.min(confidence, 1);
  }
}
