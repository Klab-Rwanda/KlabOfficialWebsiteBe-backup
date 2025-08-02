export interface ProgramStats {
    duration: string;
    graduates: string;
    period: string;
  }
  
  export interface Program {
    id?: number;
    title: string;
    description: string;
    image?: string;
    details?: string;
    stats: ProgramStats;
    features: string[];
    why_choose?: string;
    tags: string[];
    created_at?: Date;
    updated_at?: Date;
  }
  
  export interface CreateProgramRequest {
    title: string;
    description: string;
    image?: string;
    details?: string;
    stats: ProgramStats;
    features: string[];
    why_choose?: string;
    tags: string[];
  }
  
  export interface UpdateProgramRequest {
    title?: string;
    description?: string;
    image?: string;
    details?: string;
    stats?: ProgramStats;
    features?: string[];
    why_choose?: string;
    tags?: string[];
  }
  
  export interface ProgramFilters {
    tags?: string[];
    duration?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
  
  export interface PaginatedPrograms {
    programs: Program[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  export interface ProgramQueryResult {
    success: boolean;
    data?: Program | Program[] | PaginatedPrograms;
    message?: string;
    error?: string;
  }