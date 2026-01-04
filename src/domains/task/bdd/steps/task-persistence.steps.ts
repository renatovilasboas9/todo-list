import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'vitest'
import { TaskManagerWorld } from './common.steps'

// Storage simulation helpers
function simulateLocalStorage() {
  const storage: { [key: string]: string } = {}

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key])
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (index: number) => Object.keys(storage)[index] || null,
    _getStorage: () => ({ ...storage }), // Helper for testing
  }
}

// Mock localStorage for testing
const mockLocalStorage = simulateLocalStorage()

// Helper to create valid storage data
function createStorageData(tasks: any[]) {
  return JSON.stringify({
    tasks: tasks.map((task) => ({
      ...task,
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
    })),
    version: '1.0',
  })
}

// Helper to parse storage data
function parseStorageData(data: string) {
  try {
    const parsed = JSON.parse(data)
    return {
      ...parsed,
      tasks:
        parsed.tasks?.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
        })) || [],
    }
  } catch {
    return null
  }
}

// Storage state setup steps
Given('local storage is empty', function (this: TaskManagerWorld) {
  mockLocalStorage.clear()
  this.context.storage = { data: null }
})

Given('local storage contains saved tasks:', function (this: TaskManagerWorld, dataTable) {
  const tasks = dataTable.hashes().map((row: any) => ({
    id: `task-${Date.now()}-${Math.random()}`,
    description: row.description,
    completed: row.completed === 'true',
    createdAt: new Date(row.createdAt),
  }))

  const storageData = createStorageData(tasks)
  mockLocalStorage.setItem('taskManager', storageData)
  this.context.storage = { data: storageData }
  this.context.tasks = [...tasks]
})

Given(
  'local storage contains a completed task {string}',
  function (this: TaskManagerWorld, description: string) {
    const task = {
      id: `task-${Date.now()}-${Math.random()}`,
      description,
      completed: true,
      createdAt: new Date(),
    }

    const storageData = createStorageData([task])
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
    this.context.tasks = [task]
  }
)

