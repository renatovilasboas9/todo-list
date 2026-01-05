import { MemoryTaskRepository } from '../../repositories/MemoryTaskRepository'
import { TaskService } from '../../services/TaskService'
import { createTaskDomainConfig, TaskDomainConfig } from '../../config/test'
import {
    type Task,
    type CreateTaskInput,
    type StorageData,
    TaskSchema,
    StorageSchema,
    validateTask,
    parseStorageData,
    serializeStorageData,
    VALIDATION_CONSTANTS
} from '../../../../SHARED/contracts/task/v1'

// Test context interface using official Zod types
interface TestContext {
    tasks: Task[]
    currentTask?: Task
    lastError?: Error
    ui?: {
        inputValue?: string
        taskList?: Task[]
        validationMessages?: string[]
        lastToggledTask?: {
            id: string
            previousState: boolean
            newState: boolean
        }
        taskStyling?: {
            taskId: string
            hasCompletionStyling: boolean
            checkboxChecked: boolean
            descriptionStrikethrough: boolean
        }
        lastDeletedTask?: {
            id: string
            description: string
        }
        taskListDisplay?: {
            taskCount: number
            tasksInOrder: Array<{ id: string; description: string }>
        }
    }
    storage?: {
        data?: string | StorageData
        corrupted?: boolean
        quotaExceeded?: boolean
    }
}

// World constructor for BDD scenarios
class TaskManagerWorld {
    public context: TestContext
    public repository: MemoryTaskRepository
    public taskService: TaskService
    public domainConfig: TaskDomainConfig

    constructor() {
        this.context = {
            tasks: [],
            ui: {},
            storage: {},
        }

        // Initialize domain configuration for TEST environment
        this.domainConfig = createTaskDomainConfig()
        this.repository = this.domainConfig.taskRepository as MemoryTaskRepository
        this.taskService = this.domainConfig.taskService
    }

    // Helper methods for BDD scenarios
    resetContext() {
        this.context = {
            tasks: [],
            ui: {},
            storage: {},
        }
        this.repository.reset()
    }

    async addTask(description: string): Promise<Task> {
        // Use official Zod schema for input validation
        const input: CreateTaskInput = { description }
        const task = await this.taskService.createTask(input)

        // Sync context with repository state immediately after creation
        await this.syncContextWithRepository()

        this.context.currentTask = task
        return task
    }

    findTaskById(id: string): Task | undefined {
        return this.context.tasks.find((task) => task.id === id)
    }

    findTaskByDescription(description: string): Task | undefined {
        return this.context.tasks.find((task) => task.description === description)
    }

    async toggleTask(id: string): Promise<Task> {
        const task = await this.taskService.toggleTask(id)

        // Sync context with repository state immediately after toggle
        await this.syncContextWithRepository()

        // Update current task to the toggled task
        this.context.currentTask = task
        return task
    }

    async deleteTask(id: string): Promise<void> {
        try {
            await this.taskService.deleteTask(id)

            // Sync context with repository state immediately after deletion
            await this.syncContextWithRepository()

            // Clear current task if it was the deleted one
            if (this.context.currentTask?.id === id) {
                this.context.currentTask = undefined
            }
        } catch (error) {
            // Store error for BDD assertions
            this.context.lastError = error as Error

            // Still sync context to ensure consistency
            await this.syncContextWithRepository()

            throw error
        }
    }

    /**
     * Sync the context.tasks with the actual repository state
     * This ensures BDD assertions work correctly with the real implementation
     */
    async syncContextWithRepository() {
        try {
            this.context.tasks = await this.taskService.getAllTasks()
        } catch (error) {
            this.context.lastError = error as Error
            this.context.tasks = []
        }
    }

    simulateStorageCorruption() {
        if (this.context.storage) {
            this.context.storage.corrupted = true
            this.context.storage.data = 'invalid json data'
        }
    }

    simulateStorageRestore(tasks: Task[]) {
        if (this.context.storage) {
            this.context.storage.corrupted = false

            // Use official Zod schema for storage serialization
            const storageData: StorageData = {
                tasks,
                version: VALIDATION_CONSTANTS.STORAGE_VERSION,
            }

            // Validate storage data using official schema
            const validatedData = StorageSchema.parse(storageData)
            this.context.storage.data = serializeStorageData(validatedData)
            this.context.tasks = [...tasks]
        }
    }
}

// Export types for use in step definitions
export { TaskManagerWorld }
export type { TestContext }
