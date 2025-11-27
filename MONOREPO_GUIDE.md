# Monetizer Monorepo Guide

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode (all packages)
pnpm dev

# Run specific package
pnpm --filter @monetizer/cli dev
```

## Package Overview

### Core Packages

| Package | Purpose | Key Dependencies |
|---------|---------|------------------|
| `@monetizer/cli` | User-facing CLI interface | commander, inquirer, ora, chalk |
| `@monetizer/analyzer` | Project analysis engine | simple-git, @babel/parser |
| `@monetizer/strategy` | AI strategy generation | @anthropic-ai/sdk |
| `@monetizer/orchestrator` | Workflow orchestration | inngest |
| `@monetizer/agents` | LangGraph agent system | @langchain/core, langgraph |
| `@monetizer/metrics` | Performance tracking | (JSON-based) |
| `@monetizer/shared` | Common utilities/types | zod |
| `@monetizer/ui` | Next.js dashboard | next, react, tailwindcss |

### Package Dependencies

```
cli → analyzer, strategy, orchestrator, shared
analyzer → shared
strategy → analyzer, shared
orchestrator → analyzer, strategy, shared
agents → shared
metrics → shared
ui → shared
```

## Development Workflow

### Working on a Single Package

```bash
# Navigate to package
cd packages/cli

# Install dependencies (if needed)
pnpm install

# Development mode
pnpm dev

# Build
pnpm build

# Test
pnpm test

# Type check
pnpm typecheck
```

### Cross-Package Development

```bash
# Build dependencies first
pnpm --filter @monetizer/shared build
pnpm --filter @monetizer/analyzer build

# Then work on dependent package
pnpm --filter @monetizer/cli dev
```

### Using Turborepo

```bash
# Build all packages in dependency order
turbo run build

# Run tests across all packages
turbo run test

# Lint everything
turbo run lint

# Clear Turborepo cache
turbo run clean
```

## Package Structure

Each package follows this structure:

```
packages/[name]/
├── package.json       # Package config
├── tsconfig.json      # TypeScript config (extends root)
├── src/
│   ├── index.ts      # Main export
│   └── ...           # Package-specific files
└── dist/             # Build output (gitignored)
```

## TypeScript Configuration

- Root `tsconfig.json` contains shared compiler options
- Each package extends the root config
- Path aliases defined for cross-package imports:
  - `@monetizer/cli`
  - `@monetizer/analyzer`
  - `@monetizer/strategy`
  - etc.

## Common Tasks

### Add a New Package

1. Create directory in `packages/`
2. Create `package.json` with `@monetizer/[name]`
3. Create `tsconfig.json` extending root
4. Create `src/index.ts`
5. Add to workspace in `pnpm-workspace.yaml` (already configured as `packages/*`)

### Add Dependency to Package

```bash
# Add to specific package
pnpm --filter @monetizer/cli add chalk

# Add dev dependency
pnpm --filter @monetizer/analyzer add -D @types/node

# Add workspace dependency
pnpm --filter @monetizer/cli add @monetizer/shared
```

### Link Packages Locally

Packages are automatically linked via workspace protocol (`workspace:*`)

### Test Cross-Package Changes

```bash
# Build shared package
pnpm --filter @monetizer/shared build

# Build dependent package
pnpm --filter @monetizer/cli build

# Or build everything
turbo run build
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
RAILWAY_TOKEN=...
STRIPE_SECRET_KEY=sk_test_...
GITHUB_TOKEN=ghp_...
```

## Scripts Reference

### Root Scripts

```json
{
  "build": "turbo run build",
  "dev": "turbo run dev",
  "lint": "turbo run lint",
  "test": "turbo run test",
  "clean": "turbo run clean",
  "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
  "typecheck": "turbo run typecheck"
}
```

### Package Scripts (standardized)

```json
{
  "build": "tsc",
  "dev": "tsc --watch",
  "lint": "eslint src --ext .ts",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "clean": "rm -rf dist"
}
```

## Troubleshooting

### Build Errors

```bash
# Clean everything
turbo run clean
rm -rf node_modules
pnpm install

# Rebuild from scratch
turbo run build
```

### Type Errors

```bash
# Check all packages
turbo run typecheck

# Check specific package
pnpm --filter @monetizer/cli typecheck
```

### Circular Dependencies

Avoid circular dependencies between packages. Use `@monetizer/shared` for common code.

### Workspace Dependencies Not Found

```bash
# Rebuild dependencies
pnpm install
turbo run build
```

## Next Steps

1. **Phase 1**: Implement analyzer and strategy packages
2. **Phase 2**: Set up orchestrator with Inngest workflows
3. **Phase 3**: Develop agent system with LangGraph
4. **Phase 4**: Build Next.js dashboard

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspace Docs](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
