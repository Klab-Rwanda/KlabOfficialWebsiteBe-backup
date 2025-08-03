import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';
import { FormFieldType, FormStatus } from '../types/dynamicForm.types';

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
 * Validate create dynamic form request
 */
export const validateCreateDynamicForm = [
  body('program_id')
    .notEmpty()
    .withMessage('Program ID is required')
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer'),

  body('title')
    .notEmpty()
    .withMessage('Form title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Form title must be between 1 and 255 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(FormStatus))
    .withMessage('Invalid form status'),

  body('fields')
    .isArray({ min: 1 })
    .withMessage('At least one field is required'),

  body('fields.*.name')
    .notEmpty()
    .withMessage('Field name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Field name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Field name can only contain letters, numbers, underscores, and hyphens'),

  body('fields.*.label')
    .notEmpty()
    .withMessage('Field label is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Field label must be between 1 and 255 characters')
    .trim(),

  body('fields.*.type')
    .isIn(Object.values(FormFieldType))
    .withMessage('Invalid field type'),

  body('fields.*.required')
    .isBoolean()
    .withMessage('Required field must be a boolean'),

  body('fields.*.order')
    .isInt({ min: 1 })
    .withMessage('Field order must be a positive integer'),

  body('fields.*.placeholder')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Placeholder cannot exceed 255 characters')
    .trim(),

  body('fields.*.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Field description cannot exceed 500 characters')
    .trim(),

  body('fields.*.options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),

  body('fields.*.options.*.value')
    .if(body('fields.*.options').exists())
    .notEmpty()
    .withMessage('Option value is required')
    .isLength({ max: 255 })
    .withMessage('Option value cannot exceed 255 characters'),

  body('fields.*.options.*.label')
    .if(body('fields.*.options').exists())
    .notEmpty()
    .withMessage('Option label is required')
    .isLength({ max: 255 })
    .withMessage('Option label cannot exceed 255 characters'),

  body('fields.*.validation')
    .optional()
    .isObject()
    .withMessage('Validation must be an object'),

  body('fields.*.validation.minLength')
    .optional()
    .isInt({ min: 0 })
    .withMessage('minLength must be a non-negative integer'),

  body('fields.*.validation.maxLength')
    .optional()
    .isInt({ min: 0 })
    .withMessage('maxLength must be a non-negative integer'),

  body('fields.*.validation.min')
    .optional()
    .isNumeric()
    .withMessage('min must be a number'),

  body('fields.*.validation.max')
    .optional()
    .isNumeric()
    .withMessage('max must be a number'),

  body('fields.*.validation.pattern')
    .optional()
    .custom((value) => {
      try {
        new RegExp(value);
        return true;
      } catch (error) {
        throw new Error('Invalid regex pattern');
      }
    }),

  body('fields.*.validation.fileTypes')
    .optional()
    .isArray()
    .withMessage('fileTypes must be an array'),

  body('fields.*.validation.maxFileSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxFileSize must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate update dynamic form request
 */
export const validateUpdateDynamicForm = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer'),

  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Form title must be between 1 and 255 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(FormStatus))
    .withMessage('Invalid form status'),

  body('fields')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one field is required when updating fields'),

  // Same field validations as create (when fields are provided)
  body('fields.*.name')
    .if(body('fields').exists())
    .notEmpty()
    .withMessage('Field name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Field name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Field name can only contain letters, numbers, underscores, and hyphens'),

  body('fields.*.label')
    .if(body('fields').exists())
    .notEmpty()
    .withMessage('Field label is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Field label must be between 1 and 255 characters')
    .trim(),

  body('fields.*.type')
    .if(body('fields').exists())
    .isIn(Object.values(FormFieldType))
    .withMessage('Invalid field type'),

  body('fields.*.required')
    .if(body('fields').exists())
    .isBoolean()
    .withMessage('Required field must be a boolean'),

  body('fields.*.order')
    .if(body('fields').exists())
    .isInt({ min: 1 })
    .withMessage('Field order must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate form ID parameter
 */
export const validateFormId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate program ID parameter
 */
export const validateProgramId = [
  param('programId')
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer'),

  handleValidationErrors
];

/**
 * Validate query parameters for listing forms
 */
export const validateGetFormsQuery = [
  query('program_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Program ID must be a positive integer')
    .toInt(),

  query('status')
    .optional()
    .isIn(Object.values(FormStatus))
    .withMessage('Invalid form status'),

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

  handleValidationErrors
];

/**
 * Validate duplicate form request
 */
export const validateDuplicateForm = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer'),

  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Form title must be between 1 and 255 characters')
    .trim(),

  handleValidationErrors
];

/**
 * Custom validation for field-specific requirements
 */
export const validateFieldRequirements = (req: Request, res: Response, next: NextFunction) => {
  const { fields } = req.body;
  
  if (!fields || !Array.isArray(fields)) {
    return next();
  }

  const errors: string[] = [];

  for (const field of fields) {
    // Validate options for select, radio, checkbox fields
    const optionRequiredTypes = [FormFieldType.SELECT, FormFieldType.RADIO, FormFieldType.CHECKBOX];
    if (optionRequiredTypes.includes(field.type)) {
      if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
        errors.push(`Options are required for ${field.type} field: ${field.name}`);
      } else {
        // Check for duplicate option values
        const optionValues = field.options.map((opt: any) => opt.value);
        const uniqueValues = new Set(optionValues);
        if (optionValues.length !== uniqueValues.size) {
          errors.push(`Duplicate option values found in field: ${field.name}`);
        }
      }
    }

    // Validate file type restrictions
    if (field.type === FormFieldType.FILE && field.validation?.fileTypes) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/csv'
      ];
      
      const invalidTypes = field.validation.fileTypes.filter(
        (type: string) => !allowedTypes.includes(type)
      );
      
      if (invalidTypes.length > 0) {
        errors.push(`Invalid file types for field ${field.name}: ${invalidTypes.join(', ')}`);
      }
    }
  }

  // Check for duplicate field names
  const fieldNames = fields.map((f: any) => f.name.toLowerCase());
  const uniqueNames = new Set(fieldNames);
  if (fieldNames.length !== uniqueNames.size) {
    errors.push('Duplicate field names found');
  }

  // Check for duplicate field orders
  const fieldOrders = fields.map((f: any) => f.order);
  const uniqueOrders = new Set(fieldOrders);
  if (fieldOrders.length !== uniqueOrders.size) {
    errors.push('Duplicate field orders found');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Field validation failed', true, errors);
  }

  next();
};