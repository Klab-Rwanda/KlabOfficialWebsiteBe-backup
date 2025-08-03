export interface ApplicationSubmission {
    id: number;
    form_id: number;
    program_id: number;
    applicant_name: string;
    applicant_email: string;
    applicant_phone?: string;
    submission_data: Record<string, any>; // Flexible JSON data
    submitted_files?: SubmittedFile[];
    status: ApplicationStatus;
    submitted_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    reviewer_notes?: string;
    created_at: string;
    updated_at: string;
    
    // Joined data
    form_title?: string;
    program_title?: string;
    form_fields?: any[];
  }
  
  export interface SubmittedFile {
    field_name: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }
  
  export enum ApplicationStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn'
  }
  
  // Request/Response Types
  export interface CreateApplicationRequest {
    form_id: number;
    applicant_name: string;
    applicant_email: string;
    applicant_phone?: string;
    submission_data: Record<string, any>;
    submitted_files?: Array<{
      field_name: string;
      file: File;
    }>;
  }
  
  export interface UpdateApplicationStatusRequest {
    status: ApplicationStatus;
    reviewer_notes?: string;
  }
  
  export interface GetApplicationsQuery {
    form_id?: number;
    program_id?: number;
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: 'submitted_at' | 'reviewed_at' | 'applicant_name';
    sort_order?: 'asc' | 'desc';
  }
  
  export interface ApplicationsResponse {
    applications: ApplicationSubmission[];
    pagination: {
      currentPage: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
    total: number;
  }
  
  export interface ApplicationStats {
    total: number;
    pending: number;
    under_review: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    by_program: Array<{
      program_id: number;
      program_title: string;
      count: number;
      pending: number;
      accepted: number;
      rejected: number;
    }>;
    by_form: Array<{
      form_id: number;
      form_title: string;
      count: number;
      pending: number;
      accepted: number;
      rejected: number;
    }>;
    recent_submissions: ApplicationSubmission[];
  }
  
  // Validation types for form submission
  export interface FormSubmissionValidation {
    field_name: string;
    field_label: string;
    errors: string[];
  }
  
  export interface SubmissionValidationResult {
    is_valid: boolean;
    errors: FormSubmissionValidation[];
    file_errors?: Array<{
      field_name: string;
      errors: string[];
    }>;
  }
  
  // Application details with form structure
  export interface ApplicationWithFormStructure {
    application: ApplicationSubmission;
    form_structure: Array<{
      field_name: string;
      field_label: string;
      field_type: string;
      required: boolean;
      options?: Array<{ value: string; label: string }>;
      submitted_value: any;
      display_value: string;
    }>;
    submitted_files: SubmittedFile[];
  }
  
  // Bulk operations
  export interface BulkApplicationUpdate {
    application_ids: number[];
    status: ApplicationStatus;
    reviewer_notes?: string;
  }
  
  export interface BulkApplicationResponse {
    updated_count: number;
    failed_updates: Array<{
      application_id: number;
      error: string;
    }>;
  }