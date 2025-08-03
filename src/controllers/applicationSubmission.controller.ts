import { Request, Response } from 'express';
import applicationSubmissionService from '../services/applicationSubmission.service';
import { 
  CreateApplicationRequest, 
  UpdateApplicationStatusRequest, 
  GetApplicationsQuery,
  BulkApplicationUpdate
} from '../types/applicationSubmission.types';
import { sendSuccessResponse, sendErrorResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export class ApplicationSubmissionController {

  /**
   * Submit a new application (Public endpoint)
   * POST /applications
   */
  submitApplication = asyncHandler(async (req: Request, res: Response) => {
    const applicationData: CreateApplicationRequest = req.body;
    const files = req.files;

    const application = await applicationSubmissionService.submitApplication(applicationData, files);

    sendSuccessResponse(res, {
      application_id: application.id,
      status: application.status,
      submitted_at: application.submitted_at,
      message: 'Thank you for your application. You will receive an email confirmation shortly.'
    }, 'Application submitted successfully', 201);
  });

  /**
   * Check if user has already applied (Public endpoint)
   * GET /applications/check?form_id=1&email=user@example.com
   */
  checkUserApplication = asyncHandler(async (req: Request, res: Response) => {
    const { form_id, email } = req.query;

    const result = await applicationSubmissionService.checkUserApplication(
      parseInt(form_id as string),
      email as string
    );

    sendSuccessResponse(res, result, 'Application check completed');
  });

  /**
   * Get all applications with filtering (Admin only)
   * GET /admin/applications
   */
  getApplications = asyncHandler(async (req: Request, res: Response) => {
    const query: GetApplicationsQuery = {
      form_id: req.query.form_id ? parseInt(req.query.form_id as string) : undefined,
      program_id: req.query.program_id ? parseInt(req.query.program_id as string) : undefined,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as any
    };

    const result = await applicationSubmissionService.getApplications(query);

    sendSuccessResponse(res, {
      applications: result.applications,
      pagination: result.pagination,
      total: result.total
    }, 'Applications retrieved successfully');
  });

  /**
   * Get application by ID with full details (Admin only)
   * GET /admin/applications/:id
   */
  getApplicationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await applicationSubmissionService.getApplicationById(parseInt(id));

    sendSuccessResponse(res, result, 'Application details retrieved successfully');
  });

  /**
   * Update application status (Admin only)
   * PATCH /admin/applications/:id/status
   */
  updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateApplicationStatusRequest = req.body;
    
    // TODO: Get actual user ID from auth middleware
    const reviewedBy = req.headers['user-id'] as string || 'admin-user';

    const updatedApplication = await applicationSubmissionService.updateApplicationStatus(
      parseInt(id),
      updateData,
      reviewedBy
    );

    sendSuccessResponse(res, updatedApplication, 'Application status updated successfully');
  });

  /**
   * Bulk update application status (Admin only)
   * PATCH /admin/applications/bulk-status
   */
  bulkUpdateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
    const bulkData: BulkApplicationUpdate = req.body;
    
    // TODO: Get actual user ID from auth middleware
    const reviewedBy = req.headers['user-id'] as string || 'admin-user';

    const result = await applicationSubmissionService.bulkUpdateApplicationStatus(bulkData, reviewedBy);

    sendSuccessResponse(res, result, 'Bulk status update completed');
  });

  /**
   * Get application statistics (Admin only)
   * GET /admin/applications/stats
   */
  getApplicationStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await applicationSubmissionService.getApplicationStats();

    sendSuccessResponse(res, stats, 'Application statistics retrieved successfully');
  });

  /**
   * Get dashboard summary (Admin only)
   * GET /admin/applications/dashboard-summary
   */
  getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await applicationSubmissionService.getDashboardSummary();

    sendSuccessResponse(res, summary, 'Dashboard summary retrieved successfully');
  });

  /**
   * Get applications by program (Admin only)
   * GET /admin/programs/:programId/applications
   */
  getApplicationsByProgram = asyncHandler(async (req: Request, res: Response) => {
    const { programId } = req.params;
    const query: Omit<GetApplicationsQuery, 'program_id'> = {
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as any
    };

    const result = await applicationSubmissionService.getApplicationsByProgram(
      parseInt(programId),
      query
    );

    sendSuccessResponse(res, {
      program_id: parseInt(programId),
      applications: result.applications,
      pagination: result.pagination,
      total: result.total
    }, 'Program applications retrieved successfully');
  });

  /**
   * Get applications by form (Admin only)
   * GET /admin/forms/:formId/applications
   */
  getApplicationsByForm = asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const query: Omit<GetApplicationsQuery, 'form_id'> = {
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as any
    };

    const result = await applicationSubmissionService.getApplicationsByForm(
      parseInt(formId),
      query
    );

    sendSuccessResponse(res, {
      form_id: parseInt(formId),
      applications: result.applications,
      pagination: result.pagination,
      total: result.total
    }, 'Form applications retrieved successfully');
  });

  /**
   * Export applications to CSV (Admin only)
   * GET /admin/applications/export
   */
  exportApplications = asyncHandler(async (req: Request, res: Response) => {
    const query: GetApplicationsQuery = {
      form_id: req.query.form_id ? parseInt(req.query.form_id as string) : undefined,
      program_id: req.query.program_id ? parseInt(req.query.program_id as string) : undefined,
      status: req.query.status as any,
      search: req.query.search as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };

    const csvContent = await applicationSubmissionService.exportApplicationsToCSV(query);

    const filename = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  });

  /**
   * Get application status history (Admin only)
   * GET /admin/applications/:id/history
   */
  getApplicationStatusHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const history = await applicationSubmissionService.getApplicationStatusHistory(parseInt(id));

    sendSuccessResponse(res, history, 'Application status history retrieved successfully');
  });

  /**
   * Delete application (Admin only)
   * DELETE /admin/applications/:id
   */
  deleteApplication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await applicationSubmissionService.deleteApplication(parseInt(id));

    sendSuccessResponse(res, {}, 'Application deleted successfully');
  });

  /**
   * Accept application (Admin shortcut endpoint)
   * PATCH /admin/applications/:id/accept
   */
  acceptApplication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewer_notes } = req.body;
    
    const reviewedBy = req.headers['user-id'] as string || 'admin-user';

    const updatedApplication = await applicationSubmissionService.updateApplicationStatus(
      parseInt(id),
      { 
        status: 'accepted' as any,
        reviewer_notes 
      },
      reviewedBy
    );

    sendSuccessResponse(res, updatedApplication, 'Application accepted successfully');
  });

  /**
   * Reject application (Admin shortcut endpoint)
   * PATCH /admin/applications/:id/reject
   */
  rejectApplication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewer_notes } = req.body;
    
    const reviewedBy = req.headers['user-id'] as string || 'admin-user';

    const updatedApplication = await applicationSubmissionService.updateApplicationStatus(
      parseInt(id),
      { 
        status: 'rejected' as any,
        reviewer_notes 
      },
      reviewedBy
    );

    sendSuccessResponse(res, updatedApplication, 'Application rejected successfully');
  });

  /**
   * Mark application as under review (Admin shortcut endpoint)
   * PATCH /admin/applications/:id/review
   */
  markAsUnderReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewer_notes } = req.body;
    
    const reviewedBy = req.headers['user-id'] as string || 'admin-user';

    const updatedApplication = await applicationSubmissionService.updateApplicationStatus(
      parseInt(id),
      { 
        status: 'under_review' as any,
        reviewer_notes 
      },
      reviewedBy
    );

    sendSuccessResponse(res, updatedApplication, 'Application marked as under review');
  });

  /**
   * Get recent applications (Admin dashboard)
   * GET /admin/applications/recent
   */
  getRecentApplications = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await applicationSubmissionService.getApplications({
      limit,
      sort_by: 'submitted_at',
      sort_order: 'desc'
    });

    sendSuccessResponse(res, result.applications, 'Recent applications retrieved successfully');
  });

  /**
   * Get applications requiring review (Admin dashboard)
   * GET /admin/applications/pending-review
   */
  getApplicationsRequiringReview = asyncHandler(async (req: Request, res: Response) => {
    const result = await applicationSubmissionService.getApplications({
      status: 'pending' as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sort_by: 'submitted_at',
      sort_order: 'asc' // Oldest first for review queue
    });

    sendSuccessResponse(res, {
      applications: result.applications,
      total: result.total
    }, 'Applications requiring review retrieved successfully');
  });

  /**
   * Get application summary for a specific applicant
   * GET /applications/summary?email=user@example.com
   */
  getApplicantSummary = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query;

    if (!email) {
      throw new ApiError(400, 'Email parameter is required');
    }

    const result = await applicationSubmissionService.getApplications({
      search: email as string,
      limit: 50 // Max applications per user
    });

    // Filter to exact email match
    const userApplications = result.applications.filter(
      app => app.applicant_email.toLowerCase() === (email as string).toLowerCase()
    );

    const summary = {
      applicant_email: email,
      total_applications: userApplications.length,
      applications: userApplications.map(app => ({
        id: app.id,
        form_title: app.form_title,
        program_title: app.program_title,
        status: app.status,
        submitted_at: app.submitted_at,
        reviewed_at: app.reviewed_at
      })),
      status_breakdown: {
        pending: userApplications.filter(app => app.status === 'pending').length,
        under_review: userApplications.filter(app => app.status === 'under_review').length,
        accepted: userApplications.filter(app => app.status === 'accepted').length,
        rejected: userApplications.filter(app => app.status === 'rejected').length,
        withdrawn: userApplications.filter(app => app.status === 'withdrawn').length
      }
    };

    sendSuccessResponse(res, summary, 'Applicant summary retrieved successfully');
  });
}

export default new ApplicationSubmissionController();