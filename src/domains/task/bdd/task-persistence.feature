Feature: Task Persistence and Loading
  As a user
  I want my tasks to persist between sessions
  So that I don't lose my work when I close and reopen the application

  Background:
    Given the task manager is initialized

  Scenario: Load tasks from empty storage on application start
    Given local storage is empty
    When the application starts
    Then the task list should be empty
    And no error should occur
    And the application should initialize successfully

  Scenario: Load previously saved tasks on application start
    Given local storage contains saved tasks:
      | description              | completed | createdAt           |
      | Buy groceries           | false     | 2024-01-01T10:00:00Z |
      | Complete documentation  | true      | 2024-01-01T11:00:00Z |
      | Schedule appointment    | false     | 2024-01-01T12:00:00Z |
    When the application starts
    Then the task list should contain 3 tasks
    And the tasks should be loaded with their original descriptions
    And the tasks should be loaded with their original completion status
    And the tasks should be loaded with their original creation timestamps
    And the tasks should be displayed in the correct order

  Scenario: Restore complete task state including completion status
    Given local storage contains a completed task "Buy groceries"
    And local storage contains an incomplete task "Complete documentation"
    When the application starts
    Then the task "Buy groceries" should be marked as completed
    And the task "Complete documentation" should be marked as incomplete
    And the completion status should be visually indicated correctly

  Scenario: Immediate synchronization after task creation
    Given the application is running
    And local storage is empty
    When I create a new task "Buy groceries"
    Then the task should be immediately saved to local storage
    And local storage should contain the task data
    And the storage format should include version information
    And the storage should be valid JSON

  Scenario: Immediate synchronization after task completion toggle
    Given the application is running
    And I have a task "Buy groceries" that is incomplete
    When I mark the task as completed
    Then the task completion status should be immediately saved to local storage
    And local storage should reflect the updated completion status
    When I mark the task as incomplete again
    Then the task completion status should be immediately updated in local storage

  Scenario: Immediate synchronization after task deletion
    Given the application is running
    And I have tasks:
      | description              | completed |
      | Buy groceries           | false     |
      | Complete documentation  | true      |
    When I delete the task "Buy groceries"
    Then the task should be immediately removed from local storage
    And local storage should only contain "Complete documentation"
    And the remaining task data should be intact

  Scenario: Handle corrupted storage data gracefully
    Given local storage contains corrupted data
    When the application starts
    Then the application should initialize with an empty task list
    And no error should be thrown
    And the application should remain functional
    And a new valid storage structure should be created

  Scenario: Handle invalid JSON in storage
    Given local storage contains invalid JSON data
    When the application starts
    Then the application should initialize with an empty task list
    And the corrupted data should be handled gracefully
    And the application should create a fresh storage structure

  Scenario: Handle missing version information in storage
    Given local storage contains task data without version information
    When the application starts
    Then the application should load the tasks successfully
    And the application should add version information to the storage
    And the tasks should be displayed correctly

  Scenario: Handle storage with wrong version format
    Given local storage contains task data with version "2.0"
    When the application starts
    Then the application should handle the version mismatch gracefully
    And the application should either migrate or initialize with empty state
    And no errors should occur

  Scenario: Verify storage format consistency
    Given the application is running
    When I create multiple tasks:
      | description              | completed |
      | Buy groceries           | false     |
      | Complete documentation  | true      |
      | Schedule appointment    | false     |
    Then local storage should contain a valid JSON structure
    And the storage should include a "tasks" array
    And the storage should include version information "1.0"
    And each task should have id, description, completed, and createdAt fields
    And all task IDs should be unique
    And all creation timestamps should be valid dates

  Scenario: Persistence survives application restart simulation
    Given the application is running
    And I create a task "Buy groceries"
    And I mark the task as completed
    When I simulate an application restart
    Then the task "Buy groceries" should still exist
    And the task should still be marked as completed
    And the task should have the same ID and creation timestamp

  Scenario: Large task list persistence
    Given the application is running
    When I create 50 tasks with descriptions "Task 1" through "Task 50"
    And I mark every other task as completed
    And I simulate an application restart
    Then all 50 tasks should be restored
    And the completion status of each task should be preserved
    And the tasks should be in the correct order
    And no data should be lost or corrupted

  Scenario: Storage quota handling (edge case)
    Given local storage is nearly full
    When I attempt to create a new task "Important task"
    Then the application should handle storage quota gracefully
    And either the task should be saved successfully
    Or an appropriate error should be displayed to the user
    And the application should remain functional

  Scenario: Concurrent storage operations
    Given the application is running
    When I rapidly create multiple tasks in quick succession:
      | description    |
      | Task A        |
      | Task B        |
      | Task C        |
    Then all tasks should be saved to local storage
    And no data should be lost due to race conditions
    And the storage should remain in a consistent state
    And all tasks should be retrievable after restart