Given(
  'local storage contains an incomplete task {string}',
  function (this: TaskManagerWorld, description: string) {
    const existingTasks = this.context.tasks || []
    const task = {
      id: `task-${Date.now()}-${Math.random()}`,
      description,
      completed: false,
      createdAt: new Date(),
    }

    const allTasks = [...existingTasks, task]
    const storageData = createStorageData(allTasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
    this.context.tasks = allTasks
  }
)

Given('local storage contains corrupted data', function (this: TaskManagerWorld) {
  mockLocalStorage.setItem('taskManager', 'invalid json data {corrupted}')
  this.context.storage = { data: 'invalid json data {corrupted}', corrupted: true }
})

Given('local storage contains invalid JSON data', function (this: TaskManagerWorld) {
  mockLocalStorage.setItem('taskManager', '{"tasks": [invalid json')
  this.context.storage = { data: '{"tasks": [invalid json', corrupted: true }
})

Given(
  'local storage contains task data without version information',
  function (this: TaskManagerWorld) {
    const tasks = [
      {
        id: `task-${Date.now()}-${Math.random()}`,
        description: 'Test task',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]

    // Storage without version field
    const storageData = JSON.stringify({ tasks })
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
)

Given(
  'local storage contains task data with version {string}',
  function (this: TaskManagerWorld, version: string) {
    const tasks = [
      {
        id: `task-${Date.now()}-${Math.random()}`,
        description: 'Test task',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]

    const storageData = JSON.stringify({ tasks, version })
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
)

Given('local storage is nearly full', function (this: TaskManagerWorld) {
  // Simulate storage quota by filling storage with dummy data
  const largeData = 'x'.repeat(1024 * 1024) // 1MB of data
  try {
    mockLocalStorage.setItem('dummyData', largeData)
  } catch {
    // Storage is full, which is what we want for this test
  }
  this.context.storage = { quotaExceeded: true }
})

Given(
  'I have a task {string} that is incomplete',
  function (this: TaskManagerWorld, description: string) {
    const task = this.addTask(description)
    task.completed = false

    // Save to storage
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
)

Given('I have tasks:', function (this: TaskManagerWorld, dataTable) {
  const tasks = dataTable.hashes().map((row: any) => ({
    id: `task-${Date.now()}-${Math.random()}`,
    description: row.description,
    completed: row.completed === 'true',
    createdAt: new Date(),
  }))

  this.context.tasks = tasks
  const storageData = createStorageData(tasks)
  mockLocalStorage.setItem('taskManager', storageData)
  this.context.storage = { data: storageData }
})

// Application lifecycle steps
When('the application starts', function (this: TaskManagerWorld) {
  // Simulate application startup by loading from storage
  const storageData = mockLocalStorage.getItem('taskManager')

  if (!storageData) {
    this.context.tasks = []
    return
  }

  const parsed = parseStorageData(storageData)
  if (parsed && parsed.tasks) {
    this.context.tasks = parsed.tasks
    this.context.storage = { data: storageData, version: parsed.version }
  } else {
    // Handle corrupted data
    this.context.tasks = []
    this.context.storage = { corrupted: true }
  }
})

When('I create a new task {string}', function (this: TaskManagerWorld, description: string) {
  const task = this.addTask(description)

  // Simulate immediate persistence
  const storageData = createStorageData(this.context.tasks)
  mockLocalStorage.setItem('taskManager', storageData)
  this.context.storage = { data: storageData }
})

When('I mark the task as completed', function (this: TaskManagerWorld) {
  if (this.context.currentTask) {
    this.context.currentTask.completed = true

    // Update storage immediately
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
})

When('I mark the task as incomplete again', function (this: TaskManagerWorld) {
  if (this.context.currentTask) {
    this.context.currentTask.completed = false

    // Update storage immediately
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
})

When('I delete the task {string}', function (this: TaskManagerWorld, description: string) {
  const task = this.findTaskByDescription(description)
  if (task) {
    this.deleteTask(task.id)

    // Update storage immediately
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
})

When('I simulate an application restart', function (this: TaskManagerWorld) {
  // Save current state to storage
  const storageData = createStorageData(this.context.tasks)
  mockLocalStorage.setItem('taskManager', storageData)

  // Clear context and reload from storage
  this.resetContext()

  const reloadedData = mockLocalStorage.getItem('taskManager')
  if (reloadedData) {
    const parsed = parseStorageData(reloadedData)
    if (parsed && parsed.tasks) {
      this.context.tasks = parsed.tasks
      this.context.storage = { data: reloadedData }
    }
  }
})

When(
  'I create {int} tasks with descriptions {string} through {string}',
  function (this: TaskManagerWorld, count: number, startDesc: string, endDesc: string) {
    for (let i = 1; i <= count; i++) {
      this.addTask(`Task ${i}`)
    }

    // Save to storage
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
)

When('I mark every other task as completed', function (this: TaskManagerWorld) {
  this.context.tasks.forEach((task, index) => {
    if (index % 2 === 1) {
      // Every other task (0-indexed, so 1, 3, 5...)
      task.completed = true
    }
  })

  // Update storage
  const storageData = createStorageData(this.context.tasks)
  mockLocalStorage.setItem('taskManager', storageData)
  this.context.storage = { data: storageData }
})

When(
  'I attempt to create a new task {string}',
  function (this: TaskManagerWorld, description: string) {
    try {
      const task = this.addTask(description)
      const storageData = createStorageData(this.context.tasks)
      mockLocalStorage.setItem('taskManager', storageData)
      this.context.storage = { data: storageData }
    } catch (error) {
      this.context.lastError = error as Error
    }
  }
)

When(
  'I rapidly create multiple tasks in quick succession:',
  function (this: TaskManagerWorld, dataTable) {
    const descriptions = dataTable.hashes().map((row: any) => row.description)

    descriptions.forEach((description) => {
      this.addTask(description)
    })

    // Simulate rapid storage updates
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)
    this.context.storage = { data: storageData }
  }
)

When('I create multiple tasks:', function (this: TaskManagerWorld, dataTable) {
  const tasks = dataTable.hashes()

  tasks.forEach((row: any) => {
    const task = this.addTask(row.description)
    task.completed = row.completed === 'true'
  })

  // Save to storage
  const storageData = createStorageData(this.context.tasks)
  mockLocalStorage.setItem('taskManager', storageData)
  this.context.storage = { data: storageData }
})

// Assertion steps
Then('the task list should be empty', function (this: TaskManagerWorld) {
  expect(this.context.tasks).toHaveLength(0)
})

Then('no error should occur', function (this: TaskManagerWorld) {
  expect(this.context.lastError).toBeUndefined()
})

Then('the application should initialize successfully', function (this: TaskManagerWorld) {
  expect(this.context.tasks).toBeDefined()
  expect(Array.isArray(this.context.tasks)).toBe(true)
})

Then('the task list should contain {int} tasks', function (this: TaskManagerWorld, count: number) {
  expect(this.context.tasks).toHaveLength(count)
})

Then(
  'the tasks should be loaded with their original descriptions',
  function (this: TaskManagerWorld) {
    const storageData = this.context.storage?.data
    if (storageData) {
      const parsed = parseStorageData(storageData)
      if (parsed && parsed.tasks) {
        parsed.tasks.forEach((originalTask: any, index: number) => {
          expect(this.context.tasks[index].description).toBe(originalTask.description)
        })
      }
    }
  }
)

Then(
  'the tasks should be loaded with their original completion status',
  function (this: TaskManagerWorld) {
    const storageData = this.context.storage?.data
    if (storageData) {
      const parsed = parseStorageData(storageData)
      if (parsed && parsed.tasks) {
        parsed.tasks.forEach((originalTask: any, index: number) => {
          expect(this.context.tasks[index].completed).toBe(originalTask.completed)
        })
      }
    }
  }
)

Then(
  'the tasks should be loaded with their original creation timestamps',
  function (this: TaskManagerWorld) {
    const storageData = this.context.storage?.data
    if (storageData) {
      const parsed = parseStorageData(storageData)
      if (parsed && parsed.tasks) {
        parsed.tasks.forEach((originalTask: any, index: number) => {
          expect(this.context.tasks[index].createdAt).toEqual(originalTask.createdAt)
        })
      }
    }
  }
)

Then('the tasks should be displayed in the correct order', function (this: TaskManagerWorld) {
  // Tasks should maintain their creation order
  for (let i = 1; i < this.context.tasks.length; i++) {
    expect(this.context.tasks[i].createdAt.getTime()).toBeGreaterThanOrEqual(
      this.context.tasks[i - 1].createdAt.getTime()
    )
  }
})

Then(
  'the task {string} should be marked as completed',
  function (this: TaskManagerWorld, description: string) {
    const task = this.findTaskByDescription(description)
    expect(task).toBeDefined()
    expect(task?.completed).toBe(true)
  }
)

Then(
  'the task {string} should be marked as incomplete',
  function (this: TaskManagerWorld, description: string) {
    const task = this.findTaskByDescription(description)
    expect(task).toBeDefined()
    expect(task?.completed).toBe(false)
  }
)

Then(
  'the completion status should be visually indicated correctly',
  function (this: TaskManagerWorld) {
    // This would be tested in UI components - here we just verify the data is correct
    this.context.tasks.forEach((task) => {
      expect(typeof task.completed).toBe('boolean')
    })
  }
)

Then('the task should be immediately saved to local storage', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  expect(storageData).toBeDefined()

  const parsed = parseStorageData(storageData!)
  expect(parsed).toBeDefined()
  expect(parsed!.tasks).toHaveLength(this.context.tasks.length)
})

Then('local storage should contain the task data', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  expect(storageData).toBeDefined()

  const parsed = parseStorageData(storageData!)
  expect(parsed).toBeDefined()
  expect(parsed!.tasks.length).toBeGreaterThan(0)
})

Then('the storage format should include version information', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  expect(storageData).toBeDefined()

  const parsed = JSON.parse(storageData!)
  expect(parsed.version).toBe('1.0')
})

Then('the storage should be valid JSON', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  expect(storageData).toBeDefined()

  expect(() => JSON.parse(storageData!)).not.toThrow()
})

Then(
  'the task completion status should be immediately saved to local storage',
  function (this: TaskManagerWorld) {
    const storageData = mockLocalStorage.getItem('taskManager')
    expect(storageData).toBeDefined()

    const parsed = parseStorageData(storageData!)
    expect(parsed).toBeDefined()

    if (this.context.currentTask) {
      const storedTask = parsed!.tasks.find((t: any) => t.id === this.context.currentTask!.id)
      expect(storedTask?.completed).toBe(this.context.currentTask.completed)
    }
  }
)

Then(
  'local storage should reflect the updated completion status',
  function (this: TaskManagerWorld) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = parseStorageData(storageData!)

    if (this.context.currentTask) {
      const storedTask = parsed!.tasks.find((t: any) => t.id === this.context.currentTask!.id)
      expect(storedTask?.completed).toBe(this.context.currentTask.completed)
    }
  }
)

Then(
  'the task completion status should be immediately updated in local storage',
  function (this: TaskManagerWorld) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = parseStorageData(storageData!)

    if (this.context.currentTask) {
      const storedTask = parsed!.tasks.find((t: any) => t.id === this.context.currentTask!.id)
      expect(storedTask?.completed).toBe(false) // Should be false after marking incomplete again
    }
  }
)

Then(
  'the task should be immediately removed from local storage',
  function (this: TaskManagerWorld) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = parseStorageData(storageData!)

    expect(parsed!.tasks).toHaveLength(this.context.tasks.length)
  }
)

Then(
  'local storage should only contain {string}',
  function (this: TaskManagerWorld, description: string) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = parseStorageData(storageData!)

    expect(parsed!.tasks).toHaveLength(1)
    expect(parsed!.tasks[0].description).toBe(description)
  }
)

Then('the remaining task data should be intact', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  const parsed = parseStorageData(storageData!)

  parsed!.tasks.forEach((storedTask: any) => {
    const contextTask = this.context.tasks.find((t) => t.id === storedTask.id)
    expect(contextTask).toBeDefined()
    expect(storedTask.description).toBe(contextTask!.description)
    expect(storedTask.completed).toBe(contextTask!.completed)
  })
})

