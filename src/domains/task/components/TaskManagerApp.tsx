import React, { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Container,
    Typography,
    Paper,
    Alert,
    Snackbar,
    CircularProgress,
} from '@mui/material'
import { Assignment as TaskIcon } from '@mui/icons-material'
import { Task } from '../../../SHARED/contracts/task/v1'
import { TaskInput } from './TaskInput'
import { TaskList } from './TaskList'
import { eventBus } from '../../../SHARED/eventbus'
import Logger from '../../../SHARED/logger/Logger'
import { CorrelationUtils } from '../../../SHARED/logger/CorrelationUtils'

/**
 * TaskManagerApp Component
 * 
 * Main application component that:
 * - Integrates all child components with MUI theme
 * - Sets up EventBus connections and error boundaries
 * - Initializes application state from storage
 * - Handles application-level logging and correlation
 * 
 * Requirements: All requirements (integration)
 */

interface TaskManagerAppProps {
    /** Optional initial tasks for testing */
    initialTasks?: Task[]
    /** Optional callback for task state changes */
    onTasksChange?: (tasks: Task[]) => void
}

export function TaskManagerApp({ initialTasks = [], onTasksChange }: TaskManagerAppProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const logger = Logger.getInstance()

    // Handle task state updates
    const updateTasks = useCallback((newTasks: Task[]) => {
        setTasks(newTasks)
        if (onTasksChange) {
            onTasksChange(newTasks)
        }
    }, [onTasksChange])

    // Initialize application and load tasks
    useEffect(() => {
        const correlationId = CorrelationUtils.startSystemOperation('TaskManagerApp.initialize')

        logger.info('TaskManagerApp: Initializing application', {
            correlationId,
            initialTaskCount: initialTasks.length
        })

        // Set up EventBus subscriptions
        const subscriptions = [
            // Handle successful task creation
            eventBus.subscribe('DOMAIN.TASK.CREATED', (event) => {
                logger.debug('TaskManagerApp: Task created', {
                    correlationId,
                    taskId: event.payload.id
                })

                setTasks(prevTasks => [...prevTasks, event.payload])
                setSuccessMessage('Task created successfully')
            }),

            // Handle successful task toggle
            eventBus.subscribe('DOMAIN.TASK.TOGGLED', (event) => {
                logger.debug('TaskManagerApp: Task toggled', {
                    correlationId,
                    taskId: event.payload.id,
                    completed: event.payload.completed
                })

                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === event.payload.id ? event.payload : task
                    )
                )
                setSuccessMessage(
                    event.payload.completed ? 'Task completed!' : 'Task reactivated'
                )
            }),

            // Handle successful task deletion
            eventBus.subscribe('DOMAIN.TASK.DELETED', (event) => {
                logger.debug('TaskManagerApp: Task deleted', {
                    correlationId,
                    taskId: event.payload.taskId
                })

                setTasks(prevTasks =>
                    prevTasks.filter(task => task.id !== event.payload.taskId)
                )
                setSuccessMessage('Task deleted')
            }),

            // Handle task loading
            eventBus.subscribe('DOMAIN.TASK.LOADED', (event) => {
                logger.debug('TaskManagerApp: Tasks loaded', {
                    correlationId,
                    taskCount: event.payload.tasks.length
                })

                updateTasks(event.payload.tasks)
                setLoading(false)
            }),

            // Handle errors
            eventBus.subscribe('DOMAIN.TASK.CREATE_FAILED', (event) => {
                logger.error('TaskManagerApp: Task creation failed', new Error(event.payload.error), {
                    correlationId
                })
                setError(`Failed to create task: ${event.payload.error}`)
            }),

            eventBus.subscribe('DOMAIN.TASK.TOGGLE_FAILED', (event) => {
                logger.error('TaskManagerApp: Task toggle failed', new Error(event.payload.error), {
                    correlationId
                })
                setError(`Failed to toggle task: ${event.payload.error}`)
            }),

            eventBus.subscribe('DOMAIN.TASK.DELETE_FAILED', (event) => {
                logger.error('TaskManagerApp: Task deletion failed', new Error(event.payload.error), {
                    correlationId
                })
                setError(`Failed to delete task: ${event.payload.error}`)
            }),

            eventBus.subscribe('DOMAIN.TASK.LOAD_FAILED', (event) => {
                logger.error('TaskManagerApp: Task loading failed', new Error(event.payload.error), {
                    correlationId
                })
                setError(`Failed to load tasks: ${event.payload.error}`)
                setLoading(false)
            }),
        ]

        // Load initial tasks if not provided
        if (initialTasks.length === 0) {
            setLoading(true)
            eventBus.publish('UI.TASK.LOAD_ALL', {})
        }

        logger.info('TaskManagerApp: Application initialized', {
            correlationId,
            subscriptionCount: subscriptions.length
        })

        CorrelationUtils.endCorrelation()

        // Cleanup subscriptions on unmount
        return () => {
            subscriptions.forEach(subscription => subscription.unsubscribe())
            logger.debug('TaskManagerApp: Event subscriptions cleaned up')
        }
    }, [initialTasks, updateTasks, logger])

    // Handle task creation success
    const handleTaskCreated = (description: string) => {
        logger.debug('TaskManagerApp: Task creation callback', {
            description
        })
    }

    // Handle task toggle
    const handleTaskToggle = (taskId: string, completed: boolean) => {
        logger.debug('TaskManagerApp: Task toggle callback', {
            taskId,
            completed
        })
    }

    // Handle task deletion
    const handleTaskDelete = (taskId: string) => {
        logger.debug('TaskManagerApp: Task delete callback', {
            taskId
        })
    }

    // Handle error dismissal
    const handleErrorClose = () => {
        setError(null)
    }

    // Handle success message dismissal
    const handleSuccessClose = () => {
        setSuccessMessage(null)
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    textAlign: 'center',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 2,
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                    <TaskIcon sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1" fontWeight={600}>
                        Task Manager
                    </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9 }}>
                    Organize your work and stay productive
                </Typography>
            </Paper>

            {/* Task Input */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Add New Task
                </Typography>
                <TaskInput
                    onTaskCreated={handleTaskCreated}
                    placeholder="What needs to be done?"
                />
            </Paper>

            {/* Task List */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    Your Tasks
                </Typography>
                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            borderRadius: 2,
                        }}
                    >
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            Loading your tasks...
                        </Typography>
                    </Paper>
                ) : (
                    <TaskList
                        tasks={tasks}
                        onTaskToggle={handleTaskToggle}
                        onTaskDelete={handleTaskDelete}
                        error={error}
                    />
                )}
            </Box>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleErrorClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleErrorClose}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={handleSuccessClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSuccessClose}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    )
}

export default TaskManagerApp