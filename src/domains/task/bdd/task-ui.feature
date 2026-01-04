Feature: Task UI and Validation
  As a user
  I want to interact with a clean Material UI interface with proper validation
  So that I can manage tasks efficiently with clear visual feedback and guidance

  Background:
    Given the task manager is initialized with Material UI components

  Scenario: Display clean Material UI interface on application load
    When the application loads
    Then the interface should display Material UI components
    And the task entry area should be clearly visible using MUI TextField
    And the task list area should be clearly visible using MUI List
    And the interface should have consistent MUI spacing and typography
    And the MUI theme should be applied consistently across all components

  Scenario: Display task with description and completion status using MUI components
    Given I have a task "Buy groceries" that is not completed
    When the task is displayed in the task list
    Then the task should be rendered using MUI ListItem
    And the task description should be visible using MUI Typography
    And the completion status should be shown using MUI Checkbox
    And the task should display with active styling using MUI theme
    And all task properties should be clearly visible

  Scenario: Display completed task with proper MUI styling
    Given I have a task "Buy groceries" that is completed
    When the task is displayed in the task list
    Then the task should be rendered using MUI ListItem
    And the task description should show completion styling using MUI Typography
    And the checkbox should display checked state using MUI Checkbox
    And the task should have visual completion indicators
    And the MUI theme should reflect the completed state

  Scenario: Display helpful guidance when task list is empty
    Given the task list is empty
    When the application displays the task list
    Then the empty state should be shown using MUI Typography
    And helpful guidance for adding the first task should be displayed
    And the guidance should use appropriate MUI text styling
    And the empty state should be visually appealing and encouraging

  Scenario: Display multiple tasks in readable list format using MUI List
    Given I have multiple tasks in the task list:
      | description              | completed |
      | Buy groceries           | false     |
      | Complete documentation  | true      |
      | Schedule appointment    | false     |
    When the task list is displayed
    Then all tasks should be organized using MUI List components
    And each task should be rendered as a MUI ListItem
    And the list should have consistent MUI spacing between items
    And the tasks should be readable and well-organized
    And the MUI theme should provide visual hierarchy

  Scenario: Display inline validation for empty task input
    Given the task input field is focused
    When I attempt to submit an empty task description
    Then an inline validation message should be displayed using MUI form components
    And the validation message should be derived from Zod schema validation
    And the message should clearly indicate the input requirement
    And the MUI error styling should be applied to the input field
    And the validation should prevent form submission

  Scenario: Display inline validation for whitespace-only input
    Given the task input field is focused
    When I enter only whitespace characters "   " as the task description
    And I attempt to submit the task
    Then an inline validation message should be displayed using MUI form components
    And the validation message should indicate invalid input
    And the validation should be derived from Zod schema rules
    And the MUI error styling should be applied appropriately
    And the input should remain focused for correction

  Scenario: Clear validation messages when valid input is provided
    Given the task input field shows a validation error
    And the validation message is displayed using MUI components
    When I enter a valid task description "Buy groceries"
    Then the validation message should be cleared
    And the MUI error styling should be removed from the input field
    And the input field should return to normal MUI styling
    And the form should be ready for submission

  Scenario: Provide visual feedback when input field receives focus
    Given the input field is not focused
    When the input field receives focus
    Then the field should provide subtle visual feedback using MUI focus styles
    And the feedback should not disrupt the calm aesthetic
    And the MUI theme should handle the focus state appropriately
    And the visual feedback should be consistent with Material Design principles

  Scenario: Task input field behavior with MUI TextField
    Given the task input uses MUI TextField component
    When I interact with the input field
    Then the field should support Enter key submission
    And the field should support Add button click submission
    And the MUI TextField should handle focus management properly
    And the field should clear after successful task creation
    And the field should remain focused for the next entry

  Scenario: Task deletion confirmation using MUI components
    Given I have a task "Buy groceries" in the task list
    When I click the delete button (MUI IconButton)
    Then the task should be deleted immediately without confirmation dialog
    And the MUI IconButton should provide appropriate hover feedback
    And the task should be removed from the MUI List
    And the list should update smoothly with MUI transitions

  Scenario: Task completion toggle using MUI Checkbox
    Given I have a task "Buy groceries" that is not completed
    When I click on the MUI Checkbox
    Then the checkbox should toggle to checked state
    And the task description should update with completion styling
    And the MUI theme should reflect the state change
    And the visual feedback should be immediate and clear

  Scenario: Responsive layout with MUI Grid and Container
    Given the application is displayed on different screen sizes
    When the interface is rendered
    Then the layout should use MUI Grid or Container for responsiveness
    And the task list should adapt to different screen widths
    And the MUI breakpoints should be respected
    And the interface should remain usable on mobile and desktop

  Scenario: Accessibility compliance with MUI components
    Given the application uses MUI components throughout
    When the interface is rendered
    Then all MUI components should maintain accessibility features
    And the task input should have proper ARIA labels
    And the task list should be navigable with keyboard
    And the MUI components should support screen readers
    And the color contrast should meet accessibility standards

  Scenario: Consistent MUI theme application
    Given the application uses Material UI components
    When any component is rendered
    Then the MUI theme should be applied consistently
    And typography should follow MUI theme specifications
    And colors should use the defined MUI palette
    And spacing should use MUI theme spacing units
    And the visual hierarchy should be maintained across all components

  Scenario: Error boundary handling with MUI feedback
    Given an unexpected error occurs in the application
    When the error boundary is triggered
    Then the error should be displayed using MUI components
    And the error message should be user-friendly
    And the MUI styling should make the error clearly visible
    And the application should remain stable and recoverable

  Scenario: Loading states with MUI progress indicators
    Given the application is loading task data
    When the loading process is active
    Then loading feedback should be provided using MUI progress components
    And the loading state should not block user interaction unnecessarily
    And the MUI loading indicators should be visually appropriate
    And the loading state should transition smoothly to loaded state

  Scenario: Form validation integration with Zod and MUI
    Given the task input form uses Zod schema validation
    When validation occurs
    Then the validation messages should be displayed using MUI form helper text
    And the validation should integrate seamlessly with MUI form components
    And the error states should use MUI error styling
    And the validation should provide clear guidance for correction
    And the Zod schema should drive all validation logic

  Scenario: Task list updates with smooth MUI transitions
    Given I have tasks displayed in the MUI List
    When I add, complete, or delete a task
    Then the list updates should use smooth MUI transitions
    And the visual changes should be clear and not jarring
    And the MUI components should handle state changes gracefully
    And the user experience should feel polished and responsive

  Scenario: Keyboard navigation support with MUI components
    Given the application is displayed
    When I navigate using only the keyboard
    Then all interactive MUI components should be keyboard accessible
    And the tab order should be logical and intuitive
    And the MUI focus indicators should be clearly visible
    And all functionality should be available via keyboard
    And the keyboard navigation should follow Material Design guidelines