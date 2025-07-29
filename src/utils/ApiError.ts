import { Response } from 'express';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public data: any;

    constructor(
        statusCode: number,
        message: string = 'Something went wrong',
        isOperational: boolean = true,
        data: any = null
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.data = data;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handles errors and sends appropriate response
 * @param res - Express response object
 * @param error - Error object
 * @param defaultMessage - Default error message
 */
export const handleError = (
    res: Response,
    error: any,
    defaultMessage: string = 'Internal server error'
): void => {
    console.error('Error:', error);

    // If it's an ApiError, use its properties
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            data: error.data,
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Handle known error types
    if (error.code === '23505') {
        // PostgreSQL unique constraint violation
        res.status(409).json({
            success: false,
            message: 'Resource already exists',
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (error.code === '23503') {
        // PostgreSQL foreign key constraint violation
        res.status(400).json({
            success: false,
            message: 'Invalid reference to related resource',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: defaultMessage,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            error: error.message,
            stack: error.stack
        })
    });
};