// src/models/applicationSubmission.model.ts

import { Pool } from 'pg';
import pool from '../config/db.config';
import { 
  ApplicationSubmission,
  CreateApplicationRequest,
  UpdateApplicationStatusRequest,
  GetApplicationsQuery,
  ApplicationStatus,
  ApplicationsResponse,
  ApplicationStats,
  ApplicationWithFormStructure,
  SubmittedFile,
  BulkApplicationUpdate,
  BulkApplicationResponse
} from '../types/applicationSubmission.types';
import { ApiError } from '../utils/ApiError';

export class ApplicationSubmissionModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Submit a new application
   */
  async submitApplication(data: CreateApplicationRequest, submittedFiles: SubmittedFile[] = []): Promise<ApplicationSubmission> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify form exists and is published
      const formCheck = await client.query(
        `SELECT df.id, df.program_id, df.status, p.title as program_title
         FROM dynamic_forms df
         JOIN programs p ON df.program_id = p.id
         WHERE df.id = $1 AND df.status = 'published'`,
        [data.form_id]
      );

      if (formCheck.rows.length === 0) {
        throw new ApiError(404, 'Published form not found');
      }

      const form = formCheck.rows[0];

      // Check for duplicate submission (same email + form)
      const duplicateCheck = await client.query(
        'SELECT id FROM application_submissions WHERE form_id = $1 AND applicant_email = $2',
        [data.form_id, data.applicant_email]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new ApiError(400, 'You have already submitted an application for this program');
      }

      // Create application submission
      const applicationResult = await client.query(
        `INSERT INTO application_submissions (
          form_id, program_id, applicant_name, applicant_email, applicant_phone, submission_data
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.form_id,
          form.program_id,
          data.applicant_name,
          data.applicant_email,
          data.applicant_phone,
          JSON.stringify(data.submission_data)
        ]
      );

      const application = applicationResult.rows[0];

      // Save submitted files
      if (submittedFiles.length > 0) {
        for (const file of submittedFiles) {
          await client.query(
            `INSERT INTO submitted_files (
              application_id, field_name, original_name, file_path, file_size, mime_type
             ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              application.id,
              file.field_name,
              file.original_name,
              file.file_path,
              file.file_size,
              file.mime_type
            ]
          );
        }
      }

      await client.query('COMMIT');

      return {
        ...application,
        submission_data: JSON.parse(application.submission_data),
        submitted_files: submittedFiles,
        form_title: form.form_title,
        program_title: form.program_title
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get applications with filtering and pagination
   */
  async getApplications(query: GetApplicationsQuery = {}): Promise<ApplicationsResponse> {
    const {
      form_id,
      program_id,
      status,
      page = 1,
      limit = 20,
      search,
      date_from,
      date_to,
      sort_by = 'submitted_at',
      sort_order = 'desc'
    } = query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (form_id) {
      whereClause += ` AND a.form_id = $${paramIndex}`;
      queryParams.push(form_id);
      paramIndex++;
    }

    if (program_id) {
      whereClause += ` AND a.program_id = $${paramIndex}`;
      queryParams.push(program_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (
        a.applicant_name ILIKE $${paramIndex} OR 
        a.applicant_email ILIKE $${paramIndex} OR
        df.title ILIKE $${paramIndex} OR
        p.title ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (date_from) {
      whereClause += ` AND a.submitted_at >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClause += ` AND a.submitted_at <= $${paramIndex}`;
      queryParams.push(date_to);
      paramIndex++;
    }

    const offset = (page - 1) * limit;
    const orderClause = `ORDER BY a.${sort_by} ${sort_order.toUpperCase()}`;

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM application_submissions a
       LEFT JOIN dynamic_forms df ON a.form_id = df.id
       LEFT JOIN programs p ON a.program_id = p.id
       ${whereClause}`,
      queryParams
    );

    // Get applications
    const applicationsResult = await this.pool.query(
      `SELECT 
         a.*,
         df.title as form_title,
         p.title as program_title,
         COUNT(sf.id) as file_count
       FROM application_submissions a
       LEFT JOIN dynamic_forms df ON a.form_id = df.id
       LEFT JOIN programs p ON a.program_id = p.id
       LEFT JOIN submitted_files sf ON a.id = sf.application_id
       ${whereClause}
       GROUP BY a.id, df.title, p.title
       ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const applications: ApplicationSubmission[] = applicationsResult.rows.map(row => ({
      ...row,
      submission_data: typeof row.submission_data === 'string' 
        ? JSON.parse(row.submission_data) 
        : row.submission_data
    }));

    return {
      applications,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      total
    };
  }

  /**
   * Get application by ID with full details
   */
  async getApplicationById(id: number): Promise<ApplicationWithFormStructure | null> {
    const applicationResult = await this.pool.query(
      `SELECT 
         a.*,
         df.title as form_title,
         df.fields as form_fields,
         p.title as program_title
       FROM application_submissions a
       LEFT JOIN dynamic_forms df ON a.form_id = df.id
       LEFT JOIN programs p ON a.program_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (applicationResult.rows.length === 0) {
      return null;
    }

    const applicationRow = applicationResult.rows[0];
    
    // Get submitted files
    const filesResult = await this.pool.query(
      'SELECT * FROM submitted_files WHERE application_id = $1 ORDER BY uploaded_at',
      [id]
    );

    const application: ApplicationSubmission = {
      ...applicationRow,
      submission_data: typeof applicationRow.submission_data === 'string' 
        ? JSON.parse(applicationRow.submission_data) 
        : applicationRow.submission_data
    };

    const submittedFiles: SubmittedFile[] = filesResult.rows;

    // Build form structure with submitted values
    const formFields = applicationRow.form_fields || [];
    const formStructure = formFields.map((field: any) => {
      const submittedValue = application.submission_data[field.name];
      
      return {
        field_name: field.name,
        field_label: field.label,
        field_type: field.type,
        required: field.required,
        options: field.options,
        submitted_value: submittedValue,
        display_value: this.formatDisplayValue(field, submittedValue)
      };
    });

    return {
      application,
      form_structure: formStructure,
      submitted_files: submittedFiles
    };
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(id: number, data: UpdateApplicationStatusRequest, reviewedBy: string): Promise<ApplicationSubmission | null> {
    const result = await this.pool.query(
      `UPDATE application_submissions 
       SET status = $1, reviewer_notes = $2, reviewed_by = $3
       WHERE id = $4
       RETURNING *`,
      [data.status, data.reviewer_notes, reviewedBy, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      submission_data: typeof result.rows[0].submission_data === 'string' 
        ? JSON.parse(result.rows[0].submission_data) 
        : result.rows[0].submission_data
    };
  }

  /**
   * Bulk update application status
   */
  async bulkUpdateApplicationStatus(data: BulkApplicationUpdate, reviewedBy: string): Promise<BulkApplicationResponse> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      let updatedCount = 0;
      const failedUpdates: Array<{ application_id: number; error: string }> = [];

      for (const applicationId of data.application_ids) {
        try {
          const result = await client.query(
            `UPDATE application_submissions 
             SET status = $1, reviewer_notes = $2, reviewed_by = $3
             WHERE id = $4`,
            [data.status, data.reviewer_notes, reviewedBy, applicationId]
          );

          if (result.rowCount && result.rowCount > 0) {
            updatedCount++;
          } else {
            failedUpdates.push({
              application_id: applicationId,
              error: 'Application not found'
            });
          }
        } catch (error) {
          failedUpdates.push({
            application_id: applicationId,
            error: (error as Error).message
          });
        }
      }

      await client.query('COMMIT');

      return {
        updated_count: updatedCount,
        failed_updates: failedUpdates
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<ApplicationStats> {
    // Overall stats
    const overallStatsResult = await this.pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
         COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
         COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
         COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn
       FROM application_submissions`
    );

    // Stats by program
    const programStatsResult = await this.pool.query(
      `SELECT * FROM application_stats_by_program ORDER BY total_applications DESC`
    );

    // Stats by form
    const formStatsResult = await this.pool.query(
      `SELECT * FROM application_stats_by_form ORDER BY total_applications DESC`
    );

    // Recent submissions
    const recentSubmissionsResult = await this.pool.query(
      `SELECT 
         a.*,
         df.title as form_title,
         p.title as program_title
       FROM application_submissions a
       LEFT JOIN dynamic_forms df ON a.form_id = df.id
       LEFT JOIN programs p ON a.program_id = p.id
       ORDER BY a.submitted_at DESC
       LIMIT 10`
    );

    const overallStats = overallStatsResult.rows[0];
    
    return {
      total: parseInt(overallStats.total),
      pending: parseInt(overallStats.pending),
      under_review: parseInt(overallStats.under_review),
      accepted: parseInt(overallStats.accepted),
      rejected: parseInt(overallStats.rejected),
      withdrawn: parseInt(overallStats.withdrawn),
      by_program: programStatsResult.rows.map(row => ({
        program_id: row.program_id,
        program_title: row.program_title,
        count: parseInt(row.total_applications),
        pending: parseInt(row.pending_count),
        accepted: parseInt(row.accepted_count),
        rejected: parseInt(row.rejected_count)
      })),
      by_form: formStatsResult.rows.map(row => ({
        form_id: row.form_id,
        form_title: row.form_title,
        count: parseInt(row.total_applications),
        pending: parseInt(row.pending_count),
        accepted: parseInt(row.accepted_count),
        rejected: parseInt(row.rejected_count)
      })),
      recent_submissions: recentSubmissionsResult.rows.map(row => ({
        ...row,
        submission_data: typeof row.submission_data === 'string' 
          ? JSON.parse(row.submission_data) 
          : row.submission_data
      }))
    };
  }

  /**
   * Delete application (admin only)
   */
  async deleteApplication(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM application_submissions WHERE id = $1',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Check if user has already applied to a form
   */
  async hasUserApplied(formId: number, email: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM application_submissions WHERE form_id = $1 AND applicant_email = $2',
      [formId, email]
    );

    return result.rows.length > 0;
  }

  /**
   * Get application status history
   */
  async getApplicationStatusHistory(applicationId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM application_status_history 
       WHERE application_id = $1 
       ORDER BY changed_at DESC`,
      [applicationId]
    );

    return result.rows;
  }

  /**
   * Format display value for different field types
   */
  private formatDisplayValue(field: any, value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }

    switch (field.type) {
      case 'checkbox':
        if (Array.isArray(value)) {
          if (field.options) {
            const selectedLabels = field.options
              .filter((option: any) => value.includes(option.value))
              .map((option: any) => option.label);
            return selectedLabels.join(', ') || 'None selected';
          }
          return value.join(', ');
        }
        return value.toString();

      case 'radio':
      case 'select':
        if (field.options) {
          const option = field.options.find((opt: any) => opt.value === value);
          return option ? option.label : value.toString();
        }
        return value.toString();

      case 'file':
        return 'File uploaded';

      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value.toString();
        }

      default:
        return value.toString();
    }
  }
}

export default new ApplicationSubmissionModel();