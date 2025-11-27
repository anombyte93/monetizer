import { inngest } from '../client';

export const researchMarket = inngest.createFunction(
  { id: 'research-market', retries: 2, throttle: { limit: 5, period: '1m' } },
  { event: 'monetizer/market.research' },
  async ({ event, step }) => {
    const research = await step.run('research', async () => {
      return { competitors: [], pricing: [], trends: [] };
    });

    return research;
  }
);
