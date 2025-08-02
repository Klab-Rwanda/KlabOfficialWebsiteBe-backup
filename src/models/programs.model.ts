import pool from "../config/db.config";
import { Program, CreateProgramRequest, UpdateProgramRequest, ProgramFilters, PaginatedPrograms } from "../types/programs.types";

// Create a new program
export const createProgram = async (program: CreateProgramRequest): Promise<Program> => {
  const {
    title,
    description,
    image,
    details,
    stats,
    features,
    why_choose,
    tags
  } = program;

  const result = await pool.query(
    `INSERT INTO programs (title, description, image, details, stats, features, why_choose, tags) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING *`,
    [title, description, image, details, JSON.stringify(stats), features, why_choose, tags]
  );

  return mapDbRowToProgram(result.rows[0]);
};

// Find program by ID
export const findProgramById = async (id: number): Promise<Program | null> => {
  try {
    const result = await pool.query(
      `SELECT * FROM programs WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] ? mapDbRowToProgram(result.rows[0]) : null;
  } catch (error) {
    console.error("Error finding program by ID:", error);
    throw new Error("Failed to find program");
  }
};

// Find all programs with optional filters and pagination
export const findAllPrograms = async (filters: ProgramFilters = {}): Promise<PaginatedPrograms> => {
  try {
    const { tags, duration, search, limit = 10, offset = 0 } = filters;
    
    let query = `SELECT * FROM programs WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) FROM programs WHERE 1=1`;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add tag filter
    if (tags && tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      countQuery += ` AND tags && $${paramIndex}`;
      queryParams.push(tags);
      paramIndex++;
    }

    // Add duration filter
    if (duration) {
      query += ` AND stats->>'duration' = $${paramIndex}`;
      countQuery += ` AND stats->>'duration' = $${paramIndex}`;
      queryParams.push(duration);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      query += ` AND (
        to_tsvector('english', title || ' ' || description || ' ' || COALESCE(details, '')) 
        @@ plainto_tsquery('english', $${paramIndex})
      )`;
      countQuery += ` AND (
        to_tsvector('english', title || ' ' || description || ' ' || COALESCE(details, '')) 
        @@ plainto_tsquery('english', $${paramIndex})
      )`;
      queryParams.push(search);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Execute queries
    const [programsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const programs = programsResult.rows.map(mapDbRowToProgram);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      programs,
      total,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    console.error("Error finding programs:", error);
    throw new Error("Failed to fetch programs");
  }
};

// Find programs by tag
export const findProgramsByTag = async (tag: string): Promise<Program[]> => {
  try {
    const result = await pool.query(
      `SELECT * FROM programs WHERE $1 = ANY(tags) ORDER BY created_at DESC`,
      [tag]
    );
    
    return result.rows.map(mapDbRowToProgram);
  } catch (error) {
    console.error("Error finding programs by tag:", error);
    throw new Error("Failed to find programs by tag");
  }
};

// Update program by ID
export const updateProgram = async (id: number, updates: UpdateProgramRequest): Promise<Program | null> => {
  try {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'stats') {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      throw new Error("No valid fields to update");
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE programs 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    return result.rows[0] ? mapDbRowToProgram(result.rows[0]) : null;
  } catch (error) {
    console.error("Error updating program:", error);
    throw new Error("Failed to update program");
  }
};

// Delete program by ID
export const deleteProgram = async (id: number): Promise<boolean> => {
  try {
    const result = await pool.query(
      `DELETE FROM programs WHERE id = $1 RETURNING id`,
      [id]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error deleting program:", error);
    throw new Error("Failed to delete program");
  }
};

// Add feature to program
export const addFeatureToProgram = async (id: number, feature: string): Promise<Program | null> => {
  try {
    const result = await pool.query(
      `UPDATE programs 
       SET features = array_append(features, $1), updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [feature, id]
    );
    
    return result.rows[0] ? mapDbRowToProgram(result.rows[0]) : null;
  } catch (error) {
    console.error("Error adding feature to program:", error);
    throw new Error("Failed to add feature");
  }
};

// Remove feature from program
export const removeFeatureFromProgram = async (id: number, feature: string): Promise<Program | null> => {
  try {
    const result = await pool.query(
      `UPDATE programs 
       SET features = array_remove(features, $1), updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [feature, id]
    );
    
    return result.rows[0] ? mapDbRowToProgram(result.rows[0]) : null;
  } catch (error) {
    console.error("Error removing feature from program:", error);
    throw new Error("Failed to remove feature");
  }
};

// Get program statistics summary
export const getProgramStatsSummary = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_programs,
        array_agg(DISTINCT unnest(tags)) as all_tags,
        AVG(array_length(features, 1)) as avg_features_count,
        COUNT(DISTINCT stats->>'duration') as unique_durations
      FROM programs
    `);
    
    return result.rows[0];
  } catch (error) {
    console.error("Error getting program stats summary:", error);
    throw new Error("Failed to get program statistics");
  }
};

// Helper function to map database row to Program interface
const mapDbRowToProgram = (row: any): Program => ({
  id: row.id,
  title: row.title,
  description: row.description,
  image: row.image,
  details: row.details,
  stats: typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats,
  features: row.features,
  why_choose: row.why_choose,
  tags: row.tags,
  created_at: row.created_at,
  updated_at: row.updated_at
});