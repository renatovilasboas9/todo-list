import { TaskDomainConfig as TestTaskDomainConfig, createTestTaskDomainConfig } from './test'
import { TaskDomainConfig as ProdTaskDomainConfig, createProdTaskDomainConfig } from './prod'
import EventBus from '../SHARED/eventbus/EventBus'
import Logger from '../SHARED/logger/Logger'

/**
 * Application Configuration Interface
 * 
 * Defines the complete application configuration including all domains,
 * shared infrastructure, and environment-specific settings.
 */
export interface AppConfigData {
    environment: 'TEST' | 'PROD'
    taskDomain: TestTaskDomainConfig | ProdTaskDomainConfig
    eventBus: EventBus
    logger: Logger
}

/**
 * Application Composition Root
 * 
 * Central configuration point that coordinates all application dependencies.
 * This is the single place where all services, repositories, and infrastructure
 * components are wired together based on the current environment.
 * 
 * Responsibilities:
 * - Environment detection and configuration selection
 * - Dependency injection setup for all domains
 * - Shared infrastructure initialization (EventBus, Logger)
 * - Cross-domain event handler registration
 * - Application lifecycle management
 */
export class AppConfigManager {
    private static instance: AppConfigManager | null = null
    private config: AppConfigData | null = null

    private constructor() { }

    /**
     * Get singleton instance of AppConfigManager
     */
    public static getInstance(): AppConfigManager {
        if (!AppConfigManager.instance) {
            AppConfigManager.instance = new AppConfigManager()
        }
        return AppConfigManager.instance
    }

    /**
     * Initialize application configuration based on environment
     * 
     * @param environment - Target environment ('TEST' or 'PROD')
     * @returns Configured application dependencies
     */
    public async initialize(environment: 'TEST' | 'PROD' = 'TEST'): Promise<AppConfigData> {
        const logger = Logger.getInstance()
        const correlationId = logger.startCorrelation()

        try {
            logger.info('Initializing application configuration', {
                environment,
                correlationId
            })

            // Initialize shared infrastructure
            const eventBus = EventBus.getInstance()

            // Configure domain based on environment
            let taskDomain: TestTaskDomainConfig | ProdTaskDomainConfig

            if (environment === 'PROD') {
                taskDomain = await createProdTaskDomainConfig()
                logger.info('Production task domain configured', {
                    environment,
                    repository: 'LocalStorageTaskRepository',
                    correlationId
                })
            } else {
                taskDomain = createTestTaskDomainConfig()
                logger.info('Test task domain configured', {
                    environment,
                    repository: 'MemoryTaskRepository',
                    correlationId
                })
            }

            // Set up cross-domain event handlers if needed
            this.setupCrossDomainEventHandlers(eventBus, logger)

            const config: AppConfigData = {
                environment,
                taskDomain,
                eventBus,
                logger
            }

            this.config = config

            logger.info('Application configuration initialized successfully', {
                environment,
                domains: ['task'],
                correlationId
            })

            return config

        } catch (error) {
            logger.error('Failed to initialize application configuration', error as Error, {
                environment,
                correlationId
            })
            throw error
        } finally {
            logger.endCorrelation()
        }
    }

    /**
     * Get current application configuration
     * 
     * @throws Error if configuration not initialized
     */
    public getConfig(): AppConfigData {
        if (!this.config) {
            throw new Error('Application configuration not initialized. Call initialize() first.')
        }
        return this.config
    }

    /**
     * Check if application is configured
     */
    public isConfigured(): boolean {
        return this.config !== null
    }

    /**
     * Get current environment
     */
    public getEnvironment(): 'TEST' | 'PROD' | null {
        return this.config?.environment || null
    }

