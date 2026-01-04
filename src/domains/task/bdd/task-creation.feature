Feature: Task Creation
  As a user
  I want to add new tasks to my todo list
  So that I can capture and organize things I need to accomplish

  Background:
    Given the task manager is initialized
    And the task list is empty

  Scenario: Successfully add a valid task
    When I enter "Buy groceries" as the task description
    And I submit the task
    Then a new task should be created with description "Buy groceries"
    And the task should be added to the task list
    And the task list should contain 1 task
    And the input field should be cleared
    And the task should be persisted to storage

  Scenario: Successfully add multiple tasks
    When I enter "Buy groceries" as the task description
    And I submit the task
    And I enter "Complete project documentation" as the task description
    And I submit the task
    And I enter "Schedule dentist appointment" as the task description
    And I submit the task
    Then the task list should contain 3 tasks
    And the tasks should be in the order they were added
    And all tasks should be persisted to storage

  Scenario: Task gets unique identifier
    When I enter "Buy groceries" as the task description
    And I submit the task
    Then the created task should have a unique identifier
    And the task should have a creation timestamp
    And the task should be marked as not completed by default

  Scenario: Input field focus management
    Given the input field is not focused
    When the input field receives focus
    Then the input field should provide visual feedback
    When I enter "Buy groceries" as the task description
    And I submit the task
    Then the input field should be cleared
    And the input field should remain focused for the next entry

  Scenario: Reject empty task description
    When I enter "" as the task description
    And I submit the task
    Then no task should be created
    And the task list should remain empty
    And an inline validation message should be displayed
    And the input field should remain focused

  Scenario: Reject whitespace-only task description
    When I enter "   " as the task description
    And I submit the task
    Then no task should be created
    And the task list should remain empty
    And an inline validation message should be displayed
    And the input field should remain focused

  Scenario: Reject task description with only tabs and newlines
    When I enter "\t\n" as the task description
    And I submit the task
    Then no task should be created
    And the task list should remain empty
    And an inline validation message should be displayed

  Scenario: Accept task with leading and trailing spaces (trimmed)
    When I enter "  Buy groceries  " as the task description
    And I submit the task
    Then a new task should be created with description "Buy groceries"
    And the task should be added to the task list
    And the task description should be trimmed of whitespace

  Scenario: Task creation via Enter key
    When I enter "Buy groceries" as the task description
    And I press the Enter key
    Then a new task should be created with description "Buy groceries"
    And the task should be added to the task list
    And the input field should be cleared

  Scenario: Task creation via Add button click
    When I enter "Buy groceries" as the task description
    And I click the add button
    Then a new task should be created with description "Buy groceries"
    And the task should be added to the task list
    And the input field should be cleared

  Scenario: Immediate persistence after task creation
    Given local storage is empty
    When I enter "Buy groceries" as the task description
    And I submit the task
    Then the task should be immediately saved to local storage
    And local storage should contain the task data
    And the storage format should include version information