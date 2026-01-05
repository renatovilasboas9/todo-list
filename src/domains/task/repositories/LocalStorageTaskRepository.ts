import { Task, TaskSchema } from '../../../SHARED/contracts/task/v1/TaskSchema'
import {
    StorageData,
    createEmptyStorage,
    parseStorageData,
    serializeStorageData
} from '../../../SHARED/contracts/task/v1/StorageSchema'
import { TaskRepository } from './TaskRepository'
import Logger from '../../../SHARED/logger/Logger'

/**
 * LocalStorageTaskRepository
 * 
 * Production implementation of TaskRepository using browser Local Storage.
 * Provides persistent storage that survives browser sessions and page reloads.
 * 
 * Features:
 * - Zod schema validation for data integrity
 * - Automatic serialization/deserialization with date handling
 * - Comprehensive error handling for corrupted data and storage quota
 * - Storage versioning for future migrations
 * - Detailed logging for debugging and monitoring
 * - Graceful fallback for storage failures
 */
export class LocalStorageTaskRepository implements TaskRepository {
    private static readonly STORAGE_KEY = 'task-manager-data'
    private logger: Logger
    private cache: StorageData | null = null
    private cacheValid: boolean = false

    constructor() {
        this.logger = Logger.getInstance()
    }

    /**
     * Load storage data from localStorage with error handling
     */
    private async loadStorageData(): Promise<StorageData> {
        const correlationId = this.logger.getCurrentCorrelationId()

        // Return cached data if valid
        if (this.cacheValid && this.cache) {
            this.logger.debug('Using cached storage data', {
                operation: 'loadStorageData',
                repository: 'LocalStorageTaskRepository',
                taskCount: this.cache.tasks.length,
                correlationId
            })
            return this.cache
        }

        try {
            const storedData = localStorage.getItem(LocalStorageTaskRepository.STORAGE_KEY)

            if (!storedData) {
                this.logger.debug('No existing storage data found, creating empty storage', {
                    operation: 'loadStorageData',
                    repository: 'LocalStorageTaskRepository',
                    correlationId
                })

                const emptyStorage = createEmptyStorage()
                await this.saveStorageData(emptyStorage)
                return emptyStorage
            }

            // Parse and validate stored data
            const parsedData = parseStorageData(storedData)

            // Update cache
            this.cache = parsedData
            this.cacheValid = true

            this.logger.debug('Storage data loaded successfully', {
                operation: 'loadStorageData',
                repository: 'LocalStorageTaskRepository',
                taskCount: parsedData.tasks.length,
                version: parsedData.version,
                correlationId
            })

            return parsedData
        } catch (error) {
            this.logger.error('Failed to load storage data, falling back to empty storage', error as Error, {
                operation: 'loadStorageData',
                repository: 'LocalStorageTaskRepository',
                correlationId
            })

            // Handle corrupted data by creating fresh storage
            const emptyStorage = createEmptyStorage()

            try {
                await this.saveStorageData(emptyStorage)
            } catch (saveError) {
                this.logger.error('Failed to save fallback empty storage', saveError as Error, {
                    operation: 'loadStorageData',
                    repository: 'LocalStorageTaskRepository',
                    correlationId
                })
            }

            return emptyStorage
        }
    }

