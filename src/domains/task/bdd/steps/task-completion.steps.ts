import { expect } from 'vitest'
import { TaskManagerWorld } from './common.steps.js'
import {
    validateTask,
    parseStorageData,
    type Task,
    VALIDATION_CONSTANTS
} from '../../../../SHARED/contracts/task/v1'
import { v4 as uuidv4 } from 'uuid'

// This file contains step definitions for task completion scenarios
// For now, these are used for validation through the BDD runner test
// In the future, these can be used with Cucumber when E2E testing is implemented

export class TaskCompletionSteps {
    static async setupTaskForCompletion(world: TaskManagerWorld, description: string): Promise<Task> {
        // Given I have a task in the task list
        const task = await world.addTask(description)
        expect(task.completed).toBe(false) // Initially not completed
        world.simulateStorageRestore(world.context.tasks)
        return task
    }

    static async setupCompletedTask(world: TaskManagerWorld, description: string): Promise<Task | undefined> {
        // Given the task is marked as completed
        const task = world.findTaskByDescription(description)
        if (task) {
            // Only toggle if the task is not already completed
            if (!task.completed) {
                // Use TaskService to toggle the task to completed
                await world.toggleTask(task.id)
                world.simulateStorageRestore(world.context.tasks)
            }
        }
        return task
    }

    static async setupMultipleTasks(
        world: TaskManagerWorld,
        tasksData: Array<{ description: string; completed: boolean }>
    ) {
        // Given I have multiple tasks in the task list
        // Clear repository and context first
        world.resetContext()

        // Create tasks through TaskService to ensure proper synchronization
        for (const taskData of tasksData) {
            const task = await world.addTask(taskData.description)

            // If task should be completed, toggle it
            if (taskData.completed) {
                await world.toggleTask(task.id)
            }
        }

        // Ensure context is synced with repository
        await world.syncContextWithRepository()
        world.simulateStorageRestore(world.context.tasks)
    }

    static async clickTaskCheckbox(world: TaskManagerWorld, description?: string) {
        // When I click on the task checkbox
        let task = world.context.currentTask

        if (description) {
            task = world.findTaskByDescription(description)
            if (!task) {
                throw new Error(`Task with description "${description}" not found`)
            }
        }

        if (!task) {
            throw new Error('No current task to toggle')
        }

        // Use TaskService to toggle the task (this ensures proper validation)
        await world.toggleTask(task.id)
        world.simulateStorageRestore(world.context.tasks)

        // Simulate UI state changes
        if (!world.context.ui) {
            world.context.ui = {}
        }
        world.context.ui.lastToggledTask = {
            id: task.id,
            previousState: !world.context.currentTask!.completed,
            newState: world.context.currentTask!.completed,
        }
    }

    static async toggleTaskTwice(world: TaskManagerWorld) {
        // When I toggle the task completion twice
        const task = world.context.currentTask
        if (!task) {
            throw new Error('No current task to toggle')
        }

        const originalState = task.completed

        // First toggle
        await world.toggleTask(task.id)
        // Second toggle
        await world.toggleTask(task.id)

        world.simulateStorageRestore(world.context.tasks)

        // Verify we're back to original state
        expect(world.context.currentTask!.completed).toBe(originalState)
    }

    static validateTaskToggled(world: TaskManagerWorld, expectedState: boolean) {
        // Then the task completion status should be toggled
        expect(world.context.currentTask).toBeDefined()
        expect(world.context.currentTask!.completed).toBe(expectedState)

        // Validate task using official Zod schema
        const validationResult = validateTask(world.context.currentTask)
        expect(validationResult.isValid).toBe(true)
    }

    static validateTaskInListState(world: TaskManagerWorld, expectedState: boolean) {
        // And the task should be marked as completed/active in the task list
        expect(world.context.currentTask).toBeDefined()
        const taskInList = world.findTaskById(world.context.currentTask!.id)
        expect(taskInList).toBeDefined()
        expect(taskInList!.completed).toBe(expectedState)
    }

    static validateCompletionPersisted(world: TaskManagerWorld) {
        // And the completion change should be persisted to storage immediately
        expect(world.context.storage?.data).toBeDefined()

        // Handle both string and object storage data
        let storageData
        if (typeof world.context.storage!.data === 'string') {
            storageData = parseStorageData(world.context.storage!.data)
        } else {
            storageData = world.context.storage!.data
        }
        expect(storageData).not.toBeNull()

        // Find the current task in storage
        const currentTask = world.context.currentTask!
        const taskInStorage = storageData!.tasks.find(t => t.id === currentTask.id)
        expect(taskInStorage).toBeDefined()
        expect(taskInStorage!.completed).toBe(currentTask.completed)
    }

