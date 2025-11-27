/**
 * Tech Stack Detection Types
 */
export interface TechStack {
  language: string[];      // 'typescript', 'python', 'go', etc.
  framework: string[];     // 'react', 'next', 'express', etc.
  runtime: string[];       // 'node', 'deno', 'bun'
  database: string[];      // 'postgres', 'mongodb', 'redis'
  infrastructure: string[]; // 'docker', 'kubernetes', 'railway'
}

/**
 * Git Repository Health Metrics
 */
export interface GitMetrics {
  isGitRepo: boolean;
  totalCommits: number;
  contributors: number;
  lastCommitDate: Date | null;
  commitFrequency: number; // commits per week
  branchCount: number;
  hasRemote: boolean;
  age: number;            // days since first commit
  health: 'active' | 'maintained' | 'stale' | 'abandoned';
}

/**
 * Code Quality and Complexity Metrics
 */
export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  filesByType: Record<string, number>;
  hasTests: boolean;
  testCoverage: number | null;
  hasCI: boolean;
  hasDocs: boolean;
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Monetization Signal Detection
 */
export interface MonetizationSignals {
  hasPaymentIntegration: boolean;  // stripe, paddle, etc.
  hasPricingPage: boolean;
  hasLicenseKey: boolean;
  hasAuthSystem: boolean;
  hasApiEndpoints: boolean;
  existingModel: 'none' | 'freemium' | 'subscription' | 'one-time' | 'usage';
}

/**
 * Monetization Scoring
 */
export interface MonetizationScore {
  overall: number;        // 1-10
  readiness: number;      // 1-10 (how ready to monetize)
  marketPotential: number; // 1-10 (market demand)
  technicalQuality: number; // 1-10
  reasoning: string[];
}

/**
 * Complete Project Analysis Result
 */
export interface ProjectAnalysis {
  path: string;
  name: string;
  techStack: TechStack;
  gitMetrics: GitMetrics;
  codeMetrics: CodeMetrics;
  monetizationSignals: MonetizationSignals;
  score: MonetizationScore;
  timestamp: Date;
}

/**
 * File Statistics
 */
export interface FileStats {
  path: string;
  lines: number;
  codeLines: number;
  extension: string;
}
