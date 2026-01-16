-- Allow Gurus to MANAGE their own sessions
-- (Create, Update, Delete)

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Gurus can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Gurus can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Gurus can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Gurus can view own sessions" ON sessions;

-- 2. Create Policies

CREATE POLICY "Gurus can insert own sessions" 
ON sessions FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = guru_id 
);

CREATE POLICY "Gurus can update own sessions" 
ON sessions FOR UPDATE
TO authenticated 
USING (
  auth.uid() = guru_id
)
WITH CHECK (
  auth.uid() = guru_id
);

CREATE POLICY "Gurus can delete own sessions" 
ON sessions FOR DELETE
TO authenticated 
USING (
  auth.uid() = guru_id
);

CREATE POLICY "Gurus can view own sessions"
ON sessions FOR SELECT
TO authenticated
USING (
  auth.uid() = guru_id
);
