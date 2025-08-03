// src/services/dynamicForm.service.ts

import dynamicFormModel from '../models/dynamicForm.model';
import { 
  CreateDynamicFormRequest, 
  UpdateDynamicFormRequest, 
  DynamicForm,
  GetDynamicFormsQuery,
  FormFieldType,
  FormStatus
} from '../types/dynamicForm.types';
import { ApiError } from '../utils/ApiError';

export class DynamicFormService {

  /**
   * Create a new dynamic form
   */
  async createDynamicForm(data: CreateDynamicFormRequest, createdBy: string): Promise<DynamicForm> {
    // Validate form data
    this.validateFormData(data);

    // Validate field order uniqueness and sequence
    this.validateFieldOrder(data.fields);

    // Validate field names are unique
    this.validateFieldNames(data.fields);

    // Validate field types and their requirements
    this.validateFieldTypes(data.fields);

    return await dynamicFormModel.createDynamicForm(data, createdBy);
  }

  /**
   * Get all dynamic forms with filters
   */
  async getDynamicForms(query: GetDynamicFormsQuery): Promise<{ forms: DynamicForm[], total: number, pagination: any }> {
    const result = await dynamicFormModel.getDynamicForms(query);
    
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(result.total / limit);

    return {
      forms: result.forms,
      total: result.total,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    };
  }

  /**
   * Get dynamic form by ID
   */
  async getDynamicFormById(id: number): Promise<DynamicForm> {
    const form = await dynamicFormModel.getDynamicFormById(id);
    
    if (!form) {
      throw new ApiError(404, 'Dynamic form not found');
    }

    return form;
  }

  /**
   * Get published form by program ID
   */
  async getPublishedFormByProgramId(programId: number): Promise<DynamicForm> {
    const form = await dynamicFormModel.getPublishedFormByProgramId(programId);
    
    if (!form) {
      throw new ApiError(404, 'No published form found for this program');
    }

    return form;
  }

  /**
   * Update dynamic form
   */
  async updateDynamicForm(id: number, data: UpdateDynamicFormRequest): Promise<DynamicForm> {
    // Validate update data
    if (data.fields) {
      this.validateFieldOrder(data.fields);
      this.validateFieldNames(data.fields);
      this.validateFieldTypes(data.fields);
    }

    const updatedForm = await dynamicFormModel.updateDynamicForm(id, data);
    
    if (!updatedForm) {
      throw new ApiError(404, 'Dynamic form not found');
    }

    return updatedForm;
  }

  /**
   * Delete dynamic form
   */
  async deleteDynamicForm(id: number): Promise<void> {
    // Check if form exists and get its details
    const existingForm = await dynamicFormModel.getDynamicFormById(id);
    
    if (!existingForm) {
      throw new ApiError(404, 'Dynamic form not found');
    }

    // Don't allow deletion of published forms
    if (existingForm.status === FormStatus.PUBLISHED) {
      throw new ApiError(400, 'Cannot delete a published form. Archive it first.');
    }

    const deleted = await dynamicFormModel.deleteDynamicForm(id);
    
    if (!deleted) {
      throw new ApiError(500, 'Failed to delete dynamic form');
    }
  }

  /**
   * Publish a form (change status from draft to published)
   */
  async publishForm(id: number): Promise<DynamicForm> {
    const form = await this.getDynamicFormById(id);

    if (form.status === FormStatus.PUBLISHED) {
      throw new ApiError(400, 'Form is already published');
    }

    if (form.fields.length === 0) {
      throw new ApiError(400, 'Cannot publish form without fields');
    }

    return await this.updateDynamicForm(id, { status: FormStatus.PUBLISHED });
  }

  /**
   * Archive a form
   */
  async archiveForm(id: number): Promise<DynamicForm> {
    const form = await this.getDynamicFormById(id);

    if (form.status === FormStatus.ARCHIVED) {
      throw new ApiError(400, 'Form is already archived');
    }

    return await this.updateDynamicForm(id, { status: FormStatus.ARCHIVED });
  }

