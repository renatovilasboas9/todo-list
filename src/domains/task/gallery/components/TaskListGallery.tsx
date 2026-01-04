import { useState } from 'react'
import {
    Box,
    Typography,
    List,
    Paper,
    Grid,
    Container,
    Button,
    Fade,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    IconButton,
    Divider,
    Chip,
    Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import { mockTasks, emptyTaskList, singleTask } from '../data/mockData'

// Simple Task type for Gallery prototype
interface Task {
    id: string
    description: string
    completed: boolean
    createdAt: Date
}

/**
 * TaskList Component Gallery
 * Demonstrates the task list container with different states and layouts
 * 
 * Features demonstrated:
 * - MUI List and ListItem components
 * - Empty state with MUI Typography and helpful guidance
 * - Responsive layout with MUI Grid/Container
 * - Multiple tasks and empty state handling
 */
export function TaskListGallery() {
    const [currentTasks, setCurrentTasks] = useState<Task[]>(mockTasks)

    const toggleTask = (taskId: string) => {
        setCurrentTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            )
        )
    }

    const deleteTask = (taskId: string) => {
        setCurrentTasks(prev => prev.filter(task => task.id !== taskId))
    }

    const clearCompleted = () => {
        setCurrentTasks(prev => prev.filter(task => !task.completed))
    }

    return (
        <Box>
            {/* Main Interactive Demo */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                TaskList Component Prototype
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
                Interactive demonstration of the task list container with MUI components,
                showing different states, responsive layout, and empty state handling.
            </Typography>

            {/* Interactive Task List */}
            <Paper variant="outlined" sx={{ mb: 4 }}>
                <TaskListDemo
                    tasks={currentTasks}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    title="Interactive Task List Demo"
                />
                <Divider />
                <Box p={2} display="flex" gap={1} flexWrap="wrap">
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCurrentTasks(mockTasks)}
                        disabled={currentTasks.length === mockTasks.length}
                    >
                        Reset Tasks
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCurrentTasks([])}
                        disabled={currentTasks.length === 0}
                        color="warning"
                    >
                        Clear All
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={clearCompleted}
                        disabled={!currentTasks.some(t => t.completed)}
                        color="success"
                    >
                        Clear Completed
                    </Button>
                </Box>
            </Paper>

            {/* Different List States */}
            <Typography variant="h6" gutterBottom>
                List States & Empty State Handling
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ height: 450 }}>
                        <Box p={2} bgcolor="primary.light" color="primary.contrastText">
                            <Typography variant="subtitle2">
                                Full List (5 tasks)
                            </Typography>
                        </Box>
                        <TaskListDemo
                            tasks={mockTasks}
                            onToggleTask={() => { }}
                            onDeleteTask={() => { }}
                            readonly
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ height: 450 }}>
                        <Box p={2} bgcolor="success.light" color="success.contrastText">
                            <Typography variant="subtitle2">
                                Single Task
                            </Typography>
                        </Box>
                        <TaskListDemo
                            tasks={singleTask}
                            onToggleTask={() => { }}
                            onDeleteTask={() => { }}
                            readonly
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ height: 450 }}>
                        <Box p={2} bgcolor="warning.light" color="warning.contrastText">
                            <Typography variant="subtitle2">
                                Empty State
                            </Typography>
                        </Box>
                        <TaskListDemo
                            tasks={emptyTaskList}
                            onToggleTask={() => { }}
                            onDeleteTask={() => { }}
                            readonly
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Responsive Layout Demo */}
            <Typography variant="h6" gutterBottom>
                Responsive Layout with MUI Grid & Container
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resize your browser window to see responsive behavior. Uses MUI breakpoints.
                </Typography>
                <Container maxWidth="md">
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TaskListDemo
                                tasks={mockTasks.slice(0, 2)}
                                onToggleTask={() => { }}
                                onDeleteTask={() => { }}
                                title="Mobile View"
                                compact
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TaskListDemo
                                tasks={mockTasks.slice(2, 4)}
                                onToggleTask={() => { }}
                                onDeleteTask={() => { }}
                                title="Tablet View"
                                compact
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TaskListDemo
                                tasks={mockTasks.slice(4, 5)}
                                onToggleTask={() => { }}
                                onDeleteTask={() => { }}
                                title="Desktop View"
                                compact
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Paper>

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
                            <li>MUI List and ListItem components</li>
                            <li>Empty state with helpful guidance</li>
                            <li>Responsive layout with MUI Grid/Container</li>
                            <li>Task ordering and visual hierarchy</li>
                            <li>Smooth animations and transitions</li>
                            <li>Progress indicators and status chips</li>
                        </ul>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                            📋 Requirements Validated:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>5.1: MUI List container with proper styling</li>
                            <li>5.2: Empty state with Typography guidance</li>
                            <li>5.3: Responsive layout with MUI breakpoints</li>
                            <li>5.4: Multiple tasks and empty state handling</li>
                            <li>MUI theme consistency and visual hierarchy</li>
                        </ul>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    )
}