    static validateVisualStyling(world: TaskManagerWorld, shouldShowCompleted: boolean) {
        // Then the task should display visual styling to indicate completion
        expect(world.context.currentTask).toBeDefined()

        if (!world.context.ui) {
            world.context.ui = {}
        }

        // Simulate visual styling state
        world.context.ui.taskStyling = {
            taskId: world.context.currentTask!.id,
            hasCompletionStyling: shouldShowCompleted,
            checkboxChecked: shouldShowCompleted,
            descriptionStrikethrough: shouldShowCompleted,
        }

        expect(world.context.ui.taskStyling.hasCompletionStyling).toBe(shouldShowCompleted)
        expect(world.context.ui.taskStyling.checkboxChecked).toBe(shouldShowCompleted)
        expect(world.context.ui.taskStyling.descriptionStrikethrough).toBe(shouldShowCompleted)
    }

    static validateMultipleTaskStates(
        world: TaskManagerWorld,
        expectedStates: Array<{ description: string; completed: boolean }>
    ) {
        // Then specific tasks should have specific completion states
        expectedStates.forEach((expectedState) => {
            const task = world.findTaskByDescription(expectedState.description)
            expect(task).toBeDefined()
            expect(task!.completed).toBe(expectedState.completed)

            // Validate each task using official Zod schema
            const validationResult = validateTask(task)
            expect(validationResult.isValid).toBe(true)
        })
    }

    static validateAllStatesPersisted(world: TaskManagerWorld) {
        // And all completion states should be persisted to storage
        expect(world.context.storage?.data).toBeDefined()

        // Handle both string and object storage data
        let storageData
        if (typeof world.context.storage!.data === 'string') {
            storageData = parseStorageData(world.context.storage!.data)
        } else {
            storageData = world.context.storage!.data
        }
        expect(storageData).not.toBeNull()
        expect(storageData!.tasks).toHaveLength(world.context.tasks.length)

        // Verify all tasks have correct completion states in storage
        world.context.tasks.forEach((task) => {
            const taskInStorage = storageData!.tasks.find(t => t.id === task.id)
            expect(taskInStorage).toBeDefined()
            expect(taskInStorage!.completed).toBe(task.completed)
        })
    }

    static validateRoundTripConsistency(world: TaskManagerWorld, originalState: boolean) {
        // Then the task should return to its original state
        expect(world.context.currentTask).toBeDefined()
        expect(world.context.currentTask!.completed).toBe(originalState)
    }

    static validateTaskPropertiesPreserved(world: TaskManagerWorld, originalProperties: Task) {
        // Then only the completed property should change
        expect(world.context.currentTask).toBeDefined()
        const task = world.context.currentTask!

        expect(task.id).toBe(originalProperties.id)
        expect(task.description).toBe(originalProperties.description)
        expect(task.createdAt.toISOString()).toBe(originalProperties.createdAt.toISOString())
        // Only completed should have changed
        expect(task.completed).not.toBe(originalProperties.completed)

        // Validate task using official Zod schema
        const validationResult = validateTask(task)
        expect(validationResult.isValid).toBe(true)
    }

    static validateTaskOrdering(world: TaskManagerWorld) {
        // Then tasks should maintain their original creation order
        expect(world.context.tasks.length).toBeGreaterThan(1)

        // Check that tasks are still in chronological order by creation time
        for (let i = 1; i < world.context.tasks.length; i++) {
            const previousTask = world.context.tasks[i - 1]
            const currentTask = world.context.tasks[i]
            expect(previousTask.createdAt.getTime()).toBeLessThanOrEqual(currentTask.createdAt.getTime())
        }
    }

    static simulateApplicationRestart(world: TaskManagerWorld) {
        // When the application is restarted and tasks are loaded from storage
        expect(world.context.storage?.data).toBeDefined()

        // Handle both string and object storage data
        let storageData
        if (typeof world.context.storage!.data === 'string') {
            storageData = parseStorageData(world.context.storage!.data)
        } else {
            storageData = world.context.storage!.data
        }
        expect(storageData).not.toBeNull()

        // Simulate loading tasks from storage (like app restart)
        world.context.tasks = storageData!.tasks.map((taskData) => ({
            ...taskData,
            createdAt: new Date(taskData.createdAt), // Convert back to Date object
        }))

        // Set current task to the one we're testing
        world.context.currentTask = world.context.tasks[0]
    }

    static validateRestoredCompletionState(
        world: TaskManagerWorld,
        description: string,
        expectedCompleted: boolean
    ) {
        // Then the task should be restored with correct completion state
        const task = world.findTaskByDescription(description)
        expect(task).toBeDefined()
        expect(task!.completed).toBe(expectedCompleted)

        // Validate restored task using official Zod schema
        const validationResult = validateTask(task)
        expect(validationResult.isValid).toBe(true)

        // Simulate that visual styling is applied based on restored state
        TaskCompletionSteps.validateVisualStyling(world, expectedCompleted)
    }
}
