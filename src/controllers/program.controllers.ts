import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { validateRequiredFields } from '../utils/validateRequiredFields';
import { sendResponse } from '../utils/ApiResponse';
import { handleError } from '../utils/ApiError';
import { userService } from '../services/program.service';

/**
 * Register a new user
 */
export const signUp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
        return sendResponse(res, 400, {}, 'All fields are required');
    }

    // Check if user already exists
    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
        return sendResponse(res, 409, {}, 'User already exists');
    }

    const avatarPath = req.file?.path;
    const newUser = await userService.createUser(firstname, lastname, email, password, avatarPath);

    sendResponse(res, 201, newUser, 'User signed up successfully');
});

/**
 * Update profile
 */
export const updateProfileById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { firstname, lastname, phone_number } = req.body;

    const validation = validateRequiredFields({ id, firstname, lastname });
    if (!validation.isValid) {
        return sendResponse(res, 400, {}, validation.error || 'Required fields are missing');
    }

    const existProfile = await userService.findUserById(id);
    if (!existProfile) {
        return sendResponse(res, 404, {}, 'Profile not found');
    }

    const avatarLocalPath = req.file?.path;
    const profile = await userService.updateUser(id, firstname, lastname, phone_number, avatarLocalPath, existProfile.avatar);

    sendResponse(res, 200, profile, 'Profile updated successfully');
});

/**
 * Delete profile
 */
export const deleteProfileById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const validation = validateRequiredFields({ id });
        if (!validation.isValid) {
            return sendResponse(res, 400, {}, validation.error || 'User ID is required');
        }

        const existProfile = await userService.findUserById(id);
        if (!existProfile) {
            return sendResponse(res, 404, {}, 'Profile not found');
        }

        await userService.deleteUser(id, existProfile.avatar);

        sendResponse(res, 200, existProfile, 'Profile deleted successfully');
    } catch (error) {
        handleError(res, error, 'Something went wrong while deleting profile');
    }
});
