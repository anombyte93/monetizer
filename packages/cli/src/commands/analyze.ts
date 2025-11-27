import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import {
  displayHeader,
  displaySection,
  displayScore,
  displayMonetizationPotential,
  displayKeyValue,
  displayList,
  displayDivider,
  displayJSON,
  displayError,
  displaySuccess,
} from '../utils/display.js';
import { loadConfig } from '../utils/config.js';

export const analyzeCommand = new Command('analyze')
  .description('Analyze a project for monetization potential')
  .argument('[path]', 'Project path to analyze', '.')
  .option('-o, --output <format>', 'Output format (json|text)', 'text')
  .option('-v, --verbose', 'Show detailed analysis')
  .option('--save', 'Save analysis results to file')
  .action(async (projectPath: string, options) => {
    const spinner = ora('Initializing analysis...').start();

    try {
      // Load configuration
      const config = loadConfig();

      // Resolve project path
      const absolutePath = path.resolve(projectPath);

      if (!fs.existsSync(absolutePath)) {
        spinner.fail('Project path does not exist');
        displayError(`Path not found: ${absolutePath}`);
        process.exit(1);
      }

      // Step 1: Detect tech stack
      spinner.text = 'Detecting tech stack...';
      await new Promise(resolve => setTimeout(resolve, 500));
      const techStack = await detectTechStack(absolutePath);

      // Step 2: Analyze project structure
      spinner.text = 'Analyzing project structure...';
      await new Promise(resolve => setTimeout(resolve, 500));
      const structure = await analyzeStructure(absolutePath);

      // Step 3: Evaluate monetization potential
      spinner.text = 'Evaluating monetization potential...';
      await new Promise(resolve => setTimeout(resolve, 500));
      const potential = await evaluatePotential(techStack, structure);

      // Step 4: Identify opportunities
      spinner.text = 'Identifying monetization opportunities...';
      await new Promise(resolve => setTimeout(resolve, 500));
      const opportunities = await identifyOpportunities(techStack, structure);

      spinner.succeed('Analysis complete!');

      // Display results
      if (options.output === 'json') {
        displayJSON({
          path: absolutePath,
          techStack,
          structure,
          potential,
          opportunities,
        });
      } else {
        displayResults(absolutePath, techStack, structure, potential, opportunities, options.verbose);
      }

      // Save results if requested
      if (options.save) {
        const outputPath = path.join(absolutePath, '.monetizer', 'analysis.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(
          outputPath,
          JSON.stringify({ techStack, structure, potential, opportunities }, null, 2)
        );
        displaySuccess(`Analysis saved to ${outputPath}`);
      }

      // Suggest next steps
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      displayList([
        'Run ' + chalk.yellow('monetizer strategy') + ' to generate monetization strategy',
        'Review opportunities and pick your monetization method',
        'Execute with ' + chalk.yellow('monetizer execute'),
      ]);

    } catch (error) {
      spinner.fail('Analysis failed');
      displayError(error instanceof Error ? error.message : String(error));
      if (options.verbose && error instanceof Error) {
        console.error(chalk.dim(error.stack));
      }
      process.exit(1);
    }
  });

async function detectTechStack(projectPath: string): Promise<any> {
  const techStack: any = {
    languages: [],
    frameworks: [],
    runtime: null,
    database: null,
    hasAPI: false,
    hasUI: false,
  };

  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    techStack.runtime = 'Node.js';
    techStack.languages.push('JavaScript/TypeScript');

    const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps['react'] || deps['next']) techStack.frameworks.push('React');
    if (deps['next']) techStack.frameworks.push('Next.js');
    if (deps['vue']) techStack.frameworks.push('Vue');
    if (deps['express']) techStack.frameworks.push('Express');
    if (deps['fastify']) techStack.frameworks.push('Fastify');

    if (deps['mongoose'] || deps['mongodb']) techStack.database = 'MongoDB';
    if (deps['pg'] || deps['postgres']) techStack.database = 'PostgreSQL';
    if (deps['mysql']) techStack.database = 'MySQL';
    if (deps['prisma']) techStack.database = 'Prisma';

    techStack.hasAPI = !!(deps['express'] || deps['fastify'] || deps['@nestjs/core']);
    techStack.hasUI = !!(deps['react'] || deps['vue'] || deps['next']);
  }

  if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
      fs.existsSync(path.join(projectPath, 'setup.py'))) {
    techStack.runtime = 'Python';
    techStack.languages.push('Python');
  }

  if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
    techStack.runtime = 'Go';
    techStack.languages.push('Go');
  }

  return techStack;
}

async function analyzeStructure(projectPath: string): Promise<any> {
  const structure: any = {
    hasTests: false,
    hasDocumentation: false,
    hasCICD: false,
    hasDocker: false,
    linesOfCode: 0,
    fileCount: 0,
  };

  structure.hasTests = fs.existsSync(path.join(projectPath, 'test')) ||
                       fs.existsSync(path.join(projectPath, '__tests__'));
  structure.hasDocumentation = fs.existsSync(path.join(projectPath, 'README.md')) ||
                               fs.existsSync(path.join(projectPath, 'docs'));
  structure.hasCICD = fs.existsSync(path.join(projectPath, '.github', 'workflows')) ||
                      fs.existsSync(path.join(projectPath, '.gitlab-ci.yml'));
  structure.hasDocker = fs.existsSync(path.join(projectPath, 'Dockerfile'));

  function countFiles(dir: string): number {
    let count = 0;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith('.') || file === 'node_modules') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          count += countFiles(filePath);
        } else {
          count++;
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    return count;
  }

  structure.fileCount = countFiles(projectPath);
  structure.linesOfCode = structure.fileCount * 50;

  return structure;
}

