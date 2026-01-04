# Task Manager

A modern task management application built with React, TypeScript, and Material UI following Domain-Driven Design principles and BDD-first development methodology.

## Project Structure

```
├── .github/workflows/     # CI/CD configuration
├── changes/              # Change management documentation
├── db/                   # Database files (SQLite)
├── docs/                 # Project documentation
├── logs/                 # Application logs
├── reports/              # Test and coverage reports
├── src/                  # Source code
│   ├── SHARED/           # Shared infrastructure
│   │   ├── contracts/    # Zod schemas and data contracts
│   │   ├── eventbus/     # Event-driven communication
│   │   └── logger/       # Centralized logging
│   ├── config/           # Environment configuration
│   └── domains/          # Domain-driven design structure
│       └── task/         # Task management domain
│           ├── bdd/      # BDD scenarios and steps
│           ├── components/ # React UI components
│           ├── gallery/  # UI prototyping
│           ├── repositories/ # Data access layer
│           └── services/ # Business logic
├── temp/                 # Temporary files (gitignored)
└── videos/               # E2E test recordings
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Material UI
- **Testing**: Vitest, React Testing Library, Cucumber (BDD)
- **Property Testing**: fast-check
- **Validation**: Zod
- **Build**: Vite
- **Linting**: ESLint, Prettier

## Development Workflow

This project follows a **BDD-first** development methodology:

1. **BDD Scenarios** - Define behavior with Gherkin scenarios
2. **Contracts** - Create Zod schemas for data validation
3. **Gallery** - Prototype UI components with Material UI
4. **Services** - Implement business logic
5. **Repositories** - Create data access layer
6. **Components** - Build React UI components
7. **Integration** - Wire everything together
8. **E2E Testing** - Validate complete user journeys

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:file` - Run specific test file
- `npm run test:domain` - Run domain-level tests
- `npm run test:global` - Run complete test suite
- `npm run test:bdd` - Run BDD scenarios
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run typecheck` - Type checking

## Quality Standards

- **Coverage**: Minimum 80% test coverage required
- **TypeScript**: Strict mode enabled, no JavaScript allowed
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Testing**: Unit tests + Property-based tests + BDD scenarios

## Architecture Principles

- **Domain-Driven Design**: Organized by business domains
- **Clean Architecture**: Clear separation of concerns
- **Event-Driven**: Pub/sub communication pattern
- **Repository Pattern**: Abstract data access
- **Dependency Injection**: Environment-based configuration
- **Material Design**: Consistent UI/UX with Material UI

## Getting Started

1. Install dependencies: `npm install`
2. Run tests: `npm run test`
3. Start development: `npm run dev`
4. View BDD scenarios in `src/domains/task/bdd/`

## CI/CD

The project includes GitHub Actions workflow that runs:
- Linting and formatting checks
- TypeScript compilation
- Unit and BDD tests
- Coverage validation (80% minimum)
- Multi-Node.js version testing (18.x, 20.x)