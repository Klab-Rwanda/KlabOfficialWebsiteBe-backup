import express from 'express';
import bodyParser from 'body-parser';
import cors from "cors";
import {dbRoutes, homeRoutes, authRoutes, programRoutes} from './routes';
import fs from 'fs';
import path from 'path';

const app = express();

// Ensure public directories exist
const publicDir = './public';
const programImagesDir = './public/program-images';

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(programImagesDir)) {
    fs.mkdirSync(programImagesDir, { recursive: true });
}

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', homeRoutes);
app.use('/test', dbRoutes);
app.use('/auth', authRoutes);
app.use('/programs', programRoutes);

export default app;