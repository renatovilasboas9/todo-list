import { MemoryTaskRepository } from '../../repositories/MemoryTaskRepository'
import { Task } from '../../../../SHARED/contracts/task/v1/TaskSchema'
import { v4 as uuidv4 } from 'uuid'

// Test context interface for type safety
interface TestContext {
    tasks: any[]
    currentTask?: any
    lastError?: Error
    ui?: {
        inputValue?: string
        taskList?: any[]
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
        data?: any
        corrupted?: boolean
    }
}

// World constructor for BDD scenarios
class TaskManagerWorld {
    public context: TestContext
    public repository: MemoryTaskRepository

    constructor() {
        this.context = {
            tasks: [],
            ui: {},
            storage: {},
        }
        this.repository = new MemoryTaskRepository()
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

    async addTask(description: string) {
        const task = {
            id: uuidv4(),
            description,
            completed: false,
            createdAt: new Date(),
        }

        await this.repository.save(task)
        this.context.tasks.push(task)
        this.context.currentTask = task
        return task
    }

    findTaskById(id: string) {
        return this.context.tasks.find((task) => task.id === id)
    }

    findTaskByDescription(description: string) {
        return this.context.tasks.find((task) => task.description === description)
    }

    async toggleTask(id: string) {
        const task = this.findTaskById(id)
        if (task) {
            task.completed = !task.completed
            await this.repository.save(task)
            this.context.currentTask = task
        }
        return task
    }

    async deleteTask(id: string) {
        const index = this.context.tasks.findIndex((task) => task.id === id)
        if (index !== -1) {
            const deletedTask = this.context.tasks.splice(index, 1)[0]
            try {
                await this.repository.delete(deletedTask.id)
                this.context.currentTask = deletedTask
                return deletedTask
            } catch (error) {
                // If repository delete fails, restore the task to context
                this.context.tasks.splice(index, 0, deletedTask)
                throw error
            }
        }
        return null
    }

    simulateStorageCorruption() {
        if (this.context.storage) {
            this.context.storage.corrupted = true
            this.context.storage.data = 'invalid json data'
        }
    }

    simulateStorageRestore(tasks: any[]) {
        if (this.context.storage) {
            this.context.storage.corrupted = false
            // Simulate the serialization/deserialization process that happens with localStorage
            const serializedTasks = tasks.map((task) => ({
                ...task,
                createdAt: task.createdAt.toISOString(), // Convert Date to string like JSON.stringify does
            }))
            this.context.storage.data = JSON.stringify({ tasks: serializedTasks, version: '1.0' })
            this.context.tasks = [...tasks] // Keep the original tasks with Date objects in context
        }
    }
}

// Export types for use in step definitions
export { TaskManagerWorld }
export type { TestContext }
