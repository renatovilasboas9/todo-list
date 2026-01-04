import { describe, it, expect } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import {
    TaskSchema,
    CreateTaskInputSchema,
    UpdateTaskCompletionSchema,
    DeleteTaskSchema,
    type Task,
} from './TaskSchema.js'

describe('TaskSchema', () => {
    const validTask: Task = {
        id: uuidv4(),
        description: 'Test task',
        completed: false,
        createdAt: new Date(),
    }

    describe('TaskSchema validation', () => {
        it('should validate a valid task', () => {
            expect(() => TaskSchema.parse(validTask)).not.toThrow()
        })

        it('should require a valid UUID for id', () => {
            const invalidTask = { ...validTask, id: 'invalid-uuid' }
            expect(() => TaskSchema.parse(invalidTask)).toThrow('Task ID must be a valid UUID')
        })

        it('should require non-empty description', () => {
            const invalidTask = { ...validTask, description: '' }
            expect(() => TaskSchema.parse(invalidTask)).toThrow('Task description cannot be empty')
        })

        it('should trim whitespace from description', () => {
            const taskWithWhitespace = { ...validTask, description: '  Test task  ' }
            const parsed = TaskSchema.parse(taskWithWhitespace)
            expect(parsed.description).toBe('Test task')
        })

        it('should reject description longer than 500 characters', () => {
            const longDescription = 'a'.repeat(501)
            const invalidTask = { ...validTask, description: longDescription }
            expect(() => TaskSchema.parse(invalidTask)).toThrow('Task description cannot exceed 500 characters')
        })

        it('should require boolean for completed', () => {
            const invalidTask = { ...validTask, completed: 'true' as any }
            expect(() => TaskSchema.parse(invalidTask)).toThrow()
        })

        it('should require Date for createdAt', () => {
            const invalidTask = { ...validTask, createdAt: '2024-01-01' as any }
            expect(() => TaskSchema.parse(invalidTask)).toThrow()
        })
    })

    describe('CreateTaskInputSchema validation', () => {
        it('should validate valid input', () => {
            const input = { description: 'New task' }
            expect(() => CreateTaskInputSchema.parse(input)).not.toThrow()
        })

        it('should reject empty description', () => {
            const input = { description: '' }
            expect(() => CreateTaskInputSchema.parse(input)).toThrow()
        })

        it('should trim whitespace', () => {
            const input = { description: '  New task  ' }
            const parsed = CreateTaskInputSchema.parse(input)
            expect(parsed.description).toBe('New task')
        })
    })

    describe('UpdateTaskCompletionSchema validation', () => {
        it('should validate valid input', () => {
            const input = { id: uuidv4(), completed: true }
            expect(() => UpdateTaskCompletionSchema.parse(input)).not.toThrow()
        })

        it('should require valid UUID', () => {
            const input = { id: 'invalid', completed: true }
            expect(() => UpdateTaskCompletionSchema.parse(input)).toThrow()
        })

        it('should require boolean completed', () => {
            const input = { id: uuidv4(), completed: 'true' as any }
            expect(() => UpdateTaskCompletionSchema.parse(input)).toThrow()
        })
    })

    describe('DeleteTaskSchema validation', () => {
        it('should validate valid input', () => {
            const input = { id: uuidv4() }
            expect(() => DeleteTaskSchema.parse(input)).not.toThrow()
        })

        it('should require valid UUID', () => {
            const input = { id: 'invalid' }
            expect(() => DeleteTaskSchema.parse(input)).toThrow()
        })
    })
})