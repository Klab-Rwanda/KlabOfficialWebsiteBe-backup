import { Router } from 'express';
import dynamicFormController from '../controllers/dynamicForm.controller';
import {
  validateCreateDynamicForm,
  validateUpdateDynamicForm,
  validateFormId,
  validateProgramId,
  validateGetFormsQuery,
  validateDuplicateForm,
  validateFieldRequirements
} from '../middleware/dynamicFormValidation.middleware';

const router = Router();

/**
 * @route   POST /forms
 * @desc    Create a new dynamic form
 * @access  Admin only (TODO: Add auth middleware)
 */
router.post(
  '/',
  validateCreateDynamicForm,
  validateFieldRequirements,
  dynamicFormController.createDynamicForm
);

/**
 * @route   GET /forms
 * @desc    Get all dynamic forms with optional filters
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get(
  '/',
  validateGetFormsQuery,
  dynamicFormController.getDynamicForms
);

/**
 * @route   POST /forms/validate
 * @desc    Validate form structure without saving
 * @access  Admin only (TODO: Add auth middleware)
 */
router.post(
  '/validate',
  validateCreateDynamicForm,
  validateFieldRequirements,
  dynamicFormController.validateForm
);

/**
 * @route   GET /forms/program/:programId/published
 * @desc    Get published form for a specific program (for applicants)
 * @access  Public
 */
router.get(
  '/program/:programId/published',
  validateProgramId,
  dynamicFormController.getPublishedFormByProgramId
);

/**
 * @route   GET /forms/:id
 * @desc    Get dynamic form by ID
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get(
  '/:id',
  validateFormId,
  dynamicFormController.getDynamicFormById
);

/**
 * @route   PUT /forms/:id
 * @desc    Update dynamic form
 * @access  Admin only (TODO: Add auth middleware)
 */
router.put(
  '/:id',
  validateUpdateDynamicForm,
  validateFieldRequirements,
  dynamicFormController.updateDynamicForm
);

/**
 * @route   DELETE /forms/:id
 * @desc    Delete dynamic form
 * @access  Admin only (TODO: Add auth middleware)
 */
router.delete(
  '/:id',
  validateFormId,
  dynamicFormController.deleteDynamicForm
);

/**
 * @route   PATCH /forms/:id/publish
 * @desc    Publish a form (change status from draft to published)
 * @access  Admin only (TODO: Add auth middleware)
 */
router.patch(
  '/:id/publish',
  validateFormId,
  dynamicFormController.publishForm
);

/**
 * @route   PATCH /forms/:id/archive
 * @desc    Archive a form
 * @access  Admin only (TODO: Add auth middleware)
 */
router.patch(
  '/:id/archive',
  validateFormId,
  dynamicFormController.archiveForm
);

/**
 * @route   POST /forms/:id/duplicate
 * @desc    Duplicate an existing form
 * @access  Admin only (TODO: Add auth middleware)
 */
router.post(
  '/:id/duplicate',
  validateDuplicateForm,
  dynamicFormController.duplicateForm
);

/**
 * @route   GET /forms/:id/stats
 * @desc    Get form statistics
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get(
  '/:id/stats',
  validateFormId,
  dynamicFormController.getFormStats
);

/**
 * @route   GET /forms/:id/preview
 * @desc    Preview form structure
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get(
  '/:id/preview',
  validateFormId,
  dynamicFormController.previewForm
);

/**
 * @route   GET /api/programs/:programId/forms
 * @desc    Get all forms for a specific program
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get(
  '/program/:programId',
  validateProgramId,
  validateGetFormsQuery,
  dynamicFormController.getFormsByProgram
);

export default router;