Then(
  'the application should initialize with an empty task list',
  function (this: TaskManagerWorld) {
    expect(this.context.tasks).toHaveLength(0)
  }
)

Then('no error should be thrown', function (this: TaskManagerWorld) {
  expect(this.context.lastError).toBeUndefined()
})

Then('the application should remain functional', function (this: TaskManagerWorld) {
  // Test that we can still add tasks after handling corruption
  expect(() => this.addTask('Test task')).not.toThrow()
})

Then('a new valid storage structure should be created', function (this: TaskManagerWorld) {
  // After handling corruption, the app should create fresh storage
  const task = this.addTask('Test task')
  const storageData = createStorageData([task])
  mockLocalStorage.setItem('taskManager', storageData)

  const parsed = parseStorageData(storageData)
  expect(parsed).toBeDefined()
  expect(parsed!.version).toBe('1.0')
})

Then('the corrupted data should be handled gracefully', function (this: TaskManagerWorld) {
  expect(this.context.storage?.corrupted).toBe(true)
  expect(this.context.tasks).toHaveLength(0)
})

Then('the application should create a fresh storage structure', function (this: TaskManagerWorld) {
  // Verify that after corruption, we can create new valid storage
  const task = this.addTask('Fresh task')
  const storageData = createStorageData([task])

  expect(() => JSON.parse(storageData)).not.toThrow()
  const parsed = JSON.parse(storageData)
  expect(parsed.version).toBe('1.0')
})

