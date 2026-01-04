import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LoggerFactory } from './logger/LoggerFactory'
import EventBus from './eventbus/EventBus'
import { EventHandlers } from './eventbus/EventHandlers'
import { UI_EVENTS, DOMAIN_EVENTS } from './eventbus/EventTypes'
import { CorrelationUtils } from './logger/CorrelationUtils'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('Shared Infrastructure Integration', () => {
    let logger: any
    let eventBus: EventBus
    let eventHandlers: EventHandlers

    beforeEach(() => {
        // Get fresh instances
        logger = LoggerFactory.getLogger()
        eventBus = EventBus.getInstance()
        eventHandlers = new EventHandlers(eventBus)

        // Clear state
        eventBus.clear()
        logger.clearLogs()
        vi.clearAllMocks()
        localStorageMock.getItem.mockReturnValue('')
    })

    it('should integrate logger with EventBus for correlated operations', async () => {
        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { })

        // Start a correlation for a UI action
        const correlationId = CorrelationUtils.startUIAction('TASK_CREATE', { description: 'Test task' })

        // Set up event handler that logs
        const handler = vi.fn((event) => {
            logger.info('Handling task creation', { taskId: event.payload.taskId })
        })

        eventHandlers.subscribe(UI_EVENTS.TASK.CREATE_REQUESTED, 'TaskCreationHandler', handler)

        // Publish event
        await eventHandlers.publish(UI_EVENTS.TASK.CREATE_REQUESTED, { description: 'Test task' })

        // End correlation
        CorrelationUtils.endCorrelation()

        // Verify handler was called
        expect(handler).toHaveBeenCalledTimes(1)

        // Verify logging occurred with correlation
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining(correlationId),
            expect.anything(),
            expect.anything()
        )

        consoleSpy.mockRestore()
    })

    it('should handle event publishing with automatic correlation', async () => {
        const handler = vi.fn()

        // Start correlation
        const correlationId = CorrelationUtils.startDomainOperation('TASK_PROCESSING')

        eventHandlers.subscribe(DOMAIN_EVENTS.TASK.CREATED, 'TaskCreatedHandler', handler)

        // Publish event - should automatically include correlation ID
        await eventHandlers.publish(DOMAIN_EVENTS.TASK.CREATED, {
            task: {
                id: 'test-id',
                description: 'Test task',
                completed: false,
                createdAt: new Date()
            }
        })

        CorrelationUtils.endCorrelation()

        // Verify handler received event with correlation ID
        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({
                task: expect.objectContaining({
                    id: 'test-id',
                    description: 'Test task'
                })
            }),
            correlationId
        )
    })

    it('should log event handler errors with correlation context', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const testError = new Error('Handler failed')

        // Start correlation
        const correlationId = CorrelationUtils.startUIAction('ERROR_TEST')

        // Create failing handler
        const failingHandler = vi.fn().mockRejectedValue(testError)

        eventHandlers.subscribe('TEST.ERROR.EVENT', 'FailingHandler', failingHandler)

        // Publish event - should handle error gracefully
        await eventHandlers.publish('TEST.ERROR.EVENT', { test: 'data' })

        CorrelationUtils.endCorrelation()

        // Verify error was logged with correlation context
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining(correlationId),
            expect.anything(),
            testError
        )

        errorSpy.mockRestore()
    })

    it('should support multiple event handlers with shared correlation', async () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()

        const correlationId = CorrelationUtils.startSystemOperation('MULTI_HANDLER_TEST')

        eventHandlers.subscribe('TEST.MULTI.EVENT', 'Handler1', handler1)
        eventHandlers.subscribe('TEST.MULTI.EVENT', 'Handler2', handler2)

        await eventHandlers.publish('TEST.MULTI.EVENT', { data: 'test' })

        CorrelationUtils.endCorrelation()

        // Both handlers should receive the same correlation ID
        expect(handler1).toHaveBeenCalledWith({ data: 'test' }, correlationId)
        expect(handler2).toHaveBeenCalledWith({ data: 'test' }, correlationId)
    })

    it('should export logs with event correlation data', () => {
        // Start correlation and perform operations
        const correlationId = CorrelationUtils.startUIAction('LOG_EXPORT_TEST')

        logger.info('Test operation started')
        logger.debug('Processing data', { step: 1 })
        logger.info('Test operation completed')

        CorrelationUtils.endCorrelation()

        // Export logs and verify correlation
        const logs = logger.exportLogs()
        const correlatedLogs = logger.getLogsByCorrelationId(correlationId)

        expect(logs.length).toBeGreaterThan(0)
        expect(correlatedLogs.length).toBe(4) // UI Action + 3 log messages
        expect(correlatedLogs.every(log => log.correlationId === correlationId)).toBe(true)
    })
})