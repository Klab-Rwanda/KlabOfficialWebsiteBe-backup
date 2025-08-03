import applicationSubmissionModel from '../models/applicationSubmission.model';
import { 
  ApplicationSubmission,
  CreateApplicationRequest, 
  UpdateApplicationStatusRequest, 
  GetApplicationsQuery,
  ApplicationsResponse,
  ApplicationStats,
  ApplicationWithFormStructure,
  SubmittedFile,
  BulkApplicationUpdate,
  BulkApplicationResponse
} from '../types/applicationSubmission.types';
import { ApiError } from '../utils/ApiError';
import fs from 'fs';
import path from 'path';

export class ApplicationSubmissionService {

  /**
   * Submit a new application
   */
  async submitApplication(data: CreateApplicationRequest, files?: any): Promise<ApplicationSubmission> {
    try {
      // Process uploaded files if any
      const submittedFiles: SubmittedFile[] = [];
      
      if (files && Array.isArray(files)) {
        for (const file of files) {
          submittedFiles.push({
            field_name: file.fieldname,
            original_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_at: new Date().toISOString()
          });
        }
      } else if (files) {
        // Handle single file or files object
        Object.entries(files).forEach(([fieldName, fileArray]: [string, any]) => {
          const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
          fileList.forEach((file: any) => {
            submittedFiles.push({
              field_name: fieldName,
              original_name: file.originalname,
              file_path: file.path,
              file_size: file.size,
              mime_type: file.mimetype,
              uploaded_at: new Date().toISOString()
            });
          });
        });
      }

      const application = await applicationSubmissionModel.submitApplication(data, submittedFiles);
      return application;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has already applied to a form
   */
  async checkUserApplication(formId: number, email: string): Promise<{ has_applied: boolean; application_id?: number; status?: string }> {
    try {
      const hasApplied = await applicationSubmissionModel.hasUserApplied(formId, email);
      
      if (hasApplied) {
        // Get the application details
        const applications = await applicationSubmissionModel.getApplications({
          form_id: formId,
          search: email,
          limit: 1
        });
        
        const userApplication = applications.applications.find(
          app => app.applicant_email.toLowerCase() === email.toLowerCase()
        );

        return {
          has_applied: true,
          application_id: userApplication?.id,
          status: userApplication?.status
        };
      }

      return { has_applied: false };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get applications with filtering and pagination
   */
  async getApplications(query: GetApplicationsQuery = {}): Promise<ApplicationsResponse> {
    try {
      return await applicationSubmissionModel.getApplications(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get application by ID with full details
   */
  async getApplicationById(id: number): Promise<ApplicationWithFormStructure> {
    try {
      const result = await applicationSubmissionModel.getApplicationById(id);
      
      if (!result) {
        throw new ApiError(404, 'Application not found');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(id: number, data: UpdateApplicationStatusRequest, reviewedBy: string): Promise<ApplicationSubmission> {
    try {
      const updatedApplication = await applicationSubmissionModel.updateApplicationStatus(id, data, reviewedBy);
      
      if (!updatedApplication) {
        throw new ApiError(404, 'Application not found');
      }

      return updatedApplication;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update application status
   */
  async bulkUpdateApplicationStatus(data: BulkApplicationUpdate, reviewedBy: string): Promise<BulkApplicationResponse> {
    try {
      if (!data.application_ids || data.application_ids.length === 0) {
        throw new ApiError(400, 'No application IDs provided');
      }

      return await applicationSubmissionModel.bulkUpdateApplicationStatus(data, reviewedBy);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<ApplicationStats> {
    try {
      return await applicationSubmissionModel.getApplicationStats();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get dashboard summary with key metrics
   */
  async getDashboardSummary(): Promise<any> {
    try {
      const stats = await applicationSubmissionModel.getApplicationStats();
      
      // Calculate additional metrics
      const acceptanceRate = stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(1) : '0';
      const rejectionRate = stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : '0';
      const pendingRate = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : '0';

      return {
        total_applications: stats.total,
        pending_applications: stats.pending,
        applications_under_review: stats.under_review,
        accepted_applications: stats.accepted,
        rejected_applications: stats.rejected,
        withdrawn_applications: stats.withdrawn,
        acceptance_rate: `${acceptanceRate}%`,
        rejection_rate: `${rejectionRate}%`,
        pending_rate: `${pendingRate}%`,
        top_programs: stats.by_program.slice(0, 5),
        recent_submissions: stats.recent_submissions.slice(0, 5),
        applications_by_status: {
          pending: stats.pending,
          under_review: stats.under_review,
          accepted: stats.accepted,
          rejected: stats.rejected,
          withdrawn: stats.withdrawn
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get applications by program
   */
  async getApplicationsByProgram(programId: number, query: Omit<GetApplicationsQuery, 'program_id'>): Promise<ApplicationsResponse> {
    try {
      const fullQuery: GetApplicationsQuery = {
        ...query,
        program_id: programId
      };

      return await applicationSubmissionModel.getApplications(fullQuery);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get applications by form
   */
  async getApplicationsByForm(formId: number, query: Omit<GetApplicationsQuery, 'form_id'>): Promise<ApplicationsResponse> {
    try {
      const fullQuery: GetApplicationsQuery = {
        ...query,
        form_id: formId
      };

      return await applicationSubmissionModel.getApplications(fullQuery);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export applications to CSV
   */
  async exportApplicationsToCSV(query: GetApplicationsQuery = {}): Promise<string> {
    try {
      // Get all applications without pagination for export
      const exportQuery = { ...query, limit: undefined, page: undefined };
      const result = await applicationSubmissionModel.getApplications(exportQuery);
      
      if (result.applications.length === 0) {
        return 'No applications found for the specified criteria';
      }

      // CSV headers
      const headers = [
        'ID',
        'Form Title',
        'Program Title',
        'Applicant Name',
        'Applicant Email',
        'Applicant Phone',
        'Status',
        'Submitted At',
        'Reviewed At',
        'Reviewed By',
        'Reviewer Notes'
      ];

      // Add dynamic headers for submission data
      const sampleSubmissionData = result.applications[0]?.submission_data || {};
      const dynamicHeaders = Object.keys(sampleSubmissionData);
      headers.push(...dynamicHeaders);

      // Build CSV content
      const csvRows = [headers.join(',')];

      result.applications.forEach(app => {
        const row = [
          app.id,
          `"${app.form_title || ''}"`,
          `"${app.program_title || ''}"`,
          `"${app.applicant_name}"`,
          `"${app.applicant_email}"`,
          `"${app.applicant_phone || ''}"`,
          app.status,
          app.submitted_at,
          app.reviewed_at || '',
          `"${app.reviewed_by || ''}"`,
          `"${app.reviewer_notes || ''}"`
        ];

        // Add dynamic data
        dynamicHeaders.forEach(header => {
          const value = app.submission_data[header];
          const formattedValue = typeof value === 'object' ? JSON.stringify(value) : (value || '');
          row.push(`"${formattedValue}"`);
        });

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get application status history
   */
  async getApplicationStatusHistory(id: number): Promise<any[]> {
    try {
      // First check if application exists
      const application = await applicationSubmissionModel.getApplicationById(id);
      if (!application) {
        throw new ApiError(404, 'Application not found');
      }

      return await applicationSubmissionModel.getApplicationStatusHistory(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete application
   */
  async deleteApplication(id: number): Promise<void> {
    try {
      // Check if application exists
      const application = await applicationSubmissionModel.getApplicationById(id);
      if (!application) {
        throw new ApiError(404, 'Application not found');
      }

      // Delete associated files from filesystem
      if (application.submitted_files && application.submitted_files.length > 0) {
        for (const file of application.submitted_files) {
          try {
            if (fs.existsSync(file.file_path)) {
              fs.unlinkSync(file.file_path);
            }
          } catch (fileError) {
            console.error(`Failed to delete file ${file.file_path}:`, fileError);
          }
        }
      }

      // Delete from database
      const deleted = await applicationSubmissionModel.deleteApplication(id);
      if (!deleted) {
        throw new ApiError(500, 'Failed to delete application');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate application data before submission
   */
  private validateApplicationData(data: CreateApplicationRequest): void {
    if (!data.form_id) {
      throw new ApiError(400, 'Form ID is required');
    }

    if (!data.applicant_name || data.applicant_name.trim().length === 0) {
      throw new ApiError(400, 'Applicant name is required');
    }

    if (!data.applicant_email || !this.isValidEmail(data.applicant_email)) {
      throw new ApiError(400, 'Valid applicant email is required');
    }

    if (!data.submission_data || Object.keys(data.submission_data).length === 0) {
      throw new ApiError(400, 'Submission data is required');
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Clean up uploaded files (utility method)
   */
  async cleanupUploadedFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }

  /**
   * Get file info for download
   */
  async getFileInfo(applicationId: number, fileName: string): Promise<{ filePath: string; originalName: string; mimeType: string } | null> {
    try {
      const application = await applicationSubmissionModel.getApplicationById(applicationId);
      if (!application) {
        return null;
      }

      const file = application.submitted_files.find(f => 
        f.original_name === fileName || path.basename(f.file_path) === fileName
      );

      if (!file || !fs.existsSync(file.file_path)) {
        return null;
      }

      return {
        filePath: file.file_path,
        originalName: file.original_name,
        mimeType: file.mime_type
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new ApplicationSubmissionService();