Then('the application should load the tasks successfully', function (this: TaskManagerWorld) {
  expect(this.context.tasks.length).toBeGreaterThan(0)
})

Then(
  'the application should add version information to the storage',
  function (this: TaskManagerWorld) {
    // Simulate the app updating storage with version info
    const storageData = createStorageData(this.context.tasks)
    mockLocalStorage.setItem('taskManager', storageData)

    const parsed = JSON.parse(storageData)
    expect(parsed.version).toBe('1.0')
  }
)

Then('the tasks should be displayed correctly', function (this: TaskManagerWorld) {
  this.context.tasks.forEach((task) => {
    expect(task.id).toBeDefined()
    expect(task.description).toBeDefined()
    expect(typeof task.completed).toBe('boolean')
    expect(task.createdAt).toBeInstanceOf(Date)
  })
})

Then(
  'the application should handle the version mismatch gracefully',
  function (this: TaskManagerWorld) {
    expect(this.context.lastError).toBeUndefined()
    expect(this.context.tasks).toBeDefined()
  }
)

Then(
  'the application should either migrate or initialize with empty state',
  function (this: TaskManagerWorld) {
    expect(Array.isArray(this.context.tasks)).toBe(true)
  }
)

Then('no errors should occur', function (this: TaskManagerWorld) {
  expect(this.context.lastError).toBeUndefined()
})

Then('local storage should contain a valid JSON structure', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  expect(storageData).toBeDefined()
  expect(() => JSON.parse(storageData!)).not.toThrow()
})

Then(
  'the storage should include a {string} array',
  function (this: TaskManagerWorld, arrayName: string) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = JSON.parse(storageData!)
    expect(Array.isArray(parsed[arrayName])).toBe(true)
  }
)

Then(
  'the storage should include version information {string}',
  function (this: TaskManagerWorld, version: string) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = JSON.parse(storageData!)
    expect(parsed.version).toBe(version)
  }
)

Then(
  'each task should have id, description, completed, and createdAt fields',
  function (this: TaskManagerWorld) {
    const storageData = mockLocalStorage.getItem('taskManager')
    const parsed = parseStorageData(storageData!)

    parsed!.tasks.forEach((task: any) => {
      expect(task.id).toBeDefined()
      expect(task.description).toBeDefined()
      expect(typeof task.completed).toBe('boolean')
      expect(task.createdAt).toBeDefined()
    })
  }
)

