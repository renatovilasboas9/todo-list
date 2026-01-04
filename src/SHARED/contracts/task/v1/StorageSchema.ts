import { z } from 'zod'
import { TaskSchema } from './TaskSchema.js'

/**
 * Storage Schema - Defines the format for persisting tasks in Local Storage
 * 
 * This schema ensures data integrity and provides versioning support
 * for future migrations and backward compatibility.
 */
export const StorageSchema = z.object({
    /**
     * Array of tasks stored in the system
     */
    tasks: z.array(TaskSchema),

    /**
     * Schema version for migration support
     * Current version is "1.0"
     */
    version: z.literal('1.0'),

    /**
     * Optional metadata for storage operations
     */
    metadata: z
        .object({
            /**
             * Timestamp when storage was last updated
             */
            lastUpdated: z.date().optional(),

            /**
             * Total number of tasks ever created (for statistics)
             */
            totalTasksCreated: z.number().int().min(0).optional(),

            /**
             * Application version that created this storage
             */
            appVersion: z.string().optional(),
        })
        .optional(),
})

/**
 * TypeScript type inferred from the Storage schema
 */
export type StorageData = z.infer<typeof StorageSchema>

/**
 * Serialized storage schema for JSON operations
 * Converts Date objects to ISO strings for JSON serialization
 */
export const SerializedStorageSchema = z.object({
    tasks: z.array(
        TaskSchema.extend({
            createdAt: z.string().datetime(),
        })
    ),
    version: z.literal('1.0'),
    metadata: z
        .object({
            lastUpdated: z.string().datetime().optional(),
            totalTasksCreated: z.number().int().min(0).optional(),
            appVersion: z.string().optional(),
        })
        .optional(),
})

export type SerializedStorageData = z.infer<typeof SerializedStorageSchema>

/**
 * Creates an empty storage structure with default values
 */
export function createEmptyStorage(): StorageData {
    return {
        tasks: [],
        version: '1.0',
        metadata: {
            lastUpdated: new Date(),
            totalTasksCreated: 0,
            appVersion: '1.0.0',
        },
    }
}

/**
 * Validates and parses storage data from JSON string
 * Handles date deserialization and validation
 */
export function parseStorageData(jsonString: string): StorageData {
    try {
        const parsed = JSON.parse(jsonString)

        // First validate the serialized format
        const serialized = SerializedStorageSchema.parse(parsed)

        // Convert back to proper Date objects
        const storage: StorageData = {
            tasks: serialized.tasks.map((task) => ({
                ...task,
                createdAt: new Date(task.createdAt),
            })),
            version: serialized.version,
            metadata: serialized.metadata
                ? {
                    ...serialized.metadata,
                    lastUpdated: serialized.metadata.lastUpdated
                        ? new Date(serialized.metadata.lastUpdated)
                        : undefined,
                }
                : undefined,
        }

        // Validate the final format
        return StorageSchema.parse(storage)
    } catch (error) {
        throw new Error(`Invalid storage data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Serializes storage data to JSON string
 * Handles date serialization for storage
 */
export function serializeStorageData(storage: StorageData): string {
    const serialized: SerializedStorageData = {
        tasks: storage.tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
        })),
        version: storage.version,
        metadata: storage.metadata
            ? {
                ...storage.metadata,
                lastUpdated: storage.metadata.lastUpdated?.toISOString(),
            }
            : undefined,
    }

    return JSON.stringify(serialized, null, 2)
}