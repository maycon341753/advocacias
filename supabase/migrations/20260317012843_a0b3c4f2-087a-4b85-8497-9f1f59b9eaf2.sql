
-- Fix permissive INSERT policy on activity_logs
DROP POLICY "Authenticated insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated insert own logs" ON public.activity_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = auth.uid() AND 
    (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id(auth.uid()))
  );
