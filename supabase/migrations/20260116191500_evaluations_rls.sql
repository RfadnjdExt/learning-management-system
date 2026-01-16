
-- Allow Evaluators (Gurus) to view the evaluations they created
CREATE POLICY "Evaluators can view their own evaluations"
ON evaluations
FOR SELECT
TO authenticated
USING (evaluator_id = auth.uid());

-- Allow Students to view their own evaluations
CREATE POLICY "Students can view their own evaluations"
ON evaluations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
