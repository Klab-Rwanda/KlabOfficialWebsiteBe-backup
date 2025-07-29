import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { validateRequiredFields } from '../utils/validateRequiredFields';
import { sendResponse } from '../utils/ApiResponse';
import { handleError } from '../utils/ApiError';
import { programService } from '../services/program.service';

/**
 * Create a new program
 */
export const createProgram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, details } = req.body;

    if (!name || !description || !details) {
        return sendResponse(res, 400, {}, 'Name, description, and details are required');
    }

    const imagePath = req.file?.path;
    const newProgram = await programService.createProgram(name, description, details, imagePath);

    sendResponse(res, 201, newProgram, 'Program created successfully');
});

/**
 * Get all programs
 */
export const getAllPrograms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const programs = await programService.getAllPrograms();
    sendResponse(res, 200, programs, 'Programs fetched successfully');
});

/**
 * Get program by ID
 */
export const getProgramById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const validation = validateRequiredFields({ id });
    if (!validation.isValid) {
        return sendResponse(res, 400, {}, validation.error || 'Program ID is required');
    }

    const program = await programService.findProgramById(id);
    if (!program) {
        return sendResponse(res, 404, {}, 'Program not found');
    }

    sendResponse(res, 200, program, 'Program fetched successfully');
});

/**
 * Update program
 */
export const updateProgram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, details } = req.body;

    const validation = validateRequiredFields({ id });
    if (!validation.isValid) {
        return sendResponse(res, 400, {}, validation.error || 'Program ID is required');
    }

    const existProgram = await programService.findProgramById(id);
    if (!existProgram) {
        return sendResponse(res, 404, {}, 'Program not found');
    }

    const imageLocalPath = req.file?.path;
    const program = await programService.updateProgram(id, name, description, details, imageLocalPath, existProgram.image);

    sendResponse(res, 200, program, 'Program updated successfully');
});

/**
 * Delete program
 */
export const deleteProgram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const validation = validateRequiredFields({ id });
        if (!validation.isValid) {
            return sendResponse(res, 400, {}, validation.error || 'Program ID is required');
        }

        const existProgram = await programService.findProgramById(id);
        if (!existProgram) {
            return sendResponse(res, 404, {}, 'Program not found');
        }

        await programService.deleteProgram(id, existProgram.image);

        sendResponse(res, 200, existProgram, 'Program deleted successfully');
    } catch (error) {
        handleError(res, error, 'Something went wrong while deleting program');
    }
});
