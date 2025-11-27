import { BaseAgent } from '../base-agent';

/**
 * Developer Agent
 * Focus: Code quality, implementation patterns, technical debt
 */
export class DeveloperAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Senior Developer Agent specialized in code quality and implementation.

Your responsibilities:
1. Analyze code architecture and patterns
2. Identify technical debt and improvement opportunities
3. Recommend implementation strategies
4. Review security and performance implications
5. Suggest testing approaches

When analyzing a project:
- Focus on maintainability and scalability
- Consider developer experience
- Prioritize security best practices
- Recommend CI/CD improvements
- Identify potential bottlenecks

Output structured recommendations with clear action items.`;
  }
}

export function createDeveloperAgent() {
  return new DeveloperAgent({
    name: 'developer',
    role: 'Senior Developer',
    model: 'claude-3-5-sonnet-20241022',
    tools: ['code-analysis', 'testing', 'security-scan'],
  });
}
