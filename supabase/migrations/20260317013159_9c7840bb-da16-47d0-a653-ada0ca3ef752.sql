
-- Allow authenticated users to create their own tenant (during registration)
CREATE POLICY "Users can create own tenant" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Allow authenticated users to assign themselves a role (during registration)
CREATE POLICY "Users can assign own role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to create subscription for their tenant
CREATE POLICY "Users can create own subscription" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
