import pool from "../config/db.config";
import uploadOnCloudinary, { cloudinaryFolderName } from '../utils/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const handleAvatarOperations = async (existingAvatarUrl: string | null): Promise<string | null> => {
    if (!existingAvatarUrl) return null;
    const avatarParts = existingAvatarUrl.split('klab/');
    if (avatarParts.length > 1) {
        return avatarParts[1].split('.')[0];
    }
    return null;
};

export const userService = {
    async createUser(firstname: string, lastname: string, email: string, password: string, avatarPath?: string) {
        let avatar = null;
        if (avatarPath) {
            avatar = await uploadOnCloudinary(avatarPath);
        }

        const newUser = await pool.query(
            `INSERT INTO testing (firstname, lastname, email, password, avatar) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, firstname, lastname, avatar`,
            [firstname, lastname, email, password, avatar]
        );

        return newUser.rows[0];
    },

    async findUserByEmail(email: string) {
        const result = await pool.query('SELECT * FROM testing WHERE email = $1', [email]);
        return result.rows[0];
    },

    async findUserById(id: string) {
        const result = await pool.query(
            `SELECT id, avatar, firstname, lastname, email, phone_number, is_verified, created_at 
             FROM testing 
             WHERE id = $1 LIMIT 1`,
            [id],
        );
        return result.rows[0];
    },

    async updateUser(id: string, firstname: string, lastname: string, phone_number: string, avatarLocalPath?: string, existingAvatarUrl?: string) {
        let avatar = existingAvatarUrl;

        if (avatarLocalPath) {
            const existAvatar = await handleAvatarOperations(existingAvatarUrl || null);
            if (existAvatar) {
                await cloudinary.uploader.destroy(`${cloudinaryFolderName}/${existAvatar}`, { invalidate: true });
            }
            avatar = await uploadOnCloudinary(avatarLocalPath) || undefined;
        }

        const profile = await pool.query(
            `UPDATE testing 
             SET firstname = $1, lastname = $2, phone_number = $3, avatar = $4 
             WHERE id = $5 
             RETURNING id, avatar, firstname, lastname, email, phone_number, is_verified, created_at`,
            [firstname, lastname, phone_number, avatar, id],
        );

        return profile.rows[0];
    },

    async deleteUser(id: string, existingAvatarUrl?: string) {
        const existAvatar = await handleAvatarOperations(existingAvatarUrl || null);

        if (existAvatar) {
            await cloudinary.uploader.destroy(`${cloudinaryFolderName}/${existAvatar}`, { invalidate: true });
        }

        await pool.query('DELETE FROM testing WHERE id = $1', [id]);
    }
};
