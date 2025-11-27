#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';
import { strategyCommand } from './commands/strategy.js';
import { executeCommand } from './commands/execute.js';
import { gtmCommand } from './commands/gtm.js';
import { adsCommand } from './commands/ads.js';
import { campaignCommand } from './commands/campaign.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('monetizer')
  .description(chalk.cyan('Transform any project into revenue'))
  .version('0.1.0')
  .addHelpText('beforeAll', () => {
    return `
${chalk.bold.cyan('╔════════════════════════════════════════════╗')}
${chalk.bold.cyan('║')}     ${chalk.bold.white('MONETIZER - Revenue Generator')}    ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚════════════════════════════════════════════╝')}

${chalk.dim('Analyze • Strategize • Execute • Launch')}
`;
  })
  .addHelpText('after', () => {
    return `
${chalk.dim('─'.repeat(50))}

${chalk.bold('Examples:')}
  ${chalk.cyan('$')} monetizer analyze                ${chalk.dim('# Analyze current directory')}
  ${chalk.cyan('$')} monetizer analyze ./my-project   ${chalk.dim('# Analyze specific project')}
  ${chalk.cyan('$')} monetizer strategy --research    ${chalk.dim('# Generate strategy with research')}
  ${chalk.cyan('$')} monetizer execute --method speed ${chalk.dim('# Fast orchestration')}
  ${chalk.cyan('$')} monetizer gtm --ph               ${chalk.dim('# Product Hunt launch plan')}
  ${chalk.cyan('$')} monetizer ads --budget 1000      ${chalk.dim('# AI advertising strategy')}
  ${chalk.cyan('$')} monetizer campaign --images      ${chalk.dim('# Full AI content campaign')}

${chalk.dim('Need help? Visit https://github.com/monetizer/docs')}
`;
  });

// Register commands
program.addCommand(analyzeCommand);
program.addCommand(strategyCommand);
program.addCommand(executeCommand);
program.addCommand(gtmCommand);
program.addCommand(adsCommand);
program.addCommand(campaignCommand);

// Handle unknown commands gracefully
program.on('command:*', function () {
  console.error(chalk.red('\n❌ Invalid command: %s\n'), program.args.join(' '));
  console.log(chalk.yellow('See --help for a list of available commands.\n'));
  process.exit(1);
});

// Show help if no args provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();
