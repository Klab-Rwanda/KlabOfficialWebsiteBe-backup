import pool from "../config/db.config";
import uploadOnCloudinary, { cloudinaryFolderName } from '../utils/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const handleImageOperations = async (existingImageUrl: string | null): Promise<string | null> => {
    if (!existingImageUrl) return null;
    const imageParts = existingImageUrl.split('klab/');
    if (imageParts.length > 1) {
        return imageParts[1].split('.')[0];
    }
    return null;
};

export const programService = {
    async createProgram(name: string, description: string, details: string, imagePath?: string) {
        let image = null;
        if (imagePath) {
            image = await uploadOnCloudinary(imagePath);
        }

        const newProgram = await pool.query(
            `INSERT INTO programs (name, description, details, image) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, description, details, image, created_at, updated_at`,
            [name, description, details, image]
        );

        return newProgram.rows[0];
    },

    async getAllPrograms() {
        const result = await pool.query(
            `SELECT id, name, description, details, image, created_at, updated_at 
             FROM programs 
             ORDER BY created_at DESC`
        );
        return result.rows;
    },

    async findProgramById(id: string) {
        const result = await pool.query(
            `SELECT id, name, description, details, image, created_at, updated_at 
             FROM programs 
             WHERE id = $1 LIMIT 1`,
            [id],
        );
        return result.rows[0];
    },

    async updateProgram(id: string, name: string, description: string, details: string, imageLocalPath?: string, existingImageUrl?: string) {
        let image = existingImageUrl;

        if (imageLocalPath) {
            const existImage = await handleImageOperations(existingImageUrl || null);
            if (existImage) {
                await cloudinary.uploader.destroy(`${cloudinaryFolderName}/${existImage}`, { invalidate: true });
            }
            image = await uploadOnCloudinary(imageLocalPath) || undefined;
        }

        const program = await pool.query(
            `UPDATE programs 
             SET name = $1, description = $2, details = $3, image = $4, updated_at = NOW()
             WHERE id = $5 
             RETURNING id, name, description, details, image, created_at, updated_at`,
            [name, description, details, image, id],
        );

        return program.rows[0];
    },

    async deleteProgram(id: string, existingImageUrl?: string) {
        const existImage = await handleImageOperations(existingImageUrl || null);

        if (existImage) {
            await cloudinary.uploader.destroy(`${cloudinaryFolderName}/${existImage}`, { invalidate: true });
        }

        await pool.query('DELETE FROM programs WHERE id = $1', [id]);
    }
};
