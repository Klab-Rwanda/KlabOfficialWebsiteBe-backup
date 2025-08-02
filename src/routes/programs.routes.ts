import { Router } from "express";
import {
  createProgramController,
  getProgramByIdController,
  getAllProgramsController,
  getProgramsByTagController,
  updateProgramController,
  deleteProgramController,
  addFeatureToProgramController,
  removeFeatureFromProgramController,
  getProgramStatsSummaryController
} from "../controllers/programs.controllers";
import {
  validateCreateProgramFormData,
  validateUpdateProgram,
  validateProgramId,
  validateTag,
  validateQueryParams,
  validateFeature,
  sanitizeInput,
  rateLimit,
  logProgramActions
} from "../middleware/programs.middleware";
import {
  uploadSingleImage,
  handleUploadError,
  parseFormData,
  cleanupUploadedFile
} from "../middleware/uploads.middleware";

const router = Router();

// Apply global middleware for all program routes
router.use(logProgramActions);
router.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// GET /programs/stats - Get program statistics summary
router.get(
  "/stats",
  getProgramStatsSummaryController
);

// GET /programs - Get all programs with optional filters
router.get(
  "/",
  validateQueryParams,
  sanitizeInput,
  getAllProgramsController
);

// GET /programs/tag/:tag - Get programs by tag
router.get(
  "/tag/:tag",
  validateTag,
  sanitizeInput,
  getProgramsByTagController
);

// GET /programs/:id - Get program by ID
router.get(
  "/:id",
  validateProgramId,
  getProgramByIdController
);

// POST /programs - Create new program with image upload
router.post(
  "/",
  cleanupUploadedFile,
  uploadSingleImage,
  handleUploadError,
  parseFormData,
  validateCreateProgramFormData,
  createProgramController
);

// PUT /programs/:id - Update program (JSON only for now)
router.put(
  "/:id",
  sanitizeInput,
  validateUpdateProgram,
  updateProgramController
);

// DELETE /programs/:id - Delete program
router.delete(
  "/:id",
  validateProgramId,
  deleteProgramController
);

// PATCH /programs/:id/features/add - Add feature to program
router.patch(
  "/:id/features/add",
  sanitizeInput,
  validateFeature,
  addFeatureToProgramController
);

// PATCH /programs/:id/features/remove - Remove feature from program
router.patch(
  "/:id/features/remove",
  sanitizeInput,
  validateFeature,
  removeFeatureFromProgramController
);

export default router;