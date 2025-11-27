import { config } from 'dotenv';
import { z } from 'zod';
import { displayError, displayWarning } from './display.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  RAILWAY_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
}).refine(
  (data) => data.ANTHROPIC_API_KEY || data.OPENAI_API_KEY,
  { message: 'Either ANTHROPIC_API_KEY or OPENAI_API_KEY is required' }
);

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load configuration from .env file
 */
export function loadConfig(projectPath?: string): Config {
  // Try to load from project directory first, then fallback to current directory
  const envPaths = [
    projectPath ? path.join(projectPath, '.env') : null,
    path.join(process.cwd(), '.env'),
    path.join(process.env.HOME || '~', '.env'),
  ].filter(Boolean) as string[];

  let loaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    displayWarning('No .env file found. Checking environment variables...');
  }

  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      displayError('Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(chalk.red(`  " ${err.path.join('.')}: ${err.message}`));
      });

      console.log('\n' + chalk.yellow('Required (at least one):'));
      console.log(chalk.dim('  " ANTHROPIC_API_KEY - Claude AI (recommended)'));
      console.log(chalk.dim('  " OPENAI_API_KEY - GPT-4 (alternative)'));

      console.log('\n' + chalk.yellow('Optional (enhances functionality):'));
      console.log(chalk.dim('  " PERPLEXITY_API_KEY (for market research)'));
      console.log(chalk.dim('  " RAILWAY_TOKEN (for deployment)'));
      console.log(chalk.dim('  " STRIPE_SECRET_KEY (for payment integration)'));
      console.log(chalk.dim('  " GITHUB_TOKEN (for repo analysis)'));

      console.log('\n' + chalk.cyan('Create a .env file in your project or home directory.'));
      console.log(chalk.dim('Example: cp .env.example .env\n'));

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validate that required API keys are present for specific features
 */
export function validateFeatureConfig(feature: 'research' | 'deployment' | 'payments', config: Config): boolean {
  switch (feature) {
    case 'research':
      if (!config.PERPLEXITY_API_KEY) {
        displayWarning('PERPLEXITY_API_KEY not set. Research features will use basic analysis.');
        return false;
      }
      return true;

    case 'deployment':
      if (!config.RAILWAY_TOKEN) {
        displayWarning('RAILWAY_TOKEN not set. Deployment features will be limited.');
        return false;
      }
      return true;

    case 'payments':
      if (!config.STRIPE_SECRET_KEY) {
        displayWarning('STRIPE_SECRET_KEY not set. Payment integration features will be limited.');
        return false;
      }
      return true;

    default:
      return true;
  }
}

/**
 * Get config value safely with fallback
 */
export function getConfigValue(key: keyof Config, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Check if running in verbose mode
 */
export function isVerbose(): boolean {
  return process.env.VERBOSE === 'true' || process.argv.includes('--verbose') || process.argv.includes('-v');
}

/**
 * Get project configuration if it exists
 */
export function loadProjectConfig(projectPath: string): any {
  const configPath = path.join(projectPath, 'monetizer.config.json');

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    displayWarning(`Failed to load project config: ${configPath}`);
    return {};
  }
}
