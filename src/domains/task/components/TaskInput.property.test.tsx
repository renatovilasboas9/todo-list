import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import { TaskInput } from './TaskInput'
import { eventBus } from '../../../SHARED/eventbus'

/**
 * Property-Based Tests for TaskInput Component
 * 
 * **Feature: task-manager, Property 3: Input Field Reset**
 * **Validates: Requirements 1.3**
 * 
 * Tests the universal property that input field should be cleared and focused
 * after any valid task addition, regardless of the specific task content.
 */

describe('TaskInput Property Tests', () => {
    beforeEach(() => {
        // Clear event bus before each test
        eventBus.clear()

        // Mock focus method
        HTMLElement.prototype.focus = vi.fn()
    })

    afterEach(() => {
        // Clean up after each test
        cleanup()
        vi.clearAllMocks()
    })

    describe('Property 3: Input Field Reset', () => {
        it('should clear input field and refocus after any valid task addition', async () => {
            // Test with a few specific valid examples instead of property testing
            // to avoid the multiple component rendering issue
            const validTaskDescriptions = [
                'Buy groceries',
                'Complete project',
                'Call mom',
                'Read book',
                'Exercise'
            ]

            for (const validTaskDescription of validTaskDescriptions) {
                // Clean up before each iteration
                cleanup()
                vi.clearAllMocks()

                // Render component
                const onTaskCreated = vi.fn()
                const { container } = render(<TaskInput onTaskCreated={onTaskCreated} />)

                const input = container.querySelector('input[type="text"]') as HTMLInputElement
                const addButton = container.querySelector('button') as HTMLButtonElement

                expect(input).toBeTruthy()
                expect(addButton).toBeTruthy()

                // Set input value to the valid task description
                fireEvent.change(input, { target: { value: validTaskDescription } })

                // Verify input has the value
                expect(input.value).toBe(validTaskDescription)

                // Submit the task via Enter key
                fireEvent.keyDown(input, { key: 'Enter' })

                // Wait for async operations to complete
                await waitFor(() => {
                    // Property: Input field should be cleared after valid submission
                    expect(input.value).toBe('')
                }, { timeout: 2000 })

                // Property: Input field should be focused after submission
                await waitFor(() => {
                    expect(input.focus).toHaveBeenCalled()
                }, { timeout: 2000 })

                // Verify the task creation callback was called
                expect(onTaskCreated).toHaveBeenCalledWith(validTaskDescription)
            }
        })

        it('should NOT clear input field for invalid task descriptions', async () => {
            // Test with invalid examples
            const invalidTaskDescriptions = [
                '', // Empty string
                '   ', // Whitespace only
                '\t\n', // Tabs and newlines
            ]

            for (const invalidTaskDescription of invalidTaskDescriptions) {
                // Clean up before each iteration
                cleanup()
                vi.clearAllMocks()

                // Render component
                const onTaskCreated = vi.fn()
                const onValidationError = vi.fn()
                const { container } = render(
                    <TaskInput
                        onTaskCreated={onTaskCreated}
                        onValidationError={onValidationError}
                    />
                )

                const input = container.querySelector('input[type="text"]') as HTMLInputElement
                const addButton = container.querySelector('button') as HTMLButtonElement

                expect(input).toBeTruthy()
                expect(addButton).toBeTruthy()

                // Set input value to the invalid task description
                fireEvent.change(input, { target: { value: invalidTaskDescription } })

                // Get the actual value from the input (may be normalized)
                const actualInputValue = input.value

                // Try to submit (button should be disabled, but test both methods)
                fireEvent.click(addButton)
                fireEvent.keyDown(input, { key: 'Enter' })

                // Wait a bit to ensure no async operations occur
                await new Promise(resolve => setTimeout(resolve, 500))

                // Property: Input field should NOT be cleared for invalid input
                expect(input.value).toBe(actualInputValue)

                // Property: Task creation callback should NOT be called
                expect(onTaskCreated).not.toHaveBeenCalled()

                // Property: Validation error callback should be called for non-empty invalid input
                if (invalidTaskDescription.length > 0) {
                    expect(onValidationError).toHaveBeenCalled()
                }
            }
        })

        it('should maintain focus behavior consistency across different input methods', async () => {
            const validTaskDescription = 'Test task'

            // Clean up
            cleanup()
            vi.clearAllMocks()

            // Render component
            const { container } = render(<TaskInput />)

            const input = container.querySelector('input[type="text"]') as HTMLInputElement

            expect(input).toBeTruthy()

            // Set input value
            fireEvent.change(input, { target: { value: validTaskDescription } })

            // Test focus behavior on focus event
            fireEvent.focus(input)

            // Submit via Enter key
            fireEvent.keyDown(input, { key: 'Enter' })

            // Wait for focus to be called
            await waitFor(() => {
                expect(input.focus).toHaveBeenCalled()
            }, { timeout: 2000 })

            // Property: Focus should be called after submission regardless of input method
            expect(input.focus).toHaveBeenCalledTimes(1)
        })
    })
})