import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import {
  RevenueMultiplierGenerator,
  REVENUE_MULTIPLIER_CATALOG,
  DEV_TOOL_AFFILIATE_PROGRAMS,
  LEAD_SCORING_WEIGHTS,
} from '@monetizer/strategy';
import {
  displayHeader,
  displaySection,
  displayList,
  displayDivider,
  displayError,
  displaySuccess,
  displayWarning,
  displayKeyValue,
} from '../utils/display.js';

export const revenueCommand = new Command('revenue')
  .description('AI-powered revenue multipliers: affiliates, pricing tests, lead scoring, sponsorships')
  .option('-t, --type <type>', 'Multiplier type: affiliates | pricing | leads | sponsors | upsells | all', 'all')
  .option('--current-mrr <amount>', 'Current monthly recurring revenue', '0')
  .option('--target-mrr <amount>', 'Target monthly recurring revenue', '5000')
  .option('--catalog', 'Show available revenue multiplier catalog')
  .option('--affiliates', 'Show curated affiliate programs for dev tools')
  .option('--lead-weights', 'Show lead scoring weight configuration')
  .option('-o, --output <file>', 'Save strategy to file')
  .action(async (options) => {
    // Show catalog
    if (options.catalog) {
      displayCatalog();
      return;
    }

    // Show affiliate programs
    if (options.affiliates) {
      displayAffiliatePrograms();
      return;
    }

    // Show lead scoring weights
    if (options.leadWeights) {
      displayLeadWeights();
      return;
    }

    const spinner = ora('Generating revenue multiplier strategy...').start();

    try {
      const projectPath = process.cwd();
      const analysisPath = path.join(projectPath, '.monetizer', 'analysis.json');
      const strategyPath = path.join(projectPath, '.monetizer', 'strategy.json');

      // Load analysis and strategy
      if (!fs.existsSync(analysisPath)) {
        spinner.fail('Analysis not found');
        displayError('Run `monetizer analyze --save` first to analyze your project.');
        process.exit(1);
      }

      if (!fs.existsSync(strategyPath)) {
        spinner.fail('Strategy not found');
        displayError('Run `monetizer strategy` first to generate a monetization strategy.');
        process.exit(1);
      }

      const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
      const strategy = JSON.parse(fs.readFileSync(strategyPath, 'utf-8'));

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        spinner.fail('API key not found');
        displayError('Set ANTHROPIC_API_KEY environment variable.');
        process.exit(1);
      }

      const generator = new RevenueMultiplierGenerator({ anthropicApiKey: apiKey });
      const currentMRR = parseInt(options.currentMrr, 10);
      const targetMRR = parseInt(options.targetMrr, 10);

      // Generate based on type
      if (options.type === 'affiliates') {
        spinner.text = 'Finding optimal affiliate programs...';
        const affiliates = await generator.generateAffiliatePrograms(analysis, strategy);
        spinner.succeed('Affiliate programs generated!');
        displayGeneratedAffiliates(affiliates);
        saveOutput(options.output, projectPath, 'affiliates', affiliates);
      } else if (options.type === 'pricing') {
        spinner.text = 'Generating pricing experiments...';
        const experiments = await generator.generatePricingExperiments(analysis, strategy);
        spinner.succeed('Pricing experiments generated!');
        displayPricingExperiments(experiments);
        saveOutput(options.output, projectPath, 'pricing-experiments', experiments);
      } else if (options.type === 'upsells') {
        spinner.text = 'Generating upsell triggers...';
        const triggers = await generator.generateUpsellTriggers(analysis, strategy);
        spinner.succeed('Upsell triggers generated!');
        displayUpsellTriggers(triggers);
        saveOutput(options.output, projectPath, 'upsell-triggers', triggers);
      } else if (options.type === 'sponsors') {
        spinner.text = 'Finding sponsorship opportunities...';
        const sponsorships = await generator.generateSponsorships(analysis, strategy);
        spinner.succeed('Sponsorship opportunities generated!');
        displaySponsorships(sponsorships);
        saveOutput(options.output, projectPath, 'sponsorships', sponsorships);
      } else {
        // Generate full strategy
        spinner.text = 'Generating comprehensive revenue multiplier strategy...';
        const fullStrategy = await generator.generateStrategy(analysis, strategy, {
          currentMRR,
          targetMRR,
        });
        spinner.succeed('Revenue multiplier strategy generated!');
        displayFullStrategy(fullStrategy, currentMRR, targetMRR);
        saveOutput(options.output, projectPath, 'revenue-multipliers', fullStrategy);
      }

      // Next steps
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Review recommended multipliers and pick 2-3 to start',
        'Sign up for top affiliate programs (Railway, Vercel, Supabase)',
        'Set up A/B testing for pricing experiments',
        'Create sponsorship rate card page',
        'Implement upsell triggers in CLI and dashboard',
      ]);

    } catch (error) {
      spinner.fail('Revenue strategy generation failed');
      displayError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function saveOutput(outputPath: string | undefined, projectPath: string, name: string, data: any): void {
  const finalPath = outputPath || path.join(projectPath, '.monetizer', `${name}.json`);
  fs.mkdirSync(path.dirname(finalPath), { recursive: true });
  fs.writeFileSync(finalPath, JSON.stringify(data, null, 2));
  displaySuccess(`Strategy saved to ${finalPath}`);
}

function displayCatalog(): void {
  displayHeader('Revenue Multiplier Catalog');

  console.log(chalk.dim('\nAI-powered strategies to multiply your revenue:\n'));

  REVENUE_MULTIPLIER_CATALOG.forEach((m, i) => {
    const effort = {
      low: chalk.green('Low'),
      medium: chalk.yellow('Medium'),
      high: chalk.red('High'),
    }[m.implementationEffort];

    console.log(chalk.bold.cyan(`${i + 1}. ${m.name}`) + ` (${m.type})`);
    console.log(`   ${chalk.dim(m.description)}`);
    console.log(`   Revenue: ${chalk.green(m.estimatedRevenueLift)}`);
    console.log(`   Effort: ${effort} | Time: ${m.timeToFirstRevenue}`);
    console.log(`   Requires: ${m.requirements.join(', ')}`);
    console.log();
  });

  displayDivider();
  console.log(chalk.dim('\nRun `monetizer revenue --type=<type>` to generate specific strategies.'));
  console.log(chalk.dim('Types: affiliates | pricing | leads | sponsors | upsells | all'));
}

function displayAffiliatePrograms(): void {
  displayHeader('Developer Tool Affiliate Programs');

  console.log(chalk.dim('\nHigh-converting affiliate programs for dev audiences:\n'));

  DEV_TOOL_AFFILIATE_PROGRAMS.forEach((p, i) => {
    const relevance = Math.round(p.relevanceScore * 100);
    const relevanceColor = relevance >= 90 ? chalk.green : relevance >= 80 ? chalk.yellow : chalk.dim;

    console.log(chalk.bold.cyan(`${i + 1}. ${p.name}`) + ` (${p.type})`);
    console.log(`   Commission: ${chalk.green(p.commission)}`);
    console.log(`   Cookie: ${p.cookieDuration} | Method: ${p.integrationMethod}`);
    console.log(`   Est. Earnings: ${chalk.green(p.estimatedEarnings)}`);
    console.log(`   Relevance: ${relevanceColor(`${relevance}%`)} - ${p.audienceMatch}`);
    console.log(`   ${chalk.dim(`Signup: ${p.signupUrl}`)}`);
    console.log();
  });

  displayDivider();
  console.log(chalk.bold.green('\n💡 Tip: Start with Railway and Vercel - highest relevance for dev tools'));
  console.log(chalk.dim('Run `monetizer revenue --type=affiliates` for AI-customized recommendations.'));
}

function displayLeadWeights(): void {
  displayHeader('Lead Scoring Configuration');

  console.log(chalk.dim('\nSignal weights for calculating conversion probability:\n'));

  for (const [category, signals] of Object.entries(LEAD_SCORING_WEIGHTS)) {
    console.log(chalk.bold.cyan(`\n${category.toUpperCase()}`));
    for (const [signal, config] of Object.entries(signals as Record<string, { weight: number; thresholds: { low: number; medium: number; high: number } }>)) {
      const weight = Math.round(config.weight * 100);
      console.log(`  ${signal}: ${chalk.yellow(`${weight}%`)} weight`);
      console.log(`    Thresholds: low=${config.thresholds.low}, medium=${config.thresholds.medium}, high=${config.thresholds.high}`);
    }
  }

  displayDivider();
  console.log(chalk.dim('\nCustomize weights in your config for your specific conversion patterns.'));
}

function displayGeneratedAffiliates(affiliates: any[]): void {
  displayHeader('AI-Recommended Affiliate Programs');

  affiliates.forEach((p, i) => {
    const relevance = Math.round((p.relevanceScore || 0.5) * 100);
    console.log(chalk.bold.cyan(`\n${i + 1}. ${p.name}`) + ` (${p.type})`);
    console.log(`   Commission: ${chalk.green(p.commission)}`);
    console.log(`   Est. Earnings: ${chalk.green(p.estimatedEarnings)}`);
    console.log(`   Relevance: ${relevance}% - ${p.audienceMatch}`);
    if (p.signupUrl) {
      console.log(`   ${chalk.dim(`Signup: ${p.signupUrl}`)}`);
    }
  });

  console.log();
}

function displayPricingExperiments(experiments: any[]): void {
  displayHeader('Pricing Experiments to Test');

  experiments.forEach((e, i) => {
    const risk = {
      low: chalk.green('Low'),
      medium: chalk.yellow('Medium'),
      high: chalk.red('High'),
    }[e.riskLevel as string] || chalk.dim('Unknown');

    console.log(chalk.bold.cyan(`\n${i + 1}. ${e.name}`) + ` [${e.id}]`);
    console.log(`   Hypothesis: ${e.hypothesis}`);
    console.log(`   Test: $${e.variant?.originalPrice} → $${e.variant?.testPrice}`);
    console.log(`   Expected: ${chalk.green(e.expectedLift)} | Risk: ${risk}`);
    console.log(`   Duration: ${e.duration} | Success: ${e.successMetric}`);
  });

  console.log();
}

function displayUpsellTriggers(triggers: any[]): void {
  displayHeader('Intelligent Upsell Triggers');

  triggers.forEach((t, i) => {
    const timing = {
      immediate: chalk.green('⚡ Immediate'),
      delayed: chalk.yellow('⏱ Delayed'),
      scheduled: chalk.blue('📅 Scheduled'),
    }[t.timing as string] || t.timing;

    console.log(chalk.bold.cyan(`\n${i + 1}. ${t.trigger}`));
    console.log(`   Condition: ${chalk.dim(t.condition)}`);
    console.log(`   Target: ${t.targetPlan} | Channel: ${t.channel}`);
    console.log(`   Timing: ${timing}`);
    console.log(`   Message: "${t.message}"`);
    console.log(`   Expected: ${chalk.green(t.expectedConversion)} conversion`);
  });

  console.log();
}

function displaySponsorships(sponsorships: any[]): void {
  displayHeader('Sponsorship Opportunities');

  sponsorships.forEach((s, i) => {
    console.log(chalk.bold.cyan(`\n${i + 1}. ${s.type.toUpperCase()}: ${s.placement}`));
    console.log(`   Impressions: ${s.estimatedImpressions}/mo`);
    console.log(`   Suggested: ${chalk.green(`$${s.suggestedCPM} CPM`)} or ${chalk.green(`$${s.suggestedFlat}/mo flat`)}`);

    if (s.matchingSponsors?.length) {
      console.log(`   Matching sponsors:`);
      s.matchingSponsors.forEach((m: any) => {
        console.log(`     • ${m.category}: ${m.examples?.join(', ')}`);
      });
    }
  });

  console.log();
}

function displayFullStrategy(strategy: any, currentMRR: number, targetMRR: number): void {
  displayHeader('Revenue Multiplier Strategy');

  displayKeyValue('Current MRR', `$${currentMRR}`);
  displayKeyValue('Target MRR', `$${targetMRR}`);
  displayKeyValue('Gap to Close', `$${targetMRR - currentMRR}`);
  displayKeyValue('Est. Total Lift', strategy.totalEstimatedLift || 'TBD');

  // Multipliers
  console.log(chalk.bold.cyan('\n📈 Recommended Multipliers'));
  (strategy.multipliers || []).forEach((m: any, i: number) => {
    const effort = {
      low: chalk.green('●'),
      medium: chalk.yellow('●'),
      high: chalk.red('●'),
    }[m.implementationEffort as string] || '○';

    console.log(`\n  ${i + 1}. ${effort} ${chalk.bold(m.name)} (${m.type})`);
    console.log(`     ${chalk.dim(m.description)}`);
    console.log(`     Revenue: ${chalk.green(m.estimatedRevenueLift)}`);
    console.log(`     Time: ${m.timeToFirstRevenue}`);
  });

  // Implementation order
  if (strategy.implementationOrder?.length) {
    console.log(chalk.bold.cyan('\n🎯 Implementation Order'));
    strategy.implementationOrder.forEach((step: string, i: number) => {
      console.log(`  ${i + 1}. ${step}`);
    });
  }

  // Top affiliates
  if (strategy.affiliates?.length) {
    console.log(chalk.bold.cyan('\n🤝 Top Affiliate Programs'));
    strategy.affiliates.slice(0, 5).forEach((a: any) => {
      console.log(`  • ${a.name}: ${a.commission} - ${a.estimatedEarnings}`);
    });
  }

  // Top experiments
  if (strategy.pricingExperiments?.length) {
    console.log(chalk.bold.cyan('\n🧪 Pricing Experiments'));
    strategy.pricingExperiments.slice(0, 3).forEach((e: any) => {
      console.log(`  • ${e.name}: ${e.expectedLift}`);
    });
  }

  // Top upsells
  if (strategy.upsellTriggers?.length) {
    console.log(chalk.bold.cyan('\n⬆️ Upsell Triggers'));
    strategy.upsellTriggers.slice(0, 5).forEach((t: any) => {
      console.log(`  • ${t.trigger}: ${t.expectedConversion}`);
    });
  }

  console.log();
}
