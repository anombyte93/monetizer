import * as path from 'path';
import { ProjectAnalysis, MonetizationScore, TechStack, GitMetrics, CodeMetrics } from './types';
import { detectTechStack } from './stack-detector';
import { analyzeGit } from './git-analyzer';
import { analyzeCode } from './code-metrics';
import { detectMonetization } from './monetization-signals';

/**
 * Main project analyzer that combines all analysis components
 */
export class ProjectAnalyzer {
  constructor(private projectPath: string) {}

  /**
   * Perform complete project analysis
   */
  async analyze(): Promise<ProjectAnalysis> {
    const projectName = path.basename(this.projectPath);

    // Run all analyzers in parallel
    const [techStack, gitMetrics, codeMetrics, monetizationSignals] = await Promise.all([
      detectTechStack(this.projectPath),
      analyzeGit(this.projectPath),
      analyzeCode(this.projectPath),
      detectMonetization(this.projectPath)
    ]);

    // Calculate monetization score
    const score = calculateMonetizationScore(
      techStack,
      gitMetrics,
      codeMetrics,
      monetizationSignals
    );

    return {
      path: this.projectPath,
      name: projectName,
      techStack,
      gitMetrics,
      codeMetrics,
      monetizationSignals,
      score,
      timestamp: new Date()
    };
  }
}

/**
 * Calculate overall monetization score based on all metrics
 */
function calculateMonetizationScore(
  techStack: TechStack,
  gitMetrics: GitMetrics,
  codeMetrics: CodeMetrics,
  monetizationSignals: any
): MonetizationScore {
  const reasoning: string[] = [];

  // Technical Quality Score (1-10)
  let technicalQuality = 5;

  // Git health
  if (gitMetrics.isGitRepo) {
    if (gitMetrics.health === 'active') {
      technicalQuality += 2;
      reasoning.push('Active development with recent commits');
    } else if (gitMetrics.health === 'maintained') {
      technicalQuality += 1;
      reasoning.push('Maintained codebase with regular updates');
    } else if (gitMetrics.health === 'stale') {
      technicalQuality -= 1;
      reasoning.push('Stale codebase - needs revival');
    } else {
      technicalQuality -= 2;
      reasoning.push('Abandoned project - high risk');
    }
  } else {
    technicalQuality -= 2;
    reasoning.push('Not version controlled - major red flag');
  }

  // Code quality indicators
  if (codeMetrics.hasTests) {
    technicalQuality += 1;
    reasoning.push('Has test coverage');
  }
  if (codeMetrics.hasCI) {
    technicalQuality += 0.5;
    reasoning.push('CI/CD configured');
  }
  if (codeMetrics.hasDocs) {
    technicalQuality += 0.5;
    reasoning.push('Documentation present');
  }

  // Clamp technical quality
  technicalQuality = Math.max(1, Math.min(10, technicalQuality));

  // Readiness Score (1-10) - How ready to monetize
  let readiness = 5;

  // Existing monetization infrastructure
  if (monetizationSignals.hasAuthSystem) {
    readiness += 1.5;
    reasoning.push('Authentication system in place');
  }
  if (monetizationSignals.hasApiEndpoints) {
    readiness += 1;
    reasoning.push('API infrastructure exists');
  }

  // Existing monetization attempts
  if (monetizationSignals.hasPaymentIntegration) {
    if (monetizationSignals.existingModel !== 'none') {
      readiness += 1;
      reasoning.push(`Already has ${monetizationSignals.existingModel} model`);
    } else {
      readiness += 0.5;
      reasoning.push('Payment integration started but incomplete');
    }
  } else {
    readiness -= 1;
    reasoning.push('No payment integration - needs setup');
  }

  // Code maturity
  if (codeMetrics.complexity === 'low') {
    readiness -= 0.5;
    reasoning.push('Low complexity - may need more features');
  } else if (codeMetrics.complexity === 'high') {
    readiness += 0.5;
    reasoning.push('High complexity - mature codebase');
  }

  // Clamp readiness
  readiness = Math.max(1, Math.min(10, readiness));

  // Market Potential Score (1-10) - Based on tech stack popularity
  let marketPotential = 5;

  // Popular languages get higher scores
  const popularLanguages = ['typescript', 'javascript', 'python', 'go'];
  const hasPopularLanguage = techStack.language.some(lang =>
    popularLanguages.includes(lang.toLowerCase())
  );
  if (hasPopularLanguage) {
    marketPotential += 1;
    reasoning.push('Popular language with large market');
  }

  // SaaS-friendly frameworks
  const saasFrameworks = ['next', 'react', 'vue', 'express', 'fastify', 'django', 'fastapi'];
  const hasSaasFramework = techStack.framework.some(fw =>
    saasFrameworks.includes(fw.toLowerCase())
  );
  if (hasSaasFramework) {
    marketPotential += 1.5;
    reasoning.push('SaaS-friendly framework detected');
  }

  // Database presence (suggests data storage = SaaS potential)
  if (techStack.database.length > 0) {
    marketPotential += 1;
    reasoning.push('Database integration - good for SaaS');
  }

  // Modern infrastructure
  if (techStack.infrastructure.includes('docker')) {
    marketPotential += 0.5;
    reasoning.push('Containerized - easy to deploy');
  }
  if (techStack.infrastructure.includes('kubernetes') || techStack.infrastructure.includes('railway')) {
    marketPotential += 0.5;
    reasoning.push('Cloud-native infrastructure');
  }

  // Project type inference
  const isWebApp = techStack.framework.some(fw =>
    ['react', 'next', 'vue', 'angular', 'svelte'].includes(fw)
  );
  const isApiService = techStack.framework.some(fw =>
    ['express', 'fastify', 'nest', 'fastapi', 'django'].includes(fw)
  );

  if (isWebApp || isApiService) {
    marketPotential += 1;
    reasoning.push(isWebApp ? 'Web application - high monetization potential' : 'API service - usage-based pricing opportunity');
  }

  // Clamp market potential
  marketPotential = Math.max(1, Math.min(10, marketPotential));

  // Overall Score (weighted average)
  const overall = (
    technicalQuality * 0.3 +
    readiness * 0.35 +
    marketPotential * 0.35
  );

  return {
    overall: Math.round(overall * 10) / 10,
    readiness: Math.round(readiness * 10) / 10,
    marketPotential: Math.round(marketPotential * 10) / 10,
    technicalQuality: Math.round(technicalQuality * 10) / 10,
    reasoning
  };
}

/**
 * Analyze a project and return the analysis
 */
export async function analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
  const analyzer = new ProjectAnalyzer(projectPath);
  return analyzer.analyze();
}
