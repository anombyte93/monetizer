# Monetizer

AI-powered project monetization platform that transforms any codebase into revenue.

## Turborepo Monorepo Structure

This project uses [Turborepo](https://turbo.build) to manage a monorepo containing multiple packages.

### Packages

- **@monetizer/cli** - Command-line interface for user interaction
- **@monetizer/analyzer** - Project analysis engine (tech stack, git metrics, code quality)
- **@monetizer/strategy** - AI-powered monetization strategy generator
- **@monetizer/orchestrator** - Workflow orchestration using Inngest
- **@monetizer/agents** - LangGraph agent system for intelligent decision making
- **@monetizer/metrics** - Performance tracking and comparison
- **@monetizer/ui** - Next.js dashboard (Phase 4)
- **@monetizer/shared** - Shared utilities and types

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required API keys:
- `ANTHROPIC_API_KEY` - For Claude AI (strategy generation)
- `PERPLEXITY_API_KEY` - For research capabilities
- `RAILWAY_TOKEN` - For deployment
- `STRIPE_SECRET_KEY` - For payment integration
- `GITHUB_TOKEN` - For GitHub integration

## Development

### Package Scripts

Each package supports the following scripts:

```bash
pnpm build      # Build the package
pnpm dev        # Watch mode development
pnpm lint       # Lint code
pnpm test       # Run tests
pnpm typecheck  # Type checking
pnpm clean      # Remove build artifacts
```

### Running Specific Packages

```bash
# Run CLI in development
pnpm --filter @monetizer/cli dev

# Build only the analyzer
pnpm --filter @monetizer/analyzer build

# Run Next.js dashboard
pnpm --filter @monetizer/ui dev
```

### Turborepo Commands

```bash
# Build all packages in parallel
turbo run build

# Run dev mode for all packages
turbo run dev

# Run linting across all packages
turbo run lint

# Clear cache
turbo run clean
```

## Project Structure

```
monetizer/
├── packages/
│   ├── cli/                 # Commander.js CLI
│   ├── analyzer/            # Project analysis
│   ├── strategy/            # AI strategy generation
│   ├── orchestrator/        # Inngest workflows
│   ├── agents/              # LangGraph agents
│   ├── metrics/             # Tracking system
│   ├── ui/                  # Next.js dashboard
│   └── shared/              # Common code
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # Workspace definition
├── package.json             # Root package
└── tsconfig.json            # Base TypeScript config
```

## Architecture

### Phase 1: Analysis & Strategy
- CLI command: `monetizer analyze <project-path>`
- Analyzes project using @monetizer/analyzer
- Generates strategy using @monetizer/strategy (Claude)
- Outputs actionable recommendations

### Phase 2: Orchestration
- Inngest workflows for long-running tasks
- LangGraph agents for intelligent decision making
- Coordinated implementation steps

### Phase 3: Implementation
- Automated code generation
- Integration setup (Stripe, Railway, etc.)
- Testing and validation

### Phase 4: Dashboard
- Next.js web interface
- Real-time metrics tracking
- Visual progress monitoring

## Contributing

This is a monorepo managed by Turborepo. When making changes:

1. Create a feature branch
2. Make changes in the appropriate package
3. Run `pnpm build` to ensure everything builds
4. Run `pnpm lint` to check for issues
5. Submit a pull request

## License

MIT
