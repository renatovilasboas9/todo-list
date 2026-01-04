import { z } from 'zod'
import { TaskSchema, CreateTaskInputSchema } from './TaskSchema'

/**
 * Validation utilities for inline validation in UI components
 * 
 * These utilities provide real-time validation feedback for form inputs
 * and help create user-friendly error messages.
 */

/**
 * Validation result interface for UI feedback
 */
export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * Validates task description input in real-time
 * Used for inline validation in task input components
 */
export function validateTaskDescription(description: string): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
    }

    try {
        // Use the schema's description validation
        TaskSchema.shape.description.parse(description)
    } catch (error) {
        result.isValid = false

        if (error instanceof z.ZodError) {
            result.errors = error.errors.map((err) => err.message)
        } else {
            result.errors = ['Invalid task description']
        }
    }

    // Add warnings for edge cases
    if (description.length > 400) {
        result.warnings.push('Task description is getting long')
    }

    if (description.trim() !== description && description.length > 0) {
        result.warnings.push('Leading or trailing spaces will be removed')
    }

    return result
}

/**
 * Validates complete task creation input
 */
export function validateCreateTaskInput(input: unknown): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
    }

    try {
        CreateTaskInputSchema.parse(input)
    } catch (error) {
        result.isValid = false

        if (error instanceof z.ZodError) {
            result.errors = error.errors.map((err) => {
                const path = err.path.join('.')
                return path ? `${path}: ${err.message}` : err.message
            })
        } else {
            result.errors = ['Invalid task input']
        }
    }

    return result
}

/**
 * Validates a complete task object
 */
export function validateTask(task: unknown): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
    }

    try {
        TaskSchema.parse(task)
    } catch (error) {
        result.isValid = false

        if (error instanceof z.ZodError) {
            result.errors = error.errors.map((err) => {
                const path = err.path.join('.')
                return path ? `${path}: ${err.message}` : err.message
            })
        } else {
            result.errors = ['Invalid task object']
        }
    }

    return result
}

/**
 * Checks if a string is empty or contains only whitespace
 * Useful for preventing empty task creation
 */
export function isEmptyOrWhitespace(value: string): boolean {
    return !value || value.trim().length === 0
}

/**
 * Sanitizes task description input
 * Trims whitespace and ensures valid length
 */
export function sanitizeTaskDescription(description: string): string {
    return description.trim().slice(0, 500)
}

/**
 * Validates UUID format for task IDs
 */
export function isValidTaskId(id: string): boolean {
    try {
        TaskSchema.shape.id.parse(id)
        return true
    } catch {
        return false
    }
}

/**
 * Creates user-friendly error messages for common validation failures
 */
export function getValidationErrorMessage(error: z.ZodError): string {
    const firstError = error.errors[0]

    if (!firstError) {
        return 'Validation failed'
    }

    // Customize messages for better UX
    switch (firstError.code) {
        case 'too_small':
            if (firstError.path.includes('description')) {
                return 'Please enter a task description'
            }
            return 'Value is too short'

        case 'too_big':
            if (firstError.path.includes('description')) {
                return 'Task description is too long (maximum 500 characters)'
            }
            return 'Value is too long'

        case 'invalid_string':
            if (firstError.validation === 'uuid') {
                return 'Invalid task ID format'
            }
            return 'Invalid text format'

        default:
            return firstError.message
    }
}

/**
 * Debounced validation for real-time input validation
 * Returns a function that delays validation until user stops typing
 */
export function createDebouncedValidator(
    validator: (value: string) => ValidationResult,
    delay: number = 300
): (value: string, callback: (result: ValidationResult) => void) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (value: string, callback: (result: ValidationResult) => void) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            const result = validator(value)
            callback(result)
        }, delay)
    }
}