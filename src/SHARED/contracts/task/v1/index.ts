/**
 * Task Domain Contracts v1
 * 
 * This module exports all Zod schemas, TypeScript types, and validation utilities
 * for the task domain. It serves as the single source of truth for task-related
 * data structures and validation logic.
 * 
 * @version 1.0
 */

// Task schemas and types
export {
    TaskSchema,
    CreateTaskInputSchema,
    UpdateTaskCompletionSchema,
    DeleteTaskSchema,
    type Task,
    type CreateTaskInput,
    type UpdateTaskCompletion,
    type DeleteTask,
} from './TaskSchema'

// Storage schemas and utilities
export {
    StorageSchema,
    SerializedStorageSchema,
    createEmptyStorage,
    parseStorageData,
    serializeStorageData,
    type StorageData,
    type SerializedStorageData,
} from './StorageSchema'

// Validation utilities
export {
    validateTaskDescription,
    validateCreateTaskInput,
    validateTask,
    isEmptyOrWhitespace,
    sanitizeTaskDescription,
    isValidTaskId,
    getValidationErrorMessage,
    createDebouncedValidator,
    type ValidationResult,
} from './ValidationUtils'

// Import schemas for the registry
import {
    TaskSchema,
    CreateTaskInputSchema,
    UpdateTaskCompletionSchema,
    DeleteTaskSchema,
} from './TaskSchema'
import { StorageSchema, SerializedStorageSchema } from './StorageSchema'

/**
 * Contract version information
 */
export const CONTRACT_VERSION = '1.0' as const

/**
 * Schema registry for runtime schema access
 * Useful for dynamic validation and introspection
 */
export const SCHEMAS = {
    Task: TaskSchema,
    CreateTaskInput: CreateTaskInputSchema,
    UpdateTaskCompletion: UpdateTaskCompletionSchema,
    DeleteTask: DeleteTaskSchema,
    Storage: StorageSchema,
    SerializedStorage: SerializedStorageSchema,
} as const

/**
 * Common validation patterns and constants
 */
export const VALIDATION_CONSTANTS = {
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_DESCRIPTION_LENGTH: 1,
    STORAGE_VERSION: '1.0',
    DEBOUNCE_DELAY: 300,
} as const