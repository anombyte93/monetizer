# @monetizer/analyzer

Comprehensive project analysis engine for determining monetization potential of any codebase.

## Features

### 1. Tech Stack Detection
Automatically detects:
- Programming languages (TypeScript, Python, Go, Rust, etc.)
- Frameworks (React, Next.js, Django, FastAPI, etc.)
- Runtimes (Node.js, Deno, Bun)
- Databases (PostgreSQL, MongoDB, Redis, etc.)
- Infrastructure (Docker, Kubernetes, Railway)

### 2. Git Repository Analysis
Analyzes repository health:
- Total commits and contributors
- Commit frequency (commits/week)
- Last commit date
- Branch count and remote status
- Repository age
- Health classification (active/maintained/stale/abandoned)

### 3. Code Quality Metrics
Measures code maturity:
- Total files and lines of code
- Code vs comment lines
- File type distribution
- Test presence and coverage hints
- CI/CD configuration detection
- Documentation presence
- Complexity rating (low/medium/high)

### 4. Monetization Signal Detection
Identifies existing monetization:
- Payment integrations (Stripe, Paddle, LemonSqueezy)
- Pricing pages and subscription logic
- License key systems
- Authentication systems
- API endpoints and rate limiting
- Existing business model classification

### 5. Intelligent Scoring
Calculates monetization potential:
- **Overall Score** (1-10): Weighted average of all factors
- **Readiness Score** (1-10): How ready to monetize
- **Market Potential** (1-10): Market demand and tech stack popularity
- **Technical Quality** (1-10): Code health and engineering practices
- **Reasoning**: Detailed explanation of scoring decisions

## Usage

```typescript
import { analyzeProject } from '@monetizer/analyzer';

// Analyze a project
const analysis = await analyzeProject('/path/to/project');

console.log('Overall Score:', analysis.score.overall);
console.log('Monetization Model:', analysis.monetizationSignals.existingModel);
console.log('Tech Stack:', analysis.techStack);
console.log('Git Health:', analysis.gitMetrics.health);
console.log('Reasoning:', analysis.score.reasoning);
```

### Individual Analyzers

```typescript
import {
  detectTechStack,
  analyzeGit,
  analyzeCode,
  detectMonetization
} from '@monetizer/analyzer';

// Run individual analyzers
const stack = await detectTechStack('/path/to/project');
const git = await analyzeGit('/path/to/project');
const code = await analyzeCode('/path/to/project');
const monetization = await detectMonetization('/path/to/project');
```

## Installation

```bash
npm install @monetizer/analyzer
```

## Dependencies

- `simple-git` - Git repository analysis
- `glob` - File pattern matching
- `fast-glob` - Fast file searching

## Scoring Algorithm

### Technical Quality (30% weight)
- Git repository health (active = +2, maintained = +1, stale = -1, abandoned = -2)
- Test coverage (+1)
- CI/CD configuration (+0.5)
- Documentation (+0.5)

### Readiness (35% weight)
- Authentication system (+1.5)
- API infrastructure (+1)
- Payment integration (+1)
- Code complexity (high = +0.5, low = -0.5)

### Market Potential (35% weight)
- Popular languages (+1)
- SaaS-friendly frameworks (+1.5)
- Database integration (+1)
- Modern infrastructure (Docker = +0.5, K8s/Railway = +0.5)
- Project type inference (Web app/API = +1)

## Example Output

```json
{
  "path": "/home/user/projects/my-saas",
  "name": "my-saas",
  "techStack": {
    "language": ["typescript"],
    "framework": ["next", "react"],
    "runtime": ["node"],
    "database": ["postgres"],
    "infrastructure": ["docker", "railway"]
  },
  "gitMetrics": {
    "isGitRepo": true,
    "totalCommits": 342,
    "contributors": 3,
    "lastCommitDate": "2024-01-15",
    "commitFrequency": 8.5,
    "branchCount": 5,
    "hasRemote": true,
    "age": 180,
    "health": "active"
  },
  "codeMetrics": {
    "totalFiles": 87,
    "totalLines": 12543,
    "codeLines": 8234,
    "hasTests": true,
    "hasCI": true,
    "hasDocs": true,
    "complexity": "medium"
  },
  "monetizationSignals": {
    "hasPaymentIntegration": true,
    "hasPricingPage": true,
    "hasLicenseKey": false,
    "hasAuthSystem": true,
    "hasApiEndpoints": true,
    "existingModel": "subscription"
  },
  "score": {
    "overall": 8.2,
    "readiness": 8.5,
    "marketPotential": 8.5,
    "technicalQuality": 7.5,
    "reasoning": [
      "Active development with recent commits",
      "Has test coverage",
      "CI/CD configured",
      "Documentation present",
      "Authentication system in place",
      "API infrastructure exists",
      "Already has subscription model",
      "Popular language with large market",
      "SaaS-friendly framework detected",
      "Database integration - good for SaaS",
      "Containerized - easy to deploy",
      "Cloud-native infrastructure",
      "Web application - high monetization potential"
    ]
  }
}
```

## License

MIT
