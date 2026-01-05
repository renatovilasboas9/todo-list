/**
 * BDD Configuration for Task Manager Domain
 *
 * This file contains configuration and utilities for BDD testing
 * following the BDD-First methodology.
 * 
 * Uses official Zod contracts from SHARED/contracts for validation.
 */

import {
  TaskSchema,
  CreateTaskInputSchema,
  StorageSchema,
  validateTask,
  validateCreateTaskInput,
  isEmptyOrWhitespace,
  type Task,
  type CreateTaskInput,
  type StorageData,
  VALIDATION_CONSTANTS
} from '../../../SHARED/contracts/task/v1'
import { v4 as uuidv4 } from 'uuid'

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
 * Uses official Zod contracts for type safety and validation
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
    'a'.repeat(VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH + 1), // too long
  ]

  static generateValidTask(): Task {
    const description =
      this.validTaskDescriptions[Math.floor(Math.random() * this.validTaskDescriptions.length)]

    const task = {
      id: uuidv4(),
      description,
      completed: false,
      createdAt: new Date(),
    }

    // Validate using official Zod schema
    return TaskSchema.parse(task)
  }

  static generateValidCreateTaskInput(): CreateTaskInput {
    const description =
      this.validTaskDescriptions[Math.floor(Math.random() * this.validTaskDescriptions.length)]

    const input = { description }

    // Validate using official Zod schema
    return CreateTaskInputSchema.parse(input)
  }

  static generateInvalidTaskDescription(): string {
    return this.invalidTaskDescriptions[
      Math.floor(Math.random() * this.invalidTaskDescriptions.length)
    ]
  }

  static generateTaskList(count: number = 3): Task[] {
    return Array.from({ length: count }, () => this.generateValidTask())
  }
}

/**
 * BDD Validation Helpers
 * Uses official Zod contracts for validation instead of manual checks
 */
export class BDDValidation {
  /**
   * Validates a task using official Zod schema
   */
  static isValidTask(task: unknown): boolean {
    const result = validateTask(task)
    return result.isValid
  }

  /**
   * Validates task creation input using official Zod schema
   */
  static isValidCreateTaskInput(input: unknown): boolean {
    const result = validateCreateTaskInput(input)
    return result.isValid
  }

  /**
   * Checks if string is empty or whitespace using official utility
   */
  static isEmptyOrWhitespace(str: string): boolean {
    return isEmptyOrWhitespace(str)
  }

  /**
   * Validates storage format using official Zod schema
   */
  static hasValidStorageFormat(data: unknown): boolean {
    try {
      StorageSchema.parse(data)
      return true
    } catch {
      return false
    }
  }

  /**
   * Parses and validates a task using official Zod schema
   */
  static parseTask(task: unknown): Task | null {
    try {
      return TaskSchema.parse(task)
    } catch {
      return null
    }
  }

  /**
   * Parses and validates storage data using official Zod schema
   */
  static parseStorageData(data: unknown): StorageData | null {
    try {
      return StorageSchema.parse(data)
    } catch {
      return null
    }
  }
}
