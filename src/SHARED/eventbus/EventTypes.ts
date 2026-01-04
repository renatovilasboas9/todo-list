// UI Events - User interface actions
export const UI_EVENTS = {
    TASK: {
        CREATE_REQUESTED: 'UI.TASK.CREATE_REQUESTED',
        TOGGLE_REQUESTED: 'UI.TASK.TOGGLE_REQUESTED',
        DELETE_REQUESTED: 'UI.TASK.DELETE_REQUESTED',
        INPUT_CHANGED: 'UI.TASK.INPUT_CHANGED',
        INPUT_FOCUSED: 'UI.TASK.INPUT_FOCUSED',
        INPUT_SUBMITTED: 'UI.TASK.INPUT_SUBMITTED'
    }
} as const

// Domain Events - Business logic operations
export const DOMAIN_EVENTS = {
    TASK: {
        CREATED: 'DOMAIN.TASK.CREATED',
        UPDATED: 'DOMAIN.TASK.UPDATED',
        DELETED: 'DOMAIN.TASK.DELETED',
        TOGGLED: 'DOMAIN.TASK.TOGGLED',
        VALIDATION_FAILED: 'DOMAIN.TASK.VALIDATION_FAILED',
        OPERATION_FAILED: 'DOMAIN.TASK.OPERATION_FAILED'
    }
} as const

// System Events - Infrastructure and system-level operations
export const SYSTEM_EVENTS = {
    STORAGE: {
        SAVE_REQUESTED: 'SYSTEM.STORAGE.SAVE_REQUESTED',
        SAVE_COMPLETED: 'SYSTEM.STORAGE.SAVE_COMPLETED',
        SAVE_FAILED: 'SYSTEM.STORAGE.SAVE_FAILED',
        LOAD_REQUESTED: 'SYSTEM.STORAGE.LOAD_REQUESTED',
        LOAD_COMPLETED: 'SYSTEM.STORAGE.LOAD_COMPLETED',
        LOAD_FAILED: 'SYSTEM.STORAGE.LOAD_FAILED'
    },
    APPLICATION: {
        INITIALIZED: 'SYSTEM.APPLICATION.INITIALIZED',
        ERROR: 'SYSTEM.APPLICATION.ERROR',
        SHUTDOWN: 'SYSTEM.APPLICATION.SHUTDOWN'
    }
} as const

// Event payload type definitions
export interface TaskCreateRequestedPayload {
    description: string
}

export interface TaskToggleRequestedPayload {
    taskId: string
}

export interface TaskDeleteRequestedPayload {
    taskId: string
}

export interface TaskInputChangedPayload {
    value: string
    isValid: boolean
}

export interface TaskCreatedPayload {
    task: {
        id: string
        description: string
        completed: boolean
        createdAt: Date
    }
}

export interface TaskUpdatedPayload {
    taskId: string
    changes: Partial<{
        description: string
        completed: boolean
    }>
}

export interface TaskDeletedPayload {
    taskId: string
}

export interface TaskToggledPayload {
    taskId: string
    completed: boolean
}

export interface ValidationFailedPayload {
    field: string
    value: any
    errors: string[]
}

export interface OperationFailedPayload {
    operation: string
    error: Error
    context?: Record<string, unknown>
}

export interface StorageOperationPayload {
    operation: 'save' | 'load'
    data?: any
    error?: Error
}

export interface ApplicationErrorPayload {
    error: Error
    context?: Record<string, unknown>
}

// Type helpers for event payloads
export type UIEventPayloads = {
    [UI_EVENTS.TASK.CREATE_REQUESTED]: TaskCreateRequestedPayload
    [UI_EVENTS.TASK.TOGGLE_REQUESTED]: TaskToggleRequestedPayload
    [UI_EVENTS.TASK.DELETE_REQUESTED]: TaskDeleteRequestedPayload
    [UI_EVENTS.TASK.INPUT_CHANGED]: TaskInputChangedPayload
    [UI_EVENTS.TASK.INPUT_FOCUSED]: {}
    [UI_EVENTS.TASK.INPUT_SUBMITTED]: { value: string }
}

export type DomainEventPayloads = {
    [DOMAIN_EVENTS.TASK.CREATED]: TaskCreatedPayload
    [DOMAIN_EVENTS.TASK.UPDATED]: TaskUpdatedPayload
    [DOMAIN_EVENTS.TASK.DELETED]: TaskDeletedPayload
    [DOMAIN_EVENTS.TASK.TOGGLED]: TaskToggledPayload
    [DOMAIN_EVENTS.TASK.VALIDATION_FAILED]: ValidationFailedPayload
    [DOMAIN_EVENTS.TASK.OPERATION_FAILED]: OperationFailedPayload
}

export type SystemEventPayloads = {
    [SYSTEM_EVENTS.STORAGE.SAVE_REQUESTED]: StorageOperationPayload
    [SYSTEM_EVENTS.STORAGE.SAVE_COMPLETED]: StorageOperationPayload
    [SYSTEM_EVENTS.STORAGE.SAVE_FAILED]: StorageOperationPayload
    [SYSTEM_EVENTS.STORAGE.LOAD_REQUESTED]: StorageOperationPayload
    [SYSTEM_EVENTS.STORAGE.LOAD_COMPLETED]: StorageOperationPayload
    [SYSTEM_EVENTS.STORAGE.LOAD_FAILED]: StorageOperationPayload
    [SYSTEM_EVENTS.APPLICATION.INITIALIZED]: {}
    [SYSTEM_EVENTS.APPLICATION.ERROR]: ApplicationErrorPayload
    [SYSTEM_EVENTS.APPLICATION.SHUTDOWN]: {}
}

// All event types union
export type AllEventTypes = keyof UIEventPayloads | keyof DomainEventPayloads | keyof SystemEventPayloads
export type AllEventPayloads = UIEventPayloads & DomainEventPayloads & SystemEventPayloads