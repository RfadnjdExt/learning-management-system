-- FIX INFINITE RECURSION IN RLS POLICIES
-- The previous policies directly queried the 'users' table within the 'users' policy, creating a loop.
-- This script replaces them with a SECURITY DEFINER function pattern.

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to run with the privileges of the creator
-- preventing the infinite recursion loop in RLS
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

-- 2. Drop the problematic recursive policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage semesters" ON semesters;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Admins can manage evaluation templates" ON evaluation_templates;
DROP POLICY IF EXISTS "Admins can manage evaluations" ON evaluations;

-- 3. Re-create policies using the secure function
-- USERS
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated USING (public.is_admin());

-- CLASSES
CREATE POLICY "Admins can manage classes" ON classes FOR ALL TO authenticated USING (public.is_admin());

-- SEMESTERS
CREATE POLICY "Admins can manage semesters" ON semesters FOR ALL TO authenticated USING (public.is_admin());

-- SUBJECTS
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL TO authenticated USING (public.is_admin());

-- ENROLLMENTS
CREATE POLICY "Admins can manage enrollments" ON class_enrollments FOR ALL TO authenticated USING (public.is_admin());

-- TEMPLATES
CREATE POLICY "Admins can manage evaluation templates" ON evaluation_templates FOR ALL TO authenticated USING (public.is_admin());

-- EVALUATIONS
CREATE POLICY "Admins can manage evaluations" ON evaluations FOR ALL TO authenticated USING (public.is_admin());

-- 4. Also Ensure GURU policies are safe (Example)
-- If there are Guru policies referencing users, consider creating is_guru() function too if needed.
-- For now, the Admin recursion is the primary blocker.
