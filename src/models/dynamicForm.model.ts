// src/models/dynamicForm.model.ts

import { Pool } from 'pg';
import pool from '../config/db.config';
import { 
  CreateDynamicFormRequest, 
  UpdateDynamicFormRequest, 
  DynamicForm, 
  FormField, 
  FormFieldOption,
  FormStatus,
  GetDynamicFormsQuery
} from '../types/dynamicForm.types';
import { ApiError } from '../utils/ApiError';

export class DynamicFormModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Create a new dynamic form with fields and options
   */
  async createDynamicForm(data: CreateDynamicFormRequest, createdBy: string): Promise<DynamicForm> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if program exists
      const programCheck = await client.query(
        'SELECT id FROM programs WHERE id = $1',
        [data.program_id]
      );

      if (programCheck.rows.length === 0) {
        throw new ApiError(404, 'Program not found');
      }

      // Note: Multiple published forms are now allowed per program

      // Create the form
      const formResult = await client.query(
        `INSERT INTO dynamic_forms (program_id, title, description, status, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.program_id, data.title, data.description, data.status || FormStatus.DRAFT, createdBy]
      );

      const form = formResult.rows[0];
      const fields: FormField[] = [];

      // Create fields
      for (let i = 0; i < data.fields.length; i++) {
        const fieldData = data.fields[i];
        
        const fieldResult = await client.query(
          `INSERT INTO form_fields (form_id, name, label, type, required, placeholder, description, field_order, validation_rules)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            form.id,
            fieldData.name,
            fieldData.label,
            fieldData.type,
            fieldData.required,
            fieldData.placeholder,
            fieldData.description,
            fieldData.order,
            JSON.stringify(fieldData.validation)
          ]
        );

        const field = fieldResult.rows[0];
        const options: FormFieldOption[] = [];

        // Create field options if they exist
        if (fieldData.options && fieldData.options.length > 0) {
          for (let j = 0; j < fieldData.options.length; j++) {
            const optionData = fieldData.options[j];
            
            const optionResult = await client.query(
              `INSERT INTO form_field_options (field_id, value, label, option_order)
               VALUES ($1, $2, $3, $4)
               RETURNING *`,
              [field.id, optionData.value, optionData.label, j + 1]
            );

            options.push({
              value: optionResult.rows[0].value,
              label: optionResult.rows[0].label
            });
          }
        }

        fields.push({
          id: field.id,
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          description: field.description,
          options: options,
          validation: field.validation_rules,
          order: field.field_order
        });
      }

      await client.query('COMMIT');

      return {
        id: form.id,
        program_id: form.program_id,
        title: form.title,
        description: form.description,
        fields: fields,
        status: form.status,
        created_at: form.created_at,
        updated_at: form.updated_at,
        created_by: form.created_by,
        version: form.version
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all dynamic forms with optional filters
   */
  async getDynamicForms(query: GetDynamicFormsQuery = {}): Promise<{ forms: DynamicForm[], total: number }> {
    const { 
      program_id, 
      status, 
      page = 1, 
      limit = 10, 
      search 
    } = query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (program_id) {
      whereClause += ` AND df.program_id = $${paramIndex}`;
      queryParams.push(program_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND df.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (df.title ILIKE $${paramIndex} OR df.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM dynamic_forms df ${whereClause}`,
      queryParams
    );

    // Get forms with program details
    const formsResult = await this.pool.query(
      `SELECT 
         df.*,
         p.title as program_title
       FROM dynamic_forms df
       LEFT JOIN programs p ON df.program_id = p.id
       ${whereClause}
       ORDER BY df.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    const forms: DynamicForm[] = [];

    for (const formRow of formsResult.rows) {
      const fields = await this.getFormFields(formRow.id);
      
      forms.push({
        id: formRow.id,
        program_id: formRow.program_id,
        title: formRow.title,
        description: formRow.description,
        fields: fields,
        status: formRow.status,
        created_at: formRow.created_at,
        updated_at: formRow.updated_at,
        created_by: formRow.created_by,
        version: formRow.version
      });
    }

    return {
      forms,
      total: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Get a single dynamic form by ID
   */
  async getDynamicFormById(id: number): Promise<DynamicForm | null> {
    const formResult = await this.pool.query(
      `SELECT 
         df.*,
         p.title as program_title
       FROM dynamic_forms df
       LEFT JOIN programs p ON df.program_id = p.id
       WHERE df.id = $1`,
      [id]
    );

    if (formResult.rows.length === 0) {
      return null;
    }

    const formRow = formResult.rows[0];
    const fields = await this.getFormFields(id);

    return {
      id: formRow.id,
      program_id: formRow.program_id,
      title: formRow.title,
      description: formRow.description,
      fields: fields,
      status: formRow.status,
      created_at: formRow.created_at,
      updated_at: formRow.updated_at,
      created_by: formRow.created_by,
      version: formRow.version
    };
  }

  /**
   * Get published form by program ID
   */
  async getPublishedFormByProgramId(programId: number): Promise<DynamicForm | null> {
    const formResult = await this.pool.query(
      `SELECT 
         df.*,
         p.title as program_title
       FROM dynamic_forms df
       LEFT JOIN programs p ON df.program_id = p.id
       WHERE df.program_id = $1 AND df.status = $2
       ORDER BY df.updated_at DESC
       LIMIT 1`,
      [programId, FormStatus.PUBLISHED]
    );

    if (formResult.rows.length === 0) {
      return null;
    }

    const formRow = formResult.rows[0];
    const fields = await this.getFormFields(formRow.id);

    return {
      id: formRow.id,
      program_id: formRow.program_id,
      title: formRow.title,
      description: formRow.description,
      fields: fields,
      status: formRow.status,
      created_at: formRow.created_at,
      updated_at: formRow.updated_at,
      created_by: formRow.created_by,
      version: formRow.version
    };
  }

  /**
   * Get all published forms for a program
   */
  async getAllPublishedFormsByProgramId(programId: number): Promise<DynamicForm[]> {
    const formResult = await this.pool.query(
      `SELECT 
         df.*,
         p.title as program_title
       FROM dynamic_forms df
       LEFT JOIN programs p ON df.program_id = p.id
       WHERE df.program_id = $1 AND df.status = $2
       ORDER BY df.updated_at DESC`,
      [programId, FormStatus.PUBLISHED]
    );

    const forms: DynamicForm[] = [];

    for (const formRow of formResult.rows) {
      const fields = await this.getFormFields(formRow.id);
      
      forms.push({
        id: formRow.id,
        program_id: formRow.program_id,
        title: formRow.title,
        description: formRow.description,
        fields: fields,
        status: formRow.status,
        created_at: formRow.created_at,
        updated_at: formRow.updated_at,
        created_by: formRow.created_by,
        version: formRow.version
      });
    }

    return forms;
  }

  /**
   * Update a dynamic form
   */
  async updateDynamicForm(id: number, data: UpdateDynamicFormRequest): Promise<DynamicForm | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if form exists
      const existingForm = await client.query(
        'SELECT * FROM dynamic_forms WHERE id = $1',
        [id]
      );

      if (existingForm.rows.length === 0) {
        return null;
      }

      const form = existingForm.rows[0];

      // Note: Multiple published forms are now allowed per program

      // Update form basic info
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.program_id !== undefined) {
        updateFields.push(`program_id = $${paramIndex}`);
        updateValues.push(data.program_id);
        paramIndex++;
      }

      if (data.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(data.title);
        paramIndex++;
      }

      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(data.description);
        paramIndex++;
      }

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(data.status);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await client.query(
          `UPDATE dynamic_forms SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      // Update fields if provided
      if (data.fields) {
        // Delete existing fields and options
        await client.query('DELETE FROM form_fields WHERE form_id = $1', [id]);

        // Create new fields
        for (let i = 0; i < data.fields.length; i++) {
          const fieldData = data.fields[i];
          
          const fieldResult = await client.query(
            `INSERT INTO form_fields (form_id, name, label, type, required, placeholder, description, field_order, validation_rules)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
              id,
              fieldData.name,
              fieldData.label,
              fieldData.type,
              fieldData.required,
              fieldData.placeholder,
              fieldData.description,
              fieldData.order,
              JSON.stringify(fieldData.validation)
            ]
          );

          const field = fieldResult.rows[0];

          // Create field options if they exist
          if (fieldData.options && fieldData.options.length > 0) {
            for (let j = 0; j < fieldData.options.length; j++) {
              const optionData = fieldData.options[j];
              
              await client.query(
                `INSERT INTO form_field_options (field_id, value, label, option_order)
                 VALUES ($1, $2, $3, $4)`,
                [field.id, optionData.value, optionData.label, j + 1]
              );
            }
          }
        }
      }

      await client.query('COMMIT');

      // Return updated form
      return await this.getDynamicFormById(id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a dynamic form
   */
  async deleteDynamicForm(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM dynamic_forms WHERE id = $1',
      [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get form fields with options
   */
  private async getFormFields(formId: number): Promise<FormField[]> {
    const fieldsResult = await this.pool.query(
      `SELECT * FROM form_fields 
       WHERE form_id = $1 
       ORDER BY field_order ASC`,
      [formId]
    );

    const fields: FormField[] = [];

    for (const fieldRow of fieldsResult.rows) {
      const optionsResult = await this.pool.query(
        `SELECT value, label FROM form_field_options 
         WHERE field_id = $1 
         ORDER BY option_order ASC`,
        [fieldRow.id]
      );

      const options: FormFieldOption[] = optionsResult.rows.map(row => ({
        value: row.value,
        label: row.label
      }));

      fields.push({
        id: fieldRow.id,
        name: fieldRow.name,
        label: fieldRow.label,
        type: fieldRow.type,
        required: fieldRow.required,
        placeholder: fieldRow.placeholder,
        description: fieldRow.description,
        options: options,
        validation: fieldRow.validation_rules,
        order: fieldRow.field_order
      });
    }

    return fields;
  }
}

export default new DynamicFormModel();