import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { AdCopyGenerator, DEV_TOOL_AD_RECOMMENDATIONS } from '@monetizer/strategy';
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

export const adsCommand = new Command('ads')
  .description('Generate AI-powered advertising strategy and ad copy')
  .option('-b, --budget <amount>', 'Monthly advertising budget in USD', '500')
  .option('-p, --platform <platform>', 'Generate copy for specific platform (ethicalads|carbonads|google|meta|twitter)')
  .option('-n, --variations <count>', 'Number of ad variations to generate', '5')
  .option('-o, --output <file>', 'Save ad strategy to file')
  .option('--recommendations', 'Show platform recommendations without generating')
  .action(async (options) => {
    // Show recommendations only
    if (options.recommendations) {
      displayRecommendations();
      return;
    }

    const spinner = ora('Generating advertising strategy...').start();

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

      const generator = new AdCopyGenerator({ anthropicApiKey: apiKey });
      const budget = parseInt(options.budget, 10);

      // Generate platform-specific copy or full strategy
      if (options.platform) {
        spinner.text = `Generating ${options.platform} ad copy...`;
        const variations = parseInt(options.variations, 10);
        const adCopy = await generator.generateAdCopy(
          analysis,
          strategy,
          options.platform,
          variations
        );

        spinner.succeed(`Generated ${adCopy.length} ad variations for ${options.platform}`);
        displayAdCopy(adCopy, options.platform);

        // Save to file
        const outputPath = options.output || path.join(projectPath, '.monetizer', `ads-${options.platform}.json`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(adCopy, null, 2));
        displaySuccess(`Ad copy saved to ${outputPath}`);
      } else {
        // Full advertising strategy
        spinner.text = 'Generating comprehensive advertising strategy...';
        const adStrategy = await generator.generateAdvertisingStrategy(
          analysis,
          strategy,
          { monthlyBudget: budget }
        );

        spinner.succeed('Advertising strategy generated!');
        displayAdStrategy(adStrategy, budget);

        // Save to file
        const outputPath = options.output || path.join(projectPath, '.monetizer', 'advertising-strategy.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(adStrategy, null, 2));
        displaySuccess(`Strategy saved to ${outputPath}`);
      }

      // Next steps
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Review generated ad copy and customize for your brand',
        'Start with EthicalAds ($1k min) for dev-focused audience',
        'Use AdCreative.ai ($21/mo) to generate visual creatives',
        'Track conversions with UTM parameters',
        'A/B test headlines - run 3-5 variations minimum',
      ]);

    } catch (error) {
      spinner.fail('Ad generation failed');
      displayError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function displayRecommendations(): void {
  displayHeader('Advertising Recommendations for Dev Tools');

  console.log(chalk.bold.cyan('\n📊 Platform Comparison\n'));

  const platforms = DEV_TOOL_AD_RECOMMENDATIONS.platforms;

  // EthicalAds
  console.log(chalk.bold.green('  EthicalAds') + chalk.dim(' (Recommended #1)'));
  console.log(`    URL: ${platforms.ethicalads.url}`);
  console.log(`    Min Spend: $${platforms.ethicalads.minimumSpend}`);
  console.log(`    CPM: ${platforms.ethicalads.cpmRange}`);
  console.log(`    Best For: ${platforms.ethicalads.bestFor}`);
  console.log(`    Setup: ${platforms.ethicalads.setupTime}`);

  // Carbon Ads
  console.log(chalk.bold.green('\n  Carbon Ads') + chalk.dim(' (Recommended #2)'));
  console.log(`    URL: ${platforms.carbonads.url}`);
  console.log(`    Min Spend: $${platforms.carbonads.minimumSpend}`);
  console.log(`    CPM: ${platforms.carbonads.cpmRange}`);
  console.log(`    Best For: ${platforms.carbonads.bestFor}`);
  console.log(`    Setup: ${platforms.carbonads.setupTime}`);

  // Google Ads
  console.log(chalk.bold.yellow('\n  Google Ads') + chalk.dim(' (Use after traction)'));
  console.log(`    URL: ${platforms.google.url}`);
  console.log(`    Min Spend: $${platforms.google.minimumSpend}`);
  console.log(`    CPC: ${platforms.google.cpcRange}`);
  console.log(`    Best For: ${platforms.google.bestFor}`);
  console.log(`    Setup: ${platforms.google.setupTime}`);

  console.log(chalk.bold.cyan('\n🤖 AI Tools for Ad Generation\n'));

  const tools = DEV_TOOL_AD_RECOMMENDATIONS.aiTools;
  Object.values(tools).forEach((tool: any) => {
    console.log(`  ${chalk.bold(tool.name)}`);
    console.log(`    Cost: ${tool.cost}`);
    console.log(`    Best For: ${tool.bestFor}`);
    console.log(`    URL: ${tool.url}`);
    console.log();
  });

  console.log(chalk.bold.cyan('💰 Bootstrapper Budget Allocation\n'));
  const budget = DEV_TOOL_AD_RECOMMENDATIONS.bootstrapperBudget;
  console.log(`  Minimum effective spend: $${budget.minimum}/mo`);
  console.log(`  Recommended spend: $${budget.recommended}/mo`);
  console.log('\n  Allocation:');
  console.log(`    EthicalAds: ${budget.allocation.ethicalads * 100}%`);
  console.log(`    Carbon Ads: ${budget.allocation.carbonads * 100}%`);
  console.log(`    Google Ads: ${budget.allocation.google * 100}%`);
  console.log(`    AI Tools: ${budget.allocation.aiTools * 100}%`);

  displayDivider();
  console.log(chalk.dim('\nRun `monetizer ads` to generate a full advertising strategy with AI.'));
}

function displayAdStrategy(strategy: any, budget: number): void {
  displayHeader('Advertising Strategy');

  displayKeyValue('Monthly Budget', `$${budget}`);
  displayDivider();

  // Budget recommendations
  console.log(chalk.bold.cyan('\n💰 Budget Recommendations'));
  console.log(`  Minimum: $${strategy.recommendedBudget?.minimum || 500}`);
  console.log(`  Optimal: $${strategy.recommendedBudget?.optimal || 1500}`);
  console.log(`  Aggressive: $${strategy.recommendedBudget?.aggressive || 3000}`);

  // Platforms
  console.log(chalk.bold.cyan('\n📊 Platform Strategies'));
  (strategy.platforms || []).forEach((platform: any) => {
    const status = platform.recommended ? chalk.green('✓ Recommended') : chalk.yellow('○ Optional');
    console.log(`\n  ${chalk.bold(platform.platform.toUpperCase())} ${status}`);
    console.log(`    Min Spend: $${platform.minimumSpend}`);
    console.log(`    Expected CPC: ${platform.expectedCPC}`);
    console.log(`    Expected CTR: ${platform.expectedCTR}`);
    console.log(`    Audience Match: ${platform.audienceMatch}`);

    if (platform.adVariations?.length) {
      console.log(chalk.dim(`    ${platform.adVariations.length} ad variations generated`));
    }
  });

  // AI Tools
  if (strategy.aiTools?.length) {
    console.log(chalk.bold.cyan('\n🤖 Recommended AI Tools'));
    strategy.aiTools.forEach((tool: any) => {
      const rec = tool.recommended ? chalk.green('★') : chalk.dim('○');
      console.log(`  ${rec} ${tool.name} (${tool.monthlyCost})`);
      console.log(`    ${chalk.dim(tool.purpose)}`);
    });
  }

  // Timeline
  if (strategy.timeline) {
    console.log(chalk.bold.cyan('\n📅 Implementation Timeline'));
    if (strategy.timeline.week1?.length) {
      console.log('\n  Week 1:');
      strategy.timeline.week1.forEach((item: string) => console.log(`    • ${item}`));
    }
    if (strategy.timeline.week2to4?.length) {
      console.log('\n  Weeks 2-4:');
      strategy.timeline.week2to4.forEach((item: string) => console.log(`    • ${item}`));
    }
    if (strategy.timeline.month2to3?.length) {
      console.log('\n  Months 2-3:');
      strategy.timeline.month2to3.forEach((item: string) => console.log(`    • ${item}`));
    }
  }

  // Metrics
  if (strategy.metrics) {
    console.log(chalk.bold.cyan('\n📈 Target Metrics'));
    console.log(`  Target CAC: $${strategy.metrics.targetCAC}`);
    console.log(`  Max CAC: $${strategy.metrics.maxCAC}`);
    console.log(`  Expected Conversion: ${strategy.metrics.expectedConversionRate}`);
    console.log(`  Break-even Clicks: ${strategy.metrics.breakEvenClicks}`);
  }

  console.log();
}

function displayAdCopy(ads: any[], platform: string): void {
  displayHeader(`Ad Copy for ${platform.toUpperCase()}`);

  ads.forEach((ad, i) => {
    console.log(chalk.bold.cyan(`\n  Variation ${i + 1}`) + chalk.dim(` (${ad.hook})`));
    console.log(`  ${chalk.bold('Headline:')} ${ad.headline}`);
    console.log(`  ${chalk.bold('Body:')} ${ad.body}`);
    console.log(`  ${chalk.bold('CTA:')} ${ad.cta}`);
    console.log(`  ${chalk.dim('Audience:')} ${ad.targetAudience}`);
    console.log(`  ${chalk.dim('Est. CPC:')} ${ad.estimatedCPC}`);
  });

  console.log();
}
