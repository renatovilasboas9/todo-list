import { LocalStorageTaskRepository } from '../domains/task/repositories/LocalStorageTaskRepository'
import { TaskRepository } from '../domains/task/repositories/TaskRepository'
import { TaskService } from '../domains/task/services/TaskService'
import EventBus from '../SHARED/eventbus/EventBus'
import Logger from '../SHARED/logger/Logger'

/**
 * Production Environment Configuration
 * 
 * Composition root for PROD environment that configures:
 * - LocalStorageTaskRepository for persistent browser storage
 * - TaskService with business logic
 * - EventBus handlers for domain events
 * - Logger configuration for production scenarios
 * 
 * This configuration ensures production deployment uses persistent storage
 * and proper event handling with comprehensive logging.
 */

export interface TaskDomainConfig {
    taskRepository: TaskRepository
    taskService: TaskService
    eventBus: EventBus
    logger: Logger
}

/**
 * Create and configure the task domain for PROD environment
 * 
 * @returns Configured domain dependencies for production
 */
export async function createProdTaskDomainConfig(): Promise<TaskDomainConfig> {
    const logger = Logger.getInstance()
    const correlationId = logger.startCorrelation()

    try {
        logger.info('Configuring task domain for PROD environment', {
            environment: 'PROD',
            correlationId
        })

        const eventBus = EventBus.getInstance()
        const taskRepository = new LocalStorageTaskRepository()
        const taskService = new TaskService(taskRepository, eventBus, logger)

        // Test repository connectivity and initialize if needed
        try {
            await taskRepository.findAll()
            logger.debug('LocalStorage repository connectivity verified', {
                environment: 'PROD',
                correlationId
            })
        } catch (error) {
            logger.warn('LocalStorage repository initialization issue, will retry on first use', {
                environment: 'PROD',
                error: (error as Error).message,
                correlationId
            })
        }

        logger.info('Task domain configured for PROD environment', {
            environment: 'PROD',
            repository: 'LocalStorageTaskRepository',
            service: 'TaskService',
            eventBus: 'EventBus',
            correlationId
        })

        // Register domain event handlers
        await setupProdDomainEventHandlers(eventBus, taskService, logger)

        return {
            taskRepository,
            taskService,
            eventBus,
            logger
        }

    } catch (error) {
        logger.error('Failed to configure task domain for PROD environment', error as Error, {
            environment: 'PROD',
            correlationId
        })
        throw error
    } finally {
        logger.endCorrelation()
    }
}

/**
 * Set up event handlers for task domain in production environment
 * 
 * Connects UI events to service operations through the EventBus.
 * This establishes the event-driven architecture pattern with
 * production-specific error handling and monitoring.
 * 
 * @param eventBus - The event bus instance
 * @param taskService - The task service instance
 * @param logger - The logger instance
 */
