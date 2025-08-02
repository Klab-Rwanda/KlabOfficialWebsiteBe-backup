import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `program-${uniqueSuffix}${extension}`);
    }
});

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Configure multer with size limits and file filter
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file at a time
    },
    fileFilter: fileFilter
});

// Middleware for single image upload
export const uploadSingleImage = upload.single('image');

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file is allowed.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name. Use "image" as the field name.'
            });
        }
    }
    
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
            success: false,
            message: 'Only image files (jpg, jpeg, png, gif, webp) are allowed.'
        });
    }
    
    // For other errors, pass to next middleware
    next(error);
};

// Middleware to parse form data and convert to proper types
export const parseFormData = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Parse stats from JSON string
        if (req.body.stats && typeof req.body.stats === 'string') {
            try {
                req.body.stats = JSON.parse(req.body.stats);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid JSON format in stats field'
                });
            }
        }

        // Parse features from JSON string or comma-separated values
        if (req.body.features) {
            if (typeof req.body.features === 'string') {
                try {
                    // Try parsing as JSON first
                    const parsed = JSON.parse(req.body.features);
                    // Clean up any extra quotes that might be in the data
                    req.body.features = Array.isArray(parsed) 
                        ? parsed.map((f: string) => f.replace(/^"|"$/g, '').trim())
                        : [parsed.replace(/^"|"$/g, '').trim()];
                } catch (error) {
                    // If JSON parsing fails, treat as comma-separated string
                    req.body.features = req.body.features
                        .split(',')
                        .map((f: string) => f.replace(/^"|"$/g, '').trim())
                        .filter((f: string) => f.length > 0);
                }
            }
        }

        // Parse tags from JSON string or comma-separated values
        if (req.body.tags) {
            if (typeof req.body.tags === 'string') {
                try {
                    // Try parsing as JSON first
                    const parsed = JSON.parse(req.body.tags);
                    // Clean up any extra quotes that might be in the data
                    req.body.tags = Array.isArray(parsed) 
                        ? parsed.map((t: string) => t.replace(/^"|"$/g, '').trim())
                        : [parsed.replace(/^"|"$/g, '').trim()];
                } catch (error) {
                    // If JSON parsing fails, treat as comma-separated string
                    req.body.tags = req.body.tags
                        .split(',')
                        .map((t: string) => t.replace(/^"|"$/g, '').trim())
                        .filter((t: string) => t.length > 0);
                }
            }
        }

        // Add uploaded file path to body if file exists
        if (req.file) {
            req.body.uploadedImagePath = req.file.path;
        }

        next();
    } catch (error) {
        console.error('Error parsing form data:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing form data'
        });
    }
};

// Cleanup uploaded file in case of error
export const cleanupUploadedFile = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
        // If there's an error and we have an uploaded file, clean it up
        if (body.success === false && req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Cleaned up uploaded file after error:', req.file.path);
            } catch (cleanupError) {
                console.error('❌ Error cleaning up file:', cleanupError);
            }
        }
        
        return originalJson.call(this, body);
    };
    
    next();
};