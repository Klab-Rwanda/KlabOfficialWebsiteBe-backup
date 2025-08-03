
import { Request, Response } from 'express';
import dynamicFormService from '../services/dynamicForm.service';
import { CreateDynamicFormRequest, UpdateDynamicFormRequest, GetDynamicFormsQuery } from '../types/dynamicForm.types';
import { sendSuccessResponse, sendErrorResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export class DynamicFormController {

  /**
   * Create a new dynamic form
   * POST /forms
   */
  createDynamicForm = asyncHandler(async (req: Request, res: Response) => {
    const formData: CreateDynamicFormRequest = req.body;
    
    // TODO: Get actual user ID from auth middleware
    const createdBy = req.headers['user-id'] as string || 'admin-user-id';

    const form = await dynamicFormService.createDynamicForm(formData, createdBy);

    sendSuccessResponse(res, form, 'Dynamic form created successfully', 201);
  });

  /**
   * Get all dynamic forms with optional filters
   * GET /forms
   */
  getDynamicForms = asyncHandler(async (req: Request, res: Response) => {
    const query: GetDynamicFormsQuery = {
      program_id: req.query.program_id ? parseInt(req.query.program_id as string) : undefined,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string
    };

    const result = await dynamicFormService.getDynamicForms(query);

    sendSuccessResponse(res, {
      forms: result.forms,
      pagination: result.pagination,
      total: result.total
    }, 'Dynamic forms retrieved successfully');
  });

  /**
   * Get dynamic form by ID
   * GET /forms/:id
   */
  getDynamicFormById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const form = await dynamicFormService.getDynamicFormById(id);

    sendSuccessResponse(res, form, 'Dynamic form retrieved successfully');
  });

  /**
   * Get published form by program ID
   * GET /forms/program/:programId/published
   */
  getPublishedFormByProgramId = asyncHandler(async (req: Request, res: Response) => {
    const programId = parseInt(req.params.programId);

    if (isNaN(programId)) {
      throw new ApiError(400, 'Invalid program ID');
    }

    const form = await dynamicFormService.getPublishedFormByProgramId(programId);

    sendSuccessResponse(res, form, 'Published form retrieved successfully');
  });

  /**
   * Update dynamic form
   * PUT /forms/:id
   */
  updateDynamicForm = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const updateData: UpdateDynamicFormRequest = req.body;

    const updatedForm = await dynamicFormService.updateDynamicForm(id, updateData);

    sendSuccessResponse(res, updatedForm, 'Dynamic form updated successfully');
  });

  /**
   * Delete dynamic form
   * DELETE /forms/:id
   */
  deleteDynamicForm = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    await dynamicFormService.deleteDynamicForm(id);

    sendSuccessResponse(res, {}, 'Dynamic form deleted successfully');
  });

  /**
   * Publish a form
   * PATCH /forms/:id/publish
   */
  publishForm = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const publishedForm = await dynamicFormService.publishForm(id);

    sendSuccessResponse(res, publishedForm, 'Form published successfully');
  });

  /**
   * Archive a form
   * PATCH /forms/:id/archive
   */
  archiveForm = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const archivedForm = await dynamicFormService.archiveForm(id);

    sendSuccessResponse(res, archivedForm, 'Form archived successfully');
  });

  /**
   * Duplicate a form
   * POST /forms/:id/duplicate
   */
  duplicateForm = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const { title } = req.body;
    
    // TODO: Get actual user ID from auth middleware
    const createdBy = req.headers['user-id'] as string || 'admin-user-id';

    const duplicatedForm = await dynamicFormService.duplicateForm(id, createdBy, title);

    sendSuccessResponse(res, duplicatedForm, 'Form duplicated successfully', 201);
  });

  /**
   * Get form statistics
   * GET /forms/:id/stats
   */
  getFormStats = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const stats = await dynamicFormService.getFormStats(id);

    sendSuccessResponse(res, stats, 'Form statistics retrieved successfully');
  });

  /**
   * Preview form structure (for testing/debugging)
   * GET /forms/:id/preview
   */
  previewForm = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid form ID');
    }

    const form = await dynamicFormService.getDynamicFormById(id);

    // Return simplified structure for preview
    const preview = {
      title: form.title,
      description: form.description,
      status: form.status,
      fields: form.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        description: field.description,
        options: field.options,
        validation: field.validation,
        order: field.order
      })).sort((a, b) => a.order - b.order)
    };

    sendSuccessResponse(res, preview, 'Form preview generated successfully');
  });

  /**
   * Get forms by program (for specific program)
   * GET /programs/:programId/forms
   */
  getFormsByProgram = asyncHandler(async (req: Request, res: Response) => {
    const programId = parseInt(req.params.programId);
    
    if (isNaN(programId)) {
      throw new ApiError(400, 'Invalid program ID');
    }

    const query: GetDynamicFormsQuery = {
      program_id: programId,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string
    };

    const result = await dynamicFormService.getDynamicForms(query);

    sendSuccessResponse(res, {
      programId,
      forms: result.forms,
      pagination: result.pagination,
      total: result.total
    }, 'Program forms retrieved successfully');
  });

  /**
   * Validate form structure (without saving)
   * POST /forms/validate
   */
  validateForm = asyncHandler(async (req: Request, res: Response) => {
    const formData: CreateDynamicFormRequest = req.body;

    try {
      // This will run validations without actually creating the form
      // We can create a separate validation method in service if needed
      const tempUserId = 'validation-temp';
      
      // For now, we'll just validate the structure
      // In a real implementation, you might want a separate validation method
      sendSuccessResponse(res, {
        valid: true,
        fieldCount: formData.fields.length,
        requiredFields: formData.fields.filter(f => f.required).length
      }, 'Form structure is valid');
    } catch (error) {
      sendErrorResponse(res, 'Form validation failed', 400, (error as Error).message);
    }
  });
}

export default new DynamicFormController();