    /**
     * Set up cross-domain event handlers
     * 
     * This method registers event handlers that coordinate between different domains
     * or handle system-wide events that affect multiple domains.
     * 
     * @param eventBus - The application event bus
     * @param logger - The application logger
     */
    private setupCrossDomainEventHandlers(eventBus: EventBus, logger: Logger): void {
        // System-wide error handling
        eventBus.subscribe('SYSTEM.ERROR', async (event) => {
            logger.error('System-wide error occurred', new Error(event.payload.message), {
                source: event.payload.source,
                context: event.payload.context
            })
        })

        // Application lifecycle events
        eventBus.subscribe('SYSTEM.APP.STARTED', async (event) => {
            logger.info('Application started', {
                timestamp: new Date().toISOString(),
                environment: this.config?.environment
            })
        })

        eventBus.subscribe('SYSTEM.APP.STOPPING', async (event) => {
            logger.info('Application stopping', {
                timestamp: new Date().toISOString(),
                environment: this.config?.environment
            })
        })

        logger.debug('Cross-domain event handlers registered', {
            handlers: ['SYSTEM.ERROR', 'SYSTEM.APP.STARTED', 'SYSTEM.APP.STOPPING']
        })
    }

    /**
     * Shutdown application and cleanup resources
     */
    public async shutdown(): Promise<void> {
        const logger = this.config?.logger || Logger.getInstance()
        const correlationId = logger.startCorrelation()

        try {
            logger.info('Shutting down application', {
                environment: this.config?.environment,
                correlationId
            })

            // Publish shutdown event
            if (this.config?.eventBus) {
                await this.config.eventBus.publish('SYSTEM.APP.STOPPING', {
                    timestamp: new Date().toISOString()
                }, correlationId)
            }

            // Clear event bus
            if (this.config?.eventBus) {
                this.config.eventBus.clear()
            }

            // Reset configuration
            this.config = null

            logger.info('Application shutdown completed', {
                correlationId
            })

        } catch (error) {
            logger.error('Error during application shutdown', error as Error, {
                correlationId
            })
            throw error
        } finally {
            logger.endCorrelation()
        }
    }

    /**
     * Reset configuration (for testing)
     */
    public reset(): void {
        this.config = null
    }

    /**
     * Create application configuration for testing
     * 
     * Convenience method for test scenarios that need a configured application.
     */
    public static async createTestConfig(): Promise<AppConfigData> {
        const appConfig = AppConfigManager.getInstance()
        return await appConfig.initialize('TEST')
    }

    /**
     * Create application configuration for production
     * 
     * Convenience method for production scenarios.
     */
    public static async createProdConfig(): Promise<AppConfigData> {
        const appConfig = AppConfigManager.getInstance()
        return await appConfig.initialize('PROD')
    }
}

/**
 * Environment Detection Utilities
 */
export class EnvironmentDetector {
    /**
     * Detect current environment based on various indicators
     * 
     * @returns Detected environment
     */
    public static detectEnvironment(): 'TEST' | 'PROD' {
        // Check for test environment indicators
        if (
            typeof process !== 'undefined' &&
            (process.env.NODE_ENV === 'test' ||
                process.env.VITEST === 'true' ||
                process.env.TEST === 'true')
        ) {
            return 'TEST'
        }

        // Check for development environment (treat as TEST for now)
        if (
            typeof process !== 'undefined' &&
            process.env.NODE_ENV === 'development'
        ) {
            return 'TEST'
        }

        // Check browser environment indicators
        if (typeof window !== 'undefined') {
            // Check for test frameworks in browser
            if (
                (window as any).__vitest__ ||
                (window as any).__jest__ ||
                (window as any).__karma__
            ) {
                return 'TEST'
            }

            // Check URL for test indicators
            if (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.search.includes('test=true')
            ) {
                return 'TEST'
            }
        }

        // Default to PROD for production builds
        return 'PROD'
    }

    /**
     * Check if running in test environment
     */
    public static isTestEnvironment(): boolean {
        return EnvironmentDetector.detectEnvironment() === 'TEST'
    }

    /**
     * Check if running in production environment
     */
    public static isProductionEnvironment(): boolean {
        return EnvironmentDetector.detectEnvironment() === 'PROD'
    }
}