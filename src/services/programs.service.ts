import {
  createProgram as createProgramModel,
  findProgramById as findProgramByIdModel,
  findAllPrograms as findAllProgramsModel,
  findProgramsByTag as findProgramsByTagModel,
  updateProgram as updateProgramModel,
  deleteProgram as deleteProgramModel,
  addFeatureToProgram as addFeatureToProgramModel,
  removeFeatureFromProgram as removeFeatureFromProgramModel,
  getProgramStatsSummary as getProgramStatsSummaryModel
} from "../models/programs.model";
import { 
  Program, 
  CreateProgramRequest, 
  UpdateProgramRequest, 
  ProgramFilters,
  ProgramQueryResult 
} from "../types/programs.types";

// Create new program service with image upload
export const createProgram = async (programData: CreateProgramRequest, imagePath?: string): Promise<ProgramQueryResult> => {
  try {
    // Validate required fields
    if (!programData.title || !programData.description) {
      return {
        success: false,
        error: "Title and description are required"
      };
    }

    // Validate features array
    if (!programData.features || !Array.isArray(programData.features) || programData.features.length === 0) {
      return {
        success: false,
        error: "At least one feature is required"
      };
    }

    // Validate stats object
    if (!programData.stats || !programData.stats.duration || !programData.stats.graduates || !programData.stats.period) {
      return {
        success: false,
        error: "Complete stats (duration, graduates, period) are required"
      };
    }

    // Handle image upload to Cloudinary if image file is provided
    let imageUrl = programData.image; // Default to provided URL if any
    
    if (imagePath) {
      try {
        const uploadOnCloudinary = (await import("../utils/cloudinary")).default;
        const cloudinaryUrl = await uploadOnCloudinary(imagePath);
        
        if (cloudinaryUrl) {
          imageUrl = cloudinaryUrl;
        } else {
          return {
            success: false,
            error: "Failed to upload image to Cloudinary"
          };
        }
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return {
          success: false,
          error: "Image upload failed"
        };
      }
    }

    // Create program with image URL
    const programDataWithImage = {
      ...programData,
      image: imageUrl
    };

    const program = await createProgramModel(programDataWithImage);
    
    return {
      success: true,
      data: program,
      message: "Program created successfully"
    };
  } catch (error) {
    console.error("Service error creating program:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create program"
    };
  }
};

// Get program by ID service
export const getProgramById = async (id: number): Promise<ProgramQueryResult> => {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "Valid program ID is required"
      };
    }

    const program = await findProgramByIdModel(id);
    
    if (!program) {
      return {
        success: false,
        error: "Program not found"
      };
    }

    return {
      success: true,
      data: program
    };
  } catch (error) {
    console.error("Service error getting program by ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get program"
    };
  }
};

// Get all programs with filters service
export const getAllPrograms = async (filters: ProgramFilters = {}): Promise<ProgramQueryResult> => {
  try {
    // Validate pagination parameters
    if (filters.limit && (filters.limit <= 0 || filters.limit > 100)) {
      return {
        success: false,
        error: "Limit must be between 1 and 100"
      };
    }

    if (filters.offset && filters.offset < 0) {
      return {
        success: false,
        error: "Offset must be non-negative"
      };
    }

    const paginatedPrograms = await findAllProgramsModel(filters);
    
    return {
      success: true,
      data: paginatedPrograms
    };
  } catch (error) {
    console.error("Service error getting all programs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get programs"
    };
  }
};

// Get programs by tag service
export const getProgramsByTag = async (tag: string): Promise<ProgramQueryResult> => {
  try {
    if (!tag || tag.trim().length === 0) {
      return {
        success: false,
        error: "Tag is required"
      };
    }

    const programs = await findProgramsByTagModel(tag.trim());
    
    return {
      success: true,
      data: programs
    };
  } catch (error) {
    console.error("Service error getting programs by tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get programs by tag"
    };
  }
};

// Update program service
export const updateProgram = async (id: number, updates: UpdateProgramRequest): Promise<ProgramQueryResult> => {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "Valid program ID is required"
      };
    }

    // Check if program exists
    const existingProgram = await findProgramByIdModel(id);
    if (!existingProgram) {
      return {
        success: false,
        error: "Program not found"
      };
    }

    // Validate updates
    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "No fields to update"
      };
    }

    // Validate stats if provided
    if (updates.stats) {
      const { duration, graduates, period } = updates.stats;
      if (!duration || !graduates || !period) {
        return {
          success: false,
          error: "Complete stats (duration, graduates, period) are required"
        };
      }
    }

    const updatedProgram = await updateProgramModel(id, updates);
    
    if (!updatedProgram) {
      return {
        success: false,
        error: "Failed to update program"
      };
    }

    return {
      success: true,
      data: updatedProgram,
      message: "Program updated successfully"
    };
  } catch (error) {
    console.error("Service error updating program:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update program"
    };
  }
};

// Delete program service
export const deleteProgram = async (id: number): Promise<ProgramQueryResult> => {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "Valid program ID is required"
      };
    }

    // Check if program exists
    const existingProgram = await findProgramByIdModel(id);
    if (!existingProgram) {
      return {
        success: false,
        error: "Program not found"
      };
    }

    const deleted = await deleteProgramModel(id);
    
    if (!deleted) {
      return {
        success: false,
        error: "Failed to delete program"
      };
    }

    return {
      success: true,
      message: "Program deleted successfully"
    };
  } catch (error) {
    console.error("Service error deleting program:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete program"
    };
  }
};

// Add feature to program service
export const addFeatureToProgram = async (id: number, feature: string): Promise<ProgramQueryResult> => {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "Valid program ID is required"
      };
    }

    if (!feature || feature.trim().length === 0) {
      return {
        success: false,
        error: "Feature description is required"
      };
    }

    const updatedProgram = await addFeatureToProgramModel(id, feature.trim());
    
    if (!updatedProgram) {
      return {
        success: false,
        error: "Program not found or failed to add feature"
      };
    }

    return {
      success: true,
      data: updatedProgram,
      message: "Feature added successfully"
    };
  } catch (error) {
    console.error("Service error adding feature:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add feature"
    };
  }
};

// Remove feature from program service
export const removeFeatureFromProgram = async (id: number, feature: string): Promise<ProgramQueryResult> => {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "Valid program ID is required"
      };
    }

    if (!feature || feature.trim().length === 0) {
      return {
        success: false,
        error: "Feature description is required"
      };
    }

    const updatedProgram = await removeFeatureFromProgramModel(id, feature.trim());
    
    if (!updatedProgram) {
      return {
        success: false,
        error: "Program not found or failed to remove feature"
      };
    }

    return {
      success: true,
      data: updatedProgram,
      message: "Feature removed successfully"
    };
  } catch (error) {
    console.error("Service error removing feature:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove feature"
    };
  }
};

// Get program statistics summary service
export const getProgramStatsSummary = async (): Promise<ProgramQueryResult> => {
  try {
    const stats = await getProgramStatsSummaryModel();
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("Service error getting program stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get program statistics"
    };
  }
};