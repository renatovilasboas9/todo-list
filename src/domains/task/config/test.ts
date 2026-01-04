import { MemoryTaskRepository } from '../repositories/MemoryTaskRepository'
import { TaskRepository } from '../repositories/TaskRepository'
import { EventBus } from '../../../SHARED/eventbus/EventBus'
import Logger from '../../../SHARED/logger/Logger'

/**
 * Test Environment Configuration
 * 
 * Composition root for TEST environment that configures:
 * - MemoryTaskRepository for fast, isolated testing
 * - EventBus handlers for domain events
 * - Logger configuration for test scenarios
 * 
 * This configuration ensures tests run with in-memory storage
 * and proper event handling without external dependencies.
 */

export interface TaskDomainConfig {
    taskRepository: TaskRepository
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

    // Configure logger for test environment
    logger.setLogLevel('DEBUG')

    logger.info('Task domain configured for TEST environment', {
        environment: 'TEST',
        repository: 'MemoryTaskRepository',
        eventBus: 'EventBus',
        correlationId: logger.getCurrentCorrelationId()
    })

    // Register domain event handlers
    setupDomainEventHandlers(eventBus, taskRepository, logger)

    return {
        taskRepository,
        eventBus,
        logger
    }
}

/**
 * Set up event handlers for task domain
 * 
 * Connects UI events to repository operations through the EventBus.
 * This establishes the event-driven architecture pattern.
 * 
 * @param eventBus - The event bus instance
 * @param taskRepository - The task repository instance
 * @param logger - The logger instance
 */
function setupDomainEventHandlers(
    eventBus: EventBus,
    taskRepository: TaskRepository,
    logger: Logger
): void {
    const correlationId = logger.getCurrentCorrelationId()

    // UI.TASK.CREATE -> Repository save operation
    eventBus.subscribe('UI.TASK.CREATE', async (event) => {
        logger.debug('Handling UI.TASK.CREATE event', {
            event: event.type,
            payload: event.payload,
            correlationId
        })

        try {
            await taskRepository.save(event.payload.task)

            // Publish domain event
            eventBus.publish({
                type: 'DOMAIN.TASK.CREATED',
                payload: { task: event.payload.task },
                timestamp: new Date(),
                correlationId
            })

            logger.debug('Task created successfully', {
                taskId: event.payload.task.id,
                correlationId
            })
        } catch (error) {
            logger.error('Failed to create task', error as Error, {
                taskId: event.payload.task.id,
                correlationId
            })

            // Publish error event
            eventBus.publish({
                type: 'DOMAIN.TASK.CREATE_FAILED',
                payload: { error: (error as Error).message, task: event.payload.task },
                timestamp: new Date(),
                correlationId
            })
        }
    })

    // UI.TASK.TOGGLE -> Repository save operation
    eventBus.subscribe('UI.TASK.TOGGLE', async (event) => {
        logger.debug('Handling UI.TASK.TOGGLE event', {
            event: event.type,
            payload: event.payload,
            correlationId
        })

        try {
            await taskRepository.save(event.payload.task)

            // Publish domain event
            eventBus.publish({
                type: 'DOMAIN.TASK.TOGGLED',
                payload: { task: event.payload.task },
                timestamp: new Date(),
                correlationId
            })

            logger.debug('Task toggled successfully', {
                taskId: event.payload.task.id,
                completed: event.payload.task.completed,
                correlationId
            })
        } catch (error) {
            logger.error('Failed to toggle task', error as Error, {
                taskId: event.payload.task.id,
                correlationId
            })

            // Publish error event
            eventBus.publish({
                type: 'DOMAIN.TASK.TOGGLE_FAILED',
                payload: { error: (error as Error).message, task: event.payload.task },
                timestamp: new Date(),
                correlationId
            })
        }
    })

    // UI.TASK.DELETE -> Repository delete operation
    eventBus.subscribe('UI.TASK.DELETE', async (event) => {
        logger.debug('Handling UI.TASK.DELETE event', {
            event: event.type,
            payload: event.payload,
            correlationId
        })

        try {
            await taskRepository.delete(event.payload.taskId)

            // Publish domain event
            eventBus.publish({
                type: 'DOMAIN.TASK.DELETED',
                payload: { taskId: event.payload.taskId },
                timestamp: new Date(),
                correlationId
            })

            logger.debug('Task deleted successfully', {
                taskId: event.payload.taskId,
                correlationId
            })
        } catch (error) {
            logger.error('Failed to delete task', error as Error, {
                taskId: event.payload.taskId,
                correlationId
            })

            // Publish error event
            eventBus.publish({
                type: 'DOMAIN.TASK.DELETE_FAILED',
                payload: { error: (error as Error).message, taskId: event.payload.taskId },
                timestamp: new Date(),
                correlationId
            })
        }
    })

    // UI.TASK.LOAD_ALL -> Repository findAll operation
    eventBus.subscribe('UI.TASK.LOAD_ALL', async (event) => {
        logger.debug('Handling UI.TASK.LOAD_ALL event', {
            event: event.type,
            correlationId
        })

        try {
            const tasks = await taskRepository.findAll()

            // Publish domain event
            eventBus.publish({
                type: 'DOMAIN.TASK.LOADED',
                payload: { tasks },
                timestamp: new Date(),
                correlationId
            })

            logger.debug('Tasks loaded successfully', {
                taskCount: tasks.length,
                correlationId
            })
        } catch (error) {
            logger.error('Failed to load tasks', error as Error, {
                correlationId
            })

            // Publish error event
            eventBus.publish({
                type: 'DOMAIN.TASK.LOAD_FAILED',
                payload: { error: (error as Error).message },
                timestamp: new Date(),
                correlationId
            })
        }
    })

    logger.info('Domain event handlers registered', {
        handlers: ['UI.TASK.CREATE', 'UI.TASK.TOGGLE', 'UI.TASK.DELETE', 'UI.TASK.LOAD_ALL'],
        correlationId
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
    const correlationId = logger.getCurrentCorrelationId()

    logger.debug('Resetting task domain configuration', {
        environment: 'TEST',
        correlationId
    })

    // Clear repository data if it's a MemoryTaskRepository
    if (config.taskRepository instanceof MemoryTaskRepository) {
        config.taskRepository.reset()
    }

    // Clear event bus (if needed for testing)
    config.eventBus.clearAllSubscriptions()

    // Re-setup event handlers
    setupDomainEventHandlers(config.eventBus, config.taskRepository, logger)

    logger.debug('Task domain configuration reset complete', {
        correlationId
    })
}