-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- 2. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS by running as the creator (postgres)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 3. Re-create the Users policy using the function
-- This avoids recursion because the function bypasses the RLS check on 'users'
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  public.is_admin()
);

-- 4. Update other policies to use this function as well (Cleaner & Safer)
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes" ON classes FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage semesters" ON semesters;
CREATE POLICY "Admins can manage semesters" ON semesters FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage enrollments" ON class_enrollments;
CREATE POLICY "Admins can manage enrollments" ON class_enrollments FOR ALL TO authenticated USING (public.is_admin());
