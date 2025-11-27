import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { StrategyGenerator, MarketResearcher } from '@monetizer/strategy';
import {
  displayHeader,
  displaySection,
  displayList,
  displayDivider,
  displayJSON,
  displayError,
  displaySuccess,
  displayWarning,
  displayKeyValue,
} from '../utils/display.js';
import { loadConfig } from '../utils/config.js';

export const strategyCommand = new Command('strategy')
  .description('Generate monetization strategy')
  .option('-a, --analyze', 'Run analysis first if not cached')
  .option('--research', 'Include market research (requires Perplexity API key)')
  .option('-i, --interactive', 'Interactive strategy builder')
  .option('-o, --output <file>', 'Save strategy to file')
  .option('--method <type>', 'Monetization method (saas|api|freemium|sponsorship)')
  .action(async (options) => {
    const spinner = ora('Generating monetization strategy...').start();

    try {
      const config = loadConfig();
      const projectPath = process.cwd();
      const analysisPath = path.join(projectPath, '.monetizer', 'analysis.json');

      // Load or run analysis
      let analysis: any;
      if (fs.existsSync(analysisPath) && !options.analyze) {
        spinner.text = 'Loading cached analysis...';
        analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
      } else {
        spinner.text = 'Running project analysis...';
        displayWarning('No cached analysis found. Run `monetizer analyze --save` first for better results.');
        analysis = { potential: { score: 5 }, opportunities: [] };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        spinner.fail('Strategy generation failed');
        displayError('Anthropic API key not found. Set ANTHROPIC_API_KEY before running this command.');
        process.exit(1);
      }

      let marketResearch: {
        competitors: any[];
        pricingBenchmarks: any[];
        marketSize: string;
        targetAudience: string[];
        trends: any[];
        sources: any[];
      } | undefined;

      if (options.research) {
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
        if (!perplexityApiKey) {
          spinner.fail('Strategy generation failed');
          displayError('Perplexity API key not found. Set PERPLEXITY_API_KEY before running this command.');
          process.exit(1);
        }

        const researcher = new MarketResearcher(perplexityApiKey);
        spinner.text = 'Researching market...';

        const competitors = await researcher.getCompetitors(
          analysis.techStack?.frameworks?.[0] || 'developer tools'
        );
        const pricingBenchmarks = await researcher.getPricingBenchmarks('developer tools');

        marketResearch = {
          competitors,
          pricingBenchmarks,
          marketSize: 'Unknown',
          targetAudience: [],
          trends: [],
          sources: [],
        };
      }

      spinner.text = 'Generating strategy with Claude...';
      const generator = new StrategyGenerator({
        anthropicApiKey: apiKey,
      });
      const strategy = await generator.generate(analysis, {
        includeResearch: options.research,
      });

      if (marketResearch) {
        strategy.marketResearch = marketResearch;
      }

      const displayReadyStrategy = prepareStrategyForDisplay(strategy);

      spinner.succeed('Strategy generated!');

      // Display strategy
      if (options.output) {
        displayJSON(strategy);
      } else {
        displayStrategy(displayReadyStrategy);
      }

      // Save strategy
      const outputPath = path.join(projectPath, '.monetizer', 'strategy.json');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(strategy, null, 2));
      displaySuccess(`Strategy saved to ${outputPath}`);

      // Next steps
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Review the generated strategy',
        'Run ' + chalk.yellow('monetizer execute') + ' to implement',
        'Run ' + chalk.yellow('monetizer gtm') + ' for launch plan',
      ]);

    } catch (error) {
      spinner.fail('Strategy generation failed');
      displayError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function prepareStrategyForDisplay(strategy: any): any {
  const implementation =
    strategy.implementationPlan?.phases?.reduce((acc: Record<string, any>, phase: any, index: number) => {
      acc[`phase${index + 1}`] = {
        name: phase.name,
        duration: phase.duration,
        tasks: (phase.tasks ?? []).map((task: any) => {
          if (typeof task === 'string') return task;
          if (task?.title && task?.description) {
            return `${task.title}: ${task.description}`;
          }
          return task?.title ?? task?.description ?? 'Task';
        }),
      };
      return acc;
    }, {} as Record<string, any>) ?? {};

  return {
    method: strategy.primaryMethod?.name ?? strategy.primaryMethod?.type ?? 'Unknown',
    description: strategy.primaryMethod?.description ?? '',
    pricingModel: strategy.pricingModel ?? { tiers: [] },
    features: strategy.primaryMethod?.requiredFeatures ?? [],
    implementation,
    marketResearch: strategy.marketResearch,
  };
}

function displayStrategy(strategy: any): void {
  displayHeader('Monetization Strategy');

  displayKeyValue('Method', strategy.method);
  console.log(chalk.dim(strategy.description));
  displayDivider();

  // Pricing
  displaySection('Pricing Model', []);
  if (strategy.pricingModel.tiers) {
    strategy.pricingModel.tiers.forEach((tier: any) => {
      const price = tier.price === 0 ? chalk.green('Free') : chalk.green(`$${tier.price}/mo`);
      console.log(`\n  ${chalk.bold.cyan(tier.name)} - ${price}`);
      if (tier.features) {
        tier.features.forEach((f: string) => console.log(`    - ${f}`));
      }
      if (tier.perks) {
        tier.perks.forEach((p: string) => console.log(`    - ${p}`));
      }
      if (tier.quota) {
        console.log(`    - ${tier.quota.toLocaleString()} ${strategy.pricingModel.unit}/month`);
      }
    });
  } else if (strategy.pricingModel.free) {
    console.log(`\n  ${chalk.bold.cyan('Free Tier')}`);
    strategy.pricingModel.free.features.forEach((f: string) => console.log(`    - ${f}`));

    console.log(`\n  ${chalk.bold.cyan('Premium')} - ${chalk.green('$' + strategy.pricingModel.premium.price)}/month`);
    strategy.pricingModel.premium.features.forEach((f: string) => console.log(`    - ${f}`));
  }

  if (strategy.marketResearch) {
    displaySection('Market Research', []);

    if (strategy.marketResearch.competitors?.length) {
      console.log(`\n  ${chalk.bold.cyan('Competitors')}`);
      strategy.marketResearch.competitors.forEach((competitor: any) => {
        const pricing = competitor.pricing ? ` - ${chalk.green(competitor.pricing)}` : '';
        console.log(`    - ${competitor.name}${pricing}`);
      });
    }

    if (strategy.marketResearch.pricingBenchmarks?.length) {
      console.log(`\n  ${chalk.bold.cyan('Pricing Benchmarks')}`);
      strategy.marketResearch.pricingBenchmarks.forEach((benchmark: any) => {
        const formatPrice = (value: number) =>
          typeof value === 'number' && Number.isFinite(value)
            ? `$${value.toLocaleString()}`
            : undefined;

        const low = formatPrice(benchmark.lowEnd);
        const mid = formatPrice(benchmark.midRange);
        const high = formatPrice(benchmark.highEnd);

        const range = low && high ? `${low} - ${high}` : low || high || 'N/A';
        const midText = mid ? ` (mid ${mid})` : '';

        console.log(`    - ${benchmark.category}: ${range}${midText}`);
      });
    }
  }

  // Features
  displaySection('Features to Implement', strategy.features);

  // Implementation Plan
  displaySection('Implementation Plan', []);
  Object.values(strategy.implementation).forEach((phase: any) => {
    console.log(`\n  ${chalk.bold.cyan(phase.name)} (${phase.duration})`);
    phase.tasks.forEach((task: string) => {
      console.log(`    - ${task}`);
    });
  });

  console.log();
}
