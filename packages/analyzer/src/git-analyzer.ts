import simpleGit, { SimpleGit } from 'simple-git';
import { GitMetrics } from './types';

/**
 * Analyze git repository health and activity
 */
export async function analyzeGit(projectPath: string): Promise<GitMetrics> {
  const git: SimpleGit = simpleGit(projectPath);

  const metrics: GitMetrics = {
    isGitRepo: false,
    totalCommits: 0,
    contributors: 0,
    lastCommitDate: null,
    commitFrequency: 0,
    branchCount: 0,
    hasRemote: false,
    age: 0,
    health: 'abandoned'
  };

  try {
    // Check if it's a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return metrics;
    }

    metrics.isGitRepo = true;

    // Get total commits
    const log = await git.log();
    metrics.totalCommits = log.total;

    if (metrics.totalCommits === 0) {
      return metrics;
    }

    // Get last commit date
    if (log.latest) {
      metrics.lastCommitDate = new Date(log.latest.date);
    }

    // Get contributors
    const contributors = await git.raw(['shortlog', '-sn', '--all']);
    const contributorLines = contributors.trim().split('\n').filter(line => line.trim());
    metrics.contributors = contributorLines.length;

    // Get branches
    const branches = await git.branchLocal();
    metrics.branchCount = branches.all.length;

    // Check for remote
    const remotes = await git.getRemotes();
    metrics.hasRemote = remotes.length > 0;

    // Calculate repository age
    const firstCommit = await git.raw(['log', '--reverse', '--format=%at', '--max-count=1']);
    if (firstCommit) {
      const firstCommitTimestamp = parseInt(firstCommit.trim()) * 1000;
      const now = Date.now();
      metrics.age = Math.floor((now - firstCommitTimestamp) / (1000 * 60 * 60 * 24));
    }

    // Calculate commit frequency (commits per week)
    if (metrics.age > 0) {
      const weeks = Math.max(1, metrics.age / 7);
      metrics.commitFrequency = metrics.totalCommits / weeks;
    }

    // Determine repository health
    metrics.health = calculateHealth(metrics);

  } catch (error) {
    console.error('Error analyzing git repository:', error);
  }

  return metrics;
}

/**
 * Calculate repository health based on activity
 */
function calculateHealth(metrics: GitMetrics): 'active' | 'maintained' | 'stale' | 'abandoned' {
  if (!metrics.lastCommitDate) {
    return 'abandoned';
  }

  const daysSinceLastCommit = Math.floor(
    (Date.now() - metrics.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Active: commit within last 7 days OR high commit frequency
  if (daysSinceLastCommit <= 7 || metrics.commitFrequency > 3) {
    return 'active';
  }

  // Maintained: commit within last 30 days OR moderate commit frequency
  if (daysSinceLastCommit <= 30 || metrics.commitFrequency > 1) {
    return 'maintained';
  }

  // Stale: commit within last 90 days
  if (daysSinceLastCommit <= 90) {
    return 'stale';
  }

  // Abandoned: no recent commits
  return 'abandoned';
}

/**
 * Get repository activity summary
 */
export async function getActivitySummary(projectPath: string): Promise<string> {
  const metrics = await analyzeGit(projectPath);

  if (!metrics.isGitRepo) {
    return 'Not a git repository';
  }

  const parts: string[] = [];

  parts.push(`Health: ${metrics.health.toUpperCase()}`);
  parts.push(`${metrics.totalCommits} commits`);
  parts.push(`${metrics.contributors} contributors`);
  parts.push(`${metrics.branchCount} branches`);

  if (metrics.lastCommitDate) {
    const daysAgo = Math.floor(
      (Date.now() - metrics.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    parts.push(`Last commit ${daysAgo} days ago`);
  }

  parts.push(`${metrics.commitFrequency.toFixed(1)} commits/week`);
  parts.push(`${Math.floor(metrics.age / 365)} years old`);

  return parts.join(' | ');
}
