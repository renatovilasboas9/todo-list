/**
 * Task Domain UI Components
 * 
 * This module exports all UI components for the task domain with EventBus integration.
 * All components are built with Material UI and follow the event-driven architecture pattern.
 */

export { TaskInput } from './TaskInput'
export { TaskItem } from './TaskItem'
export { TaskList } from './TaskList'
export { TaskManagerApp } from './TaskManagerApp'

// Re-export types for convenience
export type { Task } from '../../../SHARED/contracts/task/v1'