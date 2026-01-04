import EventBus, { EventHandler, EventSubscription } from './EventBus'
import { LoggerFactory } from '../logger/LoggerFactory'
import { CorrelationUtils } from '../logger/CorrelationUtils'

export class EventHandlers {
    private eventBus: EventBus
    private logger = LoggerFactory.getLogger()
    private subscriptions: EventSubscription[] = []

    constructor(eventBus?: EventBus) {
        this.eventBus = eventBus || EventBus.getInstance()
    }

    /**
     * Create a handler that automatically manages correlation and logging
     */
    public createHandler<T = any>(
        handlerName: string,
        handler: (payload: T, correlationId?: string) => void | Promise<void>
    ): EventHandler<T> {
        return async (event) => {
            const correlationId = event.correlationId || CorrelationUtils.getCurrentCorrelationId()

            this.logger.debug(`Handling event`, {
                eventType: event.type,
                handlerName,
                correlationId,
                payload: event.payload
            })

            try {
                await handler(event.payload, correlationId)

                this.logger.debug(`Event handled successfully`, {
                    eventType: event.type,
                    handlerName,
                    correlationId
                })
            } catch (error) {
                this.logger.error(`Event handler failed`, error as Error, {
                    eventType: event.type,
                    handlerName,
                    correlationId,
                    payload: event.payload
                })
                throw error
            }
        }
    }

    /**
     * Subscribe to an event with automatic correlation and logging
     */
    public subscribe<T = any>(
        eventType: string,
        handlerName: string,
        handler: (payload: T, correlationId?: string) => void | Promise<void>
    ): EventSubscription {
        const wrappedHandler = this.createHandler(handlerName, handler)
        const subscription = this.eventBus.subscribe(eventType, wrappedHandler)

        this.subscriptions.push(subscription)

        this.logger.debug(`Event handler registered`, {
            eventType,
            handlerName
        })

        return subscription
    }

    /**
     * Subscribe to multiple events with the same handler
     */
    public subscribeToMultiple<T = any>(
        eventTypes: string[],
        handlerName: string,
        handler: (payload: T, correlationId?: string) => void | Promise<void>
    ): EventSubscription {
        const wrappedHandler = this.createHandler(handlerName, handler)
        const subscription = this.eventBus.subscribeToMultiple(eventTypes, wrappedHandler)

        this.subscriptions.push(subscription)

        this.logger.debug(`Multi-event handler registered`, {
            eventTypes,
            handlerName
        })

        return subscription
    }

    /**
     * Subscribe to events matching a pattern
     */
    public subscribeToPattern<T = any>(
        pattern: string,
        handlerName: string,
        handler: (payload: T, correlationId?: string) => void | Promise<void>
    ): EventSubscription {
        const wrappedHandler = this.createHandler(handlerName, handler)
        const subscription = this.eventBus.subscribeToPattern(pattern, wrappedHandler)

        this.subscriptions.push(subscription)

        this.logger.debug(`Pattern event handler registered`, {
            pattern,
            handlerName
        })

        return subscription
    }

    /**
     * Publish an event with automatic correlation
     */
    public async publish<T = any>(eventType: string, payload: T): Promise<void> {
        const correlationId = CorrelationUtils.getCurrentCorrelationId()

        this.logger.debug(`Publishing event`, {
            eventType,
            correlationId,
            payload
        })

        await this.eventBus.publish(eventType, payload, correlationId)
    }

    /**
     * Unsubscribe from all registered handlers
     */
    public unsubscribeAll(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe())
        this.subscriptions = []

        this.logger.debug('All event handlers unsubscribed')
    }

    /**
     * Get the underlying event bus instance
     */
    public getEventBus(): EventBus {
        return this.eventBus
    }
}

export default EventHandlers