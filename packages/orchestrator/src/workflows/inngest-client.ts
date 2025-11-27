import { Inngest } from 'inngest';

const appId = process.env.INNGEST_APP_ID ?? 'monetizer-orchestrator';

/**
 * Shared Inngest client for orchestrator workflows.
 * optimizeParallelism keeps Promise.all flows efficient for step.run calls.
 */
export const inngest = new Inngest({
  id: appId,
  eventKey: process.env.INNGEST_EVENT_KEY,
  env: process.env.INNGEST_ENV,
  optimizeParallelism: true,
});
