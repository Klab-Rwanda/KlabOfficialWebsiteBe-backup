-- Create programs table to support the Test array structure
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(500),
    details TEXT,
    -- Stats as JSON object
    stats JSONB,
    -- Features as array of text
    features TEXT[],
    why_choose TEXT,
    -- Tags as array of text
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the stats JSONB column for better query performance
CREATE INDEX idx_programs_stats ON programs USING GIN (stats);

-- Create an index on tags array for better search performance
CREATE INDEX idx_programs_tags ON programs USING GIN (tags);

-- Create an index on features array for better search performance
CREATE INDEX idx_programs_features ON programs USING GIN (features);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_programs_updated_at 
    BEFORE UPDATE ON programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert the sample data from your Test array
INSERT INTO programs (id, title, description, image, details, stats, features, why_choose, tags) VALUES
(1, 
 'TechUpSkill Program', 
 'A comprehensive program designed to enhance your technical skills and prepare you for the job market.',
 'https://assets.aceternity.com/demos/algochurn.webp',
 'This program includes hands-on training, mentorship, and access to industry experts. Participants will work on real-world projects and gain valuable insights into the tech industry.',
 '{"duration": "6 months", "graduates": "163 talent", "period": "2023-2024"}',
 ARRAY[
   'Hands-on technical training',
   'Mentorship from industry experts',
   'Access to real-world projects',
   'Networking opportunities with tech professionals',
   'Job placement assistance',
   'Certification upon completion'
 ],
 'This program is designed to equip participants with the skills needed to excel in the tech industry. It focuses on practical experience and real-world applications, ensuring that graduates are job-ready.',
 ARRAY['Tech', 'Skills', 'Training', 'Mentorship', 'Job Placement']
),

(2,
 'Future Koders',
 'An innovative program aimed at nurturing the next generation of coders and tech enthusiasts.',
 'https://assets.aceternity.com/demos/tailwindmasterkit.webp',
 'Future Koders focuses on teaching coding fundamentals, problem-solving skills, and creative thinking. Participants will engage in interactive coding challenges and collaborative projects.',
 '{"duration": "3 months", "graduates": "200+ young coders", "period": "2023-2024"}',
 ARRAY[
   'Interactive coding lessons',
   'Problem-solving challenges',
   'Collaborative projects',
   'Access to coding resources',
   'Community support and networking',
   'Certification upon completion'
 ],
 'This program is perfect for young learners who want to explore the world of coding. It fosters creativity and critical thinking while providing a solid foundation in programming.',
 ARRAY['Coding', 'Youth', 'Education', 'Innovation', 'Community']
),

(3,
 'Refugee Empowerment Program',
 'A program dedicated to empowering refugees through education and skill development.',
 'https://assets.aceternity.com/demos/algochurn.webp',
 'This program offers language training, vocational skills development, and cultural integration support for refugees. It aims to help them rebuild their lives and integrate into the community.',
 '{"duration": "6 months", "graduates": "150+ refugees", "period": "2023-2024"}',
 ARRAY[
   'Language training',
   'Vocational skills development',
   'Cultural integration support',
   'Access to community resources',
   'Job placement assistance',
   'Certification upon completion'
 ],
 'This program is designed to provide refugees with the tools they need to succeed in their new environment. It focuses on practical skills and community support to facilitate their integration.',
 ARRAY['Refugees', 'Empowerment', 'Education', 'Community Support']
),

(4,
 'Entrepreneur and Innovator Program',
 'A program designed to foster entrepreneurship and innovation among aspiring business leaders.',
 'https://assets.aceternity.com/demos/algochurn.webp',
 'Participants will learn about business development, innovation strategies, and leadership skills. The program includes mentorship from successful entrepreneurs and access to funding opportunities.',
 '{"duration": "6 months", "graduates": "100+ entrepreneurs", "period": "2023-2024"}',
 ARRAY[
   'Business development training',
   'Innovation strategies',
   'Leadership skills development',
   'Mentorship from successful entrepreneurs',
   'Access to funding opportunities',
   'Certification upon completion'
 ],
 'This program is ideal for individuals looking to start their own businesses or innovate within existing organizations. It provides the knowledge and resources needed to succeed in the entrepreneurial landscape.',
 ARRAY['Entrepreneurship', 'Innovation', 'Business Development', 'Leadership']
);

-- Example queries to work with the data:

-- 1. Get all programs
SELECT * FROM programs;

-- 2. Get programs with specific tags
SELECT * FROM programs WHERE 'Tech' = ANY(tags);

-- 3. Get programs by duration (using JSONB)
SELECT * FROM programs WHERE stats->>'duration' = '6 months';

-- 4. Search for programs with specific features
SELECT * FROM programs WHERE 'Mentorship from industry experts' = ANY(features);

-- 5. Get programs with full-text search in title or description
SELECT * FROM programs 
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'coding');

-- 6. Update a program's stats
UPDATE programs 
SET stats = jsonb_set(stats, '{graduates}', '"200 talent"')
WHERE id = 1;

-- 7. Add a new feature to a program
UPDATE programs 
SET features = array_append(features, 'New feature')
WHERE id = 1;

-- 8. Get stats summary
SELECT 
    COUNT(*) as total_programs,
    array_agg(DISTINCT unnest(tags)) as all_tags,
    AVG(array_length(features, 1)) as avg_features_count
FROM programs;