import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { MonetizationSignals } from './types';

/**
 * Detect existing monetization signals in a project
 */
export async function detectMonetization(projectPath: string): Promise<MonetizationSignals> {
  const signals: MonetizationSignals = {
    hasPaymentIntegration: false,
    hasPricingPage: false,
    hasLicenseKey: false,
    hasAuthSystem: false,
    hasApiEndpoints: false,
    existingModel: 'none'
  };

  try {
    // Search all code files for patterns
    const files = await findRelevantFiles(projectPath);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lower = content.toLowerCase();

      // Check for payment integrations
      if (!signals.hasPaymentIntegration) {
        signals.hasPaymentIntegration = hasPaymentKeywords(lower);
      }

      // Check for pricing pages
      if (!signals.hasPricingPage) {
        signals.hasPricingPage = hasPricingKeywords(lower);
      }

      // Check for license keys
      if (!signals.hasLicenseKey) {
        signals.hasLicenseKey = hasLicenseKeywords(lower);
      }

      // Check for auth system
      if (!signals.hasAuthSystem) {
        signals.hasAuthSystem = hasAuthKeywords(lower);
      }

      // Check for API endpoints
      if (!signals.hasApiEndpoints) {
        signals.hasApiEndpoints = hasApiKeywords(lower);
      }
    }

    // Check for package.json dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
      const packageData = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageData);
      checkPackageDependencies(packageJson, signals);
    } catch {
      // No package.json or parse error
    }

    // Determine existing monetization model
    signals.existingModel = determineModel(signals);

  } catch (error) {
    console.error('Error detecting monetization signals:', error);
  }

  return signals;
}

/**
 * Find files that might contain monetization signals
 */
async function findRelevantFiles(projectPath: string): Promise<string[]> {
  const patterns = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.py',
    '**/*.go',
    '**/*.rs',
    '**/routes/**/*',
    '**/api/**/*',
    '**/pages/**/*',
    '**/components/**/*'
  ];

  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/__pycache__/**'
  ];

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

  // Limit to avoid reading too many files
  return files.slice(0, 500);
}

/**
 * Check for payment integration keywords
 */
function hasPaymentKeywords(content: string): boolean {
  const keywords = [
    'stripe',
    'paddle',
    'lemonsqueezy',
    'lemon squeezy',
    'paypal',
    'braintree',
    'checkout.session',
    'payment_intent',
    'subscription.create',
    'charge.create'
  ];

  return keywords.some(keyword => content.includes(keyword));
}

/**
 * Check for pricing page keywords
 */
function hasPricingKeywords(content: string): boolean {
  const keywords = [
    'pricing',
    'plans',
    'subscription',
    'tier',
    'free trial',
    'pro plan',
    'enterprise',
    'billing',
    'upgrade'
  ];

  // Look for multiple keywords to reduce false positives
  const matches = keywords.filter(keyword => content.includes(keyword));
  return matches.length >= 2;
}

/**
 * Check for license key keywords
 */
function hasLicenseKeywords(content: string): boolean {
  const keywords = [
    'license key',
    'activation',
    'validate license',
    'license.verify',
    'licensekey',
    'activation code',
    'product key'
  ];

  return keywords.some(keyword => content.includes(keyword));
}

/**
 * Check for authentication keywords
 */
function hasAuthKeywords(content: string): boolean {
  const keywords = [
    'login',
    'register',
    'signup',
    'authenticate',
    'jwt',
    'session',
    'auth.login',
    'user.create',
    'passport',
    'bcrypt',
    'hash password'
  ];

  // Look for multiple keywords to reduce false positives
  const matches = keywords.filter(keyword => content.includes(keyword));
  return matches.length >= 2;
}

/**
 * Check for API endpoint keywords
 */
function hasApiKeywords(content: string): boolean {
  const keywords = [
    'api key',
    'rate limit',
    'api_key',
    'ratelimit',
    'throttle',
    '/api/',
    'router.get',
    'router.post',
    'app.get(',
    'app.post(',
    '@route',
    '@get',
    '@post'
  ];

  return keywords.some(keyword => content.includes(keyword));
}

/**
 * Check package.json for monetization-related dependencies
 */
function checkPackageDependencies(packageJson: any, signals: MonetizationSignals): void {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  // Payment processors
  const paymentDeps = ['stripe', '@stripe/stripe-js', 'paddle', 'lemonsqueezy'];
  if (paymentDeps.some(dep => allDeps[dep])) {
    signals.hasPaymentIntegration = true;
  }

  // Auth libraries
  const authDeps = ['next-auth', 'passport', 'jsonwebtoken', 'bcrypt', 'bcryptjs', 'auth0'];
  if (authDeps.some(dep => allDeps[dep])) {
    signals.hasAuthSystem = true;
  }

  // API frameworks
  const apiDeps = ['express', 'fastify', 'koa', '@nestjs/core', 'hapi'];
  if (apiDeps.some(dep => allDeps[dep])) {
    signals.hasApiEndpoints = true;
  }
}

/**
 * Determine the existing monetization model
 */
function determineModel(signals: MonetizationSignals): 'none' | 'freemium' | 'subscription' | 'one-time' | 'usage' {
  // No monetization
  if (!signals.hasPaymentIntegration && !signals.hasLicenseKey) {
    return 'none';
  }

  // License key suggests one-time purchase
  if (signals.hasLicenseKey && !signals.hasPricingPage) {
    return 'one-time';
  }

  // Subscription model (most common for SaaS)
  if (signals.hasPaymentIntegration && signals.hasPricingPage) {
    return 'subscription';
  }

  // API with rate limiting suggests usage-based
  if (signals.hasApiEndpoints && signals.hasPaymentIntegration) {
    return 'usage';
  }

  // Auth + payment but unclear model
  if (signals.hasAuthSystem && signals.hasPaymentIntegration) {
    return 'freemium';
  }

  return 'none';
}

/**
 * Get monetization signals summary
 */
export function getMonetizationSummary(signals: MonetizationSignals): string {
  const parts: string[] = [];

  parts.push(`Model: ${signals.existingModel}`);

  const features: string[] = [];
  if (signals.hasPaymentIntegration) features.push('Payments');
  if (signals.hasAuthSystem) features.push('Auth');
  if (signals.hasApiEndpoints) features.push('API');
  if (signals.hasPricingPage) features.push('Pricing');
  if (signals.hasLicenseKey) features.push('License');

  if (features.length > 0) {
    parts.push(`Features: ${features.join(', ')}`);
  } else {
    parts.push('No monetization detected');
  }

  return parts.join(' | ');
}
