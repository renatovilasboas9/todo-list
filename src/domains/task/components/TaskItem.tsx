import React, { useState } from 'react'
import {
    Box,
    Checkbox,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import { Task } from '../../../SHARED/contracts/task/v1'
import { eventBus } from '../../../SHARED/eventbus'
import Logger from '../../../SHARED/logger/Logger'
import { CorrelationUtils } from '../../../SHARED/logger/CorrelationUtils'

/**
 * TaskItem Component
 * 
 * Material UI component for displaying individual tasks with:
 * - MUI Checkbox for completion toggle
 * - MUI Typography for task description
 * - MUI IconButton for delete with confirmation
 * - Completion visual styling with MUI theme
 * 
 * Requirements: 2.1, 2.2, 3.1
 */

interface TaskItemProps {
    /** The task to display */
    task: Task
    /** Optional callback when task is toggled */
    onToggle?: (taskId: string, completed: boolean) => void
    /** Optional callback when task is deleted */
    onDelete?: (taskId: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const logger = Logger.getInstance()

    // Handle completion toggle
    const handleToggle = async () => {
        const correlationId = CorrelationUtils.startUIAction('TaskItem.toggle', {
            taskId: task.id,
            currentCompleted: task.completed
        })

        logger.debug('TaskItem: Toggling task completion', {
            correlationId,
            taskId: task.id,
            from: task.completed,
            to: !task.completed
        })

        try {
            // Publish toggle event to EventBus
            await eventBus.publish('UI.TASK.TOGGLE', { taskId: task.id })

            logger.info('TaskItem: Task toggle event published', {
                correlationId,
                taskId: task.id,
                newCompleted: !task.completed
            })

            // Call callback if provided
            if (onToggle) {
                onToggle(task.id, !task.completed)
            }

        } catch (error) {
            logger.error('TaskItem: Failed to toggle task', error as Error, {
                correlationId,
                taskId: task.id
            })
        } finally {
            CorrelationUtils.endCorrelation()
        }
    }

    // Handle delete confirmation dialog
    const handleDeleteClick = () => {
        logger.debug('TaskItem: Delete button clicked', {
            taskId: task.id
        })
        setDeleteDialogOpen(true)
    }

    const handleDeleteCancel = () => {
        logger.debug('TaskItem: Delete cancelled', {
            taskId: task.id
        })
        setDeleteDialogOpen(false)
    }

    const handleDeleteConfirm = async () => {
        const correlationId = CorrelationUtils.startUIAction('TaskItem.delete', {
            taskId: task.id
        })

        logger.debug('TaskItem: Deleting task', {
            correlationId,
            taskId: task.id,
            description: task.description
        })

        try {
            // Publish delete event to EventBus
            await eventBus.publish('UI.TASK.DELETE', { taskId: task.id })

            logger.info('TaskItem: Task delete event published', {
                correlationId,
                taskId: task.id
            })

            // Call callback if provided
            if (onDelete) {
                onDelete(task.id)
            }

            // Close dialog
            setDeleteDialogOpen(false)

        } catch (error) {
            logger.error('TaskItem: Failed to delete task', error as Error, {
                correlationId,
                taskId: task.id
            })
        } finally {
            CorrelationUtils.endCorrelation()
        }
    }

    return (
        <>
            <Box
                display="flex"
                alignItems="center"
                gap={2}
                py={1}
                px={2}
                sx={{
                    borderRadius: 1,
                    transition: 'background-color 0.2s ease-in-out',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                {/* Completion Checkbox */}
                <Checkbox
                    checked={task.completed}
                    onChange={handleToggle}
                    color="primary"
                    sx={{
                        '&.Mui-checked': {
                            color: 'success.main',
                        },
                    }}
                />

                {/* Task Description */}
                <Typography
                    variant="body1"
                    sx={{
                        flexGrow: 1,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'text.secondary' : 'text.primary',
                        opacity: task.completed ? 0.7 : 1,
                        transition: 'all 0.2s ease-in-out',
                    }}
                >
                    {task.description}
                </Typography>

                {/* Delete Button */}
                <IconButton
                    onClick={handleDeleteClick}
                    color="error"
                    size="small"
                    sx={{
                        opacity: 0.7,
                        transition: 'opacity 0.2s ease-in-out',
                        '&:hover': {
                            opacity: 1,
                            backgroundColor: 'error.light',
                        },
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Delete Task
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this task?
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, fontStyle: 'italic' }}
                    >
                        "{task.description}"
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleDeleteCancel}
                        color="primary"
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default TaskItem