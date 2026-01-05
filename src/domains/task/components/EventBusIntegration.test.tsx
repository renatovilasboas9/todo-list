import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { TaskInput } from './TaskInput'
import { TaskItem } from './TaskItem'
import { TaskManagerApp } from './TaskManagerApp'
import { Task } from '../../../SHARED/contracts/task/v1'
import { eventBus } from '../../../SHARED/eventbus'

/**
 * EventBus Integration Tests
 * 
 * Tests that verify the EventBus integration works correctly across UI components.
 * These tests validate the event-driven architecture implementation.
 * 
 * Requirements: Event-driven frontend architecture
 */

describe('EventBus Integration Tests', () => {
    beforeEach(() => {
        // Clear event bus before each test
        eventBus.clear()
    })

    afterEach(() => {
        // Clean up after each test
        cleanup()
        vi.clearAllMocks()
    })

    describe('TaskInput EventBus Integration', () => {
        it('should publish UI.TASK.CREATE event when task is created', async () => {
            const eventSpy = vi.fn()
            eventBus.subscribe('UI.TASK.CREATE', eventSpy)

            const { container } = render(<TaskInput />)
            const input = container.querySelector('input[type="text"]') as HTMLInputElement

            // Create a task
            fireEvent.change(input, { target: { value: 'Test task' } })
            fireEvent.keyDown(input, { key: 'Enter' })

            // Wait for event to be published
            await waitFor(() => {
                expect(eventSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'UI.TASK.CREATE',
                        payload: 'Test task'
                    })
                )
            })
        })
    })

    describe('TaskItem EventBus Integration', () => {
        it('should publish UI.TASK.TOGGLE event when task is toggled', async () => {
            const eventSpy = vi.fn()
            eventBus.subscribe('UI.TASK.TOGGLE', eventSpy)

            const task: Task = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                description: 'Test task',
                completed: false,
                createdAt: new Date()
            }

            const { container } = render(<TaskItem task={task} />)
            const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement

            // Toggle the task
            fireEvent.click(checkbox)

            // Wait for event to be published
            await waitFor(() => {
                expect(eventSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'UI.TASK.TOGGLE',
                        payload: { taskId: task.id }
                    })
                )
            })
        })

        it('should publish UI.TASK.DELETE event when task is deleted', async () => {
            const eventSpy = vi.fn()
            eventBus.subscribe('UI.TASK.DELETE', eventSpy)

            const task: Task = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                description: 'Test task',
                completed: false,
                createdAt: new Date()
            }

            const { container } = render(<TaskItem task={task} />)
            const deleteButton = container.querySelector('button') as HTMLButtonElement

            // Click delete button
            fireEvent.click(deleteButton)

            // Confirm deletion in dialog
            await waitFor(() => {
                const confirmButton = document.querySelector('button[color="error"]') as HTMLButtonElement
                if (confirmButton) {
                    fireEvent.click(confirmButton)
                }
            })

            // Wait for event to be published
            await waitFor(() => {
                expect(eventSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'UI.TASK.DELETE',
                        payload: { taskId: task.id }
                    })
                )
            })
        })
    })

    describe('TaskManagerApp EventBus Integration', () => {
        it('should subscribe to domain events and update state', async () => {
            const initialTasks: Task[] = []
            const onTasksChange = vi.fn()

            render(
                <TaskManagerApp
                    initialTasks={initialTasks}
                    onTasksChange={onTasksChange}
                />
            )

            // Simulate a task creation event from the domain
            const newTask: Task = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                description: 'New task from domain',
                completed: false,
                createdAt: new Date()
            }

            await eventBus.publish('DOMAIN.TASK.CREATED', newTask)

            // Wait for the component to update
            await waitFor(() => {
                expect(onTasksChange).toHaveBeenCalledWith([newTask])
            })
        })

        it('should handle task loading events', async () => {
            const onTasksChange = vi.fn()

            render(
                <TaskManagerApp
                    initialTasks={[]}
                    onTasksChange={onTasksChange}
                />
            )

            // Simulate tasks being loaded
            const loadedTasks: Task[] = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    description: 'Loaded task 1',
                    completed: false,
                    createdAt: new Date()
                },
                {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    description: 'Loaded task 2',
                    completed: true,
                    createdAt: new Date()
                }
            ]

            await eventBus.publish('DOMAIN.TASK.LOADED', { tasks: loadedTasks })

            // Wait for the component to update
            await waitFor(() => {
                expect(onTasksChange).toHaveBeenCalledWith(loadedTasks)
            })
        })
    })

    describe('End-to-End EventBus Flow', () => {
        it('should handle complete task creation flow through EventBus', async () => {
            // Set up event handlers to simulate domain layer responses
            eventBus.subscribe('UI.TASK.CREATE', async (event) => {
                // Simulate domain processing and response
                const newTask: Task = {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    description: event.payload,
                    completed: false,
                    createdAt: new Date()
                }

                // Simulate successful creation
                await eventBus.publish('DOMAIN.TASK.CREATED', newTask)
            })

            const onTasksChange = vi.fn()

            const { container } = render(
                <TaskManagerApp
                    initialTasks={[]}
                    onTasksChange={onTasksChange}
                />
            )

            // Find the input field in the TaskManagerApp
            const input = container.querySelector('input[type="text"]') as HTMLInputElement
            expect(input).toBeTruthy()

            // Create a task through the UI
            fireEvent.change(input, { target: { value: 'End-to-end test task' } })
            fireEvent.keyDown(input, { key: 'Enter' })

            // Wait for the complete flow to finish
            await waitFor(() => {
                expect(onTasksChange).toHaveBeenCalledWith([
                    expect.objectContaining({
                        description: 'End-to-end test task',
                        completed: false
                    })
                ])
            }, { timeout: 3000 })
        })
    })
})