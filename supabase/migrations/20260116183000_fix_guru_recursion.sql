
-- 1. DROP the problematic policies first (Clean up)
DROP POLICY IF EXISTS "Guru can view enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Guru can view students in their classes" ON users;

-- 2. Create a SECURITY DEFINER function to safely check enrollment
-- This function runs with Admin privileges (Bypassing RLS), breaking the recursion loop.
CREATE OR REPLACE FUNCTION public.is_student_in_guru_class(student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.user_id = student_id
    AND c.guru_id = auth.uid()
  );
END;
$$;

-- 3. Re-create the policies using the safe function

-- Policy for Users (Students)
CREATE POLICY "Guru can view their students"
ON users FOR SELECT TO authenticated
USING (
  public.is_student_in_guru_class(id) -- Uses the secure function
);

-- Policy for Class Enrollments
-- We can check directly here because this table is lower in the hierarchy, 
-- but using the same pattern is safer if 'classes' has complex RLS.
CREATE POLICY "Guru can view enrollments"
ON class_enrollments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_enrollments.class_id
    AND classes.guru_id = auth.uid()
  )
);