async function evaluatePotential(techStack: any, structure: any): Promise<any> {
  let score = 5;

  if (techStack.hasAPI) score += 1.5;
  if (techStack.hasUI) score += 1.5;
  if (techStack.database) score += 1;
  if (techStack.frameworks.length > 0) score += 0.5;

  if (structure.hasTests) score += 0.5;
  if (structure.hasDocumentation) score += 0.5;
  if (structure.hasCICD) score += 0.5;
  if (structure.hasDocker) score += 0.5;

  if (structure.linesOfCode > 5000) score += 0.5;
  if (structure.linesOfCode > 10000) score += 0.5;

  return {
    score: Math.min(Math.round(score), 10),
    readiness: score >= 7 ? 'High' : score >= 5 ? 'Medium' : 'Low',
    factors: {
      techStack: techStack.hasAPI && techStack.hasUI ? 'Full-stack' : 'Partial',
      maturity: structure.linesOfCode > 5000 ? 'Mature' : 'Early',
      infrastructure: structure.hasDocker && structure.hasCICD ? 'Production-ready' : 'Needs work',
    },
  };
}

async function identifyOpportunities(techStack: any, structure: any): Promise<any[]> {
  const opportunities = [];

  if (techStack.hasAPI) {
    opportunities.push({
      type: 'API Monetization',
      confidence: 'High',
      description: 'Convert API endpoints to paid tiers with usage limits',
      estimatedEffort: 'Medium',
      potentialRevenue: 'High',
    });
  }

  if (techStack.hasUI) {
    opportunities.push({
      type: 'SaaS Model',
      confidence: 'High',
      description: 'Package as subscription-based service',
      estimatedEffort: 'High',
      potentialRevenue: 'Very High',
    });
  }

  if (techStack.frameworks.includes('Next.js') || techStack.frameworks.includes('React')) {
    opportunities.push({
      type: 'Premium Features',
      confidence: 'Medium',
      description: 'Add premium features behind paywall',
      estimatedEffort: 'Low',
      potentialRevenue: 'Medium',
    });
  }

  opportunities.push({
    type: 'Open Source Sponsorship',
    confidence: 'Medium',
    description: 'GitHub Sponsors / Open Collective',
    estimatedEffort: 'Low',
    potentialRevenue: 'Low to Medium',
  });

  return opportunities;
}

function displayResults(
  projectPath: string,
  techStack: any,
  structure: any,
  potential: any,
  opportunities: any[],
  verbose: boolean
): void {
  displayHeader('Project Analysis');

  console.log(chalk.bold('Project:'), chalk.cyan(projectPath));
  displayDivider();

  displaySection('Tech Stack', [
    `Runtime: ${chalk.cyan(techStack.runtime || 'Unknown')}`,
    `Languages: ${chalk.cyan(techStack.languages.join(', ') || 'None detected')}`,
    `Frameworks: ${chalk.cyan(techStack.frameworks.join(', ') || 'None detected')}`,
    `Database: ${chalk.cyan(techStack.database || 'None detected')}`,
    `Has API: ${techStack.hasAPI ? chalk.green('Yes') : chalk.red('No')}`,
    `Has UI: ${techStack.hasUI ? chalk.green('Yes') : chalk.red('No')}`,
  ]);

  if (verbose) {
    displaySection('Project Structure', [
      `Files: ${chalk.cyan(structure.fileCount)}`,
      `Lines of Code: ${chalk.cyan('~' + structure.linesOfCode)}`,
      `Tests: ${structure.hasTests ? chalk.green('Yes') : chalk.red('No')}`,
      `Documentation: ${structure.hasDocumentation ? chalk.green('Yes') : chalk.red('No')}`,
      `CI/CD: ${structure.hasCICD ? chalk.green('Yes') : chalk.red('No')}`,
      `Docker: ${structure.hasDocker ? chalk.green('Yes') : chalk.red('No')}`,
    ]);
  }

  console.log();
  displayScore(potential.score, chalk.bold('Monetization Potential'));
  displayMonetizationPotential(potential.score);

  displayKeyValue('  Readiness', potential.readiness);
  displayKeyValue('  Tech Stack', potential.factors.techStack);
  displayKeyValue('  Maturity', potential.factors.maturity);
  displayKeyValue('  Infrastructure', potential.factors.infrastructure);

  displaySection('Monetization Opportunities', []);
  opportunities.forEach((opp, index) => {
    console.log(`\n  ${chalk.bold.cyan(`${index + 1}. ${opp.type}`)}`);
    console.log(`     ${chalk.dim('Confidence:')} ${opp.confidence}`);
    console.log(`     ${chalk.dim('Description:')} ${opp.description}`);
    console.log(`     ${chalk.dim('Effort:')} ${opp.estimatedEffort}`);
    console.log(`     ${chalk.dim('Revenue:')} ${opp.potentialRevenue}`);
  });

  console.log();
}
