
-- Enable RLS
ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates of their institution
CREATE POLICY "Users can view templates of their institution"
ON evaluation_templates FOR SELECT
TO authenticated
USING (
  institution_id IN (
    SELECT institution_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Optional: Allow reading templates with NULL institution_id (global templates)
CREATE POLICY "Users can view global templates"
ON evaluation_templates FOR SELECT
TO authenticated
USING (
  institution_id IS NULL
);
