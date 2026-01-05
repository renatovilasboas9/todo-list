import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AppConfigManager, EnvironmentDetector } from './AppConfig'
import { MemoryTaskRepository } from '../domains/task/repositories/MemoryTaskRepository'
import { LocalStorageTaskRepository } from '../domains/task/repositories/LocalStorageTaskRepository'

describe('AppConfigManager', () => {
    let appConfig: AppConfigManager

    beforeEach(() => {
        appConfig = AppConfigManager.getInstance()
        appConfig.reset()
    })

    afterEach(() => {
        appConfig.reset()
    })

    describe('Environment Detection', () => {
        it('should detect test environment correctly', () => {
            const environment = EnvironmentDetector.detectEnvironment()
            expect(environment).toBe('TEST')
        })

        it('should identify test environment', () => {
            expect(EnvironmentDetector.isTestEnvironment()).toBe(true)
            expect(EnvironmentDetector.isProductionEnvironment()).toBe(false)
        })
    })

    describe('Configuration Initialization', () => {
        it('should initialize test configuration', async () => {
            const config = await appConfig.initialize('TEST')

            expect(config.environment).toBe('TEST')
            expect(config.taskDomain).toBeDefined()
            expect(config.taskDomain.taskRepository).toBeInstanceOf(MemoryTaskRepository)
            expect(config.eventBus).toBeDefined()
            expect(config.logger).toBeDefined()
        })

        it('should initialize production configuration', async () => {
            const config = await appConfig.initialize('PROD')

            expect(config.environment).toBe('PROD')
            expect(config.taskDomain).toBeDefined()
            expect(config.taskDomain.taskRepository).toBeInstanceOf(LocalStorageTaskRepository)
            expect(config.eventBus).toBeDefined()
            expect(config.logger).toBeDefined()
        })

        it('should default to test environment', async () => {
            const config = await appConfig.initialize()

            expect(config.environment).toBe('TEST')
            expect(config.taskDomain.taskRepository).toBeInstanceOf(MemoryTaskRepository)
        })
    })

    describe('Configuration Management', () => {
        it('should track configuration state', async () => {
            expect(appConfig.isConfigured()).toBe(false)
            expect(appConfig.getEnvironment()).toBe(null)

            const config = await appConfig.initialize('TEST')

            expect(appConfig.isConfigured()).toBe(true)
            expect(appConfig.getEnvironment()).toBe('TEST')
            expect(appConfig.getConfig()).toBe(config)
        })

        it('should throw error when accessing config before initialization', () => {
            expect(() => appConfig.getConfig()).toThrow('Application configuration not initialized')
        })

        it('should reset configuration', async () => {
            await appConfig.initialize('TEST')
            expect(appConfig.isConfigured()).toBe(true)

            appConfig.reset()
            expect(appConfig.isConfigured()).toBe(false)
        })
    })

    describe('Convenience Methods', () => {
        it('should create test configuration', async () => {
            const config = await AppConfigManager.createTestConfig()

            expect(config.environment).toBe('TEST')
            expect(config.taskDomain.taskRepository).toBeInstanceOf(MemoryTaskRepository)
        })

        it('should create production configuration', async () => {
            const config = await AppConfigManager.createProdConfig()

            expect(config.environment).toBe('PROD')
            expect(config.taskDomain.taskRepository).toBeInstanceOf(LocalStorageTaskRepository)
        })
    })

    describe('Singleton Pattern', () => {
        it('should return same instance', () => {
            const instance1 = AppConfigManager.getInstance()
            const instance2 = AppConfigManager.getInstance()

            expect(instance1).toBe(instance2)
        })
    })
})