/**
 * TaskList Demo Component
 * Reusable task list with MUI styling and different configurations
 */
interface TaskListDemoProps {
    tasks: Task[]
    onToggleTask: (taskId: string) => void
    onDeleteTask: (taskId: string) => void
    title?: string
    readonly?: boolean
    compact?: boolean
}

function TaskListDemo({
    tasks,
    onToggleTask,
    onDeleteTask,
    title,
    readonly = false,
    compact = false,
}: TaskListDemoProps) {
    const completedCount = tasks.filter(task => task.completed).length
    const totalCount = tasks.length

    return (
        <Box>
            {title && (
                <Box p={compact ? 1.5 : 2} borderBottom="1px solid" borderColor="divider">
                    <Typography variant={compact ? "subtitle2" : "h6"}>{title}</Typography>
                    {totalCount > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <Typography variant="caption" color="text.secondary">
                                {completedCount} of {totalCount} completed
                            </Typography>
                            <Chip
                                size="small"
                                label={`${Math.round((completedCount / totalCount) * 100)}%`}
                                color={completedCount === totalCount ? "success" : "primary"}
                                variant="outlined"
                            />
                        </Stack>
                    )}
                </Box>
            )}

            {tasks.length === 0 ? (
                <EmptyState compact={compact} />
            ) : (
                <List sx={{ py: 0 }} dense={compact}>
                    {tasks.map((task, index) => (
                        <Fade in key={task.id} timeout={300 + index * 100}>
                            <div>
                                <ListItem
                                    disablePadding
                                    sx={{
                                        '&:hover': {
                                            bgcolor: readonly ? 'transparent' : 'action.hover',
                                        },
                                        transition: 'background-color 0.2s ease-in-out',
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: compact ? 36 : 42, pl: compact ? 1 : 2 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={task.completed}
                                            onChange={readonly ? undefined : () => onToggleTask(task.id)}
                                            color="primary"
                                            disabled={readonly}
                                            size={compact ? "small" : "medium"}
                                            sx={{
                                                '&.Mui-disabled': {
                                                    color: task.completed ? 'primary.main' : 'action.disabled',
                                                }
                                            }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={task.description}
                                        secondary={compact ? undefined : task.createdAt.toLocaleDateString()}
                                        primaryTypographyProps={{
                                            variant: compact ? "body2" : "body1",
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
                                    {!readonly && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => onDeleteTask(task.id)}
                                            sx={{
                                                mr: compact ? 0.5 : 1,
                                                '&:hover': {
                                                    bgcolor: 'error.light',
                                                    color: 'error.contrastText',
                                                }
                                            }}
                                            size={compact ? "small" : "medium"}
                                        >
                                            <DeleteIcon fontSize={compact ? "small" : "medium"} />
                                        </IconButton>
                                    )}
                                </ListItem>
                                {index < tasks.length - 1 && <Divider variant="inset" component="li" />}
                            </div>
                        </Fade>
                    ))}
                </List>
            )}
        </Box>
    )
}

/**
 * Empty State Component
 * Displayed when there are no tasks with helpful guidance
 */
interface EmptyStateProps {
    compact?: boolean
}

function EmptyState({ compact = false }: EmptyStateProps) {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={compact ? 4 : 6}
            px={3}
            textAlign="center"
        >
            <TaskAltIcon
                sx={{
                    fontSize: compact ? 48 : 64,
                    color: 'text.disabled',
                    mb: compact ? 1 : 2
                }}
            />
            <Typography
                variant={compact ? "subtitle1" : "h6"}
                color="text.secondary"
                gutterBottom
            >
                No tasks yet
            </Typography>
            <Typography
                variant="body2"
                color="text.disabled"
                sx={{ mb: compact ? 2 : 3, maxWidth: 280 }}
            >
                Add your first task to get started with organizing your work and staying productive
            </Typography>
            <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled
                size={compact ? "small" : "medium"}
                sx={{ textTransform: 'none' }}
            >
                Add your first task
            </Button>
        </Box>
    )
}