# Task Manager Design Document

## Overview

The Task Manager is a simple, focused web application built with React and TypeScript that provides essential task management functionality. The system emphasizes simplicity, reliability, and user experience while maintaining clean architecture principles. The application operates entirely in the browser using Local Storage for persistence, making it lightweight and immediately usable without backend dependencies.

## Reference Implementation

This specification is based on an existing implementation available at:
**Repository**: https://github.com/renatovilasboas9/todo-list.git

The reference implementation provides a working example of the core functionality described in this specification. However, this specification extends the original implementation with:
- BDD-driven development methodology
- Domain-driven design architecture
- Comprehensive property-based testing
- Material UI integration
- Centralized logging and observability
- Automated testing and reporting infrastructure

## Architecture

The application follows a clean architecture pattern with domain-driven design and clear separation of concerns:

```
src/
├── domains/
│   └── task/
│       ├── bdd/           # BDD scenarios (FIRST)
│       ├── gallery/       # UI prototyping with MUI
│       ├── services/      # Business logic
│       ├── repositories/  # Data access interfaces
│       └── components/    # UI components
├── SHARED/
│   ├── contracts/
│   │   └── task/v1/      # Zod schemas
│   ├── logger/           # Centralized logging
│   └── eventbus/        # Pub/sub system
├── config/
│   ├── test.ts          # Test environment config
│   └── prod.ts          # Production environment config
├── docs/               # Documentation
├── reports/            # Global reports
├── logs/              # Application logs
└── temp/              # Temporary files (gitignored)
```

**Key Architectural Decisions:**
- **Domain-Driven Design**: Organize by domain (task) with clear boundaries
- **BDD First**: All implementation starts with BDD scenarios
- **Repository Pattern**: Abstract storage operations behind interfaces for testability
- **Service Layer**: Centralize business logic and validation
- **Event-Driven Communication**: Decouple UI from business logic using pub/sub pattern
- **Contract-First**: Use Zod schemas as single source of truth for data validation
- **Material UI**: Consistent UI components and design system
- **Observability**: Centralized logging with correlation IDs

## Components and Interfaces

### Core Interfaces

```typescript
interface Task {
  id: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface TaskRepository {
  findAll(): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

interface TaskService {
  createTask(description: string): Promise<Task>;
  toggleTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  getAllTasks(): Promise<Task[]>;
}
```

### Component Hierarchy

```
TaskManagerApp
├── TaskInput
│   ├── Input field
│   └── Add button
├── TaskList
│   ├── TaskItem (multiple)
│   │   ├── Checkbox
│   │   ├── Description
│   │   └── Delete button
│   └── EmptyState
└── TaskStats (optional)
    ├── Total count
    └── Completed count
```

## Data Models

### Task Entity

The core entity representing a single task:

```typescript
// Zod schema as source of truth
const TaskSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  completed: z.boolean(),
  createdAt: z.date()
});

type Task = z.infer<typeof TaskSchema>;
```

### Storage Format

Tasks are stored in Local Storage as a JSON array:

