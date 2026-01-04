import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { v4 as uuidv4 } from 'uuid'
import { Task } from '../../../SHARED/contracts/task/v1/TaskSchema'
import { MemoryTaskRepository } from './MemoryTaskRepository'
import { LocalStorageTaskRepository } from './LocalStorageTaskRepository'
import Logger from '../../../SHARED/logger/Logger'

/**
 * Property-Based Tests for Task Repository State Persistence
 * 
 * These tests verify that repository operations maintain data integrity
 * and that state persistence works correctly across different implementations.
 */

// Test data generators
const taskGenerator = fc.record({
    id: fc.string().map(() => uuidv4()),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0).map(s => s.trim()), // Pre-trim to match schema behavior
    completed: fc.boolean(),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
})

const taskArrayGenerator = fc.array(taskGenerator, { minLength: 0, maxLength: 20 })

describe('Task Repository State Persistence Properties', () => {
    let memoryRepo: MemoryTaskRepository
    let localStorageRepo: LocalStorageTaskRepository
    let logger: Logger

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()

        // Initialize repositories
        memoryRepo = new MemoryTaskRepository()
        localStorageRepo = new LocalStorageTaskRepository()

        // Initialize logger with correlation
        logger = Logger.getInstance()
        logger.startCorrelation(`test-${Date.now()}`)

        // Reset memory repository
        memoryRepo.reset()
    })

    /**
     * **Feature: task-manager, Property 7: State Persistence Synchronization**
     * **Validates: Requirements 1.4, 2.3, 3.2, 4.4**
     * 
     * For any task operation (add, toggle, delete), the storage should immediately 
     * reflect the current application state
     */
    describe('Property 7: State Persistence Synchronization', () => {
        it('should synchronize state immediately after save operations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator,
                    async (tasks) => {
                        // Test with LocalStorageTaskRepository (production persistence)
                        const repo = localStorageRepo

                        // Clear repository first
                        await repo.clear()

                        // Save all tasks
                        for (const task of tasks) {
                            await repo.save(task)
                        }

                        // Verify immediate synchronization - state should reflect all saves
                        const retrievedTasks = await repo.findAll()

                        // Should have same number of tasks
                        expect(retrievedTasks).toHaveLength(tasks.length)

                        // Each task should be present and identical
                        for (const originalTask of tasks) {
                            const foundTask = retrievedTasks.find(t => t.id === originalTask.id)
                            expect(foundTask).toBeDefined()
                            expect(foundTask).toEqual(originalTask)
                        }

                        // Verify tasks are sorted by creation order (if applicable)
                        const sortedOriginal = [...tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                        const sortedRetrieved = [...retrievedTasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

                        expect(sortedRetrieved).toEqual(sortedOriginal)
                    }
                ),
                { numRuns: 50 }
            )
        })

        it('should synchronize state immediately after delete operations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator.filter(tasks => tasks.length > 0),
                    fc.integer({ min: 0, max: 100 }).map(n => n / 100), // Deletion ratio 0-100%
                    async (initialTasks, deletionRatio) => {
                        const repo = localStorageRepo

                        // Clear and populate repository
                        await repo.clear()
                        for (const task of initialTasks) {
                            await repo.save(task)
                        }

                        // Determine which tasks to delete
                        const tasksToDelete = initialTasks.slice(0, Math.floor(initialTasks.length * deletionRatio))
                        const expectedRemainingTasks = initialTasks.slice(tasksToDelete.length)

                        // Delete selected tasks
                        for (const task of tasksToDelete) {
                            await repo.delete(task.id)
                        }

                        // Verify immediate synchronization
                        const remainingTasks = await repo.findAll()

                        // Should have correct number of remaining tasks
                        expect(remainingTasks).toHaveLength(expectedRemainingTasks.length)

                        // Each remaining task should be present and unchanged
                        for (const expectedTask of expectedRemainingTasks) {
                            const foundTask = remainingTasks.find(t => t.id === expectedTask.id)
                            expect(foundTask).toBeDefined()
                            expect(foundTask).toEqual(expectedTask)
                        }

                        // Deleted tasks should not be present
                        for (const deletedTask of tasksToDelete) {
                            const foundTask = remainingTasks.find(t => t.id === deletedTask.id)
                            expect(foundTask).toBeUndefined()
                        }
                    }
                ),
                { numRuns: 30 }
            )
        })

        it('should synchronize state immediately after update operations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator.filter(tasks => tasks.length > 0),
                    async (initialTasks) => {
                        const repo = localStorageRepo

                        // Clear and populate repository
                        await repo.clear()
                        for (const task of initialTasks) {
                            await repo.save(task)
                        }

                        // Update each task (toggle completion status)
                        const updatedTasks = initialTasks.map(task => ({
                            ...task,
                            completed: !task.completed
                        }))

                        for (const updatedTask of updatedTasks) {
                            await repo.save(updatedTask)
                        }

                        // Verify immediate synchronization
                        const retrievedTasks = await repo.findAll()

                        // Should have same number of tasks
                        expect(retrievedTasks).toHaveLength(updatedTasks.length)

                        // Each task should reflect the updates
                        for (const updatedTask of updatedTasks) {
                            const foundTask = retrievedTasks.find(t => t.id === updatedTask.id)
                            expect(foundTask).toBeDefined()
                            expect(foundTask).toEqual(updatedTask)

                            // Specifically verify the completion status was updated
                            const originalTask = initialTasks.find(t => t.id === updatedTask.id)!
                            expect(foundTask!.completed).toBe(!originalTask.completed)
                        }
                    }
                ),
                { numRuns: 30 }
            )
        })

        it('should synchronize state immediately after clear operations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator,
                    async (initialTasks) => {
                        const repo = localStorageRepo

                        // Populate repository with tasks
                        await repo.clear()
                        for (const task of initialTasks) {
                            await repo.save(task)
                        }

                        // Verify tasks were saved
                        const tasksBeforeClear = await repo.findAll()
                        expect(tasksBeforeClear).toHaveLength(initialTasks.length)

                        // Clear repository
                        await repo.clear()

                        // Verify immediate synchronization - should be empty
                        const tasksAfterClear = await repo.findAll()
                        expect(tasksAfterClear).toHaveLength(0)
                        expect(tasksAfterClear).toEqual([])
                    }
                ),
                { numRuns: 30 }
            )
        })
    })

    /**
     * **Feature: task-manager, Property 8: State Restoration Round-Trip**
     * **Validates: Requirements 4.1, 4.2**
     * 
     * For any set of tasks saved to Local Storage, reloading the application should restore 
     * the complete state including all task descriptions and completion statuses
     */
    describe('Property 8: State Restoration Round-Trip', () => {
        it('should restore complete state after simulated application restart', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator,
                    async (originalTasks) => {
                        // First repository instance - simulate initial application session
                        const firstRepo = new LocalStorageTaskRepository()

                        // Clear storage and save tasks
                        await firstRepo.clear()
                        for (const task of originalTasks) {
                            await firstRepo.save(task)
                        }

                        // Verify tasks were saved
                        const savedTasks = await firstRepo.findAll()
                        expect(savedTasks).toHaveLength(originalTasks.length)

                        // Create new repository instance - simulate application restart
                        const secondRepo = new LocalStorageTaskRepository()

                        // Force cache invalidation to simulate fresh application start
                        secondRepo.invalidateCacheForTesting()

                        // Restore state from storage
                        const restoredTasks = await secondRepo.findAll()

                        // Should restore complete state
                        expect(restoredTasks).toHaveLength(originalTasks.length)

                        // Each task should be restored with complete state
                        for (const originalTask of originalTasks) {
                            const restoredTask = restoredTasks.find(t => t.id === originalTask.id)
                            expect(restoredTask).toBeDefined()
                            expect(restoredTask).toEqual(originalTask)

                            // Specifically verify critical fields are preserved
                            expect(restoredTask!.description).toBe(originalTask.description)
                            expect(restoredTask!.completed).toBe(originalTask.completed)
                            expect(restoredTask!.createdAt).toEqual(originalTask.createdAt)
                        }

                        // Verify order preservation (tasks should be in same order)
                        const sortedOriginal = [...originalTasks].sort((a, b) => a.id.localeCompare(b.id))
                        const sortedRestored = [...restoredTasks].sort((a, b) => a.id.localeCompare(b.id))
                        expect(sortedRestored).toEqual(sortedOriginal)
                    }
                ),
                { numRuns: 30 }
            )
        })

        it('should handle empty storage gracefully on application start', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constant(null), // No input needed for this test
                    async () => {
                        // Clear storage completely
                        localStorage.clear()

                        // Create new repository instance - simulate fresh application start
                        const repo = new LocalStorageTaskRepository()

                        // Should initialize with empty state
                        const tasks = await repo.findAll()
                        expect(tasks).toHaveLength(0)
                        expect(tasks).toEqual([])

                        // Should be able to save tasks after empty initialization
                        const testTask: Task = {
                            id: uuidv4(),
                            description: 'Test task',
                            completed: false,
                            createdAt: new Date()
                        }

                        await repo.save(testTask)
                        const savedTasks = await repo.findAll()
                        expect(savedTasks).toHaveLength(1)
                        expect(savedTasks[0]).toEqual(testTask)
                    }
                ),
                { numRuns: 10 }
            )
        })

        it('should handle corrupted storage data gracefully', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.oneof(
                        fc.constant('invalid json'),
                        fc.constant('{"invalid": "schema"}'),
                        fc.constant('{"tasks": "not an array"}'),
                        fc.constant('{"tasks": [{"invalid": "task"}]}')
                    ),
                    async (corruptedData) => {
                        // Manually corrupt localStorage
                        localStorage.setItem('task-manager-data', corruptedData)

                        // Create new repository instance
                        const repo = new LocalStorageTaskRepository()

                        // Should gracefully handle corruption by initializing empty state
                        const tasks = await repo.findAll()
                        expect(tasks).toHaveLength(0)
                        expect(tasks).toEqual([])

                        // Should be able to save tasks after corruption recovery
                        const testTask: Task = {
                            id: uuidv4(),
                            description: 'Recovery test',
                            completed: false,
                            createdAt: new Date()
                        }

                        await repo.save(testTask)
                        const savedTasks = await repo.findAll()
                        expect(savedTasks).toHaveLength(1)
                        expect(savedTasks[0]).toEqual(testTask)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should preserve task state across multiple save/restore cycles', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator.filter(tasks => tasks.length > 0),
                    fc.integer({ min: 2, max: 5 }), // Number of cycles
                    async (initialTasks, cycles) => {
                        let currentTasks = [...initialTasks]

                        for (let cycle = 0; cycle < cycles; cycle++) {
                            // Create repository instance for this cycle
                            const repo = new LocalStorageTaskRepository()

                            // Clear and save current state
                            await repo.clear()
                            for (const task of currentTasks) {
                                await repo.save(task)
                            }

                            // Simulate application restart
                            const newRepo = new LocalStorageTaskRepository()
                            newRepo.invalidateCacheForTesting()

                            // Restore state
                            const restoredTasks = await newRepo.findAll()

                            // Verify complete restoration
                            expect(restoredTasks).toHaveLength(currentTasks.length)

                            for (const originalTask of currentTasks) {
                                const restoredTask = restoredTasks.find(t => t.id === originalTask.id)
                                expect(restoredTask).toBeDefined()
                                expect(restoredTask).toEqual(originalTask)
                            }

                            // Modify tasks for next cycle (toggle completion status)
                            currentTasks = currentTasks.map(task => ({
                                ...task,
                                completed: !task.completed
                            }))
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Cross-repository consistency test
     * Verifies that both repository implementations behave consistently
     */
    describe('Property: Cross-Repository Consistency', () => {
        it('should behave consistently across Memory and LocalStorage repositories', async () => {
            await fc.assert(
                fc.asyncProperty(
                    taskArrayGenerator,
                    async (tasks) => {
                        // Reset both repositories
                        memoryRepo.reset()
                        await localStorageRepo.clear()

                        // Perform same operations on both repositories
                        for (const task of tasks) {
                            await memoryRepo.save(task)
                            await localStorageRepo.save(task)
                        }

                        // Both should return identical results
                        const memoryTasks = await memoryRepo.findAll()
                        const localStorageTasks = await localStorageRepo.findAll()

                        expect(memoryTasks).toHaveLength(localStorageTasks.length)

                        // Sort both arrays for comparison (order might differ)
                        const sortMemory = memoryTasks.sort((a, b) => a.id.localeCompare(b.id))
                        const sortLocalStorage = localStorageTasks.sort((a, b) => a.id.localeCompare(b.id))

                        expect(sortMemory).toEqual(sortLocalStorage)
                    }
                ),
                { numRuns: 30 }
            )
        })
    })

    /**
     * Error handling consistency
     * Verifies that error conditions are handled consistently
     */
    describe('Property: Error Handling Consistency', () => {
        it('should handle invalid operations consistently', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string().filter(s => s.trim().length === 0 || !s), // Invalid IDs
                    async (invalidId) => {
                        // Both repositories should reject invalid delete operations
                        await expect(memoryRepo.delete(invalidId)).rejects.toThrow()
                        await expect(localStorageRepo.delete(invalidId)).rejects.toThrow()
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should handle non-existent task deletion consistently', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string().map(() => uuidv4()), // Valid but non-existent ID
                    async (nonExistentId) => {
                        // Clear both repositories
                        memoryRepo.reset()
                        await localStorageRepo.clear()

                        // Both should reject deletion of non-existent tasks
                        await expect(memoryRepo.delete(nonExistentId)).rejects.toThrow()
                        await expect(localStorageRepo.delete(nonExistentId)).rejects.toThrow()
                    }
                ),
                { numRuns: 20 }
            )
        })
    })
})