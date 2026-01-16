
-- 1. Allow Gurus to view enrollments for classes they teach
-- This enables querying 'class_enrollments' where the class belongs to the logged-in Guru.
CREATE POLICY "Guru can view enrollments"
ON class_enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_enrollments.class_id
    AND classes.guru_id = auth.uid()
  )
);

-- 2. Allow Gurus to view Basic Info (name, etc) of Students in their classes
-- This enables querying 'users' (students) if they are enrolled in a class taught by the logged-in Guru.
CREATE POLICY "Guru can view students in their classes"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.user_id = users.id
    AND c.guru_id = auth.uid()
  )
);
