# BDD Framework for Task Manager

This directory contains the Behavior-Driven Development (BDD) framework for the Task Manager domain, following the **BDD-First** methodology.

## Structure

```
src/domains/task/bdd/
├── README.md                 # This file
├── bdd.config.ts            # BDD configuration and utilities
├── bdd-runner.test.ts       # Vitest integration for BDD execution
├── steps/
│   ├── common.steps.ts      # Common step definitions and world setup
│   ├── task-creation.steps.ts      # Steps for task creation scenarios
│   ├── task-completion.steps.ts    # Steps for task completion scenarios
│   ├── task-deletion.steps.ts      # Steps for task deletion scenarios (future)
│   ├── task-persistence.steps.ts   # Steps for persistence scenarios (future)
│   └── task-ui.steps.ts            # Steps for UI validation scenarios (future)
├── task-creation.feature    # Task creation BDD scenarios
├── task-completion.feature  # Task completion BDD scenarios
├── task-deletion.feature    # Task deletion BDD scenarios (future)
├── task-persistence.feature # Data persistence BDD scenarios (future)
└── task-ui.feature         # UI and validation BDD scenarios (future)
```

## BDD-First Methodology

Following the **BDD-First** rule, all implementation must start with BDD scenarios:

1. **BDD Scenarios** (this phase) - Define expected behavior
2. **Contracts (Zod)** - Define data validation
3. **Gallery (UI Prototyping)** - Prototype with MUI
4. **Services** - Implement business logic
5. **Repositories** - Implement data access
6. **Component Tests** - Test individual components
7. **E2E Tests** - Validate BDD scenarios with real UI
8. **Documentation** - Document the implementation
9. **Baseline** - Create deployment baseline

## Running BDD Tests

### Via npm scripts:

```bash
npm run test:bdd          # Run all BDD scenarios
npm run test:global       # Run all tests including BDD
```

### Via Vitest integration:

```bash
npm run test              # Includes BDD runner test
```

### Direct Cucumber execution:

```bash
npx cucumber-js --require-module ts-node/register --require 'src/domains/task/bdd/steps/**/*.steps.ts' 'src/domains/task/bdd/**/*.feature'
```

## Test Context and World

The BDD framework uses a `TaskManagerWorld` class that provides:

- **Test Context**: Isolated state for each scenario
- **Helper Methods**: Common operations like adding, toggling, deleting tasks
- **Storage Simulation**: Mock storage operations for testing
- **UI State Tracking**: Track UI state changes for validation

## Writing BDD Scenarios

Each feature file should follow this structure:

```gherkin
Feature: Task Completion
  As a user
  I want to mark tasks as complete
  So that I can track my progress and feel accomplished

  Background:
    Given the task manager is initialized
    And I have a task "Buy groceries" in the task list
    And the task is initially marked as not completed

  Scenario: Toggle task completion status via checkbox
    When I click on the task checkbox
    Then the task completion status should be toggled to completed
    And the task should be marked as completed in the task list
    And the completion change should be persisted to storage immediately

  Scenario: Visual styling for completed task
    When I click on the task checkbox to mark it as complete
    Then the task should display visual styling to indicate completion
    And the task description should show completion styling
    And the checkbox should show a checked state
```

## Step Definition Guidelines

- Use the `TaskManagerWorld` context for state management
- Follow async/await pattern for all step definitions
- Use descriptive step names that match business language
- Include proper error handling and assertions
- Validate both happy path and error scenarios

## Integration with Vitest

The BDD framework integrates with Vitest through `bdd-runner.test.ts`, which:

- Validates the BDD directory structure
- Executes Cucumber scenarios when feature files exist
- Provides proper error reporting
- Integrates with the overall test suite

## Reports

BDD execution generates reports in the `reports/` directory:

- `cucumber-report.json` - Machine-readable test results
- `cucumber-report.html` - Human-readable HTML report

These reports are used by the Global Report system for comprehensive test tracking.
