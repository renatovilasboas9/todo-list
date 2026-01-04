Feature: Task Deletion
  As a user
  I want to delete tasks I no longer need
  So that I can keep my task list clean and relevant

  Background:
    Given the task manager is initialized
    And I have a task "Buy groceries" in the task list
    And I have a task "Complete project documentation" in the task list
    And I have a task "Schedule dentist appointment" in the task list

  Scenario: Successfully delete a task from the list
    When I click the delete button for task "Buy groceries"
    Then the task "Buy groceries" should be removed from the task list
    And the task list should contain 2 tasks
    And the remaining tasks should maintain their order
    And the deletion should be persisted to storage immediately

  Scenario: Delete task maintains list integrity
    Given the task list contains tasks in order:
      | description              | completed |
      | Buy groceries           | false     |
      | Complete documentation  | true      |
      | Schedule appointment    | false     |
    When I delete the task "Complete documentation"
    Then the task list should contain 2 tasks
    And the remaining tasks should be:
      | description              | completed |
      | Buy groceries           | false     |
      | Schedule appointment    | false     |
    And the task order should be preserved
    And all remaining tasks should be persisted to storage

  Scenario: Delete first task in list
    When I delete the first task in the list
    Then the task should be removed from the task list
    And the second task should become the first task
    And the task list should contain 2 tasks
    And the deletion should be persisted to storage immediately

  Scenario: Delete last task in list
    When I delete the last task in the list
    Then the task should be removed from the task list
    And the previous tasks should remain unchanged
    And the task list should contain 2 tasks
    And the deletion should be persisted to storage immediately

  Scenario: Delete middle task in list
    When I delete the middle task in the list
    Then the task should be removed from the task list
    And the first and last tasks should remain unchanged
    And the task list should contain 2 tasks
    And the deletion should be persisted to storage immediately

  Scenario: Delete completed task
    Given the task "Complete project documentation" is marked as completed
    When I delete the task "Complete project documentation"
    Then the completed task should be removed from the task list
    And the remaining tasks should maintain their completion states
    And the task list should contain 2 tasks
    And the deletion should be persisted to storage immediately

  Scenario: Delete task with unique identifier preservation
    Given the task "Buy groceries" has id "task-123"
    And the task "Schedule dentist appointment" has id "task-456"
    When I delete the task "Buy groceries"
    Then the task with id "task-123" should not exist in the task list
    And the task with id "task-456" should still exist in the task list
    And the remaining task should preserve all its properties
    And the deletion should be persisted to storage immediately

  Scenario: Delete single remaining task
    Given the task list contains only one task "Buy groceries"
    When I delete the task "Buy groceries"
    Then the task list should be empty
    And the task list should contain 0 tasks
    And the empty state should be persisted to storage
    And local storage should contain an empty task list

  Scenario: Attempt to delete non-existent task
    When I attempt to delete a task with id "non-existent-task"
    Then no task should be removed from the task list
    And the task list should remain unchanged
    And the task list should still contain 3 tasks
    And an error should be logged for the invalid deletion attempt

  Scenario: Delete task and verify storage format
    Given local storage contains all tasks with version information
    When I delete the task "Buy groceries"
    Then local storage should be updated immediately
    And the storage format should maintain version information
    And the deleted task should not appear in storage
    And the remaining tasks should be correctly serialized in storage

  Scenario: Delete task preserves creation timestamps
    Given tasks have different creation timestamps:
      | description              | createdAt                |
      | Buy groceries           | 2024-01-01T10:00:00.000Z |
      | Complete documentation  | 2024-01-01T11:00:00.000Z |
      | Schedule appointment    | 2024-01-01T12:00:00.000Z |
    When I delete the task "Complete documentation"
    Then the remaining tasks should preserve their original creation timestamps
    And the task "Buy groceries" should still have timestamp "2024-01-01T10:00:00.000Z"
    And the task "Schedule appointment" should still have timestamp "2024-01-01T12:00:00.000Z"
    And the timestamps should be correctly persisted to storage

  Scenario: Multiple consecutive deletions
    When I delete the task "Buy groceries"
    And I delete the task "Complete project documentation"
    Then the task list should contain 1 task
    And only the task "Schedule dentist appointment" should remain
    And each deletion should be persisted to storage immediately
    And the final storage state should contain only the remaining task

  Scenario: Delete task and verify UI updates
    When I delete the task "Buy groceries"
    Then the task should be immediately removed from the UI
    And the task list display should update to show 2 tasks
    And the remaining tasks should be displayed in their original order
    And no visual artifacts of the deleted task should remain

  Scenario: Delete task with confirmation behavior
    When I click the delete button for task "Buy groceries"
    Then the task should be immediately deleted without confirmation
    And the task should be removed from the task list
    And the deletion should be persisted to storage immediately
    And the UI should update to reflect the deletion

  Scenario: Immediate persistence after task deletion
    Given local storage contains all 3 tasks
    When I delete the task "Buy groceries"
    Then the task should be immediately removed from local storage
    And local storage should contain exactly 2 tasks
    And the storage format should include version information
    And the deleted task data should be completely removed from storage