import React, { useState, useRef, useEffect } from 'react'
import {
    Box,
    TextField,
    Button,
    Alert,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { validateTaskDescription, type ValidationResult } from '../../../SHARED/contracts/task/v1'
import { eventBus } from '../../../SHARED/eventbus'
import Logger from '../../../SHARED/logger/Logger'
import { CorrelationUtils } from '../../../SHARED/logger/CorrelationUtils'

/**
 * TaskInput Component
 * 
 * Material UI component for task creation with:
 * - MUI TextField with validation
 * - MUI Button and Enter key handling
 * - Input clearing and focus management
 * - EventBus integration for task creation
 * - Inline validation derived from Zod schemas
 * 
 * Requirements: 1.1, 1.2, 1.3, 5.5
 */

interface TaskInputProps {
    /** Optional placeholder text for the input field */
    placeholder?: string
    /** Optional callback when a task is successfully created */
    onTaskCreated?: (description: string) => void
    /** Optional callback when validation fails */
    onValidationError?: (errors: string[]) => void
}

export function TaskInput({
    placeholder = "Enter a new task...",
    onTaskCreated,
    onValidationError
}: TaskInputProps) {
    const [inputValue, setInputValue] = useState('')
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const logger = Logger.getInstance()

    // Real-time validation on input change
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setInputValue(value)

        // Validate using Zod-derived validation
        const result = validateTaskDescription(value)
        setValidationResult(result)

        // Call validation error callback if provided
        if (!result.isValid && onValidationError) {
            onValidationError(result.errors)
        }
    }

    // Handle task creation
    const handleSubmit = async () => {
        const correlationId = CorrelationUtils.startUIAction('TaskInput.createTask', {
            inputValue: inputValue.trim()
        })

        logger.debug('TaskInput: Attempting to create task', {
            correlationId,
            inputValue: inputValue.trim(),
            isValid: validationResult?.isValid
        })

        // Validate before submission
        if (!validationResult?.isValid || !inputValue.trim()) {
            logger.warn('TaskInput: Invalid input prevented submission', {
                correlationId,
                errors: validationResult?.errors || ['Empty input']
            })
            return
        }

        setIsSubmitting(true)

        try {
            const taskDescription = inputValue.trim()

            // Publish task creation event to EventBus
            await eventBus.publish('UI.TASK.CREATE', taskDescription)

            logger.info('TaskInput: Task creation event published', {
                correlationId,
                description: taskDescription
            })

            // Clear input and refocus (Requirement 1.3)
            setInputValue('')
            setValidationResult(null)

            // Focus the input field for next entry
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)

            // Call success callback if provided
            if (onTaskCreated) {
                onTaskCreated(taskDescription)
            }

        } catch (error) {
            logger.error('TaskInput: Failed to create task', error as Error, {
                correlationId,
                inputValue: inputValue.trim()
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle Enter key press
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && validationResult?.isValid && inputValue.trim() && !isSubmitting) {
            event.preventDefault()
            handleSubmit()
        }
    }

    // Handle focus events for visual feedback (Requirement 1.5)
    const handleFocus = () => {
        setIsFocused(true)
        logger.debug('TaskInput: Input field focused')
    }

    const handleBlur = () => {
        setIsFocused(false)
        logger.debug('TaskInput: Input field blurred')
    }

    // Auto-focus on component mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const hasError = validationResult && !validationResult.isValid
    const canSubmit = validationResult?.isValid && inputValue.trim() && !isSubmitting

    return (
        <Box>
            <Box display="flex" gap={2} alignItems="flex-start" mb={hasError ? 2 : 0}>
                <TextField
                    ref={inputRef}
                    fullWidth
                    label="Task Description"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    error={!!hasError}
                    helperText={
                        hasError
                            ? validationResult.errors[0]
                            : validationResult?.warnings?.[0] ||
                            (isFocused ? 'Press Enter or click Add to create task' : '')
                    }
                    variant="outlined"
                    size="medium"
                    disabled={isSubmitting}
                    inputProps={{
                        maxLength: 500, // Prevent typing beyond limit (Rule 03-ui-mui.md)
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderWidth: 2,
                                },
                            },
                        },
                    }}
                />
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    startIcon={<AddIcon />}
                    sx={{
                        minWidth: 120,
                        height: 56,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover:not(:disabled)': {
                            transform: 'translateY(-1px)',
                            boxShadow: 3,
                        }
                    }}
                >
                    {isSubmitting ? 'Adding...' : 'Add Task'}
                </Button>
            </Box>

            {/* Inline validation display (Requirement 5.5) */}
            {hasError && (
                <Alert
                    severity="error"
                    variant="outlined"
                    sx={{ mt: 1 }}
                >
                    {validationResult.errors[0]}
                </Alert>
            )}
        </Box>
    )
}

export default TaskInput