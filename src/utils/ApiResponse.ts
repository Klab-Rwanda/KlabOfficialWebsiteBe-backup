import { Response } from 'express';

/**
 * Standard API response interface
 */
export interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
    timestamp?: string;
}

/**
 * Sends a standardized API response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Data to send in response
 * @param message - Response message
 */
export const sendResponse = (
    res: Response,
    statusCode: number,
    data: any = {},
    message: string = 'Success'
): void => {
    const response: ApiResponse = {
        success: statusCode >= 200 && statusCode < 300,
        message,
        data,
        timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(response);
};

/**
 * Sends a success response
 * @param res - Express response object
 * @param data - Data to send
 * @param message - Success message
 * @param statusCode - HTTP status code (default: 200)
 */
export const sendSuccessResponse = (
    res: Response,
    data: any = {},
    message: string = 'Operation successful',
    statusCode: number = 200
): void => {
    sendResponse(res, statusCode, data, message);
};

/**
 * Sends an error response
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param data - Additional error data
 */
export const sendErrorResponse = (
    res: Response,
    message: string = 'Internal server error',
    statusCode: number = 500,
    data: any = {}
): void => {
    sendResponse(res, statusCode, data, message);
};