  /**
   * Duplicate a form
   */
  async duplicateForm(id: number, createdBy: string, newTitle?: string): Promise<DynamicForm> {
    const originalForm = await this.getDynamicFormById(id);

    const duplicateData: CreateDynamicFormRequest = {
      program_id: originalForm.program_id,
      title: newTitle || `${originalForm.title} (Copy)`,
      description: originalForm.description,
      fields: originalForm.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        description: field.description,
        options: field.options,
        validation: field.validation,
        order: field.order
      })),
      status: FormStatus.DRAFT
    };

    return await this.createDynamicForm(duplicateData, createdBy);
  }

  /**
   * Get form statistics
   */
  async getFormStats(id: number): Promise<any> {
    const form = await this.getDynamicFormById(id);
    
    // Basic stats - can be extended later when applications are implemented
    return {
      formId: id,
      status: form.status,
      totalFields: form.fields.length,
      requiredFields: form.fields.filter(f => f.required).length,
      fieldTypes: this.getFieldTypeStats(form.fields),
      version: form.version,
      lastUpdated: form.updated_at
    };
  }

  /**
   * Validate form data
   */
  private validateFormData(data: CreateDynamicFormRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new ApiError(400, 'Form title is required');
    }

    if (data.title.length > 255) {
      throw new ApiError(400, 'Form title cannot exceed 255 characters');
    }

    if (!data.program_id) {
      throw new ApiError(400, 'Program ID is required');
    }

    if (!data.fields || data.fields.length === 0) {
      throw new ApiError(400, 'At least one field is required');
    }

    if (data.fields.length > 50) {
      throw new ApiError(400, 'Maximum 50 fields allowed per form');
    }
  }

  /**
   * Validate field order
   */
  private validateFieldOrder(fields: any[]): void {
    const orders = fields.map(f => f.order);
    const uniqueOrders = new Set(orders);
    
    if (orders.length !== uniqueOrders.size) {
      throw new ApiError(400, 'Field orders must be unique');
    }

    // Check if orders are positive integers
    const invalidOrders = orders.filter(order => !Number.isInteger(order) || order <= 0);
    if (invalidOrders.length > 0) {
      throw new ApiError(400, 'Field orders must be positive integers');
    }
  }

  /**
   * Validate field names are unique
   */
  private validateFieldNames(fields: any[]): void {
    const names = fields.map(f => f.name.toLowerCase());
    const uniqueNames = new Set(names);
    
    if (names.length !== uniqueNames.size) {
      throw new ApiError(400, 'Field names must be unique (case-insensitive)');
    }

    // Validate field name format (alphanumeric, underscore, hyphen only)
    const invalidNames = fields.filter(field => 
      !/^[a-zA-Z0-9_-]+$/.test(field.name)
    );
    
    if (invalidNames.length > 0) {
      throw new ApiError(400, 'Field names can only contain letters, numbers, underscores, and hyphens');
    }
  }

  /**
   * Validate field types and their requirements
   */
  private validateFieldTypes(fields: any[]): void {
    for (const field of fields) {
      // Validate field type
      if (!Object.values(FormFieldType).includes(field.type)) {
        throw new ApiError(400, `Invalid field type: ${field.type}`);
      }

      // Validate label
      if (!field.label || field.label.trim().length === 0) {
        throw new ApiError(400, `Field label is required for field: ${field.name}`);
      }

      // Validate options for select, radio, checkbox fields
      const optionRequiredTypes = [FormFieldType.SELECT, FormFieldType.RADIO, FormFieldType.CHECKBOX];
      if (optionRequiredTypes.includes(field.type)) {
        if (!field.options || field.options.length === 0) {
          throw new ApiError(400, `Options are required for ${field.type} field: ${field.name}`);
        }

        // Validate option values are unique
        const optionValues = field.options.map((opt: any) => opt.value);
        const uniqueOptionValues = new Set(optionValues);
        if (optionValues.length !== uniqueOptionValues.size) {
          throw new ApiError(400, `Option values must be unique for field: ${field.name}`);
        }
      }

      // Validate validation rules
      if (field.validation) {
        this.validateFieldValidationRules(field);
      }
    }
  }

  /**
   * Validate field validation rules
   */
  private validateFieldValidationRules(field: any): void {
    const validation = field.validation;

    // String length validation
    if (validation.minLength !== undefined && validation.minLength < 0) {
      throw new ApiError(400, `Invalid minLength for field ${field.name}: must be non-negative`);
    }

    if (validation.maxLength !== undefined && validation.maxLength < 0) {
      throw new ApiError(400, `Invalid maxLength for field ${field.name}: must be non-negative`);
    }

    if (validation.minLength !== undefined && validation.maxLength !== undefined) {
      if (validation.minLength > validation.maxLength) {
        throw new ApiError(400, `Invalid length validation for field ${field.name}: minLength cannot be greater than maxLength`);
      }
    }

    // Number validation
    if (field.type === FormFieldType.NUMBER) {
      if (validation.min !== undefined && validation.max !== undefined) {
        if (validation.min > validation.max) {
          throw new ApiError(400, `Invalid number validation for field ${field.name}: min cannot be greater than max`);
        }
      }
    }

    // File validation
    if (field.type === FormFieldType.FILE) {
      if (validation.fileTypes && !Array.isArray(validation.fileTypes)) {
        throw new ApiError(400, `Invalid fileTypes for field ${field.name}: must be an array`);
      }

      if (validation.maxFileSize !== undefined && validation.maxFileSize <= 0) {
        throw new ApiError(400, `Invalid maxFileSize for field ${field.name}: must be positive`);
      }
    }

    // Pattern validation
    if (validation.pattern) {
      try {
        new RegExp(validation.pattern);
      } catch (error) {
        throw new ApiError(400, `Invalid regex pattern for field ${field.name}: ${validation.pattern}`);
      }
    }
  }

  /**
   * Get field type statistics
   */
  private getFieldTypeStats(fields: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const field of fields) {
      stats[field.type] = (stats[field.type] || 0) + 1;
    }

    return stats;
  }
}

export default new DynamicFormService();