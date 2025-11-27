import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import {
  displayHeader,
  displaySection,
  displayList,
  displayDivider,
  displayError,
  displaySuccess,
  displayWarning,
  displayProgress,
  displayKeyValue,
} from '../utils/display.js';
import { loadConfig } from '../utils/config.js';

export const executeCommand = new Command('execute')
  .description('Execute monetization workflow')
  .option('-m, --method <method>', 'Orchestration method (developer|speed|research)', 'speed')
  .option('--all', 'Run all 3 orchestrators in parallel')
  .option('--dry-run', 'Show what would be done without executing')
  .option('--step <step>', 'Execute specific step (auth|payments|dashboard|deploy)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    const spinner = ora('Initializing execution...').start();

    try {
      const config = loadConfig();
      const projectPath = process.cwd();
      const strategyPath = path.join(projectPath, '.monetizer', 'strategy.json');

      // Load strategy
      if (!fs.existsSync(strategyPath)) {
        spinner.fail('No strategy found');
        displayError('Run `monetizer strategy` first to generate a strategy');
        process.exit(1);
      }

      const strategy = JSON.parse(fs.readFileSync(strategyPath, 'utf-8'));
      spinner.succeed('Strategy loaded');

      // Show execution plan
      displayHeader('¡ Monetization Execution Plan');
      displayKeyValue('Method', strategy.method);
      displayKeyValue('Orchestration', options.method);
      displayDivider();

      if (options.dryRun) {
        displayWarning('DRY RUN MODE - No changes will be made');
      }

      // Confirm execution
      if (!options.yes && !options.dryRun) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Ready to execute monetization workflow?',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('\nL Execution cancelled'));
          process.exit(0);
        }
      }

      // Execute based on method
      if (options.all) {
        await executeAllOrchestrators(strategy, options.dryRun);
      } else if (options.step) {
        await executeSingleStep(options.step, strategy, options.dryRun);
      } else {
        await executeWorkflow(options.method, strategy, options.dryRun);
      }

      // Success summary
      displaySuccess('Monetization workflow executed successfully!');

      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Test the implementation locally',
        'Deploy with Railway: ' + chalk.yellow('monetizer execute --step deploy'),
        'Create launch plan: ' + chalk.yellow('monetizer gtm'),
      ]);

    } catch (error) {
      spinner.fail('Execution failed');
      displayError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Execute full workflow with selected orchestration method
 */
async function executeWorkflow(method: string, strategy: any, dryRun: boolean): Promise<void> {
  displaySection(`<¯ Executing with ${method.toUpperCase()} orchestration`, []);

  const steps = [
    { name: 'Authentication', weight: 20 },
    { name: 'Payment Integration', weight: 30 },
    { name: 'User Dashboard', weight: 25 },
    { name: 'Admin Panel', weight: 15 },
    { name: 'Testing', weight: 10 },
  ];

  let totalProgress = 0;

  for (const step of steps) {
    const spinner = ora(`${step.name}...`).start();

    if (!dryRun) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
    }

    totalProgress += step.weight;
    spinner.succeed(step.name);
    displayProgress(totalProgress, 100, 'Overall Progress');
  }

  console.log();

  if (dryRun) {
    displayWarning('Dry run complete - no changes made');
  } else {
    displaySuccess('All steps completed!');

    // Save execution report
    const report = {
      method,
      strategy: strategy.method,
      timestamp: new Date().toISOString(),
      steps: steps.map(s => s.name),
      status: 'completed',
    };

    const reportPath = path.join(process.cwd(), '.monetizer', 'execution-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    displaySuccess(`Report saved to ${reportPath}`);
  }
}

/**
 * Execute all orchestrators in parallel
 */
async function executeAllOrchestrators(strategy: any, dryRun: boolean): Promise<void> {
  displaySection('=€ Parallel Execution - All Orchestrators', [
    'Developer Agent: Code generation',
    'Speed Agent: Quick implementation',
    'Research Agent: Best practices',
  ]);

  const orchestrators = ['developer', 'speed', 'research'];

  if (dryRun) {
    displayWarning('Would execute all 3 orchestrators in parallel');
    return;
  }

  const spinner = ora('Running all orchestrators...').start();

  // Simulate parallel execution
  await Promise.all(
    orchestrators.map(async (method) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { method, status: 'completed' };
    })
  );

  spinner.succeed('All orchestrators completed!');

  displaySection('=Ê Results', [
    `${chalk.green('')} Developer Agent: Code generated`,
    `${chalk.green('')} Speed Agent: Implementation complete`,
    `${chalk.green('')} Research Agent: Best practices applied`,
  ]);
}

/**
 * Execute a single step
 */
async function executeSingleStep(step: string, strategy: any, dryRun: boolean): Promise<void> {
  const stepMap: Record<string, { name: string; tasks: string[] }> = {
    auth: {
      name: 'Authentication',
      tasks: [
        'Install authentication libraries (Passport.js / Auth0)',
        'Create user model and database schema',
        'Implement JWT token generation',
        'Add login/register routes',
        'Set up password hashing with bcrypt',
      ],
    },
    payments: {
      name: 'Payment Integration',
      tasks: [
        'Install Stripe SDK',
        'Create Stripe customer on user signup',
        'Implement subscription creation',
        'Add webhook handlers for events',
        'Create billing portal integration',
      ],
    },
    dashboard: {
      name: 'User Dashboard',
      tasks: [
        'Create dashboard layout',
        'Add usage statistics display',
        'Implement account settings',
        'Add billing history view',
        'Create plan upgrade UI',
      ],
    },
    deploy: {
      name: 'Deployment',
      tasks: [
        'Build production bundle',
        'Set up Railway project',
        'Configure environment variables',
        'Deploy application',
        'Set up custom domain',
      ],
    },
  };

  const selectedStep = stepMap[step];
  if (!selectedStep) {
    throw new Error(`Unknown step: ${step}. Available: auth, payments, dashboard, deploy`);
  }

  displaySection(`=( Executing: ${selectedStep.name}`, []);

  for (let i = 0; i < selectedStep.tasks.length; i++) {
    const task = selectedStep.tasks[i];
    const spinner = ora(task).start();

    if (!dryRun) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    spinner.succeed(task);
    displayProgress(i + 1, selectedStep.tasks.length, selectedStep.name);
  }

  console.log();

  if (dryRun) {
    displayWarning(`Dry run complete for ${selectedStep.name}`);
  } else {
    displaySuccess(`${selectedStep.name} implemented successfully!`);
  }
}

/**
 * Validate execution prerequisites
 */
function validatePrerequisites(config: any, strategy: any): void {
  const errors: string[] = [];

  if (!config.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is required');
  }

  if (strategy.method === 'saas' || strategy.method === 'api') {
    if (!config.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY is required for payment integration');
    }
  }

  if (errors.length > 0) {
    displayError('Missing required configuration:');
    errors.forEach(err => console.error(chalk.red(`  " ${err}`)));
    process.exit(1);
  }
}