    /**
     * Save storage data to localStorage with error handling
     */
    private async saveStorageData(data: StorageData): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        try {
            // Update metadata
            const updatedData: StorageData = {
                ...data,
                metadata: {
                    ...data.metadata,
                    lastUpdated: new Date(),
                    totalTasksCreated: data.metadata?.totalTasksCreated || data.tasks.length,
                    appVersion: '1.0.0'
                }
            }

            const serializedData = serializeStorageData(updatedData)

            // Check storage quota before saving
            const estimatedSize = new Blob([serializedData]).size
            this.logger.debug('Saving storage data', {
                operation: 'saveStorageData',
                repository: 'LocalStorageTaskRepository',
                taskCount: updatedData.tasks.length,
                estimatedSize,
                correlationId
            })

            localStorage.setItem(LocalStorageTaskRepository.STORAGE_KEY, serializedData)

            // Update cache
            this.cache = updatedData
            this.cacheValid = true

            this.logger.debug('Storage data saved successfully', {
                operation: 'saveStorageData',
                repository: 'LocalStorageTaskRepository',
                taskCount: updatedData.tasks.length,
                correlationId
            })
        } catch (error) {
            // Invalidate cache on save failure
            this.cacheValid = false

            if (error instanceof Error && error.name === 'QuotaExceededError') {
                this.logger.error('Storage quota exceeded', error, {
                    operation: 'saveStorageData',
                    repository: 'LocalStorageTaskRepository',
                    taskCount: data.tasks.length,
                    correlationId
                })
                throw new Error('Storage quota exceeded. Please clear some data or use a different browser.')
            } else {
                this.logger.error('Failed to save storage data', error as Error, {
                    operation: 'saveStorageData',
                    repository: 'LocalStorageTaskRepository',
                    correlationId
                })
                throw error
            }
        }
    }

    /**
     * Invalidate cache to force reload on next operation
     */
    private invalidateCache(): void {
        this.cacheValid = false
        this.cache = null
    }

    async findAll(): Promise<Task[]> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Finding all tasks', {
            operation: 'findAll',
            repository: 'LocalStorageTaskRepository',
            correlationId
        })

        try {
            const storageData = await this.loadStorageData()
            const tasks = storageData.tasks.map(task => ({ ...task })) // Deep copy

            this.logger.debug('Successfully retrieved all tasks', {
                operation: 'findAll',
                repository: 'LocalStorageTaskRepository',
                resultCount: tasks.length,
                correlationId
            })

            return tasks
        } catch (error) {
            this.logger.error('Failed to find all tasks', error as Error, {
                operation: 'findAll',
                repository: 'LocalStorageTaskRepository',
                correlationId
            })
            throw error
        }
    }

    async findById(id: string): Promise<Task | null> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Finding task by ID', {
            operation: 'findById',
            repository: 'LocalStorageTaskRepository',
            taskId: id,
            correlationId
        })

        try {
            // Validate ID format
            if (!id || typeof id !== 'string') {
                throw new Error('Task ID must be a non-empty string')
            }

            const storageData = await this.loadStorageData()
            const task = storageData.tasks.find(t => t.id === id)
            const result = task ? { ...task } : null

            this.logger.debug('Task search completed', {
                operation: 'findById',
                repository: 'LocalStorageTaskRepository',
                taskId: id,
                found: result !== null,
                correlationId
            })

            return result
        } catch (error) {
            this.logger.error('Failed to find task by ID', error as Error, {
                operation: 'findById',
                repository: 'LocalStorageTaskRepository',
                taskId: id,
                correlationId
            })
            throw error
        }
    }

    async save(task: Task): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Saving task', {
            operation: 'save',
            repository: 'LocalStorageTaskRepository',
            taskId: task.id,
            taskDescription: task.description,
            correlationId
        })

        try {
            // Validate task using Zod schema
            const validatedTask = TaskSchema.parse(task)

            const storageData = await this.loadStorageData()
            const existingIndex = storageData.tasks.findIndex(t => t.id === validatedTask.id)

            if (existingIndex >= 0) {
                // Update existing task
                storageData.tasks[existingIndex] = { ...validatedTask }

                this.logger.debug('Task updated in storage', {
                    operation: 'save',
                    repository: 'LocalStorageTaskRepository',
                    taskId: validatedTask.id,
                    action: 'update',
                    correlationId
                })
            } else {
                // Insert new task
                storageData.tasks.push({ ...validatedTask })

                this.logger.debug('Task inserted in storage', {
                    operation: 'save',
                    repository: 'LocalStorageTaskRepository',
                    taskId: validatedTask.id,
                    action: 'insert',
                    totalTasks: storageData.tasks.length,
                    correlationId
                })
            }

            await this.saveStorageData(storageData)
        } catch (error) {
            this.invalidateCache()
            this.logger.error('Failed to save task', error as Error, {
                operation: 'save',
                repository: 'LocalStorageTaskRepository',
                taskId: task.id,
                correlationId
            })
            throw error
        }
    }

    async delete(id: string): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Deleting task', {
            operation: 'delete',
            repository: 'LocalStorageTaskRepository',
            taskId: id,
            correlationId
        })

        try {
            // Validate ID format
            if (!id || typeof id !== 'string') {
                throw new Error('Task ID must be a non-empty string')
            }

            const storageData = await this.loadStorageData()
            const initialLength = storageData.tasks.length
            const taskIndex = storageData.tasks.findIndex(task => task.id === id)

            if (taskIndex === -1) {
                const error = new Error(`Task with ID ${id} not found`)
                this.logger.error('Task not found for deletion', error, {
                    operation: 'delete',
                    repository: 'LocalStorageTaskRepository',
                    taskId: id,
                    correlationId
                })
                throw error
            }

            // Remove task from array
            storageData.tasks.splice(taskIndex, 1)

            await this.saveStorageData(storageData)

            this.logger.debug('Task deleted successfully', {
                operation: 'delete',
                repository: 'LocalStorageTaskRepository',
                taskId: id,
                previousCount: initialLength,
                currentCount: storageData.tasks.length,
                correlationId
            })
        } catch (error) {
            this.invalidateCache()
            this.logger.error('Failed to delete task', error as Error, {
                operation: 'delete',
                repository: 'LocalStorageTaskRepository',
                taskId: id,
                correlationId
            })
            throw error
        }
    }

    async clear(): Promise<void> {
        const correlationId = this.logger.getCurrentCorrelationId()

        this.logger.debug('Clearing all tasks', {
            operation: 'clear',
            repository: 'LocalStorageTaskRepository',
            correlationId
        })

        try {
            const storageData = await this.loadStorageData()
            const clearedCount = storageData.tasks.length

            // Create empty storage while preserving metadata structure
            const emptyStorage = createEmptyStorage()
            emptyStorage.metadata = {
                ...storageData.metadata,
                lastUpdated: new Date(),
                totalTasksCreated: storageData.metadata?.totalTasksCreated || 0
            }

            await this.saveStorageData(emptyStorage)

            this.logger.debug('All tasks cleared successfully', {
                operation: 'clear',
                repository: 'LocalStorageTaskRepository',
                clearedCount,
                correlationId
            })
        } catch (error) {
            this.invalidateCache()
            this.logger.error('Failed to clear tasks', error as Error, {
                operation: 'clear',
                repository: 'LocalStorageTaskRepository',
                correlationId
            })
            throw error
        }
    }

    /**
     * Utility methods for debugging and maintenance
     */

    /**
     * Get storage statistics
     */
    public async getStorageStats(): Promise<{
        taskCount: number
        storageSize: number
        lastUpdated: Date | undefined
        version: string
    }> {
        try {
            const storageData = await this.loadStorageData()
            const serializedData = serializeStorageData(storageData)

            return {
                taskCount: storageData.tasks.length,
                storageSize: new Blob([serializedData]).size,
                lastUpdated: storageData.metadata?.lastUpdated,
                version: storageData.version
            }
        } catch (error) {
            this.logger.error('Failed to get storage stats', error as Error)
            throw error
        }
    }

    /**
     * Force cache invalidation (for testing/debugging)
     */
    public invalidateCacheForTesting(): void {
        this.invalidateCache()
    }

    /**
     * Export storage data as JSON (for backup/debugging)
     */
    public async exportData(): Promise<string> {
        const storageData = await this.loadStorageData()
        return serializeStorageData(storageData)
    }
}