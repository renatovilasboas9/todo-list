import { LoggerFactory } from '../logger/LoggerFactory'

export type EventType = string

export interface Event<T = any> {
    type: EventType
    payload: T
    timestamp: Date
    correlationId?: string
}

export type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>

export interface EventSubscription {
    unsubscribe: () => void
}

class EventBus {
    private static instance: EventBus
    private handlers: Map<EventType, Set<EventHandler>> = new Map()
    private logger = LoggerFactory.getLogger()

    private constructor() { }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus()
        }
        return EventBus.instance
    }

    /**
     * Subscribe to events of a specific type
     */
    public subscribe<T = any>(eventType: EventType, handler: EventHandler<T>): EventSubscription {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set())
        }

        const handlers = this.handlers.get(eventType)!
        handlers.add(handler)

        this.logger.debug(`Event handler subscribed`, {
            eventType,
            handlerCount: handlers.size
        })

        return {
            unsubscribe: () => {
                handlers.delete(handler)
                if (handlers.size === 0) {
                    this.handlers.delete(eventType)
                }
                this.logger.debug(`Event handler unsubscribed`, {
                    eventType,
                    handlerCount: handlers.size
                })
            }
        }
    }

    /**
     * Publish an event to all subscribers
     */
    public async publish<T = any>(eventType: EventType, payload: T, correlationId?: string): Promise<void> {
        const event: Event<T> = {
            type: eventType,
            payload,
            timestamp: new Date(),
            correlationId: correlationId || this.logger.getCurrentCorrelationId() || undefined
        }

        const handlers = this.handlers.get(eventType)
        if (!handlers || handlers.size === 0) {
            this.logger.debug(`No handlers for event`, {
                eventType,
                payload
            })
            return
        }

        this.logger.info(`Publishing event`, {
            eventType,
            handlerCount: handlers.size,
            correlationId: event.correlationId,
            payload
        })

        // Execute all handlers
        const promises: Promise<void>[] = []
        for (const handler of handlers) {
            try {
                const result = handler(event)
                if (result instanceof Promise) {
                    promises.push(result)
                }
            } catch (error) {
                this.logger.error(`Event handler failed synchronously`, error as Error, {
                    eventType,
                    correlationId: event.correlationId
                })
            }
        }

        // Wait for all async handlers to complete
        if (promises.length > 0) {
            try {
                await Promise.allSettled(promises)
            } catch (error) {
                this.logger.error(`Event handler failed asynchronously`, error as Error, {
                    eventType,
                    correlationId: event.correlationId
                })
            }
        }

        this.logger.debug(`Event published successfully`, {
            eventType,
            handlerCount: handlers.size,
            correlationId: event.correlationId
        })
    }

    /**
     * Subscribe to multiple event types with a single handler
     */
    public subscribeToMultiple<T = any>(eventTypes: EventType[], handler: EventHandler<T>): EventSubscription {
        const subscriptions = eventTypes.map(eventType => this.subscribe(eventType, handler))

        return {
            unsubscribe: () => {
                subscriptions.forEach(sub => sub.unsubscribe())
            }
        }
    }

    /**
     * Subscribe to events matching a pattern (simple wildcard support)
     */
    public subscribeToPattern<T = any>(pattern: string, handler: EventHandler<T>): EventSubscription {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        const matchingTypes = Array.from(this.handlers.keys()).filter(type => regex.test(type))

        // Subscribe to existing matching types
        const subscriptions = matchingTypes.map(eventType => this.subscribe(eventType, handler))

        // Store pattern for future event types
        const patternHandler = (eventType: EventType) => {
            if (regex.test(eventType)) {
                subscriptions.push(this.subscribe(eventType, handler))
            }
        }

        return {
            unsubscribe: () => {
                subscriptions.forEach(sub => sub.unsubscribe())
            }
        }
    }

    /**
     * Get all registered event types
     */
    public getRegisteredEventTypes(): EventType[] {
        return Array.from(this.handlers.keys())
    }

    /**
     * Get handler count for an event type
     */
    public getHandlerCount(eventType: EventType): number {
        return this.handlers.get(eventType)?.size || 0
    }

    /**
     * Clear all handlers (useful for testing)
     */
    public clear(): void {
        this.handlers.clear()
        this.logger.debug('EventBus cleared')
    }
}

export default EventBus