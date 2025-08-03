import { Router } from 'express';
import multer from 'multer';
import applicationSubmissionController from '../controllers/applicationSubmission.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateApplicationSubmission,
  validateStatusUpdate,
  validateBulkStatusUpdate,
  validateApplicationId,
  validateFormIdParam,
  validateProgramIdParam,
  validateGetApplicationsQuery,
  validateCheckApplication,
  validateFileUploads,
  validateDynamicSubmissionData,
  rateLimit
} from '../middleware/applicationSubmissionValidation.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/', // Temporary directory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  }
});

// ======================
// PUBLIC ROUTES (No Auth Required)
// ======================

/**
 * @route   POST /api/applications
 * @desc    Submit a new application
 * @access  Public
 */
router.post(
  '/',
  rateLimit(15 * 60 * 1000, 3), // 3 submissions per 15 minutes per IP+email
  upload.any(), // Accept any file fields
  validateFileUploads,
  validateApplicationSubmission,
  validateDynamicSubmissionData,
  applicationSubmissionController.submitApplication
);

/**
 * @route   GET /api/applications/check
 * @desc    Check if user has already applied to a form
 * @access  Public
 */
router.get(
  '/check',
  validateCheckApplication,
  applicationSubmissionController.checkUserApplication
);

/**
 * @route   GET /api/applications/summary
 * @desc    Get application summary for a specific applicant
 * @access  Public (with email verification in real app)
 */
router.get(
  '/summary',
  applicationSubmissionController.getApplicantSummary
);

// ======================
// ADMIN ROUTES (Auth Required)
// ======================

/**
 * @route   GET /api/admin/applications
 * @desc    Get all applications with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/admin',
  authenticate,
  validateGetApplicationsQuery,
  applicationSubmissionController.getApplications
);

/**
 * @route   GET /api/admin/applications/stats
 * @desc    Get application statistics
 * @access  Admin only
 */
router.get(
  '/admin/stats',
  authenticate,
  applicationSubmissionController.getApplicationStats
);

/**
 * @route   GET /api/admin/applications/dashboard-summary
 * @desc    Get dashboard summary statistics
 * @access  Admin only
 */
router.get(
  '/admin/dashboard-summary',
  authenticate,
  applicationSubmissionController.getDashboardSummary
);

/**
 * @route   GET /api/admin/applications/recent
 * @desc    Get recent applications for dashboard
 * @access  Admin only
 */
router.get(
  '/admin/recent',
  authenticate,
  applicationSubmissionController.getRecentApplications
);

/**
 * @route   GET /api/admin/applications/pending-review
 * @desc    Get applications requiring review
 * @access  Admin only
 */
router.get(
  '/admin/pending-review',
  authenticate,
  applicationSubmissionController.getApplicationsRequiringReview
);

/**
 * @route   GET /api/admin/applications/export
 * @desc    Export applications to CSV
 * @access  Admin only
 */
router.get(
  '/admin/export',
  authenticate,
  validateGetApplicationsQuery,
  applicationSubmissionController.exportApplications
);

/**
 * @route   PATCH /api/admin/applications/bulk-status
 * @desc    Bulk update application status
 * @access  Admin only
 */
router.patch(
  '/admin/bulk-status',
  authenticate,
  validateBulkStatusUpdate,
  applicationSubmissionController.bulkUpdateApplicationStatus
);

/**
 * @route   GET /api/admin/applications/:id
 * @desc    Get application by ID with full details
 * @access  Admin only
 */
router.get(
  '/admin/:id',
  authenticate,
  validateApplicationId,
  applicationSubmissionController.getApplicationById
);

/**
 * @route   PATCH /api/admin/applications/:id/status
 * @desc    Update application status
 * @access  Admin only
 */
router.patch(
  '/admin/:id/status',
  authenticate,
  validateStatusUpdate,
  applicationSubmissionController.updateApplicationStatus
);

/**
 * @route   PATCH /api/admin/applications/:id/accept
 * @desc    Accept application (shortcut endpoint)
 * @access  Admin only
 */
router.patch(
  '/admin/:id/accept',
  authenticate,
  validateApplicationId,
  applicationSubmissionController.acceptApplication
);

/**
 * @route   PATCH /api/admin/applications/:id/reject
 * @desc    Reject application (shortcut endpoint)
 * @access  Admin only
 */
router.patch(
  '/admin/:id/reject',
  authenticate,
  validateApplicationId,
  applicationSubmissionController.rejectApplication
);

/**
 * @route   PATCH /api/admin/applications/:id/review
 * @desc    Mark application as under review
 * @access  Admin only
 */
router.patch(
  '/admin/:id/review',
  authenticate,
  validateApplicationId,
  applicationSubmissionController.markAsUnderReview
);

/**
 * @route   GET /api/admin/applications/:id/history
 * @desc    Get application status history
 * @access  Admin only
 */
router.get(
  '/admin/:id/history',
  authenticate,
  validateApplicationId,
  applicationSubmissionController.getApplicationStatusHistory
);

/**
 * @route   DELETE /api/admin/applications/:id
 * @desc    Delete application
 * @access  Admin only
 */
router.delete(
  '/admin/:id',
  authenticate,
  validateApplicationId,
  applicationSubmissionController.deleteApplication
);

/**
 * @route   GET /api/admin/programs/:programId/applications
 * @desc    Get applications for a specific program
 * @access  Admin only
 */
router.get(
  '/admin/programs/:programId',
  authenticate,
  validateProgramIdParam,
  validateGetApplicationsQuery,
  applicationSubmissionController.getApplicationsByProgram
);

/**
 * @route   GET /api/admin/forms/:formId/applications
 * @desc    Get applications for a specific form
 * @access  Admin only
 */
router.get(
  '/admin/forms/:formId',
  authenticate,
  validateFormIdParam,
  validateGetApplicationsQuery,
  applicationSubmissionController.getApplicationsByForm
);

export default router;