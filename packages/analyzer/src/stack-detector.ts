import * as fs from 'fs/promises';
import * as path from 'path';
import { TechStack } from './types';

/**
 * Detect the technology stack of a project
 */
export async function detectTechStack(projectPath: string): Promise<TechStack> {
  const stack: TechStack = {
    language: [],
    framework: [],
    runtime: [],
    database: [],
    infrastructure: []
  };

  try {
    // Check for Node.js
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fileExists(packageJsonPath)) {
      const packageData = await readJsonFile(packageJsonPath);
      analyzePackageJson(packageData, stack);
    }

    // Check for Python
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const pyprojectPath = path.join(projectPath, 'pyproject.toml');
    if (await fileExists(requirementsPath) || await fileExists(pyprojectPath)) {
      stack.language.push('python');
      if (await fileExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        analyzePythonDeps(requirements, stack);
      }
    }

    // Check for Go
    const goModPath = path.join(projectPath, 'go.mod');
    if (await fileExists(goModPath)) {
      stack.language.push('go');
      stack.runtime.push('go');
    }

    // Check for Rust
    const cargoPath = path.join(projectPath, 'Cargo.toml');
    if (await fileExists(cargoPath)) {
      stack.language.push('rust');
      stack.runtime.push('cargo');
    }

    // Check for Docker
    const dockerfilePath = path.join(projectPath, 'Dockerfile');
    const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
    if (await fileExists(dockerfilePath) || await fileExists(dockerComposePath)) {
      stack.infrastructure.push('docker');
    }

    // Check for Kubernetes
    const k8sFiles = ['kubernetes.yml', 'k8s.yml', 'deployment.yml'];
    for (const file of k8sFiles) {
      if (await fileExists(path.join(projectPath, file))) {
        stack.infrastructure.push('kubernetes');
        break;
      }
    }

    // Check for Railway
    const railwayPath = path.join(projectPath, 'railway.json');
    if (await fileExists(railwayPath)) {
      stack.infrastructure.push('railway');
    }

    // Check .env for infrastructure hints
    const envPath = path.join(projectPath, '.env');
    if (await fileExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf-8');
      analyzeEnvFile(envContent, stack);
    }

    // Deduplicate arrays
    stack.language = [...new Set(stack.language)];
    stack.framework = [...new Set(stack.framework)];
    stack.runtime = [...new Set(stack.runtime)];
    stack.database = [...new Set(stack.database)];
    stack.infrastructure = [...new Set(stack.infrastructure)];

  } catch (error) {
    console.error('Error detecting tech stack:', error);
  }

  return stack;
}

/**
 * Analyze package.json for Node.js dependencies
 */
function analyzePackageJson(packageData: any, stack: TechStack): void {
  // Detect language
  if (packageData.devDependencies?.typescript || packageData.dependencies?.typescript) {
    stack.language.push('typescript');
  } else {
    stack.language.push('javascript');
  }

  // Detect runtime
  if (packageData.type === 'module' || packageData.devDependencies?.['@types/node']) {
    stack.runtime.push('node');
  }
  if (packageData.dependencies?.['@deno/std'] || packageData.devDependencies?.['@deno/std']) {
    stack.runtime.push('deno');
  }
  if (packageData.dependencies?.['bun'] || packageData.devDependencies?.['bun']) {
    stack.runtime.push('bun');
  }

  const allDeps = { ...packageData.dependencies, ...packageData.devDependencies };

  // Detect frameworks
  const frameworks = {
    react: ['react'],
    next: ['next'],
    vue: ['vue'],
    angular: ['@angular/core'],
    express: ['express'],
    fastify: ['fastify'],
    nest: ['@nestjs/core'],
    koa: ['koa'],
    svelte: ['svelte'],
    solid: ['solid-js']
  };

  for (const [framework, packages] of Object.entries(frameworks)) {
    if (packages.some(pkg => allDeps[pkg])) {
      stack.framework.push(framework);
    }
  }

  // Detect databases
  const databases = {
    postgres: ['pg', 'postgres', 'postgresql'],
    mongodb: ['mongodb', 'mongoose'],
    redis: ['redis', 'ioredis'],
    mysql: ['mysql', 'mysql2'],
    sqlite: ['sqlite3', 'better-sqlite3'],
    prisma: ['prisma', '@prisma/client']
  };

  for (const [db, packages] of Object.entries(databases)) {
    if (packages.some(pkg => allDeps[pkg])) {
      stack.database.push(db);
    }
  }
}

/**
 * Analyze Python requirements for frameworks and databases
 */
function analyzePythonDeps(requirements: string, stack: TechStack): void {
  const lines = requirements.toLowerCase().split('\n');

  // Frameworks
  if (lines.some(line => line.includes('django'))) {
    stack.framework.push('django');
  }
  if (lines.some(line => line.includes('flask'))) {
    stack.framework.push('flask');
  }
  if (lines.some(line => line.includes('fastapi'))) {
    stack.framework.push('fastapi');
  }

  // Databases
  if (lines.some(line => line.includes('psycopg2') || line.includes('asyncpg'))) {
    stack.database.push('postgres');
  }
  if (lines.some(line => line.includes('pymongo'))) {
    stack.database.push('mongodb');
  }
  if (lines.some(line => line.includes('redis'))) {
    stack.database.push('redis');
  }
  if (lines.some(line => line.includes('mysql') || line.includes('pymysql'))) {
    stack.database.push('mysql');
  }
}

/**
 * Analyze .env file for infrastructure hints
 */
function analyzeEnvFile(content: string, stack: TechStack): void {
  const upper = content.toUpperCase();

  // Database hints
  if (upper.includes('DATABASE_URL') || upper.includes('POSTGRES')) {
    if (!stack.database.includes('postgres')) {
      stack.database.push('postgres');
    }
  }
  if (upper.includes('MONGODB') || upper.includes('MONGO_URI')) {
    if (!stack.database.includes('mongodb')) {
      stack.database.push('mongodb');
    }
  }
  if (upper.includes('REDIS')) {
    if (!stack.database.includes('redis')) {
      stack.database.push('redis');
    }
  }

  // Infrastructure hints
  if (upper.includes('RAILWAY')) {
    if (!stack.infrastructure.includes('railway')) {
      stack.infrastructure.push('railway');
    }
  }
  if (upper.includes('VERCEL')) {
    if (!stack.infrastructure.includes('vercel')) {
      stack.infrastructure.push('vercel');
    }
  }
  if (upper.includes('AWS') || upper.includes('S3')) {
    if (!stack.infrastructure.includes('aws')) {
      stack.infrastructure.push('aws');
    }
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
async function readJsonFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}
