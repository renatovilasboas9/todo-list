import { Task } from '../../../SHARED/contracts/task/v1/TaskSchema'

/**
 * TaskRepository Interface
 * 
 * Defines the contract for task storage operations.
 * This interface abstracts storage implementation details and allows
 * for different storage strategies (memory, localStorage, database).
 * 
 * All repository implementations must implement these methods.
 */
export interface TaskRepository {
    /**
     * Retrieve all tasks from storage
     * 
     * @returns Promise resolving to array of all tasks
     * @throws Error if storage operation fails
     */
    findAll(): Promise<Task[]>

    /**
     * Save a task to storage
     * 
     * For new tasks (not existing in storage), this performs an insert.
     * For existing tasks (matching by ID), this performs an update.
     * 
     * @param task - The task to save
     * @returns Promise resolving when save operation completes
     * @throws Error if task validation fails or storage operation fails
     */
    save(task: Task): Promise<void>

    /**
     * Delete a task from storage by ID
     * 
     * @param id - UUID of the task to delete
     * @returns Promise resolving when delete operation completes
     * @throws Error if task not found or storage operation fails
     */
    delete(id: string): Promise<void>

    /**
     * Clear all tasks from storage
     * 
     * This operation removes all tasks permanently.
     * Use with caution as this cannot be undone.
     * 
     * @returns Promise resolving when clear operation completes
     * @throws Error if storage operation fails
     */
    clear(): Promise<void>
}