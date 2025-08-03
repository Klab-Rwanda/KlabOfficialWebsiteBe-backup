export interface FormField {
  id: number;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: FormFieldOption[]; // For radio, checkbox, select
  validation?: FormFieldValidation;
  order: number;
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  fileTypes?: string[]; // For file uploads
  maxFileSize?: number; // In bytes
}

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  FILE = 'file',
  DATE = 'date',
  PHONE = 'phone',
  URL = 'url'
}

export enum FormStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface DynamicForm {
  id: number;
  program_id: number;
  title: string;
  description?: string;
  fields: FormField[];
  status: FormStatus;
  created_at: string;
  updated_at: string;
  created_by: string; // Admin user ID
  version: number;
}

// Request/Response Types
export interface CreateDynamicFormRequest {
  program_id: number;
  title: string;
  description?: string;
  fields: Omit<FormField, 'id'>[];
  status?: FormStatus;
}

export interface UpdateDynamicFormRequest {
  program_id?: number;
  title?: string;
  description?: string;
  fields?: Omit<FormField, 'id'>[];
  status?: FormStatus;
}

export interface DynamicFormResponse {
  id: number;
  program_id: number;
  title: string;
  description?: string;
  fields: FormField[];
  status: FormStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  version: number;
  program_title?: string; // Joined from programs table
}

export interface FormFieldValidationError {
  field: string;
  message: string;
}

// Query parameters for listing forms
export interface GetDynamicFormsQuery {
  program_id?: number;
  status?: FormStatus;
  page?: number;
  limit?: number;
  search?: string;
}