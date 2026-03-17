import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<string, string> = {
  platform_admin: "Admin Plataforma",
  office_admin: "Admin Escritório",
  lawyer: "Advogado",
  assistant: "Assistente",
};

const UsuariosPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, isOfficeAdmin, isPlatformAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "assistant" as Database["public"]["Enums"]["app_role"],
  });
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRole, setEditRole] = useState<Database["public"]["Enums"]["app_role"]>("assistant");
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; email: string; full_name: string; role: string } | null>(null);
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const rolesByUserId = (rolesRes.data ?? []).reduce<Record<string, UserRoleRow["role"][]>>((acc, r) => {
        acc[r.user_id] = acc[r.user_id] ?? [];
        acc[r.user_id].push(r.role);
        return acc;
      }, {});

      const rolePriority: UserRoleRow["role"][] = ["platform_admin", "office_admin", "lawyer", "assistant"];

      return (profilesRes.data ?? []).map((p) => {
        const roles = rolesByUserId[p.user_id] ?? [];
        const primaryRole = rolePriority.find((r) => roles.includes(r)) ?? roles[0] ?? "assistant";
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          role: primaryRole,
        };
      }) as { user_id: string; full_name: ProfileRow["full_name"]; email: ProfileRow["email"]; role: UserRoleRow["role"] }[];
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Selecione um usuário.");
      if (!isOfficeAdmin && !isPlatformAdmin) throw new Error("Sem permissão para alterar função.");
      if (selectedUser.user_id === profile?.user_id) throw new Error("Você não pode alterar sua própria função aqui.");

      const { data: existingRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", selectedUser.user_id);
      if (rolesError) throw rolesError;

      const hasPlatformAdmin = (existingRoles ?? []).some((r) => r.role === "platform_admin");
      if (hasPlatformAdmin) throw new Error("Função de Admin Plataforma só pode ser alterada manualmente.");
      if (editRole === "platform_admin") throw new Error("Função de Admin Plataforma deve ser definida manualmente.");

      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from("user_roles").insert({ user_id: selectedUser.user_id, role: editRole });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditRoleOpen(false);
      setSelectedUser(null);
      toast({ title: "Função atualizada!", description: "A função do usuário foi atualizada." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao atualizar função.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Link enviado!", description: "Enviamos um link de redefinição de senha para o e-mail." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao enviar link.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!isOfficeAdmin && !isPlatformAdmin) throw new Error("Sem permissão para criar usuários.");
      const tenantId = profile?.tenant_id;
      if (!tenantId) throw new Error("Seu usuário não está vinculado a um escritório (tenant).");

      const email = form.email.trim().toLowerCase();
      const password = form.password;
      const fullName = form.full_name.trim();
      if (!email || !password || !fullName) throw new Error("Preencha nome, e-mail e senha.");
      if (password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres.");
      if (form.role === "platform_admin") throw new Error("Role de Admin Plataforma deve ser definida manualmente.");

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

      const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError || !signUpData.user) throw signUpError ?? new Error("Erro ao criar usuário.");
      if (!signUpData.session) throw new Error("Não foi possível autenticar o novo usuário automaticamente.");

      const newUserId = signUpData.user.id;

      const { error: profileError } = await ephemeral
        .from("profiles")
        .update({ tenant_id: tenantId, full_name: fullName })
        .eq("user_id", newUserId);
      if (profileError) throw profileError;

      const { error: roleError } = await ephemeral
        .from("user_roles")
        .insert({ user_id: newUserId, role: form.role });
      if (roleError) throw roleError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", role: "assistant" });
      toast({ title: "Usuário criado!", description: "O usuário foi cadastrado com sucesso." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao criar usuário.";
      toast({ title: "Erro ao criar usuário", description: message, variant: "destructive" });
    },
  });

  return (
    <AppLayout title="Usuários" subtitle="Gerencie a equipe do escritório">
      <DataTableCard
        title={`${users.length} usuários`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto" disabled={!isOfficeAdmin && !isPlatformAdmin}>
                <Plus className="w-4 h-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createUserMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as Database["public"]["Enums"]["app_role"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assistant">Assistente</SelectItem>
                      <SelectItem value="lawyer">Advogado</SelectItem>
                      <SelectItem value="office_admin">Admin Escritório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar Função</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                changeRoleMutation.mutate();
              }}
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{selectedUser?.full_name ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{selectedUser?.email ?? "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={editRole} onValueChange={(value) => setEditRole(value as Database["public"]["Enums"]["app_role"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assistant">Assistente</SelectItem>
                    <SelectItem value="lawyer">Advogado</SelectItem>
                    <SelectItem value="office_admin">Admin Escritório</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={changeRoleMutation.isPending}>
                {changeRoleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {users.map((user) => (
                <div key={user.user_id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={(!isOfficeAdmin && !isPlatformAdmin) || user.role === "platform_admin"}
                          onSelect={() => {
                            setSelectedUser(user);
                            setEditRole(user.role);
                            setEditRoleOpen(true);
                          }}
                        >
                          Alterar função
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!user.email || resetPasswordMutation.isPending}
                          onSelect={() => resetPasswordMutation.mutate(user.email)}
                        >
                          Enviar link de redefinição de senha
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {roleLabels[user.role] ?? user.role}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[10px]", "bg-success/10 text-success border-success/20")}>
                      Ativo
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Email</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Função</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium text-foreground">{user.full_name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className={cn("text-[10px]", "bg-success/10 text-success border-success/20")}>
                          Ativo
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={(!isOfficeAdmin && !isPlatformAdmin) || user.role === "platform_admin"}
                              onSelect={() => {
                                setSelectedUser(user);
                                setEditRole(user.role);
                                setEditRoleOpen(true);
                              }}
                            >
                              Alterar função
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={!user.email || resetPasswordMutation.isPending}
                              onSelect={() => resetPasswordMutation.mutate(user.email)}
                            >
                              Enviar link de redefinição de senha
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DataTableCard>
    </AppLayout>
  );
};

export default UsuariosPage;
