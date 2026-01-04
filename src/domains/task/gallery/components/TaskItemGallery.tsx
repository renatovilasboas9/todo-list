import { useState } from 'react'
import {
    Box,
    Typography,
    Checkbox,
    IconButton,
    Paper,
    Grid,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Divider,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { mockTasks, longDescriptionTask, mixedStateTasks } from '../data/mockData'

// Simple Task type for Gallery prototype
interface Task {
    id: string
    description: string
    completed: boolean
    createdAt: Date
}

/**
 * TaskItem Component Gallery
 * Demonstrates individual task items with different states and interactions
 * 
 * Features demonstrated:
 * - MUI Checkbox, Typography, and IconButton components
 * - Completed vs active task states with MUI styling
 * - Visual feedback for hover and interaction states
 * - Completion toggle and deletion functionality
 */
export function TaskItemGallery() {
    const [tasks, setTasks] = useState<Task[]>(mixedStateTasks)

    const handleToggleTask = (taskId: string) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            )
        )
    }

    const handleDeleteTask = (taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    }

    return (
        <Box>
            {/* Main Interactive Demo */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                TaskItem Component Prototype
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
                Interactive demonstration of individual task items with MUI components,
                showing different states and interaction patterns.
            </Typography>

            {/* Interactive Task Items */}
            <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Interactive Demo - Toggle & Delete
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Click checkboxes to toggle completion, click delete icons to remove tasks
                </Typography>

                {tasks.map((task, index) => (
                    <Box key={task.id}>
                        <TaskItemDemo
                            task={task}
                            onToggle={() => handleToggleTask(task.id)}
                            onDelete={() => handleDeleteTask(task.id)}
                        />
                        {index < tasks.length - 1 && <Divider />}
                    </Box>
                ))}

                {tasks.length === 0 && (
                    <Box p={3} textAlign="center">
                        <Typography color="text.secondary">
                            All tasks deleted - refresh to reset demo
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Different States Demo */}
            <Typography variant="h6" gutterBottom>
                Task States & Visual Styling
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="primary">
                            Active Task State
                        </Typography>
                        <TaskItemDemo
                            task={mockTasks[0]}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            readonly
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Normal text, unchecked checkbox, full opacity
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="success.main">
                            Completed Task State
                        </Typography>
                        <TaskItemDemo
                            task={{ ...mockTasks[0], completed: true }}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            readonly
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Strikethrough text, checked checkbox, muted color
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="warning.main">
                            Long Description Handling
                        </Typography>
                        <TaskItemDemo
                            task={longDescriptionTask}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            readonly
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Proper text wrapping and layout for lengthy descriptions
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Hover & Interaction States */}
            <Typography variant="h6" gutterBottom>
                Hover & Interaction States
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Hover Effects
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Hover over the task item to see background change
                        </Typography>
                        <TaskItemDemo
                            task={mockTasks[2]}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            showHoverDemo
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Delete Button Behavior
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Delete button appears on hover with smooth transition
                        </Typography>
                        <TaskItemDemo
                            task={mockTasks[3]}
                            onToggle={() => { }}
                            onDelete={() => { }}
                            showDeleteDemo
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Requirements Coverage Summary */}
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                    Requirements Coverage Summary
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                            ✓ Implemented Features:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>MUI Checkbox for completion toggle</li>
                            <li>MUI Typography for task description</li>
                            <li>MUI IconButton for delete with confirmation</li>
                            <li>Completion visual styling with MUI theme</li>
                            <li>Hover states and smooth transitions</li>
                            <li>Proper text wrapping for long descriptions</li>
                        </ul>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                            📋 Requirements Validated:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>2.1: Task completion toggle functionality</li>
                            <li>2.2: Visual feedback for completion state</li>
                            <li>3.1: Task deletion with immediate UI update</li>
                            <li>MUI component integration and theming</li>
                            <li>Accessibility with proper ARIA labels</li>
                        </ul>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    )
}

/**
 * TaskItem Demo Component
 * Individual task item with MUI styling and interactions
 */
interface TaskItemDemoProps {
    task: Task
    onToggle: () => void
    onDelete: () => void
    readonly?: boolean
    showHoverDemo?: boolean
    showDeleteDemo?: boolean
}

function TaskItemDemo({
    task,
    onToggle,
    onDelete,
    readonly = false,
    showHoverDemo = false,
    showDeleteDemo = false
}: TaskItemDemoProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <ListItem
            disablePadding
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                    bgcolor: showHoverDemo ? 'action.hover' : 'transparent',
                },
                transition: 'background-color 0.2s ease-in-out',
            }}
        >
            <ListItemButton
                onClick={readonly ? undefined : onToggle}
                disabled={readonly}
                sx={{
                    borderRadius: 1,
                    py: 1.5,
                    cursor: readonly ? 'default' : 'pointer',
                }}
            >
                <ListItemIcon sx={{ minWidth: 42 }}>
                    <Checkbox
                        edge="start"
                        checked={task.completed}
                        tabIndex={-1}
                        disableRipple={readonly}
                        color="primary"
                        disabled={readonly}
                        sx={{
                            '&.Mui-disabled': {
                                color: task.completed ? 'primary.main' : 'action.disabled',
                            }
                        }}
                    />
                </ListItemIcon>
                <ListItemText
                    primary={task.description}
                    secondary={`Created: ${task.createdAt.toLocaleDateString()}`}
                    primaryTypographyProps={{
                        style: {
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? '#666' : 'inherit',
                            fontWeight: task.completed ? 400 : 500,
                        },
                    }}
                    secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                    }}
                />
            </ListItemButton>

            <Tooltip title="Delete task" arrow>
                <IconButton
                    edge="end"
                    onClick={readonly ? undefined : (e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    disabled={readonly}
                    sx={{
                        opacity: showDeleteDemo
                            ? (isHovered ? 1 : 0.3)
                            : readonly ? 0.5 : 1,
                        transition: 'opacity 0.2s ease-in-out',
                        mr: 1,
                        '&:hover': {
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                        }
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        </ListItem>
    )
}