import { LoggerFactory } from './LoggerFactory'

export class CorrelationUtils {
    /**
     * Wraps a function with correlation tracking
     */
    public static withCorrelation<T extends (...args: any[]) => any>(
        fn: T,
        operationName: string,
        correlationId?: string
    ): T {
        return ((...args: Parameters<T>) => {
            const logger = LoggerFactory.getLogger()
            const id = logger.startCorrelation(correlationId)

            logger.debug(`Starting operation: ${operationName}`, {
                operationName,
                args: args.length > 0 ? args : undefined
            })

            try {
                const result = fn(...args)

                // Handle both sync and async functions
                if (result instanceof Promise) {
                    return result
                        .then((value) => {
                            logger.debug(`Completed operation: ${operationName}`, {
                                operationName,
                                success: true
                            })
                            logger.endCorrelation()
                            return value
                        })
                        .catch((error) => {
                            logger.error(`Failed operation: ${operationName}`, error, {
                                operationName,
                                success: false
                            })
                            logger.endCorrelation()
                            throw error
                        })
                } else {
                    logger.debug(`Completed operation: ${operationName}`, {
                        operationName,
                        success: true
                    })
                    logger.endCorrelation()
                    return result
                }
            } catch (error) {
                logger.error(`Failed operation: ${operationName}`, error as Error, {
                    operationName,
                    success: false
                })
                logger.endCorrelation()
                throw error
            }
        }) as T
    }

    /**
     * Starts a new correlation for UI actions
     */
    public static startUIAction(actionName: string, context?: Record<string, unknown>): string {
        const logger = LoggerFactory.getLogger()
        const correlationId = logger.startCorrelation()

        logger.info(`UI Action: ${actionName}`, {
            actionType: 'UI',
            actionName,
            ...context
        })

        return correlationId
    }

    /**
     * Starts a new correlation for domain operations
     */
    public static startDomainOperation(operationName: string, context?: Record<string, unknown>): string {
        const logger = LoggerFactory.getLogger()
        const correlationId = logger.startCorrelation()

        logger.info(`Domain Operation: ${operationName}`, {
            actionType: 'DOMAIN',
            operationName,
            ...context
        })

        return correlationId
    }

    /**
     * Starts a new correlation for system operations
     */
    public static startSystemOperation(operationName: string, context?: Record<string, unknown>): string {
        const logger = LoggerFactory.getLogger()
        const correlationId = logger.startCorrelation()

        logger.info(`System Operation: ${operationName}`, {
            actionType: 'SYSTEM',
            operationName,
            ...context
        })

        return correlationId
    }

    /**
     * Ends the current correlation
     */
    public static endCorrelation(): void {
        const logger = LoggerFactory.getLogger()
        logger.endCorrelation()
    }

    /**
     * Gets the current correlation ID
     */
    public static getCurrentCorrelationId(): string | null {
        const logger = LoggerFactory.getLogger()
        return logger.getCurrentCorrelationId()
    }
}

export default CorrelationUtils