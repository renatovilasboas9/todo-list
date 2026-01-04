Feature: Task Completion
  As a user
  I want to mark tasks as complete
  So that I can track my progress and feel accomplished

  Background:
    Given the task manager is initialized
    And I have a task "Buy groceries" in the task list
    And the task is initially marked as not completed

  Scenario: Toggle task completion status via checkbox
    When I click on the task checkbox
    Then the task completion status should be toggled to completed
    And the task should be marked as completed in the task list
    And the completion change should be persisted to storage immediately

  Scenario: Toggle completed task back to active
    Given the task "Buy groceries" is marked as completed
    When I click on the task checkbox
    Then the task completion status should be toggled to not completed
    And the task should be restored to its active state
    And the completion change should be persisted to storage immediately

  Scenario: Visual styling for completed task
    When I click on the task checkbox to mark it as complete
    Then the task should display visual styling to indicate completion
    And the task description should show completion styling
    And the checkbox should show a checked state

  Scenario: Visual styling removed when task unmarked
    Given the task "Buy groceries" is marked as completed
    And the task displays completion styling
    When I click on the task checkbox to unmark it
    Then the completion styling should be removed
    And the task should display active styling
    And the checkbox should show an unchecked state

  Scenario: Multiple task completion states
    Given I have multiple tasks in the task list:
      | description              | completed |
      | Buy groceries           | false     |
      | Complete documentation  | false     |
      | Schedule appointment    | false     |
    When I mark "Buy groceries" as completed
    And I mark "Schedule appointment" as completed
    Then "Buy groceries" should be marked as completed
    And "Complete documentation" should remain not completed
    And "Schedule appointment" should be marked as completed
    And all completion states should be persisted to storage

  Scenario: Task completion round-trip consistency
    Given the task "Buy groceries" is not completed
    When I toggle the task completion twice
    Then the task should return to its original not completed state
    And the final state should be persisted to storage

  Scenario: Immediate persistence of completion changes
    Given local storage contains the task in not completed state
    When I mark the task as completed
    Then the task should be immediately saved to local storage
    And local storage should reflect the completed state
    And the storage format should maintain version information

  Scenario: Completion state restoration from storage
    Given I have marked "Buy groceries" as completed
    And the completion state is persisted to storage
    When the application is restarted
    And tasks are loaded from storage
    Then "Buy groceries" should be restored as completed
    And the visual styling should reflect the completed state

  Scenario: Completion toggle preserves other task properties
    Given the task "Buy groceries" has properties:
      | property    | value                    |
      | id          | task-123                 |
      | description | Buy groceries            |
      | createdAt   | 2024-01-01T10:00:00.000Z |
      | completed   | false                    |
    When I toggle the task completion status
    Then only the completed property should change to true
    And all other properties should remain unchanged
    And the task should maintain its identity and creation timestamp

  Scenario: Completion status affects task ordering
    Given I have multiple tasks with different completion states:
      | description              | completed |
      | Buy groceries           | true      |
      | Complete documentation  | false     |
      | Schedule appointment    | true      |
    When I view the task list
    Then tasks should maintain their original creation order
    And completed tasks should display with completion styling
    And active tasks should display with active styling
    And the ordering should be preserved in storage