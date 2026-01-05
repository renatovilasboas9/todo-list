import { MemoryTaskRepository } from '../domains/task/repositories/MemoryTaskRepository'
import { TaskRepository } from '../domains/task/repositories/TaskRepository'
import { TaskService } from '../domains/task/services/TaskService'
import EventBus from '../SHARED/eventbus/EventBus'
import Logger from '../SHARED/logger/Logger'

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
 * @returns Configured domain dependencies for testing
 */
export function createTestTaskDomainConfig(): TaskDomainConfig {
    const logger = Logger.getInstance()
    const correlationId = logger.startCorrelation()

    try {
        logger.debug('Configuring task domain for TEST environment', {
            environment: 'TEST',
            correlationId
        })

        const eventBus = EventBus.getInstance()
        const taskRepository = new MemoryTaskRepository()
        const taskService = new TaskService(taskRepository, eventBus, logger)

        logger.info('Task domain configured for TEST environment', {
            environment: 'TEST',
            repository: 'MemoryTaskRepository',
            service: 'TaskService',
            eventBus: 'EventBus',
            correlationId
        })

        // Register domain event handlers
        setupTestDomainEventHandlers(eventBus, taskService, logger)

        return {
            taskRepository,
            taskService,
            eventBus,
            logger
        }

    } catch (error) {
        logger.error('Failed to configure task domain for TEST environment', error as Error, {
            environment: 'TEST',
            correlationId
        })
        throw error
    } finally {
        logger.endCorrelation()
    }
}

/**
 * Set up event handlers for task domain in test environment
 * 
 * Connects UI events to service operations through the EventBus.
 * This establishes the event-driven architecture pattern with
 * test-specific error handling and simplified logging.
 * 
 * @param eventBus - The event bus instance
 * @param taskService - The task service instance
 * @param logger - The logger instance
 */
function setupTestDomainEventHandlers(
    eventBus: EventBus,
    taskService: TaskService,
    logger: Logger
): void {
    const correlationId = logger.getCurrentCorrelationId()

    // UI.TASK.CREATE -> TaskService.createTask
    eventBus.subscribe('UI.TASK.CREATE', async (event) => {
        logger.debug('Handling UI.TASK.CREATE event in TEST', {
            event: event.type,
            payload: event.payload
        })

        try {
            const task = await taskService.createTask(event.payload)

            logger.debug('Task created successfully via service in TEST', {
                taskId: task.id
            })
        } catch (error) {
            logger.error('Failed to create task via service in TEST', error as Error, {
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
        logger.debug('Handling UI.TASK.TOGGLE event in TEST', {
            event: event.type,
            payload: event.payload
        })

        try {
            const task = await taskService.toggleTask(event.payload.taskId)

            logger.debug('Task toggled successfully via service in TEST', {
                taskId: task.id,
                completed: task.completed
            })
        } catch (error) {
            logger.error('Failed to toggle task via service in TEST', error as Error, {
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
        logger.debug('Handling UI.TASK.DELETE event in TEST', {
            event: event.type,
            payload: event.payload
        })

        try {
            await taskService.deleteTask(event.payload.taskId)

            logger.debug('Task deleted successfully via service in TEST', {
                taskId: event.payload.taskId
            })
        } catch (error) {
            logger.error('Failed to delete task via service in TEST', error as Error, {
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
        logger.debug('Handling UI.TASK.LOAD_ALL event in TEST', {
            event: event.type
        })

        try {
            const tasks = await taskService.getAllTasks()

            // Publish success event with tasks
            await eventBus.publish('DOMAIN.TASK.LOADED', { tasks })

            logger.debug('Tasks loaded successfully via service in TEST', {
                taskCount: tasks.length
            })
        } catch (error) {
            logger.error('Failed to load tasks via service in TEST', error as Error)

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.LOAD_FAILED', {
                error: (error as Error).message
            })
        }
    })

    logger.debug('Test domain event handlers registered', {
        handlers: ['UI.TASK.CREATE', 'UI.TASK.TOGGLE', 'UI.TASK.DELETE', 'UI.TASK.LOAD_ALL'],
        environment: 'TEST',
        correlationId
    })
}

/**
 * Reset domain configuration for testing
 * 
 * Clears all data and resets event handlers.
 * Used between test scenarios to ensure clean state.
 */
export function resetTestTaskDomainConfig(config: TaskDomainConfig): void {
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
    setupTestDomainEventHandlers(config.eventBus, config.taskService, logger)

    logger.debug('Task domain configuration reset complete')
}

/**
 * Test-specific configuration utilities
 */
export class TestConfigUtils {
    /**
     * Create isolated test configuration
     * 
     * Creates a completely isolated configuration for individual tests
     * that won't interfere with other tests.
     */
    public static createIsolatedTestConfig(): TaskDomainConfig {
        // Create fresh instances for complete isolation
        const logger = new (Logger as any)() // Create new instance
        const eventBus = new (EventBus as any)() // Create new instance
        const taskRepository = new MemoryTaskRepository()
        const taskService = new TaskService(taskRepository, eventBus, logger)

        // Set up event handlers for this isolated config
        setupTestDomainEventHandlers(eventBus, taskService, logger)

        return {
            taskRepository,
            taskService,
            eventBus,
            logger
        }
    }

    /**
     * Enable error simulation for testing error handling
     * 
     * @param config - The test configuration
     * @param errorRate - Probability of error (0.0 to 1.0)
     */
    public static enableErrorSimulation(config: TaskDomainConfig, errorRate: number = 0.1): void {
        if (config.taskRepository instanceof MemoryTaskRepository) {
            config.taskRepository.enableErrorSimulation(true, errorRate)
        }
    }

    /**
     * Disable error simulation
     * 
     * @param config - The test configuration
     */
    public static disableErrorSimulation(config: TaskDomainConfig): void {
        if (config.taskRepository instanceof MemoryTaskRepository) {
            config.taskRepository.enableErrorSimulation(false)
        }
    }

    /**
     * Get test configuration metadata
     */
    public static getConfigMetadata() {
        return {
            environment: 'TEST',
            repository: 'MemoryTaskRepository',
            storage: 'memory',
            eventBus: 'EventBus',
            logger: 'Logger',
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Validate test environment setup
     */
    public static validateTestEnvironment(config: TaskDomainConfig): boolean {
        try {
            // Check that all required components are present
            if (!config.taskRepository || !config.taskService || !config.eventBus || !config.logger) {
                return false
            }

            // Check that repository is MemoryTaskRepository
            if (!(config.taskRepository instanceof MemoryTaskRepository)) {
                return false
            }

            // Check that service is properly configured
            if (!config.taskService) {
                return false
            }

            return true
        } catch (error) {
            return false
        }
    }
}