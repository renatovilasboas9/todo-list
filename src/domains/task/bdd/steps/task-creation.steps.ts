import { expect } from 'vitest'
import { TaskManagerWorld } from './common.steps.js'
import { BDDAssertions } from '../bdd.config.js'

// This file contains step definitions for task creation scenarios
// For now, these are used for validation through the BDD runner test
// In the future, these can be used with Cucumber when E2E testing is implemented

export class TaskCreationSteps {
  static validateTaskCreation(world: TaskManagerWorld, description: string) {
    // Simulate: When I enter description as the task description
    if (!world.context.ui) {
      world.context.ui = {}
    }
    world.context.ui.inputValue = description
    expect(world.context.ui.inputValue).toBe(description)

    // Simulate: And I submit the task
    if (BDDAssertions.isEmptyOrWhitespace(description)) {
      // Invalid task - should show validation message
      world.context.ui.validationMessages = ['Task description cannot be empty']
      world.context.lastError = new Error('Invalid task description')
    } else {
      // Valid task - create and add it
      const trimmedDescription = description.trim()
      world.addTask(trimmedDescription)

      // Simulate clearing input field
      world.context.ui.inputValue = ''

      // Simulate persistence to storage
      world.simulateStorageRestore(world.context.tasks)
    }
  }

  static validateTaskCreated(world: TaskManagerWorld, expectedDescription: string) {
    expect(world.context.currentTask).toBeDefined()
    expect(world.context.currentTask?.description).toBe(expectedDescription)
    expect(BDDAssertions.isValidTask(world.context.currentTask)).toBe(true)
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
    const storageData = JSON.parse(world.context.storage!.data as string)
    expect(BDDAssertions.hasValidStorageFormat(storageData)).toBe(true)

    // Find the current task in storage (comparing serialized version)
    const currentTaskSerialized = {
      ...world.context.currentTask,
      createdAt: world.context.currentTask!.createdAt.toISOString(),
    }
    expect(storageData.tasks).toContainEqual(currentTaskSerialized)
  }

  static validateNoTaskCreated(world: TaskManagerWorld) {
    expect(world.context.lastError).toBeDefined()
    // The current task should not be a valid task if there was an error
    if (world.context.currentTask) {
      expect(BDDAssertions.isValidTask(world.context.currentTask)).toBe(false)
    }
  }

  static validateValidationMessage(world: TaskManagerWorld) {
    expect(world.context.ui?.validationMessages).toBeDefined()
    expect(world.context.ui!.validationMessages!.length).toBeGreaterThan(0)
    expect(world.context.ui!.validationMessages).toContain('Task description cannot be empty')
  }

  static validateTaskProperties(world: TaskManagerWorld) {
    expect(world.context.currentTask).toBeDefined()

    // Unique identifier
    expect(world.context.currentTask!.id).toBeDefined()
    expect(typeof world.context.currentTask!.id).toBe('string')
    expect(world.context.currentTask!.id.length).toBeGreaterThan(0)

    // Creation timestamp
    expect(world.context.currentTask!.createdAt).toBeDefined()
    expect(world.context.currentTask!.createdAt).toBeInstanceOf(Date)

    // Not completed by default
    expect(world.context.currentTask!.completed).toBe(false)

    // Timestamp should be recent (within last few seconds)
    const now = new Date()
    const timeDiff = now.getTime() - world.context.currentTask!.createdAt.getTime()
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
    const storageData = JSON.parse(world.context.storage!.data as string)
    expect(BDDAssertions.hasValidStorageFormat(storageData)).toBe(true)
    expect(storageData.tasks).toHaveLength(world.context.tasks.length)

    // Verify all tasks are in storage (comparing serialized versions)
    world.context.tasks.forEach((task) => {
      const taskSerialized = {
        ...task,
        createdAt: task.createdAt.toISOString(),
      }
      expect(storageData.tasks).toContainEqual(taskSerialized)
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
  }
}
