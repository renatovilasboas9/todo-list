/**
 * BDD Configuration for Task Manager Domain
 *
 * This file contains configuration and utilities for BDD testing
 * following the BDD-First methodology.
 */

export interface BDDConfig {
  timeout: number
  retries: number
  parallel: boolean
  tags?: string
}

export const bddConfig: BDDConfig = {
  timeout: 10000, // 10 seconds timeout for BDD steps
  retries: 0, // No retries for BDD scenarios to ensure deterministic behavior
  parallel: false, // Run scenarios sequentially for predictable state management
  tags: undefined, // No tag filtering by default
}

/**
 * BDD Test Data Generators
 * These utilities help create consistent test data across BDD scenarios
 */
export class BDDTestData {
  static validTaskDescriptions = [
    'Buy groceries',
    'Complete project documentation',
    'Schedule dentist appointment',
    'Review code changes',
    'Plan weekend trip',
  ]

  static invalidTaskDescriptions = [
    '', // empty string
    '   ', // whitespace only
    '\t\n', // tabs and newlines
    'a'.repeat(501), // too long (over 500 chars)
  ]

  static generateValidTask() {
    const description =
      this.validTaskDescriptions[Math.floor(Math.random() * this.validTaskDescriptions.length)]
    return {
      id: `task-${Date.now()}-${Math.random()}`,
      description,
      completed: false,
      createdAt: new Date(),
    }
  }

  static generateInvalidTaskDescription() {
    return this.invalidTaskDescriptions[
      Math.floor(Math.random() * this.invalidTaskDescriptions.length)
    ]
  }

  static generateTaskList(count: number = 3) {
    return Array.from({ length: count }, () => this.generateValidTask())
  }
}

/**
 * BDD Assertion Helpers
 * Common assertions used across BDD scenarios
 */
export class BDDAssertions {
  static isValidTask(task: any): boolean {
    return (
      task &&
      typeof task.id === 'string' &&
      typeof task.description === 'string' &&
      task.description.trim().length > 0 &&
      task.description.length <= 500 &&
      typeof task.completed === 'boolean' &&
      task.createdAt instanceof Date
    )
  }

  static isEmptyOrWhitespace(str: string): boolean {
    return !str || str.trim().length === 0
  }

  static hasValidStorageFormat(data: any): boolean {
    return data && Array.isArray(data.tasks) && typeof data.version === 'string'
  }
}
