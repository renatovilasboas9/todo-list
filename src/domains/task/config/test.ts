import { MemoryTaskRepository } from '../repositories/MemoryTaskRepository'
import { TaskRepository } from '../repositories/TaskRepository'
import { TaskService } from '../services/TaskService'
import EventBus from '../../../SHARED/eventbus/EventBus'
import Logger from '../../../SHARED/logger/Logger'

/**
 * Test Environment Configuration
 * 
 * Composition root for TEST environment that configures:
 * - MemoryTaskRepository for fast, isolated testing
 * - TaskService with business logic
 * - EventBus handlers for domain events
 * - Logger configuration for test scenarios
 * 
 * This configuration ensures tests run with in-memory storage
 * and proper event handling without external dependencies.
 */

export interface TaskDomainConfig {
    taskRepository: TaskRepository
    taskService: TaskService
    eventBus: EventBus
    logger: Logger
}

/**
 * Create and configure the task domain for TEST environment
 * 
 * @returns Configured domain dependencies
 */
export function createTaskDomainConfig(): TaskDomainConfig {
    const logger = Logger.getInstance()
    const eventBus = EventBus.getInstance()
    const taskRepository = new MemoryTaskRepository()
    const taskService = new TaskService(taskRepository, eventBus, logger)

    logger.info('Task domain configured for TEST environment', {
        environment: 'TEST',
        repository: 'MemoryTaskRepository',
        service: 'TaskService',
        eventBus: 'EventBus'
    })

    // Register domain event handlers
    setupDomainEventHandlers(eventBus, taskService, logger)

    return {
        taskRepository,
        taskService,
        eventBus,
        logger
    }
}

/**
 * Set up event handlers for task domain
 * 
 * Connects UI events to service operations through the EventBus.
 * This establishes the event-driven architecture pattern.
 * 
 * @param eventBus - The event bus instance
 * @param taskService - The task service instance
 * @param logger - The logger instance
 */
function setupDomainEventHandlers(
    eventBus: EventBus,
    taskService: TaskService,
    logger: Logger
): void {
    // UI.TASK.CREATE -> TaskService.createTask
    eventBus.subscribe('UI.TASK.CREATE', async (event) => {
        logger.debug('Handling UI.TASK.CREATE event', {
            event: event.type,
            payload: event.payload
        })

        try {
            const task = await taskService.createTask(event.payload)

            logger.debug('Task created successfully via service', {
                taskId: task.id
            })
        } catch (error) {
            logger.error('Failed to create task via service', error as Error, {
                payload: event.payload
            })

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.CREATE_FAILED', {
                error: (error as Error).message,
                input: event.payload
            })
        }
    })

    // UI.TASK.TOGGLE -> TaskService.toggleTask
    eventBus.subscribe('UI.TASK.TOGGLE', async (event) => {
        logger.debug('Handling UI.TASK.TOGGLE event', {
            event: event.type,
            payload: event.payload
        })

        try {
            const task = await taskService.toggleTask(event.payload.taskId)

            logger.debug('Task toggled successfully via service', {
                taskId: task.id,
                completed: task.completed
            })
        } catch (error) {
            logger.error('Failed to toggle task via service', error as Error, {
                taskId: event.payload.taskId
            })

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.TOGGLE_FAILED', {
                error: (error as Error).message,
                taskId: event.payload.taskId
            })
        }
    })

    // UI.TASK.DELETE -> TaskService.deleteTask
    eventBus.subscribe('UI.TASK.DELETE', async (event) => {
        logger.debug('Handling UI.TASK.DELETE event', {
            event: event.type,
            payload: event.payload
        })

        try {
            await taskService.deleteTask(event.payload.taskId)

            logger.debug('Task deleted successfully via service', {
                taskId: event.payload.taskId
            })
        } catch (error) {
            logger.error('Failed to delete task via service', error as Error, {
                taskId: event.payload.taskId
            })

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.DELETE_FAILED', {
                error: (error as Error).message,
                taskId: event.payload.taskId
            })
        }
    })

    // UI.TASK.LOAD_ALL -> TaskService.getAllTasks
    eventBus.subscribe('UI.TASK.LOAD_ALL', async (event) => {
        logger.debug('Handling UI.TASK.LOAD_ALL event', {
            event: event.type
        })

        try {
            const tasks = await taskService.getAllTasks()

            // Publish success event with tasks
            await eventBus.publish('DOMAIN.TASK.LOADED', { tasks })

            logger.debug('Tasks loaded successfully via service', {
                taskCount: tasks.length
            })
        } catch (error) {
            logger.error('Failed to load tasks via service', error as Error)

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.LOAD_FAILED', {
                error: (error as Error).message
            })
        }
    })

    logger.info('Domain event handlers registered', {
        handlers: ['UI.TASK.CREATE', 'UI.TASK.TOGGLE', 'UI.TASK.DELETE', 'UI.TASK.LOAD_ALL']
    })
}

/**
 * Reset domain configuration for testing
 * 
 * Clears all data and resets event handlers.
 * Used between test scenarios to ensure clean state.
 */
export function resetTaskDomainConfig(config: TaskDomainConfig): void {
    const logger = config.logger

    logger.debug('Resetting task domain configuration', {
        environment: 'TEST'
    })

    // Clear repository data if it's a MemoryTaskRepository
    if (config.taskRepository instanceof MemoryTaskRepository) {
        config.taskRepository.reset()
    }

    // Clear event bus
    config.eventBus.clear()

    // Re-setup event handlers
    setupDomainEventHandlers(config.eventBus, config.taskService, logger)

    logger.debug('Task domain configuration reset complete')
}