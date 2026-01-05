import { v4 as uuidv4 } from 'uuid'
import { TaskRepository } from '../repositories/TaskRepository'
import EventBus from '../../../SHARED/eventbus/EventBus'
import Logger from '../../../SHARED/logger/Logger'
import { Task, TaskSchema, CreateTaskInput, CreateTaskInputSchema } from '../../../SHARED/contracts/task/v1/TaskSchema'

/**
 * TaskService - Business logic for task management
 * 
 * Responsibilities:
 * - Validate all inputs using Zod schemas
 * - Generate GUIDs for new tasks
 * - Coordinate with repository for persistence
 * - Publish domain events for state changes
 * - Handle business rules and validation
 */
export class TaskService {
    private repository: TaskRepository
    private eventBus: EventBus
    private logger: Logger

    constructor(repository: TaskRepository, eventBus?: EventBus, logger?: Logger) {
        this.repository = repository
        this.eventBus = eventBus || EventBus.getInstance()
        this.logger = logger || Logger.getInstance()
    }

    /**
     * Create a new task with validation and event publishing
     */
    async createTask(input: CreateTaskInput): Promise<Task> {
        const correlationId = this.logger.startCorrelation()

        try {
            this.logger.debug('TaskService.createTask started', { input })

            // Validate input using Zod schema
            const validatedInput = CreateTaskInputSchema.parse(input)

            // Generate unique ID for the task
            const taskId = uuidv4()

            // Create task entity with proper initialization
            const task: Task = {
                id: taskId,
                description: validatedInput.description.trim(),
                completed: false,
                createdAt: new Date()
            }

            // Validate the complete task entity
            const validatedTask = TaskSchema.parse(task)

            // Persist to repository
            await this.repository.save(validatedTask)

            // Publish domain event
            await this.eventBus.publish('DOMAIN.TASK.CREATED', {
                taskId: validatedTask.id,
                description: validatedTask.description
            }, correlationId)

            this.logger.info('Task created successfully', {
                taskId: validatedTask.id,
                description: validatedTask.description
            })

            return validatedTask

        } catch (error) {
            this.logger.error('Failed to create task', error as Error, { input })
            throw error
        } finally {
            this.logger.endCorrelation()
        }
    }

    /**
     * Toggle task completion status
     */
    async toggleTask(taskId: string): Promise<Task> {
        const correlationId = this.logger.startCorrelation()

        try {
            this.logger.debug('TaskService.toggleTask started', { taskId })

            // Validate taskId is not empty
            if (!taskId || taskId.trim() === '') {
                throw new Error('Task ID is required')
            }

            // Find the task
            const existingTask = await this.repository.findById(taskId)
            if (!existingTask) {
                throw new Error(`Task with ID ${taskId} not found`)
            }

            // Toggle completion status
            const updatedTask: Task = {
                ...existingTask,
                completed: !existingTask.completed
            }

            // Validate the updated task
            const validatedTask = TaskSchema.parse(updatedTask)

            // Persist changes
            await this.repository.save(validatedTask)

            // Publish domain event
            const eventType = validatedTask.completed ? 'DOMAIN.TASK.COMPLETED' : 'DOMAIN.TASK.UNCOMPLETED'
            await this.eventBus.publish(eventType, {
                taskId: validatedTask.id,
                completed: validatedTask.completed
            }, correlationId)

            this.logger.info('Task toggled successfully', {
                taskId: validatedTask.id,
                completed: validatedTask.completed
            })

            return validatedTask

        } catch (error) {
            this.logger.error('Failed to toggle task', error as Error, { taskId })
            throw error
        } finally {
            this.logger.endCorrelation()
        }
    }

    /**
     * Delete a task by ID
     */
    async deleteTask(taskId: string): Promise<void> {
        const correlationId = this.logger.startCorrelation()

        try {
            this.logger.debug('TaskService.deleteTask started', { taskId })

            // Validate taskId is not empty
            if (!taskId || taskId.trim() === '') {
                throw new Error('Task ID is required')
            }

            // Verify task exists before deletion
            const existingTask = await this.repository.findById(taskId)
            if (!existingTask) {
                throw new Error(`Task with ID ${taskId} not found`)
            }

            // Delete from repository
            await this.repository.delete(taskId)

            // Publish domain event
            await this.eventBus.publish('DOMAIN.TASK.DELETED', {
                taskId,
                description: existingTask.description
            }, correlationId)

            this.logger.info('Task deleted successfully', {
                taskId,
                description: existingTask.description
            })

        } catch (error) {
            this.logger.error('Failed to delete task', error as Error, { taskId })
            throw error
        } finally {
            this.logger.endCorrelation()
        }
    }

    /**
     * Get all tasks
     */
    async getAllTasks(): Promise<Task[]> {
        const correlationId = this.logger.startCorrelation()

        try {
            this.logger.debug('TaskService.getAllTasks started')

            const tasks = await this.repository.findAll()

            // Validate all tasks conform to schema
            const validatedTasks = tasks.map(task => TaskSchema.parse(task))

            this.logger.debug('Tasks retrieved successfully', { count: validatedTasks.length })

            return validatedTasks

        } catch (error) {
            this.logger.error('Failed to get all tasks', error as Error)
            throw error
        } finally {
            this.logger.endCorrelation()
        }
    }

    /**
     * Clear all tasks (useful for testing and reset scenarios)
     */
    async clearAllTasks(): Promise<void> {
        const correlationId = this.logger.startCorrelation()

        try {
            this.logger.debug('TaskService.clearAllTasks started')

            await this.repository.clear()

            // Publish domain event
            await this.eventBus.publish('DOMAIN.TASK.ALL_CLEARED', {}, correlationId)

            this.logger.info('All tasks cleared successfully')

        } catch (error) {
            this.logger.error('Failed to clear all tasks', error as Error)
            throw error
        } finally {
            this.logger.endCorrelation()
        }
    }
}