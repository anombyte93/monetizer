export interface AgentConfig {
  name: string;
  role: string;
  model: string;
  tools: string[];
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | string;
  content: string;
  timestamp: Date;
}

export interface AgentState {
  messages: AgentMessage[];
  context: Record<string, unknown>;
  decisions: string[];
}

export interface AgentResult {
  output: string;
  confidence: number;
  reasoning: string;
}
