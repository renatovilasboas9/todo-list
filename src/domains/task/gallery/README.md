# Task Manager UI Gallery

This gallery provides a comprehensive showcase of Material UI component prototypes for the task management system. It serves as a design validation and prototyping environment before implementing the actual components.

## Purpose

The Gallery follows the **BDD-first** development methodology by allowing us to:

1. **Prototype** UI components with Material UI
2. **Validate** design decisions and user interactions
3. **Test** different states and edge cases visually
4. **Demonstrate** responsive behavior and accessibility
5. **Iterate** on designs before implementation

## Structure

```
gallery/
├── index.html              # Gallery entry point
├── gallery.tsx             # Main gallery application
├── components/             # Component galleries
│   ├── TaskInputGallery.tsx    # Input component demos
│   ├── TaskItemGallery.tsx     # Task item demos
│   ├── TaskListGallery.tsx     # List component demos
│   └── TaskManagerAppGallery.tsx # Complete app demos
├── data/
│   └── mockData.ts         # Mock data for prototyping
└── README.md              # This file
```

## Features

### TaskInput Gallery
- **Interactive Demo**: Real-time validation with Zod schemas
- **Validation Test Cases**: Valid, invalid, and edge case inputs
- **MUI Integration**: TextField and Button components with proper styling
- **Keyboard Support**: Enter key submission
- **Error Handling**: Inline validation messages

### TaskItem Gallery
- **Interactive States**: Toggle completion and delete functionality
- **Visual States**: Active, completed, and long description variants
- **Hover Effects**: Interactive feedback on mouse hover
- **MUI Components**: Checkbox, Typography, IconButton integration
- **Accessibility**: Proper ARIA labels and keyboard navigation

### TaskList Gallery
- **Multiple States**: Full list, single task, and empty state
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: Fade transitions for task operations
- **Empty State**: Helpful guidance when no tasks exist
- **Statistics**: Task completion counters

### TaskManagerApp Gallery
- **Complete Layout**: Full application with AppBar and Container
- **Layout Variations**: Compact and mobile layouts
- **Integration**: All components working together
- **Theme Consistency**: Material UI theme applied throughout
- **Real Functionality**: Working task management with mock data

## Material UI Theme

The gallery uses a custom Material UI theme that defines:

- **Primary Color**: #1976d2 (Material Blue)
- **Typography**: Roboto font family with proper hierarchy
- **Component Overrides**: Consistent border radius and button styling
- **Responsive Breakpoints**: Mobile-first responsive design

## Mock Data

The gallery includes comprehensive mock data:

- **Sample Tasks**: Various task states and descriptions
- **Validation Cases**: Test inputs for validation scenarios
- **Edge Cases**: Long descriptions, empty states, etc.
- **Interactive State**: Gallery state management for demonstrations

## Usage

### Development
1. Open `index.html` in a browser
2. Navigate through different component sections
3. Interact with components to test behavior
4. Use browser dev tools to test responsive layouts

### Design Validation
1. Review component states and interactions
2. Validate Material UI integration
3. Test accessibility features
4. Confirm responsive behavior

### Before Implementation
1. Ensure all BDD scenarios are covered
2. Validate design decisions with stakeholders
3. Test edge cases and error states
4. Confirm accessibility compliance

## Integration with BDD

The Gallery validates BDD scenarios from:
- `task-creation.feature` - Input validation and task creation
- `task-completion.feature` - Task toggle functionality
- `task-deletion.feature` - Task removal operations
- `task-ui.feature` - Material UI integration and validation
- `task-persistence.feature` - State management (simulated)

## Next Steps

After Gallery validation:
1. Implement actual React components in `src/domains/task/components/`
2. Integrate with real services and repositories
3. Add comprehensive unit and integration tests
4. Implement E2E tests based on Gallery demonstrations

## Notes

- The Gallery uses in-memory mock data only
- No actual persistence or business logic is implemented
- Focus is on UI/UX validation and Material UI integration
- All interactions are simulated for demonstration purposes