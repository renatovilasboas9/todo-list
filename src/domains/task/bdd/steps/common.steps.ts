// Test context interface for type safety
interface TestContext {
  tasks: any[]
  currentTask?: any
  lastError?: Error
  ui?: {
    inputValue?: string
    taskList?: any[]
    validationMessages?: string[]
    lastToggledTask?: {
      id: string
      previousState: boolean
      newState: boolean
    }
    taskStyling?: {
      taskId: string
      hasCompletionStyling: boolean
      checkboxChecked: boolean
      descriptionStrikethrough: boolean
    }
    lastDeletedTask?: {
      id: string
      description: string
    }
    taskListDisplay?: {
      taskCount: number
      tasksInOrder: Array<{ id: string; description: string }>
    }
  }
  storage?: {
    data?: any
    corrupted?: boolean
  }
}

// World constructor for BDD scenarios
class TaskManagerWorld {
  public context: TestContext

  constructor() {
    this.context = {
      tasks: [],
      ui: {},
      storage: {},
    }
  }

  // Helper methods for BDD scenarios
  resetContext() {
    this.context = {
      tasks: [],
      ui: {},
      storage: {},
    }
  }

  addTask(description: string) {
    const task = {
      id: `task-${Date.now()}-${Math.random()}`,
      description,
      completed: false,
      createdAt: new Date(),
    }
    this.context.tasks.push(task)
    this.context.currentTask = task
    return task
  }

  findTaskById(id: string) {
    return this.context.tasks.find((task) => task.id === id)
  }

  findTaskByDescription(description: string) {
    return this.context.tasks.find((task) => task.description === description)
  }

  toggleTask(id: string) {
    const task = this.findTaskById(id)
    if (task) {
      task.completed = !task.completed
      this.context.currentTask = task
    }
    return task
  }

  deleteTask(id: string) {
    const index = this.context.tasks.findIndex((task) => task.id === id)
    if (index !== -1) {
      const deletedTask = this.context.tasks.splice(index, 1)[0]
      this.context.currentTask = deletedTask
      return deletedTask
    }
    return null
  }

  simulateStorageCorruption() {
    if (this.context.storage) {
      this.context.storage.corrupted = true
      this.context.storage.data = 'invalid json data'
    }
  }

  simulateStorageRestore(tasks: any[]) {
    if (this.context.storage) {
      this.context.storage.corrupted = false
      // Simulate the serialization/deserialization process that happens with localStorage
      const serializedTasks = tasks.map((task) => ({
        ...task,
        createdAt: task.createdAt.toISOString(), // Convert Date to string like JSON.stringify does
      }))
      this.context.storage.data = JSON.stringify({ tasks: serializedTasks, version: '1.0' })
      this.context.tasks = [...tasks] // Keep the original tasks with Date objects in context
    }
  }
}

// Export types for use in step definitions
export { TaskManagerWorld }
export type { TestContext }
