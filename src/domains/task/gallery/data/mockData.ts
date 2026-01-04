import { v4 as uuidv4 } from 'uuid'

// Simple Task type for Gallery prototype
interface Task {
    id: string
    description: string
    completed: boolean
    createdAt: Date
}

/**
 * Mock data for Gallery prototyping
 * Provides realistic task data for component demonstrations
 */

/**
 * Sample tasks with different states for prototyping
 */
export const mockTasks: Task[] = [
    {
        id: uuidv4(),
        description: 'Complete project documentation',
        completed: false,
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
    },
    {
        id: uuidv4(),
        description: 'Review pull requests',
        completed: true,
        createdAt: new Date('2024-01-01T09:30:00.000Z'),
    },
    {
        id: uuidv4(),
        description: 'Update dependencies to latest versions',
        completed: false,
        createdAt: new Date('2024-01-01T11:15:00.000Z'),
    },
    {
        id: uuidv4(),
        description: 'Write unit tests for new features',
        completed: true,
        createdAt: new Date('2024-01-01T08:45:00.000Z'),
    },
    {
        id: uuidv4(),
        description: 'Prepare presentation for team meeting',
        completed: false,
        createdAt: new Date('2024-01-01T12:00:00.000Z'),
    },
]

/**
 * Empty task list for testing empty states
 */
export const emptyTaskList: Task[] = []

/**
 * Single task for minimal state testing
 */
export const singleTask: Task[] = [
    {
        id: uuidv4(),
        description: 'Single task example',
        completed: false,
        createdAt: new Date(),
    },
]

/**
 * Long task description for testing UI limits
 */
export const longDescriptionTask: Task = {
    id: uuidv4(),
    description: 'This is a very long task description that tests how the UI handles lengthy text content and ensures proper wrapping and display within the component boundaries while maintaining readability and visual hierarchy',
    completed: false,
    createdAt: new Date(),
}

/**
 * Tasks with various completion states
 */
export const mixedStateTasks: Task[] = [
    {
        id: uuidv4(),
        description: 'Completed task example',
        completed: true,
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
    },
    {
        id: uuidv4(),
        description: 'Active task example',
        completed: false,
        createdAt: new Date('2024-01-01T10:30:00.000Z'),
    },
    {
        id: uuidv4(),
        description: 'Another completed task',
        completed: true,
        createdAt: new Date('2024-01-01T11:00:00.000Z'),
    },
]

/**
 * Validation test cases for input scenarios
 */
export const validationTestCases = {
    valid: [
        'Valid task description',
        'Another valid task',
        'Task with numbers 123',
        'Task with special chars: @#$%',
    ],
    invalid: [
        '', // Empty string
        '   ', // Whitespace only
        '\t\n', // Tabs and newlines
        'a'.repeat(501), // Too long (over 500 chars)
    ],
    edge: [
        'a', // Minimum length (1 char)
        'a'.repeat(500), // Maximum length (500 chars)
        '  Valid task with spaces  ', // Trimming test
    ],
}

/**
 * Mock functions for Gallery interactions
 * These simulate the behavior without actual business logic
 */
export const mockActions = {
    createTask: (description: string): Task => ({
        id: uuidv4(),
        description: description.trim(),
        completed: false,
        createdAt: new Date(),
    }),

    toggleTask: (task: Task): Task => ({
        ...task,
        completed: !task.completed,
    }),

    deleteTask: (tasks: Task[], taskId: string): Task[] =>
        tasks.filter(task => task.id !== taskId),

    updateTask: (task: Task, updates: Partial<Task>): Task => ({
        ...task,
        ...updates,
    }),
}

/**
 * Gallery state management for demonstrations
 */
export class GalleryState {
    private tasks: Task[] = [...mockTasks]
    private listeners: Array<(tasks: Task[]) => void> = []

    getTasks(): Task[] {
        return [...this.tasks]
    }

    addTask(description: string): void {
        const newTask = mockActions.createTask(description)
        this.tasks = [...this.tasks, newTask]
        this.notifyListeners()
    }

    toggleTask(taskId: string): void {
        this.tasks = this.tasks.map(task =>
            task.id === taskId ? mockActions.toggleTask(task) : task
        )
        this.notifyListeners()
    }

    deleteTask(taskId: string): void {
        this.tasks = mockActions.deleteTask(this.tasks, taskId)
        this.notifyListeners()
    }

    setTasks(tasks: Task[]): void {
        this.tasks = [...tasks]
        this.notifyListeners()
    }

    subscribe(listener: (tasks: Task[]) => void): () => void {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.getTasks()))
    }
}

/**
 * Global gallery state instance
 */
export const galleryState = new GalleryState()