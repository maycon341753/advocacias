import { AppLayout } from "@/components/AppLayout";
import { StatCard, DataTableCard } from "@/components/DashboardCards";
import { Building2, Users, DollarSign, Briefcase, MoreHorizontal, Eye, Pause, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  trial: "bg-info/10 text-info border-info/20",
  suspended: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  trial: "Trial",
  suspended: "Suspenso",
  cancelled: "Cancelado",
};

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan_id: "", owner_name: "", owner_email: "", owner_password: "" });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "delete";
    tenant: TenantRow;
  } | null>(null);
  type TenantRow = Database["public"]["Tables"]["tenants"]["Row"] & { plans: Pick<Database["public"]["Tables"]["plans"]["Row"], "name"> | null };
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"] & {
    plans: Pick<Database["public"]["Tables"]["plans"]["Row"], "price_monthly"> | null;
  };
  type PlanRow = Database["public"]["Tables"]["plans"]["Row"];

  const { data: tenants = [] } = useQuery<TenantRow[]>({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*, plans(name)");
      if (error) throw error;
      return (data ?? []) as TenantRow[];
    },
  });

  const { data: plans = [] } = useQuery<PlanRow[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("price_monthly");
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });

  const { data: profiles = [] } = useQuery<ProfileRow[]>({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id");
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const { data: subscriptions = [] } = useQuery<SubscriptionRow[]>({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*, plans(price_monthly)");
      if (error) throw error;
      return (data ?? []) as SubscriptionRow[];
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async () => {
      const rawSlug = (form.slug || form.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      if (!form.name.trim()) throw new Error("Informe o nome do escritório.");
      if (!form.plan_id) throw new Error("Selecione um plano.");
      if (!form.owner_name.trim()) throw new Error("Informe o nome do usuário do escritório.");
      if (!form.owner_email.trim()) throw new Error("Informe o e-mail do usuário do escritório.");
      if (!form.owner_password) throw new Error("Informe a senha do usuário do escritório.");
      if (form.owner_password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres.");

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: form.name.trim(),
          slug: `${rawSlug}-${Date.now()}`,
          plan_id: form.plan_id,
          status: "trial",
        })
        .select()
        .single();
      if (tenantError || !tenant) throw tenantError ?? new Error("Erro ao criar escritório.");

      const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (!url || !anonKey) throw new Error("Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).");

      const memoryStorage = {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      };

      const ephemeral = createClient<Database>(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storage: memoryStorage,
        },
      });

      const ownerEmail = form.owner_email.trim().toLowerCase();
      const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({
        email: ownerEmail,
        password: form.owner_password,
        options: { data: { full_name: form.owner_name.trim() } },
      });
      if (signUpError || !signUpData.user) throw signUpError ?? new Error("Erro ao criar usuário do escritório.");
      if (!signUpData.session) throw new Error("Não foi possível autenticar o novo usuário automaticamente.");

      const ownerUserId = signUpData.user.id;

      const { error: ownerError } = await supabase.from("tenants").update({ owner_id: ownerUserId }).eq("id", tenant.id);
      if (ownerError) throw ownerError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ tenant_id: tenant.id, full_name: form.owner_name.trim(), email: ownerEmail })
        .eq("user_id", ownerUserId);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: ownerUserId, role: "office_admin" });
      if (roleError) throw roleError;

      const { error: subError } = await supabase.from("subscriptions").insert({
        tenant_id: tenant.id,
        plan_id: form.plan_id,
        status: "trial",
      });
      if (subError) throw subError;

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: ownerEmail, password: form.owner_password });
      if (signInError) throw signInError;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
      ]);
      setOpen(false);
      setForm({ name: "", slug: "", plan_id: "", owner_name: "", owner_email: "", owner_password: "" });
      toast({ title: "Escritório criado!", description: "O escritório foi criado com sucesso." });
      navigate("/");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro ao criar escritório.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const suspendTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase.from("tenants").update({ status: "suspended" }).eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast({ title: "Escritório suspenso!", description: "O escritório foi marcado como suspenso." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro ao suspender escritório.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
      ]);
      toast({ title: "Escritório excluído!", description: "O escritório foi removido." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro ao excluir escritório.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.plans?.price_monthly ?? 0), 0);

  return (
    <AppLayout title="Painel Administrativo" subtitle="Gestão da plataforma JurisControl">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" ? "Excluir escritório?" : "Suspender escritório?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? `Esta ação remove o escritório "${confirmAction?.tenant.name ?? ""}" e pode apagar dados relacionados.`
                : `O escritório "${confirmAction?.tenant.name ?? ""}" ficará suspenso.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmOpen(false);
                setConfirmAction(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "delete") deleteTenantMutation.mutate(confirmAction.tenant.id);
                if (confirmAction.type === "suspend") suspendTenantMutation.mutate(confirmAction.tenant.id);
                setConfirmOpen(false);
                setConfirmAction(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Escritório</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{selectedTenant?.name ?? "-"}</p>
              <p className="text-xs text-muted-foreground">{selectedTenant?.slug ?? "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Plano</p>
                <p className="text-foreground">{selectedTenant?.plans?.name ?? "Sem plano"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-foreground">{statusLabels[selectedTenant?.status ?? "trial"] ?? selectedTenant?.status ?? "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="text-foreground">{selectedTenant?.created_at?.slice(0, 10) ?? "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Owner ID</p>
                <p className="text-foreground">{selectedTenant?.owner_id ? selectedTenant.owner_id.slice(0, 8) : "-"}</p>
              </div>
            </div>
            <Button onClick={() => setDetailsOpen(false)} className="w-full" variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/escritorios">Escritórios</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/planos">Planos</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/usuarios">Usuários</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Escritórios" value={tenants.length} icon={Building2} change="Total cadastrados" changeType="neutral" />
        <StatCard title="Usuários Ativos" value={profiles.length} icon={Users} change="Em toda plataforma" changeType="neutral" />
        <StatCard title="Receita Mensal" value={`R$ ${totalRevenue.toLocaleString("pt-BR")}`} icon={DollarSign} change="Assinaturas ativas" changeType="positive" />
        <StatCard title="Assinaturas" value={subscriptions.length} icon={Briefcase} change="Planos contratados" changeType="neutral" />
      </div>

      <DataTableCard
        title="Escritórios Cadastrados"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Novo Escritório</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Escritório</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createTenantMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (opcional)</Label>
                  <Input
                    placeholder="silva-advogados"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.plan_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, plan_id: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Selecione um plano</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — R$ {p.price_monthly}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Usuário</Label>
                    <Input
                      value={form.owner_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, owner_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail do Usuário</Label>
                    <Input
                      type="email"
                      value={form.owner_email}
                      onChange={(e) => setForm((prev) => ({ ...prev, owner_email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha do Usuário</Label>
                    <Input
                      type="password"
                      value={form.owner_password}
                      onChange={(e) => setForm((prev) => ({ ...prev, owner_password: e.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createTenantMutation.isPending}>
                  {createTenantMutation.isPending ? "Criando..." : "Criar Escritório"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="space-y-2">
          {tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum escritório cadastrado ainda.</p>
          ) : (
            tenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.plans?.name || "Sem plano"} · {t.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", statusColors[t.status])}>
                    {statusLabels[t.status] || t.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSelectedTenant(t);
                            setDetailsOpen(true);
                          }}
                      >
                        <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                          disabled={t.status === "suspended" || suspendTenantMutation.isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            setConfirmAction({ type: "suspend", tenant: t });
                            setConfirmOpen(true);
                          }}
                      >
                        <Pause className="w-4 h-4 mr-2" /> Suspender
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                          className="text-destructive"
                          disabled={deleteTenantMutation.isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            setConfirmAction({ type: "delete", tenant: t });
                            setConfirmOpen(true);
                          }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </DataTableCard>
    </AppLayout>
  );
};

export default SuperAdminDashboard;
