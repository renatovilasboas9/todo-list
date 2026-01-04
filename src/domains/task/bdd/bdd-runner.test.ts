import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

// Import the BDD world and step definitions
import { TaskManagerWorld } from './steps/common.steps.js'
import { TaskCreationSteps } from './steps/task-creation.steps.js'
import { TaskCompletionSteps } from './steps/task-completion.steps.js'
import { TaskDeletionSteps } from './steps/task-deletion.steps.js'
import { TaskUISteps } from './steps/task-ui.steps.js'

describe('BDD Framework', () => {
  it('should have proper BDD directory structure', () => {
    const bddPath = join(process.cwd(), 'src/domains/task/bdd')
    const stepsPath = join(bddPath, 'steps')

    expect(existsSync(bddPath)).toBe(true)
    expect(existsSync(stepsPath)).toBe(true)
    expect(existsSync(join(stepsPath, 'common.steps.ts'))).toBe(true)
  })

  it('should validate task creation scenarios', () => {
    const bddPath = join(process.cwd(), 'src/domains/task/bdd')
    const featureFiles = readdirSync(bddPath).filter((file) => file.endsWith('.feature'))

    if (featureFiles.length === 0) {
      console.log('No feature files found - BDD scenarios will be added in subsequent tasks')
      return
    }

    console.log(`Found ${featureFiles.length} feature file(s): ${featureFiles.join(', ')}`)

    // Test Scenario: Successfully add a valid task
    const world = new TaskManagerWorld()
    world.resetContext()

    // Given the task manager is initialized and task list is empty
    expect(world.context.tasks).toHaveLength(0)

    // When I enter "Buy groceries" and submit
    TaskCreationSteps.validateTaskCreation(world, 'Buy groceries')

    // Then validate all expected outcomes
    TaskCreationSteps.validateTaskCreated(world, 'Buy groceries')
    TaskCreationSteps.validateTaskInList(world)
    TaskCreationSteps.validateTaskCount(world, 1)
    TaskCreationSteps.validateInputCleared(world)
    TaskCreationSteps.validateTaskPersisted(world)
    TaskCreationSteps.validateTaskProperties(world)

    console.log('✓ Scenario: Successfully add a valid task - PASSED')
  })

  it('should validate task creation rejection scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Reject empty task description
    world.resetContext()

    // When I enter empty string and submit
    TaskCreationSteps.validateTaskCreation(world, '')

    // Then validate rejection
    TaskCreationSteps.validateNoTaskCreated(world)
    TaskCreationSteps.validateTaskListEmpty(world)
    TaskCreationSteps.validateValidationMessage(world)

    console.log('✓ Scenario: Reject empty task description - PASSED')

    // Test Scenario: Reject whitespace-only task description
    world.resetContext()

    // When I enter whitespace and submit
    TaskCreationSteps.validateTaskCreation(world, '   ')

    // Then validate rejection
    TaskCreationSteps.validateNoTaskCreated(world)
    TaskCreationSteps.validateTaskListEmpty(world)
    TaskCreationSteps.validateValidationMessage(world)

    console.log('✓ Scenario: Reject whitespace-only task description - PASSED')
  })

  it('should validate multiple task creation scenarios', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Successfully add multiple tasks
    TaskCreationSteps.validateTaskCreation(world, 'Buy groceries')
    TaskCreationSteps.validateTaskCreation(world, 'Complete project documentation')
    TaskCreationSteps.validateTaskCreation(world, 'Schedule dentist appointment')

    // Then validate multiple tasks
    TaskCreationSteps.validateTaskCount(world, 3)
    TaskCreationSteps.validateMultipleTasksInOrder(world)
    TaskCreationSteps.validateAllTasksPersisted(world)

    console.log('✓ Scenario: Successfully add multiple tasks - PASSED')
  })

  it('should validate task trimming scenarios', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Accept task with leading and trailing spaces (trimmed)
    TaskCreationSteps.validateTaskCreation(world, '  Buy groceries  ')

    // Then validate trimming
    TaskCreationSteps.validateTaskCreated(world, 'Buy groceries')
    TaskCreationSteps.validateDescriptionTrimmed(world)

    console.log('✓ Scenario: Accept task with leading and trailing spaces (trimmed) - PASSED')
  })

  it('should validate task completion scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Toggle task completion status via checkbox
    world.resetContext()
    const task = TaskCompletionSteps.setupTaskForCompletion(world, 'Buy groceries')

    // When I click on the task checkbox
    TaskCompletionSteps.clickTaskCheckbox(world)

    // Then validate completion toggle
    TaskCompletionSteps.validateTaskToggled(world, true)
    TaskCompletionSteps.validateTaskInListState(world, true)
    TaskCompletionSteps.validateCompletionPersisted(world)
    TaskCompletionSteps.validateVisualStyling(world, true)

    console.log('✓ Scenario: Toggle task completion status via checkbox - PASSED')

    // Test Scenario: Toggle completed task back to active
    TaskCompletionSteps.setupCompletedTask(world, 'Buy groceries')

    // When I click on the task checkbox again
    TaskCompletionSteps.clickTaskCheckbox(world)

    // Then validate toggle back to active
    TaskCompletionSteps.validateTaskToggled(world, false)
    TaskCompletionSteps.validateTaskInListState(world, false)
    TaskCompletionSteps.validateCompletionPersisted(world)
    TaskCompletionSteps.validateVisualStyling(world, false)

    console.log('✓ Scenario: Toggle completed task back to active - PASSED')
  })

  it('should validate task completion round-trip scenarios', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Task completion round-trip consistency
    const task = TaskCompletionSteps.setupTaskForCompletion(world, 'Buy groceries')
    const originalState = task.completed

    // When I toggle the task completion twice
    TaskCompletionSteps.toggleTaskTwice(world)

    // Then validate round-trip consistency
    TaskCompletionSteps.validateRoundTripConsistency(world, originalState)
    TaskCompletionSteps.validateCompletionPersisted(world)

    console.log('✓ Scenario: Task completion round-trip consistency - PASSED')
  })

  it('should validate multiple task completion scenarios', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Multiple task completion states
    const tasksData = [
      { description: 'Buy groceries', completed: false },
      { description: 'Complete documentation', completed: false },
      { description: 'Schedule appointment', completed: false },
    ]
    TaskCompletionSteps.setupMultipleTasks(world, tasksData)

    // When I mark specific tasks as completed
    TaskCompletionSteps.clickTaskCheckbox(world, 'Buy groceries')
    TaskCompletionSteps.clickTaskCheckbox(world, 'Schedule appointment')

    // Then validate multiple completion states
    TaskCompletionSteps.validateMultipleTaskStates(world, [
      { description: 'Buy groceries', completed: true },
      { description: 'Complete documentation', completed: false },
      { description: 'Schedule appointment', completed: true },
    ])
    TaskCompletionSteps.validateAllStatesPersisted(world)
    TaskCompletionSteps.validateTaskOrdering(world)

    console.log('✓ Scenario: Multiple task completion states - PASSED')
  })

  it('should validate task completion persistence and restoration', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Completion state restoration from storage
    TaskCompletionSteps.setupTaskForCompletion(world, 'Buy groceries')
    TaskCompletionSteps.clickTaskCheckbox(world) // Mark as completed

    // When the application is restarted
    TaskCompletionSteps.simulateApplicationRestart(world)

    // Then validate restoration
    TaskCompletionSteps.validateRestoredCompletionState(world, 'Buy groceries', true)

    console.log('✓ Scenario: Completion state restoration from storage - PASSED')
  })

  it('should validate task property preservation during completion', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Completion toggle preserves other task properties
    const task = TaskCompletionSteps.setupTaskForCompletion(world, 'Buy groceries')
    const originalProperties = {
      id: task.id,
      description: task.description,
      createdAt: task.createdAt.toISOString(),
      completed: task.completed,
    }

    // When I toggle the task completion status
    TaskCompletionSteps.clickTaskCheckbox(world)

    // Then validate property preservation
    TaskCompletionSteps.validateTaskPropertiesPreserved(world, originalProperties)

    console.log('✓ Scenario: Completion toggle preserves other task properties - PASSED')
  })

  it('should validate task deletion scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Successfully delete a task from the list
    world.resetContext()
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    // When I click the delete button for task "Buy groceries"
    TaskDeletionSteps.clickDeleteButton(world, 'Buy groceries')

    // Then validate deletion
    TaskDeletionSteps.validateTaskRemoved(world, 'Buy groceries')
    TaskDeletionSteps.validateTaskCount(world, 2)
    TaskDeletionSteps.validateRemainingTasksOrder(world)
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Successfully delete a task from the list - PASSED')

    // Test Scenario: Delete task maintains list integrity
    world.resetContext()
    const tasksData = [
      { description: 'Buy groceries', completed: false },
      { description: 'Complete documentation', completed: true },
      { description: 'Schedule appointment', completed: false },
    ]
    TaskDeletionSteps.setupTasksWithSpecificOrder(world, tasksData)

    // When I delete the middle task
    TaskDeletionSteps.clickDeleteButton(world, 'Complete documentation')

    // Then validate list integrity
    TaskDeletionSteps.validateTaskCount(world, 2)
    TaskDeletionSteps.validateRemainingTasksState(world, [
      { description: 'Buy groceries', completed: false },
      { description: 'Schedule appointment', completed: false },
    ])
    TaskDeletionSteps.validateTaskOrderPreserved(world)
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Delete task maintains list integrity - PASSED')
  })

  it('should validate positional task deletion scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Delete first task in list
    world.resetContext()
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    TaskDeletionSteps.deleteFirstTask(world)

    TaskDeletionSteps.validateTaskCount(world, 2)
    TaskDeletionSteps.validateSecondTaskBecomesFirst(world)
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Delete first task in list - PASSED')

    // Test Scenario: Delete last task in list
    world.resetContext()
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    TaskDeletionSteps.deleteLastTask(world)

    TaskDeletionSteps.validateTaskCount(world, 2)
    TaskDeletionSteps.validatePreviousTasksUnchanged(world)
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Delete last task in list - PASSED')

    // Test Scenario: Delete middle task in list
    world.resetContext()
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    TaskDeletionSteps.deleteMiddleTask(world)

    TaskDeletionSteps.validateTaskCount(world, 2)
    TaskDeletionSteps.validateFirstAndLastTasksUnchanged(world)
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Delete middle task in list - PASSED')
  })

  it('should validate task deletion with completion states', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Delete completed task
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    // Mark one task as completed
    const task = world.findTaskByDescription('Complete project documentation')
    if (task) {
      task.completed = true
      world.simulateStorageRestore(world.context.tasks)
    }

    // When I delete the completed task
    TaskDeletionSteps.clickDeleteButton(world, 'Complete project documentation')

    // Then validate deletion with completion state preservation
    TaskDeletionSteps.validateTaskRemoved(world, 'Complete project documentation')
    TaskDeletionSteps.validateTaskCount(world, 2)
    TaskDeletionSteps.validateCompletionStatesPreserved(world)
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Delete completed task - PASSED')
  })

  it('should validate task deletion with unique identifiers', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Delete task with unique identifier preservation
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)
    TaskDeletionSteps.setupTaskWithSpecificId(world, 'Buy groceries', 'task-123')
    TaskDeletionSteps.setupTaskWithSpecificId(world, 'Schedule dentist appointment', 'task-456')

    // When I delete the task with id "task-123"
    TaskDeletionSteps.clickDeleteButton(world, 'Buy groceries')

    // Then validate unique identifier handling
    TaskDeletionSteps.validateTaskWithIdNotExists(world, 'task-123')
    TaskDeletionSteps.validateTaskWithIdExists(world, 'task-456')
    TaskDeletionSteps.validateTaskPropertiesPreserved(world, 'task-456')
    TaskDeletionSteps.validateDeletionPersisted(world)

    console.log('✓ Scenario: Delete task with unique identifier preservation - PASSED')
  })

  it('should validate single task deletion and empty state', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Delete single remaining task
    TaskDeletionSteps.setupSingleTask(world, 'Buy groceries')

    // When I delete the only task
    TaskDeletionSteps.clickDeleteButton(world, 'Buy groceries')

    // Then validate empty state
    TaskDeletionSteps.validateEmptyTaskList(world)
    TaskDeletionSteps.validateTaskCount(world, 0)
    TaskDeletionSteps.validateEmptyStatePersisted(world)

    console.log('✓ Scenario: Delete single remaining task - PASSED')
  })

  it('should validate invalid deletion scenarios', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Attempt to delete non-existent task
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)
    const originalCount = world.context.tasks.length

    // When I attempt to delete a non-existent task
    TaskDeletionSteps.attemptDeleteNonExistentTask(world, 'non-existent-task')

    // Then validate no changes
    TaskDeletionSteps.validateTaskListUnchanged(world, originalCount)
    TaskDeletionSteps.validateErrorLogged(world)

    console.log('✓ Scenario: Attempt to delete non-existent task - PASSED')
  })

  it('should validate task deletion storage scenarios', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Delete task and verify storage format
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    // When I delete a task
    TaskDeletionSteps.clickDeleteButton(world, 'Buy groceries')

    // Then validate storage format and content
    TaskDeletionSteps.validateStorageFormat(world)
    TaskDeletionSteps.validateDeletedTaskNotInStorage(world, 'Buy groceries')
    TaskDeletionSteps.validateRemainingTasksInStorage(world)

    console.log('✓ Scenario: Delete task and verify storage format - PASSED')
  })

  it('should validate task deletion with timestamp preservation', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Delete task preserves creation timestamps
    const tasksData = [
      { description: 'Buy groceries', createdAt: '2024-01-01T10:00:00.000Z' },
      { description: 'Complete documentation', createdAt: '2024-01-01T11:00:00.000Z' },
      { description: 'Schedule appointment', createdAt: '2024-01-01T12:00:00.000Z' },
    ]
    TaskDeletionSteps.setupTasksWithTimestamps(world, tasksData)

    // When I delete the middle task
    TaskDeletionSteps.clickDeleteButton(world, 'Complete documentation')

    // Then validate timestamp preservation
    TaskDeletionSteps.validateTimestampsPreserved(world, [
      { description: 'Buy groceries', createdAt: '2024-01-01T10:00:00.000Z' },
      { description: 'Schedule appointment', createdAt: '2024-01-01T12:00:00.000Z' },
    ])
    TaskDeletionSteps.validateTimestampsInStorage(world)

    console.log('✓ Scenario: Delete task preserves creation timestamps - PASSED')
  })

  it('should validate multiple consecutive deletions', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Multiple consecutive deletions
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    // When I delete multiple tasks consecutively
    TaskDeletionSteps.performMultipleDeletions(world, [
      'Buy groceries',
      'Complete project documentation',
    ])

    // Then validate final state
    TaskDeletionSteps.validateTaskCount(world, 1)
    TaskDeletionSteps.validateOnlyTaskRemains(world, 'Schedule dentist appointment')
    TaskDeletionSteps.validateEachDeletionPersisted(world)
    TaskDeletionSteps.validateFinalStorageState(world)

    console.log('✓ Scenario: Multiple consecutive deletions - PASSED')
  })

  it('should validate task deletion UI updates', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Delete task and verify UI updates
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    // When I delete a task
    TaskDeletionSteps.clickDeleteButton(world, 'Buy groceries')

    // Then validate UI updates
    TaskDeletionSteps.validateUIUpdates(world)
    TaskDeletionSteps.validateNoVisualArtifacts(world)
    TaskDeletionSteps.validateImmediateDeletion(world)

    console.log('✓ Scenario: Delete task and verify UI updates - PASSED')
  })

  it('should validate immediate persistence after task deletion', () => {
    const world = new TaskManagerWorld()
    world.resetContext()

    // Test Scenario: Immediate persistence after task deletion
    TaskDeletionSteps.setupMultipleTasksForDeletion(world)

    // When I delete a task
    TaskDeletionSteps.clickDeleteButton(world, 'Buy groceries')

    // Then validate immediate persistence
    TaskDeletionSteps.validateStorageTaskCount(world, 2)
    TaskDeletionSteps.validateStorageFormat(world)
    TaskDeletionSteps.validateDeletedTaskRemovedFromStorage(world)

    console.log('✓ Scenario: Immediate persistence after task deletion - PASSED')
  })

  it('should validate Material UI interface scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Display clean Material UI interface on application load
    world.resetContext()

    // When the application loads
    TaskUISteps.validateMUIInterfaceLoad(world)

    console.log('✓ Scenario: Display clean Material UI interface on application load - PASSED')

    // Test Scenario: Display task with description and completion status using MUI components
    world.resetContext()
    world.addTask('Buy groceries')

    TaskUISteps.validateTaskDisplayWithMUI(world, 'Buy groceries', false)

    console.log(
      '✓ Scenario: Display task with description and completion status using MUI components - PASSED'
    )

    // Test Scenario: Display completed task with proper MUI styling
    world.resetContext()
    const task = world.addTask('Buy groceries')
    task.completed = true

    TaskUISteps.validateTaskDisplayWithMUI(world, 'Buy groceries', true)

    console.log('✓ Scenario: Display completed task with proper MUI styling - PASSED')
  })

  it('should validate Material UI empty state and list scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Display helpful guidance when task list is empty
    world.resetContext()

    TaskUISteps.validateEmptyStateWithMUI(world)

    console.log('✓ Scenario: Display helpful guidance when task list is empty - PASSED')

    // Test Scenario: Display multiple tasks in readable list format using MUI List
    world.resetContext()
    const tasksData = [
      { description: 'Buy groceries', completed: false },
      { description: 'Complete documentation', completed: true },
      { description: 'Schedule appointment', completed: false },
    ]

    tasksData.forEach((taskData) => {
      const task = world.addTask(taskData.description)
      task.completed = taskData.completed
    })

    TaskUISteps.validateMultipleTasksMUIList(world, tasksData)

    console.log(
      '✓ Scenario: Display multiple tasks in readable list format using MUI List - PASSED'
    )
  })

  it('should validate inline validation scenarios with MUI and Zod', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Display inline validation for empty task input
    world.resetContext()

    TaskUISteps.validateInlineValidationEmpty(world)

    console.log('✓ Scenario: Display inline validation for empty task input - PASSED')

    // Test Scenario: Display inline validation for whitespace-only input
    world.resetContext()

    TaskUISteps.validateInlineValidationWhitespace(world)

    console.log('✓ Scenario: Display inline validation for whitespace-only input - PASSED')

    // Test Scenario: Clear validation messages when valid input is provided
    world.resetContext()

    TaskUISteps.validateValidationCleared(world, 'Buy groceries')

    console.log('✓ Scenario: Clear validation messages when valid input is provided - PASSED')

    // Test Scenario: Form validation integration with Zod and MUI
    world.resetContext()

    TaskUISteps.validateZodMUIIntegration(world)

    console.log('✓ Scenario: Form validation integration with Zod and MUI - PASSED')
  })

  it('should validate MUI component interaction scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Provide visual feedback when input field receives focus
    world.resetContext()

    TaskUISteps.validateFocusVisualFeedback(world)

    console.log('✓ Scenario: Provide visual feedback when input field receives focus - PASSED')

    // Test Scenario: Task input field behavior with MUI TextField
    world.resetContext()

    TaskUISteps.validateMUITextFieldBehavior(world)

    console.log('✓ Scenario: Task input field behavior with MUI TextField - PASSED')

    // Test Scenario: Task deletion confirmation using MUI components
    world.resetContext()
    world.addTask('Buy groceries')

    TaskUISteps.validateMUIDeleteButton(world, 'Buy groceries')

    console.log('✓ Scenario: Task deletion confirmation using MUI components - PASSED')

    // Test Scenario: Task completion toggle using MUI Checkbox
    world.resetContext()
    world.addTask('Buy groceries')

    TaskUISteps.validateMUICheckboxToggle(world, 'Buy groceries')

    console.log('✓ Scenario: Task completion toggle using MUI Checkbox - PASSED')
  })

  it('should validate MUI responsive and accessibility scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Responsive layout with MUI Grid and Container
    world.resetContext()

    TaskUISteps.validateResponsiveLayout(world)

    console.log('✓ Scenario: Responsive layout with MUI Grid and Container - PASSED')

    // Test Scenario: Accessibility compliance with MUI components
    world.resetContext()

    TaskUISteps.validateAccessibilityCompliance(world)

    console.log('✓ Scenario: Accessibility compliance with MUI components - PASSED')

    // Test Scenario: Keyboard navigation support with MUI components
    world.resetContext()

    TaskUISteps.validateKeyboardNavigationMUI(world)

    console.log('✓ Scenario: Keyboard navigation support with MUI components - PASSED')
  })

  it('should validate MUI theme and visual consistency scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Consistent MUI theme application
    world.resetContext()

    TaskUISteps.validateConsistentMUITheme(world)

    console.log('✓ Scenario: Consistent MUI theme application - PASSED')

    // Test Scenario: Task list updates with smooth MUI transitions
    world.resetContext()
    world.addTask('Buy groceries')

    TaskUISteps.validateSmoothMUITransitions(world)

    console.log('✓ Scenario: Task list updates with smooth MUI transitions - PASSED')
  })

  it('should validate MUI error handling and loading scenarios', () => {
    const world = new TaskManagerWorld()

    // Test Scenario: Error boundary handling with MUI feedback
    world.resetContext()

    TaskUISteps.validateErrorBoundaryMUI(world)

    console.log('✓ Scenario: Error boundary handling with MUI feedback - PASSED')

    // Test Scenario: Loading states with MUI progress indicators
    world.resetContext()

    TaskUISteps.validateLoadingStatesMUI(world)

    console.log('✓ Scenario: Loading states with MUI progress indicators - PASSED')
  })
})
