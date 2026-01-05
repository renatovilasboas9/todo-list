/**
 * Configuration Module Exports
 * 
 * Central export point for all application configuration.
 * This module provides the main entry points for dependency injection
 * and environment-specific configuration.
 */

import { AppConfigManager, EnvironmentDetector } from './AppConfig'
// Main application configuration
export { AppConfigManager, EnvironmentDetector }

export type { AppConfigData } from './AppConfig'
// Environment-specific configurations
export { createProdTaskDomainConfig, ProdConfigUtils } from './prod'

// Type definitions
export type { TaskDomainConfig as TestTaskDomainConfig } from './test'
export type { TaskDomainConfig as ProdTaskDomainConfig } from './prod'

/**
 * Convenience function to initialize application with environment detection
 * 
 * This is the main entry point for applications that want automatic
 * environment detection and configuration.
 */
export async function initializeApp() {
    const appConfig = AppConfigManager.getInstance()
    const environment = EnvironmentDetector.detectEnvironment()

    return await appConfig.initialize(environment)
}

/**
 * Convenience function to initialize application for testing
 * 
 * This is the main entry point for test scenarios that need
 * a configured application with test dependencies.
 */
export async function initializeTestApp() {
    return await AppConfigManager.createTestConfig()
}

/**
 * Convenience function to initialize application for production
 * 
 * This is the main entry point for production scenarios.
 */
export async function initializeProdApp() {
    return await AppConfigManager.createProdConfig()
}