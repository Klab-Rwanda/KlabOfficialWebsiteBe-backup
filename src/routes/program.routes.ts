import express from 'express';
import { createProgram, getAllPrograms, getProgramById, updateProgram, deleteProgram } from '../controllers/program.controllers';
import upload from "../middleware/multer.middleware";

const router = express.Router();

// Create a new program
router.post('/', upload.single('image'), createProgram);

// Get all programs
router.get('/', getAllPrograms);

// Get program by ID
router.get('/:id', getProgramById);

// Update program by ID
router.put('/:id', upload.single('image'), updateProgram);

// Delete program by ID
router.delete('/:id', deleteProgram);

export default router;