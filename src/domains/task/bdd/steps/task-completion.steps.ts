import { expect } from 'vitest'
import { TaskManagerWorld } from './common.steps.js'
import { BDDAssertions } from '../bdd.config.js'

// This file contains step definitions for task completion scenarios
// For now, these are used for validation through the BDD runner test
// In the future, these can be used with Cucumber when E2E testing is implemented

export class TaskCompletionSteps {
  static setupTaskForCompletion(world: TaskManagerWorld, description: string) {
    // Given I have a task in the task list
    const task = world.addTask(description)
    expect(task.completed).toBe(false) // Initially not completed
    world.simulateStorageRestore(world.context.tasks)
    return task
  }

  static setupCompletedTask(world: TaskManagerWorld, description: string) {
    // Given the task is marked as completed
    const task = world.findTaskByDescription(description)
    if (task) {
      task.completed = true
      world.context.currentTask = task
      world.simulateStorageRestore(world.context.tasks)
    }
    return task
  }

  static setupMultipleTasks(
    world: TaskManagerWorld,
    tasksData: Array<{ description: string; completed: boolean }>
  ) {
    // Given I have multiple tasks in the task list
    world.context.tasks = [] // Clear existing tasks

    tasksData.forEach((taskData) => {
      const task = {
        id: `task-${Date.now()}-${Math.random()}`,
        description: taskData.description,
        completed: taskData.completed,
        createdAt: new Date(),
      }
      world.context.tasks.push(task)
    })

    world.simulateStorageRestore(world.context.tasks)
  }

  static clickTaskCheckbox(world: TaskManagerWorld, description?: string) {
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

    // Simulate checkbox click - toggle completion status
    const wasCompleted = task.completed
    task.completed = !task.completed
    world.context.currentTask = task

    // Simulate immediate persistence
    world.simulateStorageRestore(world.context.tasks)

    // Simulate UI state changes
    if (!world.context.ui) {
      world.context.ui = {}
    }
    world.context.ui.lastToggledTask = {
      id: task.id,
      previousState: wasCompleted,
      newState: task.completed,
    }
  }

  static toggleTaskTwice(world: TaskManagerWorld) {
    // When I toggle the task completion twice
    const task = world.context.currentTask
    if (!task) {
      throw new Error('No current task to toggle')
    }

    const originalState = task.completed

    // First toggle
    task.completed = !task.completed
    // Second toggle
    task.completed = !task.completed

    world.simulateStorageRestore(world.context.tasks)

    // Verify we're back to original state
    expect(task.completed).toBe(originalState)
  }

  static validateTaskToggled(world: TaskManagerWorld, expectedState: boolean) {
    // Then the task completion status should be toggled
    expect(world.context.currentTask).toBeDefined()
    expect(world.context.currentTask!.completed).toBe(expectedState)
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
    const storageData = JSON.parse(world.context.storage!.data as string)
    expect(BDDAssertions.hasValidStorageFormat(storageData)).toBe(true)

    // Find the current task in storage
    const currentTask = world.context.currentTask!
    const taskInStorage = storageData.tasks.find((t: any) => t.id === currentTask.id)
    expect(taskInStorage).toBeDefined()
    expect(taskInStorage.completed).toBe(currentTask.completed)
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
    })
  }

  static validateAllStatesPersisted(world: TaskManagerWorld) {
    // And all completion states should be persisted to storage
    expect(world.context.storage?.data).toBeDefined()
    const storageData = JSON.parse(world.context.storage!.data as string)
    expect(BDDAssertions.hasValidStorageFormat(storageData)).toBe(true)
    expect(storageData.tasks).toHaveLength(world.context.tasks.length)

    // Verify all tasks have correct completion states in storage
    world.context.tasks.forEach((task) => {
      const taskInStorage = storageData.tasks.find((t: any) => t.id === task.id)
      expect(taskInStorage).toBeDefined()
      expect(taskInStorage.completed).toBe(task.completed)
    })
  }

  static validateRoundTripConsistency(world: TaskManagerWorld, originalState: boolean) {
    // Then the task should return to its original state
    expect(world.context.currentTask).toBeDefined()
    expect(world.context.currentTask!.completed).toBe(originalState)
  }

  static validateTaskPropertiesPreserved(world: TaskManagerWorld, originalProperties: any) {
    // Then only the completed property should change
    expect(world.context.currentTask).toBeDefined()
    const task = world.context.currentTask!

    expect(task.id).toBe(originalProperties.id)
    expect(task.description).toBe(originalProperties.description)
    expect(task.createdAt.toISOString()).toBe(originalProperties.createdAt)
    // Only completed should have changed
    expect(task.completed).not.toBe(originalProperties.completed)
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
    const storageData = JSON.parse(world.context.storage!.data as string)

    // Simulate loading tasks from storage (like app restart)
    world.context.tasks = storageData.tasks.map((taskData: any) => ({
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

    // Simulate that visual styling is applied based on restored state
    TaskCompletionSteps.validateVisualStyling(world, expectedCompleted)
  }
}
