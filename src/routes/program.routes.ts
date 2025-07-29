import express from 'express';
import { signUp } from '../controllers/program.controllers';
import upload from "../middleware/multer.middleware";

const router = express.Router();

router.post('/sign-up', upload.single('avatar'), signUp); // User signUp

export default router;