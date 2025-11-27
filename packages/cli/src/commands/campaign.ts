import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import {
  ContentOrchestrator,
  CONTENT_PIPELINES,
  AI_TOOL_COSTS,
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

export const campaignCommand = new Command('campaign')
  .description('Generate full AI-powered marketing campaigns with multi-modal content')
  .option('-n, --name <name>', 'Campaign name')
  .option('-a, --audience <audience>', 'Target audience', 'developers')
  .option('-b, --budget <amount>', 'Monthly budget in USD', '1000')
  .option('-p, --pipeline <type>', 'Pipeline type: minimal | devLaunch | autonomous', 'devLaunch')
  .option('--variations <count>', 'Number of copy variations', '5')
  .option('--images', 'Generate ad images (requires OPENAI_API_KEY)')
  .option('--video', 'Generate video script (requires video API key)')
  .option('--skills', 'Show available AI skills and their status')
  .option('--costs', 'Show AI tool cost reference')
  .option('-o, --output <file>', 'Save campaign to file')
  .action(async (options) => {
    // Show skills status
    if (options.skills) {
      displaySkillsStatus();
      return;
    }

    // Show cost reference
    if (options.costs) {
      displayCostReference();
      return;
    }

    const spinner = ora('Initializing content orchestrator...').start();

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

      // Check API keys
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (!anthropicKey && !openaiKey) {
        spinner.fail('API key not found');
        displayError('Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable.');
        process.exit(1);
      }

      // ContentOrchestrator currently requires Anthropic
      if (!anthropicKey) {
        spinner.fail('Anthropic API key required');
        displayError('The campaign command currently requires ANTHROPIC_API_KEY. OpenAI support coming soon.');
        process.exit(1);
      }

      // Initialize orchestrator with available keys
      const orchestrator = new ContentOrchestrator({
        anthropicApiKey: anthropicKey,
        openaiApiKey: process.env.OPENAI_API_KEY,
        jasperApiKey: process.env.JASPER_API_KEY,
        copyaiApiKey: process.env.COPYAI_API_KEY,
        runwayApiKey: process.env.RUNWAY_API_KEY,
        synthesiaApiKey: process.env.SYNTHESIA_API_KEY,
        heygenApiKey: process.env.HEYGEN_API_KEY,
        adcreativeApiKey: process.env.ADCREATIVE_API_KEY,
        metaAccessToken: process.env.META_ACCESS_TOKEN,
        googleAdsToken: process.env.GOOGLE_ADS_TOKEN,
      });

      // Show available skills
      const skills = orchestrator.getAvailableSkills();
      spinner.text = 'Available skills: ' + Object.entries(skills)
        .filter(([_, v]) => v.enabled > 0)
        .map(([k, v]) => `${k}(${v.enabled})`)
        .join(', ');

      // Generate campaign
      spinner.text = 'Generating campaign content...';
      const budget = parseInt(options.budget, 10);
      const variations = parseInt(options.variations, 10);

      const campaign = await orchestrator.generateCampaign(
        analysis,
        strategy,
        {
          name: options.name,
          targetAudience: options.audience,
          budget: { monthly: budget },
          copyVariations: variations,
          generateImages: options.images,
          generateVideo: options.video,
        }
      );

      spinner.succeed('Campaign generated!');

      // Display campaign
      displayCampaign(campaign, orchestrator);

      // Save campaign
      const outputPath = options.output || path.join(projectPath, '.monetizer', `campaign-${Date.now()}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(campaign, null, 2));
      displaySuccess(`Campaign saved to ${outputPath}`);

      // Show deployment instructions
      console.log('\n' + chalk.bold.cyan('🚀 Deployment Instructions'));
      const instructions = orchestrator.getDeploymentInstructions(campaign);

      // Prioritize dev-focused platforms
      const priorityPlatforms = ['ethicalads', 'carbonads', 'google'];
      for (const platform of priorityPlatforms) {
        const inst = instructions[platform as keyof typeof instructions];
        if (inst) {
          const auto = inst.automated ? chalk.green('✓ API') : chalk.yellow('○ Manual');
          console.log(`\n  ${chalk.bold(platform.toUpperCase())} ${auto}`);
          console.log(`    Time: ${inst.estimatedTime}`);
          console.log(`    URL: ${inst.dashboardUrl}`);
          if (!inst.automated && inst.steps.length <= 5) {
            inst.steps.forEach(step => console.log(chalk.dim(`    ${step}`)));
          }
        }
      }

      // Next steps
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Review generated copy and customize for your brand voice',
        `Deploy to EthicalAds first ($${AI_TOOL_COSTS.deployment.ethicalads.minimumSpend} min)`,
        'Post social content to HN, Twitter, Reddit on launch day',
        'Track UTM parameters: ?utm_source=ethicalads&utm_campaign=' + campaign.id,
        'Run `monetizer campaign --skills` to see API integrations',
      ]);

    } catch (error) {
      spinner.fail('Campaign generation failed');
      displayError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function displaySkillsStatus(): void {
  displayHeader('AI Content Skills Status');

  console.log(chalk.bold.cyan('\n📝 Copy Generation'));
  displaySkillRow('Claude (Anthropic)', 'ANTHROPIC_API_KEY', true);
  displaySkillRow('Jasper', 'JASPER_API_KEY');
  displaySkillRow('Copy.ai', 'COPYAI_API_KEY');

  console.log(chalk.bold.cyan('\n🎨 Image Generation'));
  displaySkillRow('DALL-E 3', 'OPENAI_API_KEY');
  displaySkillRow('AdCreative.ai', 'ADCREATIVE_API_KEY');
  displaySkillRow('Midjourney', null, false, 'Manual via Discord');

  console.log(chalk.bold.cyan('\n🎬 Video Generation'));
  displaySkillRow('Runway Gen-4', 'RUNWAY_API_KEY');
  displaySkillRow('Synthesia', 'SYNTHESIA_API_KEY');
  displaySkillRow('HeyGen', 'HEYGEN_API_KEY');
  displaySkillRow('Pictory', null, false, 'Manual');

  console.log(chalk.bold.cyan('\n📣 Deployment'));
  displaySkillRow('Meta Ads', 'META_ACCESS_TOKEN');
  displaySkillRow('Google Ads', 'GOOGLE_ADS_TOKEN');
  displaySkillRow('EthicalAds', null, true, 'Manual (recommended)');
  displaySkillRow('Carbon Ads', null, true, 'Manual');

  displayDivider();
  console.log(chalk.dim('\nSet environment variables to enable API integrations.'));
  console.log(chalk.dim('Example: export OPENAI_API_KEY=sk-...'));
}

function displaySkillRow(
  name: string,
  envVar: string | null,
  alwaysEnabled = false,
  note?: string
): void {
  const hasKey = envVar ? !!process.env[envVar] : alwaysEnabled;
  const status = hasKey
    ? chalk.green('✓ Enabled')
    : chalk.dim('○ Not configured');
  const envNote = envVar ? chalk.dim(` (${envVar})`) : '';
  const extraNote = note ? chalk.dim(` - ${note}`) : '';
  console.log(`  ${status} ${name}${envNote}${extraNote}`);
}

function displayCostReference(): void {
  displayHeader('AI Tool Cost Reference');

  console.log(chalk.bold.cyan('\n📝 Copy Generation'));
  console.log('  Claude (Anthropic)    ~$0.003/request    No subscription');
  console.log('  Jasper                ~$0.01/request     $49/mo');
  console.log('  Copy.ai               ~$0.005/request    $36/mo');

  console.log(chalk.bold.cyan('\n🎨 Image Generation'));
  console.log('  DALL-E 3              $0.04/image        No subscription');
  console.log('  Midjourney            $0.02/image        $10/mo');
  console.log('  AdCreative.ai         $0.10/image        $21/mo');

  console.log(chalk.bold.cyan('\n🎬 Video Generation'));
  console.log('  Runway Gen-4          $0.50/minute       $12/mo');
  console.log('  Synthesia             $1.00/minute       $22/mo');
  console.log('  HeyGen                $0.80/minute       $24/mo');
  console.log('  Pictory               $0.30/minute       $19/mo');

  console.log(chalk.bold.cyan('\n📣 Ad Platforms'));
  console.log('  EthicalAds            $4.50 CPM          $1,000 min spend');
  console.log('  Carbon Ads            $5.00 CPM          $1,500 min spend');
  console.log('  Google Ads            $2.50 CPC avg      $500 min recommended');
  console.log('  Meta Ads              $8.00 CPM avg      $500 min recommended');

  console.log(chalk.bold.cyan('\n💰 Bootstrapper Budget Recommendation'));
  console.log('  Minimum effective:    $500/mo');
  console.log('  Recommended:          $1,500/mo');
  console.log('  Allocation:');
  console.log('    40% EthicalAds');
  console.log('    30% Carbon Ads');
  console.log('    20% Google Ads');
  console.log('    10% AI Tools');

  displayDivider();
}

function displayCampaign(campaign: any, orchestrator: any): void {
  displayHeader(`Campaign: ${campaign.name}`);

  displayKeyValue('ID', campaign.id);
  displayKeyValue('Status', campaign.status);
  displayKeyValue('Target Audience', campaign.targetAudience);
  displayKeyValue('Budget', `$${campaign.budget.monthly}/mo`);

  // Headlines
  console.log(chalk.bold.cyan('\n📝 Headlines'));
  campaign.content.headlines.forEach((h: string, i: number) => {
    console.log(`  ${i + 1}. ${h}`);
  });

  // Bodies
  console.log(chalk.bold.cyan('\n📄 Ad Copy'));
  campaign.content.bodies.forEach((b: string, i: number) => {
    console.log(`  ${i + 1}. ${b}`);
  });

  // Social Posts
  if (campaign.content.socialPosts.length > 0) {
    console.log(chalk.bold.cyan('\n📱 Social Posts'));
    const platforms = new Set(
      campaign.content.socialPosts.map((p: any) => p.content.metadata.platform)
    );
    console.log(`  Generated ${campaign.content.socialPosts.length} posts for: ${[...platforms].join(', ')}`);
  }

  // Images
  if (campaign.content.images.length > 0) {
    console.log(chalk.bold.cyan('\n🎨 Images'));
    campaign.content.images.forEach((img: any, i: number) => {
      if (img.content.url) {
        console.log(`  ${i + 1}. ${img.content.url}`);
      } else if (img.content.metadata.instructions) {
        console.log(`  ${chalk.yellow('○')} Manual creation required`);
        console.log(chalk.dim(`    See campaign JSON for specs`));
      } else if (img.content.metadata.prompt) {
        console.log(`  ${i + 1}. DALL-E prompt ready (add OPENAI_API_KEY to generate)`);
      }
    });
  }

  // Videos
  if (campaign.content.videos.length > 0) {
    console.log(chalk.bold.cyan('\n🎬 Video'));
    const video = campaign.content.videos[0];
    if (video.content.metadata.script) {
      console.log('  Script generated - see campaign JSON');
      console.log(chalk.dim('  Recommended: Synthesia ($22/mo) or Loom (free)'));
    }
  }

  console.log();
}
