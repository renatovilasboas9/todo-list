import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
    TaskSchema,
    CreateTaskInputSchema,
    validateTaskDescription,
    isEmptyOrWhitespace,
} from './index.js'

/**
 * Property-Based Tests for Task Data Model Validation
 * 
 * These tests use fast-check to generate random inputs and verify
 * that validation properties hold across all possible inputs.
 */

describe('Task Validation Properties', () => {
    /**
     * **Feature: task-manager, Property 2: Invalid Task Rejection**
     * **Validates: Requirements 1.2**
     * 
     * For any string composed entirely of whitespace or empty content,
     * attempting to add it should be rejected and the task list should remain unchanged
     */
    describe('Property 2: Invalid Task Rejection', () => {
        it('should reject any empty or whitespace-only string', () => {
            fc.assert(
                fc.property(
                    // Generate strings that are empty or contain only whitespace characters
                    fc.oneof(
                        fc.constant(''), // Empty string
                        fc.stringMatching(/^\s+$/), // Whitespace-only strings
                        fc.string().filter(s => s.trim().length === 0) // Any string that becomes empty after trim
                    ),
                    (invalidDescription) => {
                        // Test with TaskSchema validation
                        const taskSchemaResult = TaskSchema.shape.description.safeParse(invalidDescription)
                        expect(taskSchemaResult.success).toBe(false)

                        // Test with CreateTaskInputSchema validation
                        const createInputResult = CreateTaskInputSchema.safeParse({ description: invalidDescription })
                        expect(createInputResult.success).toBe(false)

                        // Test with validation utility
                        const validationResult = validateTaskDescription(invalidDescription)
                        expect(validationResult.isValid).toBe(false)
                        expect(validationResult.errors.length).toBeGreaterThan(0)

                        // Test with utility function
                        expect(isEmptyOrWhitespace(invalidDescription)).toBe(true)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('should accept any non-empty string after trimming (within length limits)', () => {
            fc.assert(
                fc.property(
                    // Generate valid non-empty strings (1-500 chars after trimming)
                    fc.string({ minLength: 1, maxLength: 500 })
                        .filter(s => s.trim().length > 0)
                        .map(s => {
                            // Add some random whitespace padding to test trimming
                            const padding = fc.sample(fc.stringMatching(/^\s*$/), 1)[0] || ''
                            return padding + s + padding
                        }),
                    (validDescription) => {
                        // Test with TaskSchema validation
                        const taskSchemaResult = TaskSchema.shape.description.safeParse(validDescription)
                        expect(taskSchemaResult.success).toBe(true)

                        // Verify trimming behavior
                        if (taskSchemaResult.success) {
                            expect(taskSchemaResult.data).toBe(validDescription.trim())
                        }

                        // Test with CreateTaskInputSchema validation
                        const createInputResult = CreateTaskInputSchema.safeParse({ description: validDescription })
                        expect(createInputResult.success).toBe(true)

                        // Test with validation utility
                        const validationResult = validateTaskDescription(validDescription)
                        expect(validationResult.isValid).toBe(true)
                        expect(validationResult.errors).toHaveLength(0)

                        // Test with utility function
                        expect(isEmptyOrWhitespace(validDescription)).toBe(false)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('should reject strings longer than 500 characters after trimming', () => {
            fc.assert(
                fc.property(
                    // Generate strings longer than 500 characters
                    fc.string({ minLength: 501, maxLength: 1000 }),
                    (longDescription) => {
                        // Test with TaskSchema validation
                        const taskSchemaResult = TaskSchema.shape.description.safeParse(longDescription)
                        expect(taskSchemaResult.success).toBe(false)

                        // Test with CreateTaskInputSchema validation
                        const createInputResult = CreateTaskInputSchema.safeParse({ description: longDescription })
                        expect(createInputResult.success).toBe(false)

                        // Test with validation utility
                        const validationResult = validateTaskDescription(longDescription)
                        expect(validationResult.isValid).toBe(false)
                        expect(validationResult.errors.some(err =>
                            err.includes('exceed') || err.includes('long')
                        )).toBe(true)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })

    /**
     * Additional property: Task schema consistency
     * Ensures that all validation methods agree on what constitutes a valid description
     */
    describe('Property: Validation Consistency', () => {
        it('should have consistent validation across all validation methods', () => {
            fc.assert(
                fc.property(
                    // Generate any string
                    fc.string({ maxLength: 1000 }),
                    (description) => {
                        const taskSchemaResult = TaskSchema.shape.description.safeParse(description)
                        const createInputResult = CreateTaskInputSchema.safeParse({ description })
                        const validationUtilResult = validateTaskDescription(description)

                        // All validation methods should agree
                        expect(taskSchemaResult.success).toBe(createInputResult.success)
                        expect(taskSchemaResult.success).toBe(validationUtilResult.isValid)

                        // If validation fails, there should be error messages
                        if (!validationUtilResult.isValid) {
                            expect(validationUtilResult.errors.length).toBeGreaterThan(0)
                        }
                    }
                ),
                { numRuns: 200 }
            )
        })
    })

    /**
     * Property: Trimming behavior consistency
     * Ensures that trimming behavior is consistent and predictable
     */
    describe('Property: Trimming Consistency', () => {
        it('should consistently trim whitespace from descriptions', () => {
            fc.assert(
                fc.property(
                    // Generate strings with potential whitespace
                    fc.tuple(
                        fc.stringMatching(/^\s*/), // Leading whitespace
                        fc.string({ minLength: 1, maxLength: 400 }).filter(s => s.trim().length > 0), // Core content
                        fc.stringMatching(/\s*$/) // Trailing whitespace
                    ).map(([leading, content, trailing]) => {
                        const original = leading + content + trailing
                        const expected = original.trim() // This is what we actually expect after trimming
                        return { original, expected }
                    }),
                    ({ original, expected }) => {
                        const result = TaskSchema.shape.description.safeParse(original)

                        if (expected.length > 0 && expected.length <= 500) {
                            // Should succeed and trim correctly
                            expect(result.success).toBe(true)
                            if (result.success) {
                                expect(result.data).toBe(expected)
                            }
                        } else {
                            // Should fail if empty after trimming or too long
                            expect(result.success).toBe(false)
                        }
                    }
                ),
                { numRuns: 100 }
            )
        })
    })
})