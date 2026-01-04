import { z } from 'zod'

/**
 * Task Schema - Core entity representing a single task
 * 
 * This schema defines the structure and validation rules for task entities.
 * It serves as the single source of truth for task data validation across
 * the entire application.
 */
export const TaskSchema = z.object({
    /**
     * Unique identifier for the task
     * Must be a valid UUID v4 format
     */
    id: z.string().uuid('Task ID must be a valid UUID'),

    /**
     * Task description text
     * Must be between 1 and 500 characters
     * Leading and trailing whitespace will be trimmed
     * Must not be empty or whitespace-only after trimming
     */
    description: z
        .string()
        .transform((val) => val.trim())
        .refine((val) => val.length > 0, 'Task description cannot be empty')
        .refine((val) => val.length <= 500, 'Task description cannot exceed 500 characters'),

    /**
     * Task completion status
     * True if task is completed, false if active
     */
    completed: z.boolean(),

    /**
     * Task creation timestamp
     * Automatically set when task is created
     */
    createdAt: z.date(),
})

/**
 * TypeScript type inferred from the Zod schema
 * Use this type throughout the application for type safety
 */
export type Task = z.infer<typeof TaskSchema>

/**
 * Input schema for creating a new task
 * Only requires description, other fields are generated
 */
export const CreateTaskInputSchema = z.object({
    description: TaskSchema.shape.description,
})

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>

/**
 * Input schema for updating task completion status
 */
export const UpdateTaskCompletionSchema = z.object({
    id: TaskSchema.shape.id,
    completed: TaskSchema.shape.completed,
})

export type UpdateTaskCompletion = z.infer<typeof UpdateTaskCompletionSchema>

/**
 * Schema for task deletion operations
 */
export const DeleteTaskSchema = z.object({
    id: TaskSchema.shape.id,
})

export type DeleteTask = z.infer<typeof DeleteTaskSchema>