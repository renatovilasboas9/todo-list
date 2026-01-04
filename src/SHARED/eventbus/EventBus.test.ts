import { describe, it, expect, beforeEach, vi } from 'vitest'
import EventBus from './EventBus'
import { LoggerFactory } from '../logger/LoggerFactory'

// Mock the logger
vi.mock('../logger/LoggerFactory', () => ({
    LoggerFactory: {
        getLogger: vi.fn(() => ({
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            getCurrentCorrelationId: vi.fn(() => 'test-correlation-id')
        }))
    }
}))

describe('EventBus', () => {
    let eventBus: EventBus

    beforeEach(() => {
        // Reset singleton instance
        ; (EventBus as any).instance = null
        eventBus = EventBus.getInstance()
        eventBus.clear()
        vi.clearAllMocks()
    })

    it('should create a singleton instance', () => {
        const eventBus1 = EventBus.getInstance()
        const eventBus2 = EventBus.getInstance()
        expect(eventBus1).toBe(eventBus2)
    })

    it('should subscribe and publish events', async () => {
        const handler = vi.fn()
        const eventType = 'TEST.EVENT'
        const payload = { message: 'test' }

        eventBus.subscribe(eventType, handler)
        await eventBus.publish(eventType, payload)

        expect(handler).toHaveBeenCalledWith({
            type: eventType,
            payload,
            timestamp: expect.any(Date),
            correlationId: 'test-correlation-id'
        })
    })

    it('should handle multiple subscribers for the same event', async () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        const eventType = 'TEST.EVENT'
        const payload = { message: 'test' }

        eventBus.subscribe(eventType, handler1)
        eventBus.subscribe(eventType, handler2)
        await eventBus.publish(eventType, payload)

        expect(handler1).toHaveBeenCalledTimes(1)
        expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should unsubscribe handlers', async () => {
        const handler = vi.fn()
        const eventType = 'TEST.EVENT'
        const payload = { message: 'test' }

        const subscription = eventBus.subscribe(eventType, handler)
        subscription.unsubscribe()
        await eventBus.publish(eventType, payload)

        expect(handler).not.toHaveBeenCalled()
    })

    it('should handle async handlers', async () => {
        const handler = vi.fn().mockResolvedValue(undefined)
        const eventType = 'TEST.EVENT'
        const payload = { message: 'test' }

        eventBus.subscribe(eventType, handler)
        await eventBus.publish(eventType, payload)

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle handler errors gracefully', async () => {
        const error = new Error('Handler error')
        const handler = vi.fn().mockRejectedValue(error)
        const eventType = 'TEST.EVENT'
        const payload = { message: 'test' }

        eventBus.subscribe(eventType, handler)

        // Should not throw
        await expect(eventBus.publish(eventType, payload)).resolves.toBeUndefined()

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should subscribe to multiple event types', async () => {
        const handler = vi.fn()
        const eventTypes = ['TEST.EVENT1', 'TEST.EVENT2']
        const payload1 = { message: 'test1' }
        const payload2 = { message: 'test2' }

        eventBus.subscribeToMultiple(eventTypes, handler)
        await eventBus.publish(eventTypes[0], payload1)
        await eventBus.publish(eventTypes[1], payload2)

        expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should get registered event types', () => {
        const handler = vi.fn()

        eventBus.subscribe('TEST.EVENT1', handler)
        eventBus.subscribe('TEST.EVENT2', handler)

        const eventTypes = eventBus.getRegisteredEventTypes()
        expect(eventTypes).toContain('TEST.EVENT1')
        expect(eventTypes).toContain('TEST.EVENT2')
    })

    it('should get handler count for event type', () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        const eventType = 'TEST.EVENT'

        expect(eventBus.getHandlerCount(eventType)).toBe(0)

        eventBus.subscribe(eventType, handler1)
        expect(eventBus.getHandlerCount(eventType)).toBe(1)

        eventBus.subscribe(eventType, handler2)
        expect(eventBus.getHandlerCount(eventType)).toBe(2)
    })

    it('should clear all handlers', () => {
        const handler = vi.fn()

        eventBus.subscribe('TEST.EVENT1', handler)
        eventBus.subscribe('TEST.EVENT2', handler)

        expect(eventBus.getRegisteredEventTypes()).toHaveLength(2)

        eventBus.clear()

        expect(eventBus.getRegisteredEventTypes()).toHaveLength(0)
    })

    it('should handle publishing to non-existent event type', async () => {
        const eventType = 'NON.EXISTENT.EVENT'
        const payload = { message: 'test' }

        // Should not throw
        await expect(eventBus.publish(eventType, payload)).resolves.toBeUndefined()
    })

    it('should include correlation ID in events', async () => {
        const handler = vi.fn()
        const eventType = 'TEST.EVENT'
        const payload = { message: 'test' }
        const customCorrelationId = 'custom-correlation-id'

        eventBus.subscribe(eventType, handler)
        await eventBus.publish(eventType, payload, customCorrelationId)

        expect(handler).toHaveBeenCalledWith({
            type: eventType,
            payload,
            timestamp: expect.any(Date),
            correlationId: customCorrelationId
        })
    })
})