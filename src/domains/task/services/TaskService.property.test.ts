import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TaskService } from './TaskService'
import { MemoryTaskRepository } from '../repositories/MemoryTaskRepository'
import { CreateTaskInput } from '../../../SHARED/contracts/task/v1/TaskSchema'
import EventBus from '../../../SHARED/eventbus/EventBus'
import Logger from '../../../SHARED/logger/Logger'

/**
 * Property-Based Tests for TaskService
 * 
 * These tests verify that TaskService operations maintain correctness
 * properties across all valid inputs using property-based testing.
 */

// Test data generators
const validTaskDescriptionGenerator = fc.string({ minLength: 1, maxLength: 500 })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim())

const createTaskInputGenerator = fc.record({
    description: validTaskDescriptionGenerator
}) as fc.Arbitrary<CreateTaskInput>

describe('TaskService Property-Based Tests', () => {
    let taskService: TaskService
    let repository: MemoryTaskRepository
    let eventBus: EventBus
    let logger: Logger

    beforeEach(async () => {
        // Initialize dependencies with fresh instances
        repository = new MemoryTaskRepository()
        eventBus = EventBus.getInstance()
        logger = Logger.getInstance()

        // Ensure repository is completely empty
        repository.reset()
        await repository.clear()

        // Clear event bus
        eventBus.clear()

        // Create fresh service instance
        taskService = new TaskService(repository, eventBus, logger)

        // Start correlation for test
        logger.startCorrelation(`test-${Date.now()}`)
    })

    /**
     * **Feature: task-manager, Property 1: Task Addition Grows List**
     * **Validates: Requirements 1.1**
     * 
     * For any valid task description, adding it to the task list should result in 
     * the task list growing by one and containing the new task
     */
    describe('Property 1: Task Addition Grows List', () => {
        it('should grow the task list by one when adding a valid task', async () => {
            await fc.assert(
                fc.asyncProperty(
                    createTaskInputGenerator,
                    async (taskInput) => {
                        // Get initial task count
                        const initialTasks = await taskService.getAllTasks()
                        const initialCount = initialTasks.length

                        // Add the task
                        const createdTask = await taskService.createTask(taskInput)

                        // Get updated task count
                        const updatedTasks = await taskService.getAllTasks()
                        const updatedCount = updatedTasks.length

                        // Verify the list grew by exactly one
                        expect(updatedCount).toBe(initialCount + 1)

                        // Verify the new task is in the list
                        const foundTask = updatedTasks.find(task => task.id === createdTask.id)
                        expect(foundTask).toBeDefined()
                        expect(foundTask).toEqual(createdTask)

                        // Verify the task has correct properties
                        expect(createdTask.description).toBe(taskInput.description.trim())
                        expect(createdTask.completed).toBe(false)
                        expect(createdTask.id).toBeDefined()
                        expect(createdTask.createdAt).toBeInstanceOf(Date)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })

    /**
     * **Feature: task-manager, Property 4: Task Toggle Round-Trip**
     * **Validates: Requirements 2.1, 2.4**
     * 
     * For any task, toggling its completion status twice should restore it to its original state
     */
    describe('Property 4: Task Toggle Round-Trip', () => {
        it('should restore original state after toggling completion status twice', async () => {
            await fc.assert(
                fc.asyncProperty(
                    createTaskInputGenerator,
                    async (taskInput) => {
                        // Create a task first
                        const originalTask = await taskService.createTask(taskInput)
                        const originalCompleted = originalTask.completed

                        // First toggle - should change completion status
                        const firstToggle = await taskService.toggleTask(originalTask.id)
                        expect(firstToggle.completed).toBe(!originalCompleted)
                        expect(firstToggle.id).toBe(originalTask.id)
                        expect(firstToggle.description).toBe(originalTask.description)
                        expect(firstToggle.createdAt).toEqual(originalTask.createdAt)

                        // Second toggle - should restore original completion status
                        const secondToggle = await taskService.toggleTask(originalTask.id)
                        expect(secondToggle.completed).toBe(originalCompleted)
                        expect(secondToggle.id).toBe(originalTask.id)
                        expect(secondToggle.description).toBe(originalTask.description)
                        expect(secondToggle.createdAt).toEqual(originalTask.createdAt)

                        // Verify the task in the repository matches the original state
                        const allTasks = await taskService.getAllTasks()
                        const foundTask = allTasks.find(task => task.id === originalTask.id)
                        expect(foundTask).toBeDefined()
                        expect(foundTask!.completed).toBe(originalCompleted)
                        expect(foundTask!.id).toBe(originalTask.id)
                        expect(foundTask!.description).toBe(originalTask.description)
                        expect(foundTask!.createdAt).toEqual(originalTask.createdAt)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })

    /**
     * **Feature: task-manager, Property 6: Task Deletion Removes Item**
     * **Validates: Requirements 3.1, 3.3**
     * 
     * For any task in the list, deleting it should remove it from the task list 
     * while maintaining the order and integrity of remaining tasks
     */
    describe('Property 6: Task Deletion Removes Item', () => {
        it('should remove the task from the list while maintaining integrity of remaining tasks', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(createTaskInputGenerator, { minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    async (taskInputs, deleteIndex) => {
                        // Ensure fresh state for each property test iteration
                        repository.reset()
                        await repository.clear()

                        // Ensure deleteIndex is within bounds
                        const actualDeleteIndex = deleteIndex % taskInputs.length

                        // Create multiple tasks
                        const createdTasks = []
                        for (const taskInput of taskInputs) {
                            const task = await taskService.createTask(taskInput)
                            createdTasks.push(task)
                        }

                        // Get initial state
                        const initialTasks = await taskService.getAllTasks()
                        const initialCount = initialTasks.length
                        expect(initialCount).toBe(taskInputs.length)

                        // Select task to delete
                        const taskToDelete = createdTasks[actualDeleteIndex]
                        const remainingTasks = createdTasks.filter((_, index) => index !== actualDeleteIndex)

                        // Delete the selected task
                        await taskService.deleteTask(taskToDelete.id)

                        // Get updated state
                        const updatedTasks = await taskService.getAllTasks()
                        const updatedCount = updatedTasks.length

                        // Verify the list shrunk by exactly one
                        expect(updatedCount).toBe(initialCount - 1)
                        expect(updatedCount).toBe(remainingTasks.length)

                        // Verify the deleted task is no longer in the list
                        const deletedTaskFound = updatedTasks.find(task => task.id === taskToDelete.id)
                        expect(deletedTaskFound).toBeUndefined()

                        // Verify all remaining tasks are still present and unchanged
                        for (const remainingTask of remainingTasks) {
                            const foundTask = updatedTasks.find(task => task.id === remainingTask.id)
                            expect(foundTask).toBeDefined()
                            expect(foundTask).toEqual(remainingTask)
                        }

                        // Verify no extra tasks were added
                        expect(updatedTasks.length).toBe(remainingTasks.length)

                        // Verify each task in the updated list corresponds to a remaining task
                        for (const updatedTask of updatedTasks) {
                            const correspondingTask = remainingTasks.find(task => task.id === updatedTask.id)
                            expect(correspondingTask).toBeDefined()
                            expect(updatedTask).toEqual(correspondingTask)
                        }
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('should handle deletion of non-existent task by throwing error', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string().filter(s => s.trim().length > 0),
                    async (nonExistentId) => {
                        // Ensure fresh state for each property test iteration
                        repository.reset()
                        await repository.clear()

                        // Attempt to delete non-existent task should throw error
                        await expect(taskService.deleteTask(nonExistentId)).rejects.toThrow()

                        // Verify task list remains empty
                        const tasks = await taskService.getAllTasks()
                        expect(tasks).toHaveLength(0)
                    }
                ),
                { numRuns: 50 }
            )
        })
    })
})