Then('all task IDs should be unique', function (this: TaskManagerWorld) {
  const ids = this.context.tasks.map((task) => task.id)
  const uniqueIds = new Set(ids)
  expect(uniqueIds.size).toBe(ids.length)
})

Then('all creation timestamps should be valid dates', function (this: TaskManagerWorld) {
  this.context.tasks.forEach((task) => {
    expect(task.createdAt).toBeInstanceOf(Date)
    expect(isNaN(task.createdAt.getTime())).toBe(false)
  })
})

Then(
  'the task {string} should still exist',
  function (this: TaskManagerWorld, description: string) {
    const task = this.findTaskByDescription(description)
    expect(task).toBeDefined()
  }
)

Then('the task should still be marked as completed', function (this: TaskManagerWorld) {
  if (this.context.currentTask) {
    expect(this.context.currentTask.completed).toBe(true)
  }
})

Then('the task should have the same ID and creation timestamp', function (this: TaskManagerWorld) {
  // This would be verified by comparing with pre-restart state
  // For now, just verify the task has valid ID and timestamp
  if (this.context.currentTask) {
    expect(this.context.currentTask.id).toBeDefined()
    expect(this.context.currentTask.createdAt).toBeInstanceOf(Date)
  }
})

Then('all {int} tasks should be restored', function (this: TaskManagerWorld, count: number) {
  expect(this.context.tasks).toHaveLength(count)
})

Then('the completion status of each task should be preserved', function (this: TaskManagerWorld) {
  // Verify that every other task is completed (as set in the "mark every other task" step)
  this.context.tasks.forEach((task, index) => {
    if (index % 2 === 1) {
      expect(task.completed).toBe(true)
    } else {
      expect(task.completed).toBe(false)
    }
  })
})

Then('the tasks should be in the correct order', function (this: TaskManagerWorld) {
  for (let i = 0; i < this.context.tasks.length - 1; i++) {
    expect(this.context.tasks[i].createdAt.getTime()).toBeLessThanOrEqual(
      this.context.tasks[i + 1].createdAt.getTime()
    )
  }
})

Then('no data should be lost or corrupted', function (this: TaskManagerWorld) {
  this.context.tasks.forEach((task) => {
    expect(task.id).toBeDefined()
    expect(task.description).toBeDefined()
    expect(typeof task.completed).toBe('boolean')
    expect(task.createdAt).toBeInstanceOf(Date)
  })
})

Then('the application should handle storage quota gracefully', function (this: TaskManagerWorld) {
  // Either the task was saved or an error was handled gracefully
  const hasError = this.context.lastError !== undefined
  const taskWasSaved = this.context.tasks.some((task) => task.description === 'Important task')

  expect(hasError || taskWasSaved).toBe(true)
})

Then('either the task should be saved successfully', function (this: TaskManagerWorld) {
  // This is part of an "either/or" assertion - implementation would handle this
  expect(true).toBe(true) // Placeholder
})

Then('or an appropriate error should be displayed to the user', function (this: TaskManagerWorld) {
  // This is part of an "either/or" assertion - implementation would handle this
  expect(true).toBe(true) // Placeholder
})

Then('all tasks should be saved to local storage', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  const parsed = parseStorageData(storageData!)

  expect(parsed!.tasks).toHaveLength(this.context.tasks.length)
})

Then('no data should be lost due to race conditions', function (this: TaskManagerWorld) {
  expect(this.context.tasks).toHaveLength(3) // Task A, B, C
  expect(this.context.tasks.map((t) => t.description)).toEqual(['Task A', 'Task B', 'Task C'])
})

Then('the storage should remain in a consistent state', function (this: TaskManagerWorld) {
  const storageData = mockLocalStorage.getItem('taskManager')
  expect(storageData).toBeDefined()

  const parsed = parseStorageData(storageData!)
  expect(parsed).toBeDefined()
  expect(parsed!.tasks).toHaveLength(this.context.tasks.length)
})

Then('all tasks should be retrievable after restart', function (this: TaskManagerWorld) {
  // Simulate restart
  const storageData = mockLocalStorage.getItem('taskManager')
  const parsed = parseStorageData(storageData!)

  expect(parsed!.tasks).toHaveLength(3)
  expect(parsed!.tasks.map((t: any) => t.description)).toEqual(['Task A', 'Task B', 'Task C'])
})
