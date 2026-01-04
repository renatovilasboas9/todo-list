export { default as EventBus, type Event, type EventHandler, type EventSubscription, type EventType } from './EventBus'
export { EventHandlers, default as DefaultEventHandlers } from './EventHandlers'
export * from './EventTypes'

// Convenience exports for common usage
export const eventBus = EventBus.getInstance()
export const eventHandlers = new EventHandlers(eventBus)