import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { CodeMetrics, FileStats } from './types';

// Extensions to analyze
const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.rb', '.php', '.swift'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '__pycache__',
  'venv',
  'vendor',
  'target',
  '.next',
  '.nuxt',
  'out'
];

/**
 * Analyze code metrics for a project
 */
export async function analyzeCode(projectPath: string): Promise<CodeMetrics> {
  const metrics: CodeMetrics = {
    totalFiles: 0,
    totalLines: 0,
    codeLines: 0,
    filesByType: {},
    hasTests: false,
    testCoverage: null,
    hasCI: false,
    hasDocs: false,
    complexity: 'low'
  };

  try {
    // Find all code files
    const files = await findCodeFiles(projectPath);
    metrics.totalFiles = files.length;

    // Analyze each file
    const fileStats: FileStats[] = [];
    for (const file of files) {
      const stats = await analyzeFile(file);
      if (stats) {
        fileStats.push(stats);
        metrics.totalLines += stats.lines;
        metrics.codeLines += stats.codeLines;

        // Count by extension
        const ext = stats.extension;
        metrics.filesByType[ext] = (metrics.filesByType[ext] || 0) + 1;
      }
    }

    // Check for tests
    metrics.hasTests = await hasTestFiles(projectPath);

    // Check for CI
    metrics.hasCI = await hasCIConfig(projectPath);

    // Check for documentation
    metrics.hasDocs = await hasDocumentation(projectPath);

    // Calculate complexity
    metrics.complexity = calculateComplexity(metrics, fileStats);

  } catch (error) {
    console.error('Error analyzing code metrics:', error);
  }

  return metrics;
}

/**
 * Find all code files in the project
 */
async function findCodeFiles(projectPath: string): Promise<string[]> {
  const patterns = CODE_EXTENSIONS.map(ext => `**/*${ext}`);
  const ignorePatterns = IGNORE_DIRS.map(dir => `**/${dir}/**`);

  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: projectPath,
      ignore: ignorePatterns,
      absolute: true,
      nodir: true
    });
    files.push(...matches);
  }

  return files;
}

/**
 * Analyze a single file
 */
async function analyzeFile(filePath: string): Promise<FileStats | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count non-empty, non-comment lines
    let codeLines = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed === '') continue;

      // Handle block comments
      if (trimmed.startsWith('/*') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        inBlockComment = true;
        continue;
      }
      if (trimmed.endsWith('*/') || trimmed.endsWith('"""') || trimmed.endsWith("'''")) {
        inBlockComment = false;
        continue;
      }
      if (inBlockComment) continue;

      // Skip single-line comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

      codeLines++;
    }

    return {
      path: filePath,
      lines: lines.length,
      codeLines,
      extension: path.extname(filePath)
    };
  } catch {
    return null;
  }
}

/**
 * Check if project has test files
 */
async function hasTestFiles(projectPath: string): Promise<boolean> {
  const testPatterns = [
    '**/*.test.*',
    '**/*.spec.*',
    '**/test/**',
    '**/tests/**',
    '**/__tests__/**'
  ];

  for (const pattern of testPatterns) {
    const matches = await glob(pattern, {
      cwd: projectPath,
      ignore: IGNORE_DIRS.map(dir => `**/${dir}/**`),
      nodir: true
    });

    if (matches.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Check for CI configuration
 */
async function hasCIConfig(projectPath: string): Promise<boolean> {
  const ciFiles = [
    '.github/workflows',
    '.gitlab-ci.yml',
    '.travis.yml',
    'circle.yml',
    '.circleci/config.yml',
    'jenkins.yml',
    'Jenkinsfile',
    '.drone.yml',
    'azure-pipelines.yml'
  ];

  for (const file of ciFiles) {
    try {
      const fullPath = path.join(projectPath, file);
      await fs.access(fullPath);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Check for documentation
 */
async function hasDocumentation(projectPath: string): Promise<boolean> {
  const docFiles = [
    'README.md',
    'README',
    'CONTRIBUTING.md',
    'docs',
    'documentation'
  ];

  for (const file of docFiles) {
    try {
      const fullPath = path.join(projectPath, file);
      await fs.access(fullPath);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Calculate project complexity
 */
function calculateComplexity(metrics: CodeMetrics, fileStats: FileStats[]): 'low' | 'medium' | 'high' {
  let score = 0;

  // File count
  if (metrics.totalFiles > 100) score += 2;
  else if (metrics.totalFiles > 50) score += 1;

  // Lines of code
  if (metrics.codeLines > 10000) score += 2;
  else if (metrics.codeLines > 5000) score += 1;

  // Language diversity
  const languages = Object.keys(metrics.filesByType).length;
  if (languages > 3) score += 1;

  // Average file size
  const avgLines = metrics.codeLines / Math.max(1, metrics.totalFiles);
  if (avgLines > 500) score += 1;

  // Determine complexity
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Get code metrics summary
 */
export function getCodeSummary(metrics: CodeMetrics): string {
  const parts: string[] = [];

  parts.push(`${metrics.totalFiles} files`);
  parts.push(`${metrics.codeLines.toLocaleString()} lines of code`);
  parts.push(`Complexity: ${metrics.complexity}`);

  if (metrics.hasTests) parts.push('Has tests');
  if (metrics.hasCI) parts.push('Has CI');
  if (metrics.hasDocs) parts.push('Has docs');

  const topLanguages = Object.entries(metrics.filesByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([ext]) => ext);

  if (topLanguages.length > 0) {
    parts.push(`Languages: ${topLanguages.join(', ')}`);
  }

  return parts.join(' | ');
}
