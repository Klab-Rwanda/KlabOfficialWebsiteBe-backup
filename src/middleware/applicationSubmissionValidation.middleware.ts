// src/middleware/applicationSubmissionValidation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';
import { ApplicationStatus } from '../types/applicationSubmission.types';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new ApiError(400, 'Validation failed', true, errorMessages);
  }
  
  next();
};

/**
 * Validate application submission request
 */
export const validateApplicationSubmission = [
  body('form_id')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer'),

  body('applicant_name')
    .notEmpty()
    .withMessage('Applicant name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Applicant name must be between 2 and 255 characters')
    .trim(),

  body('applicant_email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email cannot exceed 255 characters'),

  body('applicant_phone')
    .optional()
    .isLength({ min: 7, max: 50 })
    .withMessage('Phone number must be between 7 and 50 characters')
    .matches(/^[\+]?[\d\s\-\(\)\.]{7,50}$/)
    .withMessage('Invalid phone number format'),

  body('submission_data')
    .isObject()
    .withMessage('Submission data must be an object'),

  handleValidationErrors
];

/**
 * Validate application status update
 */
export const validateStatusUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Application ID must be a positive integer'),

  body('status')
    .isIn(Object.values(ApplicationStatus))
    .withMessage('Invalid application status'),

  body('reviewer_notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Reviewer notes cannot exceed 2000 characters')
    .trim(),

  handleValidationErrors
];

/**
 * Validate bulk status update
 */
export const validateBulkStatusUpdate = [
  body('application_ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('Application IDs must be an array with 1-100 items'),

  body('application_ids.*')
    .isInt({ min: 1 })
    .withMessage('Each application ID must be a positive integer'),

  body('status')
    .isIn(Object.values(ApplicationStatus))
    .withMessage('Invalid application status'),

  body('reviewer_notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Reviewer notes cannot exceed 2000 characters')
    .trim(),

  handleValidationErrors
];

/**
 * Validate application ID parameter
 */
export const validateApplicationId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Application ID must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate form ID parameter
 */
export const validateFormIdParam = [
  param('formId')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate program ID parameter
 */
export const validateProgramIdParam = [
  param('programId')
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate query parameters for listing applications
 */
export const validateGetApplicationsQuery = [
  query('form_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer')
    .toInt(),

  query('program_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer')
    .toInt(),

  query('status')
    .optional()
    .isIn(Object.values(ApplicationStatus))
    .withMessage('Invalid application status'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search term cannot exceed 255 characters')
    .trim(),

  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date_from format (use ISO 8601)'),

  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date_to format (use ISO 8601)'),

  query('sort_by')
    .optional()
    .isIn(['submitted_at', 'reviewed_at', 'applicant_name'])
    .withMessage('Invalid sort_by field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  handleValidationErrors
];

/**
 * Validate check application query
 */
export const validateCheckApplication = [
  query('form_id')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer')
    .toInt(),

  query('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Custom middleware to validate file uploads
 */
export const validateFileUploads = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  if (!files) {
    return next();
  }

  const errors: string[] = [];
  const maxFileSize = 10 * 1024 * 1024; // 10MB
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

  Object.keys(files).forEach(fieldName => {
    const fileArray = files[fieldName];
    if (fileArray && fileArray.length > 0) {
      const file = fileArray[0]; // Take first file if multiple

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`File "${file.originalname}" exceeds maximum size of 10MB`);
      }

      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        errors.push(`File "${file.originalname}" has unsupported file type: ${file.mimetype}`);
      }

      // Check filename
      if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
        errors.push(`File "${file.originalname}" has invalid characters in filename`);
      }
    }
  });

  if (errors.length > 0) {
    throw new ApiError(400, 'File validation failed', true, errors);
  }

  next();
};

/**
 * Validate submission data dynamically based on form fields
 */
export const validateDynamicSubmissionData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { form_id, submission_data } = req.body;
    
    if (!form_id || !submission_data) {
      return next();
    }

    // This would be implemented to fetch form fields and validate
    // For now, we'll do basic validation
    if (typeof submission_data !== 'object' || Array.isArray(submission_data)) {
      throw new ApiError(400, 'submission_data must be an object');
    }

    // Additional dynamic validation would go here
    // Example: Check required fields, validate against form schema, etc.
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting for form submissions
 */
export const rateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip + ':' + (req.body?.applicant_email || 'anonymous');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter((time: number) => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      throw new ApiError(429, 'Too many submission attempts. Please try again later.');
    }

    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};