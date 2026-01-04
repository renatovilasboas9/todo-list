import { describe, it, expect, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import {
    validateTaskDescription,
    validateCreateTaskInput,
    validateTask,
    isEmptyOrWhitespace,
    sanitizeTaskDescription,
    isValidTaskId,
    getValidationErrorMessage,
    createDebouncedValidator,
} from './ValidationUtils.js'
import { z } from 'zod'

describe('ValidationUtils', () => {
    describe('validateTaskDescription', () => {
        it('should validate valid description', () => {
            const result = validateTaskDescription('Valid task description')
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject empty description', () => {
            const result = validateTaskDescription('')
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Task description cannot be empty')
        })

        it('should reject whitespace-only description', () => {
            const result = validateTaskDescription('   ')
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Task description cannot be empty')
        })

        it('should reject description longer than 500 characters', () => {
            const longDescription = 'a'.repeat(501)
            const result = validateTaskDescription(longDescription)
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Task description cannot exceed 500 characters')
        })

        it('should warn about long descriptions', () => {
            const longDescription = 'a'.repeat(450)
            const result = validateTaskDescription(longDescription)
            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Task description is getting long')
        })

        it('should warn about leading/trailing spaces', () => {
            const result = validateTaskDescription('  task with spaces  ')
            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Leading or trailing spaces will be removed')
        })
    })

    describe('validateCreateTaskInput', () => {
        it('should validate valid input', () => {
            const input = { description: 'Valid task' }
            const result = validateCreateTaskInput(input)
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject invalid input', () => {
            const input = { description: '' }
            const result = validateCreateTaskInput(input)
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('should handle missing description field', () => {
            const input = {}
            const result = validateCreateTaskInput(input)
            expect(result.isValid).toBe(false)
        })
    })

    describe('validateTask', () => {
        const validTask = {
            id: uuidv4(),
            description: 'Test task',
            completed: false,
            createdAt: new Date(),
        }

        it('should validate valid task', () => {
            const result = validateTask(validTask)
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject task with invalid id', () => {
            const invalidTask = { ...validTask, id: 'invalid-uuid' }
            const result = validateTask(invalidTask)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(err => err.includes('id'))).toBe(true)
        })

        it('should reject task with missing fields', () => {
            const incompleteTask = { description: 'Test' }
            const result = validateTask(incompleteTask)
            expect(result.isValid).toBe(false)
        })
    })

    describe('isEmptyOrWhitespace', () => {
        it('should return true for empty string', () => {
            expect(isEmptyOrWhitespace('')).toBe(true)
        })

        it('should return true for whitespace-only string', () => {
            expect(isEmptyOrWhitespace('   ')).toBe(true)
            expect(isEmptyOrWhitespace('\t\n')).toBe(true)
        })

        it('should return false for non-empty string', () => {
            expect(isEmptyOrWhitespace('test')).toBe(false)
            expect(isEmptyOrWhitespace(' test ')).toBe(false)
        })
    })

    describe('sanitizeTaskDescription', () => {
        it('should trim whitespace', () => {
            expect(sanitizeTaskDescription('  test  ')).toBe('test')
        })

        it('should limit length to 500 characters', () => {
            const longString = 'a'.repeat(600)
            const result = sanitizeTaskDescription(longString)
            expect(result).toHaveLength(500)
        })

        it('should handle empty string', () => {
            expect(sanitizeTaskDescription('')).toBe('')
        })
    })

    describe('isValidTaskId', () => {
        it('should return true for valid UUID', () => {
            const validId = uuidv4()
            expect(isValidTaskId(validId)).toBe(true)
        })

        it('should return false for invalid UUID', () => {
            expect(isValidTaskId('invalid-uuid')).toBe(false)
            expect(isValidTaskId('')).toBe(false)
            expect(isValidTaskId('123')).toBe(false)
        })
    })

    describe('getValidationErrorMessage', () => {
        it('should return custom message for description too_small error', () => {
            const error = new z.ZodError([
                {
                    code: 'too_small',
                    minimum: 1,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at least 1 character(s)',
                    path: ['description'],
                },
            ])

            const message = getValidationErrorMessage(error)
            expect(message).toBe('Please enter a task description')
        })

        it('should return custom message for description too_big error', () => {
            const error = new z.ZodError([
                {
                    code: 'too_big',
                    maximum: 500,
                    type: 'string',
                    inclusive: true,
                    exact: false,
                    message: 'String must contain at most 500 character(s)',
                    path: ['description'],
                },
            ])

            const message = getValidationErrorMessage(error)
            expect(message).toBe('Task description is too long (maximum 500 characters)')
        })

        it('should return custom message for UUID validation error', () => {
            const error = new z.ZodError([
                {
                    code: 'invalid_string',
                    validation: 'uuid',
                    message: 'Invalid uuid',
                    path: ['id'],
                },
            ])

            const message = getValidationErrorMessage(error)
            expect(message).toBe('Invalid task ID format')
        })

        it('should return default message for unknown error', () => {
            const error = new z.ZodError([
                {
                    code: 'custom',
                    message: 'Custom error',
                    path: [],
                },
            ])

            const message = getValidationErrorMessage(error)
            expect(message).toBe('Custom error')
        })
    })

    describe('createDebouncedValidator', () => {
        it('should debounce validation calls', async () => {
            const mockValidator = vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
            const mockCallback = vi.fn()

            const debouncedValidator = createDebouncedValidator(mockValidator, 100)

            // Call multiple times quickly
            debouncedValidator('test1', mockCallback)
            debouncedValidator('test2', mockCallback)
            debouncedValidator('test3', mockCallback)

            // Should not have called validator yet
            expect(mockValidator).not.toHaveBeenCalled()

            // Wait for debounce delay
            await new Promise(resolve => setTimeout(resolve, 150))

            // Should have called validator only once with the last value
            expect(mockValidator).toHaveBeenCalledTimes(1)
            expect(mockValidator).toHaveBeenCalledWith('test3')
            expect(mockCallback).toHaveBeenCalledTimes(1)
        })
    })
})