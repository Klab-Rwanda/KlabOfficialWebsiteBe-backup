  import pool from "../config/db.config";
  import { User } from "../types/users.types";

  export const createUser = async (user: User) => {
      const { full_name, email, password, role = 'user', is_active = true } = user;
      const result = await pool.query(
        `INSERT INTO users (full_name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, is_active`,
        [full_name, email, password, role, is_active]
      );
      return result.rows[0];
    };

  export const findUserByEmail = async (email: string) => {
      const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
      return result.rows[0];
  }

  export const updateUserPassword = async (userId: string, newHashedPassword: string): Promise<User> => {
    try {
        const result = await pool.query(
            `UPDATE users 
            SET password = $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING id, full_name, email, role, is_active`,
            [newHashedPassword, userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error("User not found");
        }
        
        return result.rows[0];
    } catch (error) {
        console.error("Error updating user password:", error);
        throw new Error("Failed to update password");
    }
  };

  export const findUserById = async (id: string): Promise<User | null> => {
    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error("Error finding user by ID:", error);
        throw new Error("Failed to find user");
    }
  }