```typescript
const StorageSchema = z.object({
  tasks: z.array(TaskSchema),
  version: z.literal("1.0")
});

type StorageData = z.infer<typeof StorageSchema>;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task Addition Grows List
*For any* valid task description, adding it to the task list should result in the task list growing by one and containing the new task
**Validates: Requirements 1.1**

### Property 2: Invalid Task Rejection
*For any* string composed entirely of whitespace or empty content, attempting to add it should be rejected and the task list should remain unchanged
**Validates: Requirements 1.2**

### Property 3: Input Field Reset
*For any* valid task addition, the input field should be cleared and focused after the operation
**Validates: Requirements 1.3**

### Property 4: Task Toggle Round-Trip
*For any* task, toggling its completion status twice should restore it to its original state
**Validates: Requirements 2.1, 2.4**

### Property 5: Completion Visual Indication
*For any* task marked as complete, the rendered output should include visual indicators of completion status
**Validates: Requirements 2.2**

### Property 6: Task Deletion Removes Item
*For any* task in the list, deleting it should remove it from the task list while maintaining the order and integrity of remaining tasks
**Validates: Requirements 3.1, 3.3**

### Property 7: State Persistence Synchronization
*For any* task operation (add, toggle, delete), the Local Storage should immediately reflect the current application state
**Validates: Requirements 1.4, 2.3, 3.2, 4.4**

### Property 8: State Restoration Round-Trip
*For any* set of tasks saved to Local Storage, reloading the application should restore the complete state including all task descriptions and completion statuses
**Validates: Requirements 4.1, 4.2**

### Property 9: Task Rendering Completeness
*For any* task displayed in the UI, the rendered output should contain both the task description and completion status
**Validates: Requirements 5.2**

### Property 10: MUI Component Usage
*For any* UI component rendered, it should use Material UI components and follow MUI design patterns
**Validates: Requirements 5.1, 5.4**

### Property 11: Inline Validation Display
*For any* invalid input, the UI should display inline validation messages derived from Zod schemas using MUI form components
**Validates: Requirements 5.5**

### Property 12: Logging Correlation
*For any* user action, the system should generate a unique correlationId and log the action with proper context
**Validates: Requirements 6.1, 6.3**

## Error Handling

The system implements graceful error handling for common failure scenarios:

### Storage Errors
- **Corrupted Data**: When Local Storage contains invalid JSON or schema violations, initialize with empty state
- **Storage Quota**: Handle storage quota exceeded errors by attempting cleanup or notifying user
- **Serialization Failures**: Validate data before storage operations and handle serialization errors gracefully

### Input Validation
- **Empty Tasks**: Prevent addition of empty or whitespace-only task descriptions
- **Invalid Characters**: Handle special characters and encoding issues in task descriptions
- **Length Limits**: Enforce reasonable limits on task description length (500 characters)

### UI Error States
- **Loading Failures**: Display appropriate messaging when initial data loading fails
- **Operation Failures**: Provide user feedback when task operations fail
- **Network Issues**: Handle offline scenarios gracefully (though not applicable for Local Storage)

## Testing Strategy

The testing approach combines unit testing and property-based testing to ensure comprehensive coverage:

### Unit Testing with Vitest + React Testing Library
- **Component Testing**: Verify individual MUI component behavior and rendering
- **Service Testing**: Test business logic in isolation with mocked dependencies
- **Repository Testing**: Validate storage operations with test data
- **Integration Testing**: Test component interactions and data flow
- **Edge Cases**: Specific tests for error conditions and boundary values
- **BDD Integration**: Unit tests validate BDD scenarios at component level

### Property-Based Testing with fast-check
- **Universal Properties**: Verify correctness properties hold across all valid inputs
- **Test Configuration**: Minimum 100 iterations per property test for thorough coverage
- **Property Tagging**: Each property test tagged with format: '**Feature: task-manager, Property {number}: {property_text}**'
- **Generator Strategy**: Smart generators that create realistic task data within valid constraints

### End-to-End Testing with Playwright + Cucumber
- **BDD Scenarios**: E2E tests validate BDD scenarios with actual UI interactions
- **User Workflows**: Complete user journeys from task creation to completion
- **Cross-Browser**: Verify functionality across different browser environments
- **Visual Validation**: Ensure MUI elements render correctly and provide proper feedback
- **Persistence Testing**: Verify data survives browser refresh and session changes

### Testing Requirements
- **Coverage**: Minimum 80% code coverage across all test types
- **Execution Modes**: Support for file-level, domain-level, and global test execution
- **No Watch Mode**: All tests run in single-execution mode for CI/CD compatibility
- **BDD Integration**: E2E tests validate BDD scenarios with actual UI interactions

The dual testing approach ensures both specific examples work correctly (unit tests) and general correctness properties hold across all inputs (property tests), providing comprehensive validation of system behavior.