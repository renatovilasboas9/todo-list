import { expect } from 'vitest'
import { TaskManagerWorld } from './common.steps.js'
import {
    validateTaskDescription,
    validateCreateTaskInput,
    validateTask,
    isEmptyOrWhitespace,
    parseStorageData,
    type Task,
    type ValidationResult,
    VALIDATION_CONSTANTS
} from '../../../../SHARED/contracts/task/v1'

// This file contains step definitions for task creation scenarios
// For now, these are used for validation through the BDD runner test
// In the future, these can be used with Cucumber when E2E testing is implemented

export class TaskCreationSteps {
    static async validateTaskCreation(world: TaskManagerWorld, description: string) {
        // Simulate: When I enter description as the task description
        if (!world.context.ui) {
            world.context.ui = {}
        }
        world.context.ui.inputValue = description
        expect(world.context.ui.inputValue).toBe(description)

        // Simulate: And I submit the task
        if (isEmptyOrWhitespace(description)) {
            // Invalid task - should show validation message using official validation
            const validationResult = validateTaskDescription(description)
            world.context.ui.validationMessages = validationResult.errors
            world.context.lastError = new Error('Invalid task description')
        } else {
            // Valid task - create and add it using TaskService
            const trimmedDescription = description.trim()
            await world.addTask(trimmedDescription)

            // Simulate clearing input field
            world.context.ui.inputValue = ''

            // Simulate persistence to storage using official contracts
            world.simulateStorageRestore(world.context.tasks)
        }
    }

    static validateTaskCreated(world: TaskManagerWorld, expectedDescription: string) {
        expect(world.context.currentTask).toBeDefined()
        expect(world.context.currentTask?.description).toBe(expectedDescription)

        // Use official Zod validation instead of manual checks
        const validationResult = validateTask(world.context.currentTask)
        expect(validationResult.isValid).toBe(true)
    }

    static validateTaskInList(world: TaskManagerWorld) {
        expect(world.context.currentTask).toBeDefined()
        const taskInList = world.findTaskById(world.context.currentTask!.id)
        expect(taskInList).toBeDefined()
        expect(taskInList).toEqual(world.context.currentTask)
    }

    static validateTaskCount(world: TaskManagerWorld, expectedCount: number) {
        expect(world.context.tasks).toHaveLength(expectedCount)
    }

    static validateInputCleared(world: TaskManagerWorld) {
        expect(world.context.ui?.inputValue).toBe('')
    }

    static validateTaskPersisted(world: TaskManagerWorld) {
        expect(world.context.storage?.data).toBeDefined()

        // Use official storage parsing instead of manual JSON.parse
        const storageDataString = typeof world.context.storage!.data === 'string'
            ? world.context.storage!.data
            : JSON.stringify(world.context.storage!.data)
        const storageData = parseStorageData(storageDataString)
        expect(storageData).not.toBeNull()

        // Find the current task in storage
        const currentTask = world.context.currentTask!
        const taskInStorage = storageData!.tasks.find(t => t.id === currentTask.id)
        expect(taskInStorage).toBeDefined()
        expect(taskInStorage!.description).toBe(currentTask.description)
    }

    static validateNoTaskCreated(world: TaskManagerWorld) {
        expect(world.context.lastError).toBeDefined()
        // The current task should not be valid if there was an error
        if (world.context.currentTask) {
            const validationResult = validateTask(world.context.currentTask)
            expect(validationResult.isValid).toBe(false)
        }
    }

    static validateValidationMessage(world: TaskManagerWorld) {
        expect(world.context.ui?.validationMessages).toBeDefined()
        expect(world.context.ui!.validationMessages!.length).toBeGreaterThan(0)

        // Check that validation message comes from official validation
        const hasEmptyMessage = world.context.ui!.validationMessages!.some(msg =>
            msg.includes('empty') || msg.includes('cannot be empty')
        )
        expect(hasEmptyMessage).toBe(true)
    }

    static validateTaskProperties(world: TaskManagerWorld) {
        expect(world.context.currentTask).toBeDefined()

        // Use official Zod validation to ensure all properties are correct
        const validationResult = validateTask(world.context.currentTask)
        expect(validationResult.isValid).toBe(true)

        const task = world.context.currentTask!

        // Unique identifier (UUID format validated by Zod)
        expect(task.id).toBeDefined()
        expect(typeof task.id).toBe('string')
        expect(task.id.length).toBeGreaterThan(0)

        // Creation timestamp
        expect(task.createdAt).toBeDefined()
        expect(task.createdAt).toBeInstanceOf(Date)

        // Not completed by default
        expect(task.completed).toBe(false)

        // Timestamp should be recent (within last few seconds)
        const now = new Date()
        const timeDiff = now.getTime() - task.createdAt.getTime()
        expect(timeDiff).toBeLessThan(5000) // Less than 5 seconds ago
    }

    static validateMultipleTasksInOrder(world: TaskManagerWorld) {
        expect(world.context.tasks.length).toBeGreaterThan(1)

        // Check that tasks are in chronological order by creation time
        for (let i = 1; i < world.context.tasks.length; i++) {
            const previousTask = world.context.tasks[i - 1]
            const currentTask = world.context.tasks[i]
            expect(previousTask.createdAt.getTime()).toBeLessThanOrEqual(currentTask.createdAt.getTime())
        }
    }

    static validateAllTasksPersisted(world: TaskManagerWorld) {
        expect(world.context.storage?.data).toBeDefined()

        // Use official storage parsing
        const storageDataString = typeof world.context.storage!.data === 'string'
            ? world.context.storage!.data
            : JSON.stringify(world.context.storage!.data)
        const storageData = parseStorageData(storageDataString)
        expect(storageData).not.toBeNull()
        expect(storageData!.tasks).toHaveLength(world.context.tasks.length)

        // Verify all tasks are in storage
        world.context.tasks.forEach((task) => {
            const taskInStorage = storageData!.tasks.find(t => t.id === task.id)
            expect(taskInStorage).toBeDefined()
            expect(taskInStorage!.description).toBe(task.description)
            expect(taskInStorage!.completed).toBe(task.completed)
        })
    }

    static validateTaskListEmpty(world: TaskManagerWorld) {
        expect(world.context.tasks).toHaveLength(0)
    }

    static validateDescriptionTrimmed(world: TaskManagerWorld) {
        expect(world.context.currentTask).toBeDefined()
        const description = world.context.currentTask!.description
        expect(description).toBe(description.trim())
        expect(description).not.toMatch(/^\s+|\s+$/) // No leading or trailing whitespace

        // Ensure description meets Zod schema requirements
        const validationResult = validateTaskDescription(description)
        expect(validationResult.isValid).toBe(true)
    }
}
