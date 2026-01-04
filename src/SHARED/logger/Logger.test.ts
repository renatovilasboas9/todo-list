import { describe, it, expect, beforeEach, vi } from 'vitest'
import Logger, { LogLevel } from './Logger'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Mock console methods
const consoleMock = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}
Object.assign(console, consoleMock)

describe('Logger', () => {
    let logger: Logger

    beforeEach(() => {
        // Reset singleton instance
        ; (Logger as any).instance = null
        vi.clearAllMocks()
        localStorageMock.getItem.mockReturnValue('')
    })

    it('should create a singleton instance', () => {
        const logger1 = Logger.getInstance()
        const logger2 = Logger.getInstance()
        expect(logger1).toBe(logger2)
    })

    it('should start and end correlation', () => {
        logger = Logger.getInstance()

        expect(logger.getCurrentCorrelationId()).toBeNull()

        const correlationId = logger.startCorrelation()
        expect(correlationId).toBeTruthy()
        expect(logger.getCurrentCorrelationId()).toBe(correlationId)

        logger.endCorrelation()
        expect(logger.getCurrentCorrelationId()).toBeNull()
    })

    it('should use custom correlation ID when provided', () => {
        logger = Logger.getInstance()

        const customId = 'custom-correlation-id'
        const returnedId = logger.startCorrelation(customId)

        expect(returnedId).toBe(customId)
        expect(logger.getCurrentCorrelationId()).toBe(customId)
    })

    it('should log debug messages when debug is enabled', () => {
        logger = Logger.getInstance({ enableDebug: true, enableFileLogging: false, logDirectory: 'logs' })

        logger.debug('Test debug message', { key: 'value' })

        expect(consoleMock.debug).toHaveBeenCalledWith(
            expect.stringContaining('[DEBUG]'),
            { key: 'value' },
            ''
        )
    })

    it('should not log debug messages when debug is disabled', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        logger.debug('Test debug message')

        expect(consoleMock.debug).not.toHaveBeenCalled()
    })

    it('should log info messages', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        logger.info('Test info message', { key: 'value' })

        expect(consoleMock.info).toHaveBeenCalledWith(
            expect.stringContaining('[INFO]'),
            { key: 'value' },
            ''
        )
    })

    it('should log warn messages', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        logger.warn('Test warn message', { key: 'value' })

        expect(consoleMock.warn).toHaveBeenCalledWith(
            expect.stringContaining('[WARN]'),
            { key: 'value' },
            ''
        )
    })

    it('should log error messages with error object', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        const error = new Error('Test error')
        logger.error('Test error message', error, { key: 'value' })

        expect(consoleMock.error).toHaveBeenCalledWith(
            expect.stringContaining('[ERROR]'),
            { key: 'value' },
            error
        )
    })

    it('should store logs in localStorage when file logging is enabled', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: true, logDirectory: 'logs' })

        logger.info('Test message')

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'task-manager-logs',
            expect.stringContaining('"message":"Test message"')
        )
    })

    it('should export logs', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        logger.info('Test message 1')
        logger.info('Test message 2')

        const logs = logger.exportLogs()
        expect(logs).toHaveLength(2)
        expect(logs[0].message).toBe('Test message 1')
        expect(logs[1].message).toBe('Test message 2')
    })

    it('should filter logs by correlation ID', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        const correlationId1 = logger.startCorrelation()
        logger.info('Message 1')
        logger.endCorrelation()

        const correlationId2 = logger.startCorrelation()
        logger.info('Message 2')
        logger.endCorrelation()

        const logs1 = logger.getLogsByCorrelationId(correlationId1)
        const logs2 = logger.getLogsByCorrelationId(correlationId2)

        expect(logs1).toHaveLength(1)
        expect(logs1[0].message).toBe('Message 1')
        expect(logs2).toHaveLength(1)
        expect(logs2[0].message).toBe('Message 2')
    })

    it('should clear logs', () => {
        logger = Logger.getInstance({ enableDebug: false, enableFileLogging: false, logDirectory: 'logs' })

        logger.info('Test message')
        expect(logger.exportLogs()).toHaveLength(1)

        logger.clearLogs()
        expect(logger.exportLogs()).toHaveLength(0)
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('task-manager-logs')
    })
})