async function setupProdDomainEventHandlers(
    eventBus: EventBus,
    taskService: TaskService,
    logger: Logger
): Promise<void> {
    const correlationId = logger.getCurrentCorrelationId()

    // UI.TASK.CREATE -> TaskService.createTask
    eventBus.subscribe('UI.TASK.CREATE', async (event) => {
        const handlerCorrelationId = logger.startCorrelation()

        logger.debug('Handling UI.TASK.CREATE event in PROD', {
            event: event.type,
            payload: event.payload,
            correlationId: handlerCorrelationId
        })

        try {
            const task = await taskService.createTask(event.payload)

            // Publish success event
            await eventBus.publish('DOMAIN.TASK.CREATED', {
                taskId: task.id,
                description: task.description
            }, handlerCorrelationId)

            logger.info('Task created successfully via service in PROD', {
                taskId: task.id,
                correlationId: handlerCorrelationId
            })
        } catch (error) {
            logger.error('Failed to create task via service in PROD', error as Error, {
                payload: event.payload,
                correlationId: handlerCorrelationId
            })

            // Publish error event with detailed context
            await eventBus.publish('DOMAIN.TASK.CREATE_FAILED', {
                error: (error as Error).message,
                input: event.payload,
                timestamp: new Date().toISOString()
            }, handlerCorrelationId)

            // Publish system error for monitoring
            await eventBus.publish('SYSTEM.ERROR', {
                source: 'TaskService.createTask',
                message: (error as Error).message,
                context: { payload: event.payload }
            }, handlerCorrelationId)
        } finally {
            logger.endCorrelation()
        }
    })

    // UI.TASK.TOGGLE -> TaskService.toggleTask
    eventBus.subscribe('UI.TASK.TOGGLE', async (event) => {
        const handlerCorrelationId = logger.startCorrelation()

        logger.debug('Handling UI.TASK.TOGGLE event in PROD', {
            event: event.type,
            payload: event.payload,
            correlationId: handlerCorrelationId
        })

        try {
            const task = await taskService.toggleTask(event.payload.taskId)

            // Publish success event
            const eventType = task.completed ? 'DOMAIN.TASK.COMPLETED' : 'DOMAIN.TASK.UNCOMPLETED'
            await eventBus.publish(eventType, {
                taskId: task.id,
                completed: task.completed
            }, handlerCorrelationId)

            logger.info('Task toggled successfully via service in PROD', {
                taskId: task.id,
                completed: task.completed,
                correlationId: handlerCorrelationId
            })
        } catch (error) {
            logger.error('Failed to toggle task via service in PROD', error as Error, {
                taskId: event.payload.taskId,
                correlationId: handlerCorrelationId
            })

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.TOGGLE_FAILED', {
                error: (error as Error).message,
                taskId: event.payload.taskId,
                timestamp: new Date().toISOString()
            }, handlerCorrelationId)

            // Publish system error for monitoring
            await eventBus.publish('SYSTEM.ERROR', {
                source: 'TaskService.toggleTask',
                message: (error as Error).message,
                context: { taskId: event.payload.taskId }
            }, handlerCorrelationId)
        } finally {
            logger.endCorrelation()
        }
    })

    // UI.TASK.DELETE -> TaskService.deleteTask
    eventBus.subscribe('UI.TASK.DELETE', async (event) => {
        const handlerCorrelationId = logger.startCorrelation()

        logger.debug('Handling UI.TASK.DELETE event in PROD', {
            event: event.type,
            payload: event.payload,
            correlationId: handlerCorrelationId
        })

        try {
            await taskService.deleteTask(event.payload.taskId)

            // Publish success event
            await eventBus.publish('DOMAIN.TASK.DELETED', {
                taskId: event.payload.taskId
            }, handlerCorrelationId)

            logger.info('Task deleted successfully via service in PROD', {
                taskId: event.payload.taskId,
                correlationId: handlerCorrelationId
            })
        } catch (error) {
            logger.error('Failed to delete task via service in PROD', error as Error, {
                taskId: event.payload.taskId,
                correlationId: handlerCorrelationId
            })

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.DELETE_FAILED', {
                error: (error as Error).message,
                taskId: event.payload.taskId,
                timestamp: new Date().toISOString()
            }, handlerCorrelationId)

            // Publish system error for monitoring
            await eventBus.publish('SYSTEM.ERROR', {
                source: 'TaskService.deleteTask',
                message: (error as Error).message,
                context: { taskId: event.payload.taskId }
            }, handlerCorrelationId)
        } finally {
            logger.endCorrelation()
        }
    })

    // UI.TASK.LOAD_ALL -> TaskService.getAllTasks
    eventBus.subscribe('UI.TASK.LOAD_ALL', async (event) => {
        const handlerCorrelationId = logger.startCorrelation()

        logger.debug('Handling UI.TASK.LOAD_ALL event in PROD', {
            event: event.type,
            correlationId: handlerCorrelationId
        })

        try {
            const tasks = await taskService.getAllTasks()

            // Publish success event with tasks
            await eventBus.publish('DOMAIN.TASK.LOADED', {
                tasks,
                count: tasks.length,
                timestamp: new Date().toISOString()
            }, handlerCorrelationId)

            logger.info('Tasks loaded successfully via service in PROD', {
                taskCount: tasks.length,
                correlationId: handlerCorrelationId
            })
        } catch (error) {
            logger.error('Failed to load tasks via service in PROD', error as Error, {
                correlationId: handlerCorrelationId
            })

            // Publish error event
            await eventBus.publish('DOMAIN.TASK.LOAD_FAILED', {
                error: (error as Error).message,
                timestamp: new Date().toISOString()
            }, handlerCorrelationId)

            // Publish system error for monitoring
            await eventBus.publish('SYSTEM.ERROR', {
                source: 'TaskService.getAllTasks',
                message: (error as Error).message,
                context: {}
            }, handlerCorrelationId)
        } finally {
            logger.endCorrelation()
        }
    })

    logger.info('Production domain event handlers registered', {
        handlers: ['UI.TASK.CREATE', 'UI.TASK.TOGGLE', 'UI.TASK.DELETE', 'UI.TASK.LOAD_ALL'],
        environment: 'PROD',
        correlationId
    })
}

/**
 * Production-specific configuration utilities
 */
export class ProdConfigUtils {
    /**
     * Validate production environment requirements
     * 
     * Checks that all required production dependencies are available
     * and properly configured.
     */
    public static async validateProdEnvironment(): Promise<boolean> {
        const logger = Logger.getInstance()

        try {
            // Check localStorage availability
            if (typeof localStorage === 'undefined') {
                logger.error('localStorage not available in production environment')
                return false
            }

            // Test localStorage functionality
            const testKey = '__task_manager_test__'
            localStorage.setItem(testKey, 'test')
            const testValue = localStorage.getItem(testKey)
            localStorage.removeItem(testKey)

            if (testValue !== 'test') {
                logger.error('localStorage not functioning correctly in production environment')
                return false
            }

            logger.info('Production environment validation passed')
            return true

        } catch (error) {
            logger.error('Production environment validation failed', error as Error)
            return false
        }
    }

    /**
     * Get production configuration metadata
     */
    public static getConfigMetadata() {
        return {
            environment: 'PROD',
            repository: 'LocalStorageTaskRepository',
            storage: 'localStorage',
            eventBus: 'EventBus',
            logger: 'Logger',
            timestamp: new Date().toISOString()
        }
    }
}