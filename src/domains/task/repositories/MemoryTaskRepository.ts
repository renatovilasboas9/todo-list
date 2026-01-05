import { Task, TaskSchema } from '../../../SHARED/contracts/task/v1/TaskSchema'
import { TaskRepository } from './TaskRepository'
import Logger from '../../../SHARED/logger/Logger'

/**
 * MemoryTaskRepository
 * 
 * In-memory implementation of TaskRepository for testing environments.
 * Stores tasks in memory using an array, providing fast access and
 * easy data manipulation for test scenarios.
 * 
 * Features:
 * - Data validation using Zod schemas
 * - Error simulation capabilities for testing error handling
 * - Comprehensive logging for debugging
 * - Thread-safe operations (within single-threaded JS context)
 */
export class MemoryTaskRepository implements TaskRepository {
    private tasks: Task[] = []
    private logger: Logger
    private shouldSimulateErrors: boolean = false
    private errorSimulationRate: number = 0

    constructor() {
        this.logger = Logger.getInstance()
    }

    /**
     * Enable error simulation for testing error handling scenarios
     * 
     * @param enabled - Whether to enable error simulation
     * @param errorRate - Probability of error (0.0 to 1.0)
     */
    public enableErrorSimulation(enabled: boolean, errorRate: number = 0.1): void {
        this.shouldSimulateErrors = enabled
        this.errorSimulationRate = Math.max(0, Math.min(1, errorRate))

        this.logger.debug('Error simulation configured', {
            enabled,
            errorRate: this.errorSimulationRate,
            repository: 'MemoryTaskRepository'
        })
    }

    /**
     * Simulate random errors for testing purposes
     */
    private simulateError(): void {
        if (this.shouldSimulateErrors && Math.random() < this.errorSimulationRate) {
            throw new Error('Simulated repository error for testing')
        }
    }

    async findAll(): Promise<Task[]> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Finding all tasks', {
            operation: 'findAll',
            repository: 'MemoryTaskRepository',
            taskCount: this.tasks.length,
            correlationId
        })

        try {
            this.simulateError()

            // Return a deep copy to prevent external mutations
            const result = this.tasks.map(task => ({ ...task }))

            this.logger.debug('Successfully retrieved all tasks', {
                operation: 'findAll',
                repository: 'MemoryTaskRepository',
                resultCount: result.length,
                correlationId
            })

            return result
        } catch (error) {
            this.logger.error('Failed to find all tasks', error as Error, {
                operation: 'findAll',
                repository: 'MemoryTaskRepository',
                correlationId
            })
            throw error
        }
    }

    async findById(id: string): Promise<Task | null> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Finding task by ID', {
            operation: 'findById',
            repository: 'MemoryTaskRepository',
            taskId: id,
            correlationId
        })

        try {
            this.simulateError()

            // Validate ID format
            if (!id || typeof id !== 'string') {
                throw new Error('Task ID must be a non-empty string')
            }

            const task = this.tasks.find(t => t.id === id)
            const result = task ? { ...task } : null

            this.logger.debug('Task search completed', {
                operation: 'findById',
                repository: 'MemoryTaskRepository',
                taskId: id,
                found: result !== null,
                correlationId
            })

            return result
        } catch (error) {
            this.logger.error('Failed to find task by ID', error as Error, {
                operation: 'findById',
                repository: 'MemoryTaskRepository',
                taskId: id,
                correlationId
            })
            throw error
        }
    }

    async save(task: Task): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Saving task', {
            operation: 'save',
            repository: 'MemoryTaskRepository',
            taskId: task.id,
            taskDescription: task.description,
            correlationId
        })

        try {
            this.simulateError()

            // Validate task using Zod schema
            const validatedTask = TaskSchema.parse(task)

            // Check if task already exists (update scenario)
            const existingIndex = this.tasks.findIndex(t => t.id === validatedTask.id)

            if (existingIndex >= 0) {
                // Update existing task
                this.tasks[existingIndex] = { ...validatedTask }

                this.logger.debug('Task updated successfully', {
                    operation: 'save',
                    repository: 'MemoryTaskRepository',
                    taskId: validatedTask.id,
                    action: 'update',
                    correlationId
                })
            } else {
                // Insert new task
                this.tasks.push({ ...validatedTask })

                this.logger.debug('Task inserted successfully', {
                    operation: 'save',
                    repository: 'MemoryTaskRepository',
                    taskId: validatedTask.id,
                    action: 'insert',
                    totalTasks: this.tasks.length,
                    correlationId
                })
            }
        } catch (error) {
            this.logger.error('Failed to save task', error as Error, {
                operation: 'save',
                repository: 'MemoryTaskRepository',
                taskId: task.id,
                correlationId
            })
            throw error
        }
    }

    async delete(id: string): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Deleting task', {
            operation: 'delete',
            repository: 'MemoryTaskRepository',
            taskId: id,
            correlationId
        })

        try {
            this.simulateError()

            // Validate ID format
            if (!id || typeof id !== 'string') {
                throw new Error('Task ID must be a non-empty string')
            }

            const initialLength = this.tasks.length
            const taskIndex = this.tasks.findIndex(task => task.id === id)

            if (taskIndex === -1) {
                const error = new Error(`Task with ID ${id} not found`)
                this.logger.error('Task not found for deletion', error, {
                    operation: 'delete',
                    repository: 'MemoryTaskRepository',
                    taskId: id,
                    correlationId
                })
                throw error
            }

            // Remove task from array
            this.tasks.splice(taskIndex, 1)

            this.logger.debug('Task deleted successfully', {
                operation: 'delete',
                repository: 'MemoryTaskRepository',
                taskId: id,
                previousCount: initialLength,
                currentCount: this.tasks.length,
                correlationId
            })
        } catch (error) {
            this.logger.error('Failed to delete task', error as Error, {
                operation: 'delete',
                repository: 'MemoryTaskRepository',
                taskId: id,
                correlationId
            })
            throw error
        }
    }

    async clear(): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Clearing all tasks', {
            operation: 'clear',
            repository: 'MemoryTaskRepository',
            currentTaskCount: this.tasks.length,
            correlationId
        })

        try {
            this.simulateError()

            const clearedCount = this.tasks.length
            this.tasks = []

            this.logger.debug('All tasks cleared successfully', {
                operation: 'clear',
                repository: 'MemoryTaskRepository',
                clearedCount,
                correlationId
            })
        } catch (error) {
            this.logger.error('Failed to clear tasks', error as Error, {
                operation: 'clear',
                repository: 'MemoryTaskRepository',
                correlationId
            })
            throw error
        }
    }

    /**
     * Test utility methods for inspection and manipulation
     * These methods are only intended for testing scenarios
     */

    /**
     * Get current task count (for testing)
     */
    public getTaskCount(): number {
        return this.tasks.length
    }

    /**
     * Get task by ID (for testing)
     */
    public getTaskById(id: string): Task | undefined {
        return this.tasks.find(task => task.id === id)
    }

    /**
     * Reset repository to initial state (for testing)
     */
    public reset(): void {
        this.tasks = []
        this.shouldSimulateErrors = false
        this.errorSimulationRate = 0

        this.logger.debug('Repository reset to initial state', {
            operation: 'reset',
            repository: 'MemoryTaskRepository'
        })
    }
}