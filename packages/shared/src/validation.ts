/**
 * Zod validation schemas
 */

import { z } from 'zod';

export const ProjectConfigSchema = z.object({
  projectPath: z.string(),
  outputPath: z.string().optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
