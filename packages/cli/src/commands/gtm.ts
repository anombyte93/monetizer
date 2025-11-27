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
  displayKeyValue,
  displayJSON,
} from '../utils/display.js';
import { loadConfig, validateFeatureConfig } from '../utils/config.js';

export const gtmCommand = new Command('gtm')
  .description('Generate go-to-market plan')
  .option('-o, --output <file>', 'Output file path (default: .monetizer/gtm-plan.md)')
  .option('--ph', 'Include Product Hunt launch strategy')
  .option('--hn', 'Include Hacker News launch strategy')
  .option('--reddit', 'Include Reddit launch strategy')
  .option('--twitter', 'Include Twitter/X launch strategy')
  .option('--all-channels', 'Include all marketing channels')
  .option('--research', 'Use market research for competitive analysis')
  .option('--format <format>', 'Output format (markdown|json)', 'markdown')
  .action(async (options) => {
    const spinner = ora('Generating go-to-market plan...').start();

    try {
      const config = loadConfig();

      if (options.research) {
        validateFeatureConfig('research', config);
      }

      const projectPath = process.cwd();
      const strategyPath = path.join(projectPath, '.monetizer', 'strategy.json');

      // Load strategy if available
      let strategy: any = null;
      if (fs.existsSync(strategyPath)) {
        strategy = JSON.parse(fs.readFileSync(strategyPath, 'utf-8'));
      } else {
        displayWarning('No strategy found. Generate one with `monetizer strategy` for better GTM plan.');
      }

      // Select channels
      let channels: string[] = [];
      if (options.allChannels) {
        channels = ['product-hunt', 'hacker-news', 'reddit', 'twitter', 'linkedin', 'email'];
      } else {
        if (options.ph) channels.push('product-hunt');
        if (options.hn) channels.push('hacker-news');
        if (options.reddit) channels.push('reddit');
        if (options.twitter) channels.push('twitter');

        if (channels.length === 0) {
          // Interactive channel selection
          spinner.stop();
          const answers = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'channels',
              message: 'Select launch channels:',
              choices: [
                { name: '=€ Product Hunt - Tech community launch', value: 'product-hunt', checked: true },
                { name: '=% Hacker News - Developer community', value: 'hacker-news' },
                { name: '=} Reddit - Niche subreddits', value: 'reddit' },
                { name: '=& Twitter/X - Tech Twitter audience', value: 'twitter' },
                { name: '=¼ LinkedIn - B2B audience', value: 'linkedin' },
                { name: '=ç Email - Direct to existing list', value: 'email' },
              ],
            },
            {
              type: 'input',
              name: 'launchDate',
              message: 'Target launch date (YYYY-MM-DD):',
              default: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
          ]);
          channels = answers.channels;
          spinner.start('Generating GTM plan...');
        }
      }

      // Generate GTM plan
      spinner.text = 'Building launch timeline...';
      await new Promise(resolve => setTimeout(resolve, 1000));

      spinner.text = 'Creating channel strategies...';
      await new Promise(resolve => setTimeout(resolve, 1000));

      const gtmPlan = await generateGTMPlan(strategy, channels, options.research);

      spinner.succeed('Go-to-market plan generated!');

      // Display plan
      if (options.format === 'json') {
        displayJSON(gtmPlan);
      } else {
        displayGTMPlan(gtmPlan);
      }

      // Save plan
      const outputPath = options.output || path.join(projectPath, '.monetizer', 'gtm-plan.md');
      const outputDir = path.dirname(outputPath);
      fs.mkdirSync(outputDir, { recursive: true });

      if (options.format === 'json') {
        fs.writeFileSync(outputPath.replace('.md', '.json'), JSON.stringify(gtmPlan, null, 2));
      } else {
        const markdown = generateMarkdown(gtmPlan);
        fs.writeFileSync(outputPath, markdown);
      }

      displaySuccess(`GTM plan saved to ${outputPath}`);

      // Next steps
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Review the plan and adjust timeline',
        'Prepare marketing assets (screenshots, video)',
        'Build landing page',
        'Set up analytics tracking',
        'Schedule social media posts',
      ]);

    } catch (error) {
      spinner.fail('GTM plan generation failed');
      displayError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Generate comprehensive GTM plan
 */
async function generateGTMPlan(strategy: any, channels: string[], includeResearch: boolean): Promise<any> {
  const plan: any = {
    overview: {
      targetAudience: strategy?.method === 'saas' ? 'B2B SaaS buyers' : 'Developers and tech enthusiasts',
      valueProposition: 'Transform your project into a revenue-generating business',
      launchGoals: {
        signups: 1000,
        revenue: 5000,
        socialMentions: 500,
      },
    },
    timeline: generateTimeline(),
    channels: {},
    contentStrategy: generateContentStrategy(),
    metrics: defineMetrics(),
    budget: estimateBudget(channels),
  };

  // Generate channel-specific strategies
  for (const channel of channels) {
    plan.channels[channel] = await generateChannelStrategy(channel, strategy);
  }

  if (includeResearch) {
    plan.competitiveAnalysis = {
      competitors: 'Would use Perplexity API for research',
      positioning: 'Unique positioning in market',
    };
  }

  return plan;
}

/**
 * Generate launch timeline
 */
function generateTimeline(): any {
  const today = new Date();
  const addDays = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  return {
    'Pre-Launch (-14 days)': {
      week1: [
        'Build landing page with waitlist',
        'Create demo video and screenshots',
        'Write Product Hunt submission',
        'Prepare press kit',
      ],
      week2: [
        'Set up analytics (Google Analytics, PostHog)',
        'Create social media accounts',
        'Build email list',
        'Line up beta users for testimonials',
      ],
    },
    'Launch Week': {
      dayBefore: [
        'Schedule Product Hunt submission for 12:01 AM PT',
        'Prepare social media posts',
        'Alert email list about tomorrow',
        'Final QA testing',
      ],
      launchDay: [
        'Submit to Product Hunt',
        'Post on Hacker News',
        'Share on Twitter/LinkedIn',
        'Engage with comments all day',
        'Monitor analytics',
      ],
      restOfWeek: [
        'Continue engaging with community',
        'Post to relevant subreddits',
        'Reach out to tech bloggers',
        'Collect feedback and iterate',
      ],
    },
    'Post-Launch (+7 days)': {
      tasks: [
        'Analyze launch metrics',
        'Write launch retrospective',
        'Plan v2 features based on feedback',
        'Set up ongoing marketing',
      ],
    },
  };
}

/**
 * Generate channel-specific strategy
 */
async function generateChannelStrategy(channel: string, strategy: any): Promise<any> {
  const strategies: Record<string, any> = {
    'product-hunt': {
      timing: '12:01 AM PT Tuesday-Thursday',
      title: 'Keep it under 60 characters, highlight main benefit',
      tagline: '1 sentence value prop',
      preparation: [
        'Hunter: Find someone with 500+ followers',
        'Teaser: Post "Coming Soon" 2 days before',
        'Comments: Prepare 3-5 detailed responses',
        'Gallery: 3-5 images + demo video',
      ],
      launchDay: [
        'Post at 12:01 AM PT',
        'Respond to every comment within 5 minutes',
        'Update top comment with metrics',
        'Share on Twitter every 2 hours',
        'Aim for top 5 of the day',
      ],
      metrics: {
        target: 'Top 5 Product of the Day',
        upvotes: '300+',
        comments: '50+',
        traffic: '5,000+ visitors',
      },
    },
    'hacker-news': {
      timing: '8-10 AM ET weekdays',
      title: 'Honest, technical, no marketing speak',
      approach: 'Show HN: [Project Name] - Brief technical description',
      preparation: [
        'Write technical blog post first',
        'Prepare for technical questions',
        'Have GitHub readme polished',
        'Be ready to share technical decisions',
      ],
      launchDay: [
        'Post between 8-10 AM ET',
        'Respond technically and honestly',
        'Share interesting technical details',
        'Avoid marketing language',
        'Engage with criticism constructively',
      ],
      metrics: {
        target: 'Front page for 2+ hours',
        points: '50+',
        comments: '20+',
      },
    },
    reddit: {
      preparation: [
        'Research relevant subreddits',
        'Read subreddit rules carefully',
        'Build karma before posting',
        'Engage authentically',
      ],
      subreddits: [
        'r/SideProject - Side project showcase',
        'r/EntrepreneurRideAlong - Startup journey',
        'r/webdev - Web development (if relevant)',
        'r/startups - Startup community',
      ],
      approach: 'Story-driven, share journey not just product',
      launchDay: [
        'Post personal story, not just product',
        'Be active in comments',
        'Cross-post to relevant subs',
        'Follow 10% self-promotion rule',
      ],
    },
    twitter: {
      preparation: [
        'Build Twitter presence 2 weeks before',
        'Engage with tech community',
        'Build in public thread',
        'Line up retweets from friends',
      ],
      launchDay: [
        'Launch thread (8-10 tweets)',
        'Tag relevant accounts',
        'Use relevant hashtags (#buildinpublic)',
        'Ask for retweets',
        'Pin tweet to profile',
      ],
      ongoing: [
        'Daily progress updates',
        'Share metrics transparently',
        'Engage with replies',
        'Build community',
      ],
    },
    linkedin: {
      approach: 'Professional, B2B focused',
      content: [
        'Launch post with business value',
        'Case study format',
        'Connect with industry leaders',
        'Share journey and lessons',
      ],
    },
    email: {
      sequence: [
        'Day -3: "Something exciting coming"',
        'Day 0: "We launched! Here\'s what\'s new"',
        'Day +3: "Here\'s what users are saying"',
        'Day +7: "Limited time offer"',
      ],
    },
  };

  return strategies[channel] || { note: 'Strategy not defined for this channel' };
}

/**
 * Generate content strategy
 */
function generateContentStrategy(): any {
  return {
    landingPage: {
      hero: 'Clear value proposition in 10 words',
      cta: 'Single, prominent call-to-action',
      socialProof: 'Testimonials, logos, metrics',
      demo: 'Video or interactive demo',
      pricing: 'Clear, simple pricing table',
    },
    blog: [
      'Technical deep-dive into architecture',
      'Problem we\'re solving',
      'Launch story and metrics',
      'How we built it',
    ],
    social: {
      assets: [
        'Product screenshots',
        '30-second demo video',
        'Founder story',
        'User testimonials',
        'Metrics and milestones',
      ],
    },
  };
}

/**
 * Define success metrics
 */
function defineMetrics(): any {
  return {
    awareness: {
      websiteVisitors: 10000,
      socialImpressions: 50000,
      pressPickups: 5,
    },
    engagement: {
      signups: 1000,
      activations: 200,
      socialEngagement: 500,
    },
    revenue: {
      freeToPaid: 20,
      mrr: 1000,
      ltv: 500,
    },
  };
}

/**
 * Estimate marketing budget
 */
function estimateBudget(channels: string[]): any {
  const channelCosts: Record<string, number> = {
    'product-hunt': 0, // Free
    'hacker-news': 0, // Free
    reddit: 0, // Free
    twitter: 100, // Sponsored tweets optional
    linkedin: 200, // LinkedIn ads optional
    email: 50, // Email tool
  };

  let total = 0;
  const breakdown: Record<string, number> = {};

  for (const channel of channels) {
    breakdown[channel] = channelCosts[channel] || 0;
    total += breakdown[channel];
  }

  breakdown['landing-page'] = 0; // Self-hosted
  breakdown['analytics'] = 0; // Free tier
  breakdown['contingency'] = total * 0.2;
  total += breakdown['contingency'];

  return {
    total,
    breakdown,
    note: 'Most launch channels are free. Budget is for optional paid amplification.',
  };
}

/**
 * Display GTM plan in terminal
 */
function displayGTMPlan(plan: any): void {
  displayHeader('=€ Go-To-Market Plan');

  // Overview
  displaySection('=Ê Overview', [
    `Target Audience: ${plan.overview.targetAudience}`,
    `Value Proposition: ${plan.overview.valueProposition}`,
  ]);

  displayKeyValue('Signup Goal', plan.overview.launchGoals.signups.toLocaleString());
  displayKeyValue('Revenue Goal', '$' + plan.overview.launchGoals.revenue.toLocaleString());
  displayDivider();

  // Timeline
  displaySection('=Å Launch Timeline', []);
  Object.entries(plan.timeline).forEach(([phase, data]: [string, any]) => {
    console.log(`\n  ${chalk.bold.cyan(phase)}`);
    Object.entries(data).forEach(([period, tasks]: [string, any]) => {
      console.log(`    ${chalk.dim(period)}:`);
      (tasks as string[]).forEach((task: string) => {
        console.log(`      ${chalk.dim('"')} ${task}`);
      });
    });
  });

  // Channels
  displaySection('=â Launch Channels', []);
  Object.entries(plan.channels).forEach(([channel, strategy]: [string, any]) => {
    console.log(`\n  ${chalk.bold.cyan(channel.replace('-', ' ').toUpperCase())}`);
    if (strategy.timing) console.log(`    ${chalk.dim('Timing:')} ${strategy.timing}`);
    if (strategy.approach) console.log(`    ${chalk.dim('Approach:')} ${strategy.approach}`);
    if (strategy.metrics) {
      console.log(`    ${chalk.dim('Target:')} ${strategy.metrics.target || 'See details'}`);
    }
  });

  // Budget
  displaySection('=° Budget', [
    `Total: $${plan.budget.total}`,
    chalk.dim(plan.budget.note),
  ]);

  console.log();
}

/**
 * Generate markdown document
 */
function generateMarkdown(plan: any): string {
  let md = '# Go-To-Market Plan\n\n';

  md += '## Overview\n\n';
  md += `- **Target Audience**: ${plan.overview.targetAudience}\n`;
  md += `- **Value Proposition**: ${plan.overview.valueProposition}\n`;
  md += `- **Launch Goals**: ${plan.overview.launchGoals.signups} signups, $${plan.overview.launchGoals.revenue} revenue\n\n`;

  md += '## Launch Timeline\n\n';
  Object.entries(plan.timeline).forEach(([phase, data]: [string, any]) => {
    md += `### ${phase}\n\n`;
    Object.entries(data).forEach(([period, tasks]: [string, any]) => {
      md += `**${period}**:\n`;
      (tasks as string[]).forEach((task: string) => {
        md += `- ${task}\n`;
      });
      md += '\n';
    });
  });

  md += '## Launch Channels\n\n';
  Object.entries(plan.channels).forEach(([channel, strategy]: [string, any]) => {
    md += `### ${channel.replace('-', ' ').toUpperCase()}\n\n`;
    if (strategy.approach) md += `**Approach**: ${strategy.approach}\n\n`;
    if (strategy.preparation) {
      md += '**Preparation**:\n';
      strategy.preparation.forEach((item: string) => md += `- ${item}\n`);
      md += '\n';
    }
  });

  md += '## Budget\n\n';
  md += `**Total**: $${plan.budget.total}\n\n`;
  md += '**Breakdown**:\n';
  Object.entries(plan.budget.breakdown).forEach(([item, cost]) => {
    md += `- ${item}: $${cost}\n`;
  });
  md += `\n${plan.budget.note}\n`;

  return md;
}

/**
 * Display warning message
 */
function displayWarning(message: string): void {
  console.warn(chalk.yellow(`  ${message}`));
}
