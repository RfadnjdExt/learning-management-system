-- Enable Admin Write Access for Badges table

-- 1. DROP existing policy if it conflicts (optional, but good practice)
DROP POLICY IF EXISTS "Admins can manage badges" ON badges;

-- 2. Create Policy for Admins using the is_admin() function
CREATE POLICY "Admins can manage badges"
ON badges
FOR ALL
TO authenticated
USING (public.is_admin());

-- 3. Ensure user_badges is also manageable if needed (e.g. for manual awarding)
DROP POLICY IF EXISTS "Admins can manage user_badges" ON user_badges;

CREATE POLICY "Admins can manage user_badges"
ON user_badges
FOR ALL
TO authenticated
USING (public.is_admin());
