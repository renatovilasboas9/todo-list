export { default as Logger, LogLevel, type LogEntry, type LoggerConfig } from './Logger'
export { LoggerFactory, default as DefaultLoggerFactory } from './LoggerFactory'
export { CorrelationUtils, default as DefaultCorrelationUtils } from './CorrelationUtils'

// Convenience exports for common usage
export const logger = LoggerFactory.getLogger()
export const withCorrelation = CorrelationUtils.withCorrelation
export const startUIAction = CorrelationUtils.startUIAction
export const startDomainOperation = CorrelationUtils.startDomainOperation
export const startSystemOperation = CorrelationUtils.startSystemOperation
export const endCorrelation = CorrelationUtils.endCorrelation
export const getCurrentCorrelationId = CorrelationUtils.getCurrentCorrelationId