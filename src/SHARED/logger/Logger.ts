import { v4 as uuidv4 } from 'uuid'

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    correlationId: string
    context?: Record<string, unknown>
    error?: Error
}

export interface LoggerConfig {
    enableDebug: boolean
    enableFileLogging: boolean
    logDirectory: string
}

class Logger {
    private static instance: Logger
    private config: LoggerConfig
    private currentCorrelationId: string | null = null
    private logEntries: LogEntry[] = []

    private constructor(config: LoggerConfig) {
        this.config = config
    }

    public static getInstance(config?: LoggerConfig): Logger {
        if (!Logger.instance) {
            const defaultConfig: LoggerConfig = {
                enableDebug: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
                enableFileLogging: true,
                logDirectory: 'logs'
            }
            Logger.instance = new Logger(config || defaultConfig)
        }
        return Logger.instance
    }

    public startCorrelation(correlationId?: string): string {
        this.currentCorrelationId = correlationId || uuidv4()
        return this.currentCorrelationId
    }

    public endCorrelation(): void {
        this.currentCorrelationId = null
    }

    public getCurrentCorrelationId(): string | null {
        return this.currentCorrelationId
    }

    public debug(message: string, context?: Record<string, unknown>): void {
        if (this.config.enableDebug) {
            this.log(LogLevel.DEBUG, message, context)
        }
    }

    public info(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, message, context)
    }

    public warn(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, message, context)
    }

    public error(message: string, error?: Error, context?: Record<string, unknown>): void {
        this.log(LogLevel.ERROR, message, context, error)
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            correlationId: this.currentCorrelationId || 'no-correlation',
            context,
            error
        }

        this.logEntries.push(logEntry)

        // Console output
        this.outputToConsole(logEntry)

        // File logging (in browser environment, we'll store in memory and provide export functionality)
        if (this.config.enableFileLogging) {
            this.writeToFile(logEntry)
        }
    }

    private outputToConsole(entry: LogEntry): void {
        const logMessage = `[${entry.timestamp}] [${entry.level}] [${entry.correlationId}] ${entry.message}`

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(logMessage, entry.context || '', entry.error || '')
                break
            case LogLevel.INFO:
                console.info(logMessage, entry.context || '', entry.error || '')
                break
            case LogLevel.WARN:
                console.warn(logMessage, entry.context || '', entry.error || '')
                break
            case LogLevel.ERROR:
                console.error(logMessage, entry.context || '', entry.error || '')
                break
        }
    }

    private writeToFile(entry: LogEntry): void {
        // In browser environment, we store logs in memory and provide export functionality
        // In a Node.js environment, this would write to actual files
        try {
            const logData = JSON.stringify(entry) + '\n'

            // Store in localStorage for persistence across sessions
            const existingLogs = localStorage.getItem('task-manager-logs') || ''
            localStorage.setItem('task-manager-logs', existingLogs + logData)
        } catch (error) {
            // Fallback if localStorage is full or unavailable
            console.warn('Failed to write log to storage:', error)
        }
    }

    public exportLogs(): LogEntry[] {
        return [...this.logEntries]
    }

    public clearLogs(): void {
        this.logEntries = []
        localStorage.removeItem('task-manager-logs')
    }

    public getLogsByCorrelationId(correlationId: string): LogEntry[] {
        return this.logEntries.filter(entry => entry.correlationId === correlationId)
    }
}

export default Logger