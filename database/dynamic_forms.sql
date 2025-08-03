-- Create enum types
CREATE TYPE form_field_type AS ENUM (
    'text',
    'email', 
    'number',
    'textarea',
    'select',
    'radio',
    'checkbox',
    'file',
    'date',
    'phone',
    'url'
);

CREATE TYPE form_status AS ENUM (
    'draft',
    'published', 
    'archived'
);

-- Dynamic Forms Table
CREATE TABLE dynamic_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status form_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL, -- Should reference users table when implemented
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT unique_published_form_per_program 
        EXCLUDE (program_id WITH =) WHERE (status = 'published')
);

-- Form Fields Table
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type form_field_type NOT NULL,
    required BOOLEAN DEFAULT false,
    placeholder TEXT,
    description TEXT,
    field_order INTEGER NOT NULL,
    validation_rules JSONB, -- Store validation rules as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_field_name_per_form UNIQUE (form_id, name),
    CONSTRAINT unique_field_order_per_form UNIQUE (form_id, field_order),
    CONSTRAINT valid_field_order CHECK (field_order > 0)
);

-- Form Field Options Table (for select, radio, checkbox fields)
CREATE TABLE form_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    option_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_option_value_per_field UNIQUE (field_id, value),
    CONSTRAINT unique_option_order_per_field UNIQUE (field_id, option_order),
    CONSTRAINT valid_option_order CHECK (option_order > 0)
);

-- Indexes for better performance
CREATE INDEX idx_dynamic_forms_program_id ON dynamic_forms(program_id);
CREATE INDEX idx_dynamic_forms_status ON dynamic_forms(status);
CREATE INDEX idx_dynamic_forms_created_by ON dynamic_forms(created_by);
CREATE INDEX idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX idx_form_fields_order ON form_fields(form_id, field_order);
CREATE INDEX idx_form_field_options_field_id ON form_field_options(field_id);
CREATE INDEX idx_form_field_options_order ON form_field_options(field_id, option_order);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dynamic_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dynamic_forms_updated_at
    BEFORE UPDATE ON dynamic_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_dynamic_forms_updated_at();

-- Sample data (optional)
INSERT INTO dynamic_forms (program_id, title, description, status, created_by) 
VALUES (
    (SELECT id FROM programs LIMIT 1), 
    'Software Development Program Application',
    'Please fill out this form to apply for our Software Development Program',
    'draft',
    gen_random_uuid()
) ON CONFLICT DO NOTHING;