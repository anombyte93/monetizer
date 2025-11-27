import { inngest } from '../client';

export const analyzeProject = inngest.createFunction(
  { id: 'analyze-project', retries: 3 },
  { event: 'monetizer/project.analyze' },
  async ({ event, step }) => {
    const analysis = await step.run('analyze', async () => {
      return { projectPath: event.data.projectPath, score: 75, suggestions: ['Add pricing page'] };
    });

    return analysis;
  }
);
