import { describe, it, expect } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import {
    StorageSchema,
    SerializedStorageSchema,
    createEmptyStorage,
    parseStorageData,
    serializeStorageData,
    type StorageData,
} from './StorageSchema.js'
import type { Task } from './TaskSchema.js'

describe('StorageSchema', () => {
    const sampleTask: Task = {
        id: uuidv4(),
        description: 'Test task',
        completed: false,
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
    }

    const validStorage: StorageData = {
        tasks: [sampleTask],
        version: '1.0',
        metadata: {
            lastUpdated: new Date('2024-01-01T10:00:00.000Z'),
            totalTasksCreated: 1,
            appVersion: '1.0.0',
        },
    }

    describe('StorageSchema validation', () => {
        it('should validate valid storage data', () => {
            expect(() => StorageSchema.parse(validStorage)).not.toThrow()
        })

        it('should require version 1.0', () => {
            const invalidStorage = { ...validStorage, version: '2.0' }
            expect(() => StorageSchema.parse(invalidStorage)).toThrow()
        })

        it('should validate empty tasks array', () => {
            const emptyStorage = { ...validStorage, tasks: [] }
            expect(() => StorageSchema.parse(emptyStorage)).not.toThrow()
        })

        it('should allow optional metadata', () => {
            const storageWithoutMetadata = { tasks: [], version: '1.0' as const }
            expect(() => StorageSchema.parse(storageWithoutMetadata)).not.toThrow()
        })

        it('should validate metadata fields', () => {
            const invalidMetadata = {
                ...validStorage,
                metadata: {
                    totalTasksCreated: -1, // Invalid negative number
                },
            }
            expect(() => StorageSchema.parse(invalidMetadata)).toThrow()
        })
    })

    describe('SerializedStorageSchema validation', () => {
        it('should validate serialized format', () => {
            const serialized = {
                tasks: [
                    {
                        ...sampleTask,
                        createdAt: sampleTask.createdAt.toISOString(),
                    },
                ],
                version: '1.0' as const,
                metadata: {
                    lastUpdated: '2024-01-01T10:00:00.000Z',
                    totalTasksCreated: 1,
                    appVersion: '1.0.0',
                },
            }
            expect(() => SerializedStorageSchema.parse(serialized)).not.toThrow()
        })

        it('should require ISO date strings', () => {
            const invalidSerialized = {
                tasks: [
                    {
                        ...sampleTask,
                        createdAt: 'invalid-date',
                    },
                ],
                version: '1.0' as const,
            }
            expect(() => SerializedStorageSchema.parse(invalidSerialized)).toThrow()
        })
    })

    describe('createEmptyStorage', () => {
        it('should create valid empty storage', () => {
            const empty = createEmptyStorage()
            expect(() => StorageSchema.parse(empty)).not.toThrow()
            expect(empty.tasks).toHaveLength(0)
            expect(empty.version).toBe('1.0')
            expect(empty.metadata?.totalTasksCreated).toBe(0)
        })
    })

    describe('serializeStorageData', () => {
        it('should serialize storage to valid JSON', () => {
            const json = serializeStorageData(validStorage)
            expect(() => JSON.parse(json)).not.toThrow()

            const parsed = JSON.parse(json)
            expect(parsed.version).toBe('1.0')
            expect(parsed.tasks).toHaveLength(1)
            expect(parsed.tasks[0].createdAt).toBe('2024-01-01T10:00:00.000Z')
        })

        it('should handle storage without metadata', () => {
            const storageWithoutMetadata: StorageData = {
                tasks: [sampleTask],
                version: '1.0',
            }
            const json = serializeStorageData(storageWithoutMetadata)
            const parsed = JSON.parse(json)
            expect(parsed.metadata).toBeUndefined()
        })
    })

    describe('parseStorageData', () => {
        it('should parse valid JSON back to storage', () => {
            const json = serializeStorageData(validStorage)
            const parsed = parseStorageData(json)

            expect(parsed.version).toBe('1.0')
            expect(parsed.tasks).toHaveLength(1)
            expect(parsed.tasks[0].createdAt).toBeInstanceOf(Date)
            expect(parsed.tasks[0].createdAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
        })

        it('should handle round-trip serialization', () => {
            const json = serializeStorageData(validStorage)
            const parsed = parseStorageData(json)
            const jsonAgain = serializeStorageData(parsed)

            expect(json).toBe(jsonAgain)
        })

        it('should throw on invalid JSON', () => {
            expect(() => parseStorageData('invalid json')).toThrow('Invalid storage data')
        })

        it('should throw on invalid schema', () => {
            const invalidJson = JSON.stringify({ version: '2.0', tasks: [] })
            expect(() => parseStorageData(invalidJson)).toThrow('Invalid storage data')
        })

        it('should handle empty tasks array', () => {
            const emptyStorage = createEmptyStorage()
            const json = serializeStorageData(emptyStorage)
            const parsed = parseStorageData(json)

            expect(parsed.tasks).toHaveLength(0)
            expect(parsed.version).toBe('1.0')
        })
    })
})