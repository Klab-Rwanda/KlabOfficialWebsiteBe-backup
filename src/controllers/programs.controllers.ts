import { Request, Response } from "express";
import {
  createProgram,
  getProgramById,
  getAllPrograms,
  getProgramsByTag,
  updateProgram,
  deleteProgram,
  addFeatureToProgram,
  removeFeatureFromProgram,
  getProgramStatsSummary
} from "../services/programs.service";
import { CreateProgramRequest, UpdateProgramRequest, ProgramFilters } from "../types/programs.types";

// Create new program controller with image upload
export const createProgramController = async (req: Request, res: Response): Promise<void> => {
  try {
    const programData: CreateProgramRequest = req.body;
    const imagePath = (req.body as any).uploadedImagePath; // Set by parseFormData middleware
    
    const result = await createProgram(programData, imagePath);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error creating program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get program by ID controller
export const getProgramByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      res.status(400).json({
        success: false,
        message: "Invalid program ID"
      });
      return;
    }

    const result = await getProgramById(programId);

    if (!result.success) {
      const statusCode = result.error === "Program not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error getting program by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all programs controller
export const getAllProgramsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: ProgramFilters = {
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      duration: req.query.duration as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const result = await getAllPrograms(filters);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error getting all programs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get programs by tag controller
export const getProgramsByTagController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag } = req.params;

    if (!tag) {
      res.status(400).json({
        success: false,
        message: "Tag parameter is required"
      });
      return;
    }

    const result = await getProgramsByTag(tag);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error getting programs by tag:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update program controller
export const updateProgramController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      res.status(400).json({
        success: false,
        message: "Invalid program ID"
      });
      return;
    }

    const updates: UpdateProgramRequest = req.body;
    const result = await updateProgram(programId, updates);

    if (!result.success) {
      const statusCode = result.error === "Program not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error updating program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete program controller
export const deleteProgramController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      res.status(400).json({
        success: false,
        message: "Invalid program ID"
      });
      return;
    }

    const result = await deleteProgram(programId);

    if (!result.success) {
      const statusCode = result.error === "Program not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error("Controller error deleting program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add feature to program controller
export const addFeatureToProgramController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { feature } = req.body;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      res.status(400).json({
        success: false,
        message: "Invalid program ID"
      });
      return;
    }

    if (!feature) {
      res.status(400).json({
        success: false,
        message: "Feature is required in request body"
      });
      return;
    }

    const result = await addFeatureToProgram(programId, feature);

    if (!result.success) {
      const statusCode = result.error?.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error adding feature:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Remove feature from program controller
export const removeFeatureFromProgramController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { feature } = req.body;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      res.status(400).json({
        success: false,
        message: "Invalid program ID"
      });
      return;
    }

    if (!feature) {
      res.status(400).json({
        success: false,
        message: "Feature is required in request body"
      });
      return;
    }

    const result = await removeFeatureFromProgram(programId, feature);

    if (!result.success) {
      const statusCode = result.error?.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error removing feature:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get program statistics summary controller
export const getProgramStatsSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getProgramStatsSummary();

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("Controller error getting program stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};