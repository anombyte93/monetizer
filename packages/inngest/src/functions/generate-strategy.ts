import { inngest } from '../client';

export const generateStrategy = inngest.createFunction(
  { id: 'generate-strategy', retries: 3 },
  { event: 'monetizer/strategy.generate' },
  async ({ event, step }) => {
    const strategy = await step.run('generate', async () => {
      return { model: event.data.model || 'freemium', confidence: 0.85, recommendations: [] };
    });

    return strategy;
  }
);
