import React from 'react'
import {
    Box,
    List,
    ListItem,
    Typography,
    Paper,
    Divider,
} from '@mui/material'
import { CheckCircleOutline as CheckIcon, Assignment as TaskIcon } from '@mui/icons-material'
import { Task } from '../../../SHARED/contracts/task/v1'
import { TaskItem } from './TaskItem'
import Logger from '../../../SHARED/logger/Logger'

/**
 * TaskList Component
 * 
 * Material UI component for displaying a list of tasks with:
 * - MUI List container with proper styling
 * - Empty state with MUI Typography guidance
 * - Task ordering and responsive layout
 * - EventBus integration for task operations
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

interface TaskListProps {
    /** Array of tasks to display */
    tasks: Task[]
    /** Optional callback when a task is toggled */
    onTaskToggle?: (taskId: string, completed: boolean) => void
    /** Optional callback when a task is deleted */
    onTaskDelete?: (taskId: string) => void
    /** Optional loading state */
    loading?: boolean
    /** Optional error message */
    error?: string
}

export function TaskList({
    tasks,
    onTaskToggle,
    onTaskDelete,
    loading = false,
    error
}: TaskListProps) {
    const logger = Logger.getInstance()

    // Handle task toggle
    const handleTaskToggle = (taskId: string, completed: boolean) => {
        logger.debug('TaskList: Task toggle requested', {
            taskId,
            completed
        })

        if (onTaskToggle) {
            onTaskToggle(taskId, completed)
        }
    }

    // Handle task delete
    const handleTaskDelete = (taskId: string) => {
        logger.debug('TaskList: Task delete requested', {
            taskId
        })

        if (onTaskDelete) {
            onTaskDelete(taskId)
        }
    }

    // Show error state
    if (error) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'error.light',
                    borderColor: 'error.main',
                }}
            >
                <Typography variant="h6" color="error.main" gutterBottom>
                    Error Loading Tasks
                </Typography>
                <Typography variant="body2" color="error.dark">
                    {error}
                </Typography>
            </Paper>
        )
    }

    // Show loading state
    if (loading) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'action.hover',
                }}
            >
                <Typography variant="body1" color="text.secondary">
                    Loading tasks...
                </Typography>
            </Paper>
        )
    }

    // Show empty state
    if (tasks.length === 0) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'background.default',
                    borderStyle: 'dashed',
                    borderColor: 'divider',
                }}
            >
                <TaskIcon
                    sx={{
                        fontSize: 48,
                        color: 'text.secondary',
                        mb: 2,
                    }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No tasks yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Add your first task above to get started organizing your work.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tasks you create will appear here and can be marked as complete or deleted.
                </Typography>
            </Paper>
        )
    }

    // Separate completed and active tasks
    const activeTasks = tasks.filter(task => !task.completed)
    const completedTasks = tasks.filter(task => task.completed)

    return (
        <Box>
            {/* Active Tasks Section */}
            {activeTasks.length > 0 && (
                <Box mb={completedTasks.length > 0 ? 3 : 0}>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1, fontWeight: 600 }}
                    >
                        Active Tasks ({activeTasks.length})
                    </Typography>
                    <Paper variant="outlined">
                        <List disablePadding>
                            {activeTasks.map((task, index) => (
                                <React.Fragment key={task.id}>
                                    <ListItem disablePadding>
                                        <TaskItem
                                            task={task}
                                            onToggle={handleTaskToggle}
                                            onDelete={handleTaskDelete}
                                        />
                                    </ListItem>
                                    {index < activeTasks.length - 1 && (
                                        <Divider variant="inset" component="li" />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Box>
            )}

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
                <Box>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1, fontWeight: 600 }}
                    >
                        <CheckIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Completed Tasks ({completedTasks.length})
                    </Typography>
                    <Paper
                        variant="outlined"
                        sx={{
                            backgroundColor: 'action.hover',
                            borderColor: 'success.light',
                        }}
                    >
                        <List disablePadding>
                            {completedTasks.map((task, index) => (
                                <React.Fragment key={task.id}>
                                    <ListItem disablePadding>
                                        <TaskItem
                                            task={task}
                                            onToggle={handleTaskToggle}
                                            onDelete={handleTaskDelete}
                                        />
                                    </ListItem>
                                    {index < completedTasks.length - 1 && (
                                        <Divider variant="inset" component="li" />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Box>
            )}
        </Box>
    )
}

export default TaskList