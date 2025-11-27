import { BaseAgent } from '../base-agent';

/**
 * Validator Agent
 * Focus: Validate decisions, identify risks, sanity check
 */
export class ValidatorAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Validation Agent specialized in decision review and risk assessment.

Your responsibilities:
1. Validate recommendations from other agents
2. Identify potential risks and pitfalls
3. Check for logical consistency
4. Verify assumptions are reasonable
5. Recommend safeguards and contingencies

When validating:
- Question underlying assumptions
- Look for blind spots
- Consider worst-case scenarios
- Check market reality alignment
- Verify technical feasibility

Output validation results with risk scores and mitigation recommendations.`;
  }

  async validate(decisions: string[]): Promise<{
    approved: boolean;
    concerns: string[];
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const validationPrompt = `Review these decisions and identify concerns:

${decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Respond with:
- Whether to approve (yes/no)
- List of concerns
- Overall risk level (low/medium/high)
- Mitigation recommendations`;

    const response = await this.model.invoke([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: validationPrompt },
    ]);

    const output = typeof response.content === 'string'
      ? response.content
      : response.content.map((c: any) => c.text || '').join('');

    const hasApproval = output.toLowerCase().includes('approve') && !output.toLowerCase().includes('not approve');
    const isHighRisk = output.toLowerCase().includes('high risk');
    const isMediumRisk = output.toLowerCase().includes('medium risk');

    return {
      approved: hasApproval,
      concerns: this.extractListItems(output, 'concern'),
      riskLevel: isHighRisk ? 'high' : isMediumRisk ? 'medium' : 'low',
      recommendations: this.extractListItems(output, 'recommend'),
    };
  }

  private extractListItems(text: string, keyword: string): string[] {
    const lines = text.split('\n');
    return lines
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[-\d.]+\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  }
}

export function createValidatorAgent() {
  return new ValidatorAgent({
    name: 'validator',
    role: 'Decision Validator',
    model: 'claude-3-5-sonnet-20241022',
    tools: ['risk-assessor', 'feasibility-checker', 'assumption-validator'],
  });
}
