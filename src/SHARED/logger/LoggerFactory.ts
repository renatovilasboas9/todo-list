import Logger, { LoggerConfig } from './Logger'

export class LoggerFactory {
    private static logger: Logger | null = null

    public static createLogger(config?: Partial<LoggerConfig>): Logger {
        const defaultConfig: LoggerConfig = {
            enableDebug: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
            enableFileLogging: true,
            logDirectory: 'logs'
        }

        const finalConfig = { ...defaultConfig, ...config }

        if (!LoggerFactory.logger) {
            LoggerFactory.logger = Logger.getInstance(finalConfig)
        }

        return LoggerFactory.logger
    }

    public static getLogger(): Logger {
        if (!LoggerFactory.logger) {
            LoggerFactory.logger = LoggerFactory.createLogger()
        }
        return LoggerFactory.logger
    }
}

export default LoggerFactory