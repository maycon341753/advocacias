import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentUI,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  "Em andamento": "bg-info/10 text-info border-info/20",
  "Aguardando audiência": "bg-warning/10 text-warning border-warning/20",
  "Encerrado": "bg-success/10 text-success border-success/20",
};

const ProcessosPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  type CaseListItem = Pick<
    CaseRow,
    "id" | "case_number" | "court" | "action_type" | "status" | "responsible_id" | "created_at"
  > & { client: { name: string } | null };
  const [selectedCase, setSelectedCase] = useState<CaseListItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    case_number: "",
    client_id: "" as string | "",
    court: "",
    action_type: "",
    status: "Em andamento",
    description: "",
  });
  type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
  type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, case_number, court, action_type, status, responsible_id, created_at, client:clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Pick<
        CaseRow,
        "id" | "case_number" | "court" | "action_type" | "status" | "responsible_id" | "created_at"
      > & { client: { name: string } | null })[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-minimal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as Pick<ClientRow, "id" | "name">[];
    },
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? cases.filter((c) => {
        const clientName = c.client?.name ?? "";
        const haystack = `${clientName} ${c.case_number}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : cases;

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      const tenantId = profile?.tenant_id;
      if (!tenantId) throw new Error("Você precisa estar em um escritório para cadastrar processos.");
      if (!user?.id) throw new Error("Usuário não autenticado.");
      if (!form.case_number.trim()) throw new Error("Informe o número do processo.");

      const payload: Database["public"]["Tables"]["cases"]["Insert"] = {
        tenant_id: tenantId,
        case_number: form.case_number.trim(),
        client_id: form.client_id ? form.client_id : null,
        court: form.court.trim() || null,
        action_type: form.action_type.trim() || null,
        status: form.status.trim(),
        description: form.description.trim() || null,
        responsible_id: user.id,
      };

      const { error } = await supabase.from("cases").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["cases-client-ids"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setOpen(false);
      setForm({ case_number: "", client_id: "", court: "", action_type: "", status: "Em andamento", description: "" });
      toast({ title: "Processo criado!", description: "O processo foi cadastrado com sucesso." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar processo.";
      toast({ title: "Erro ao cadastrar processo", description: message, variant: "destructive" });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const { error } = await supabase.from("cases").delete().eq("id", caseId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["cases-client-ids"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast({ title: "Processo excluído!", description: "O processo foi removido." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao excluir processo.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const markClosedMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const { error } = await supabase.from("cases").update({ status: "Encerrado" }).eq("id", caseId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast({ title: "Status atualizado!", description: "O processo foi marcado como encerrado." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao atualizar status.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  return (
    <AppLayout title="Processos" subtitle="Gerencie os processos do escritório">
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{selectedCase?.case_number ?? "-"}</p>
              <p className="text-xs text-muted-foreground">{selectedCase?.client?.name ?? "Sem cliente"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tribunal</p>
                <p className="text-foreground">{selectedCase?.court ?? "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-foreground">{selectedCase?.action_type ?? "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-foreground">{selectedCase?.status ?? "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="text-foreground">{selectedCase?.created_at?.slice(0, 10) ?? "-"}</p>
              </div>
            </div>
            <Button onClick={() => setDetailsOpen(false)} className="w-full" variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContentUI>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmOpen(false);
                setConfirmDeleteId(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDeleteId) return;
                deleteCaseMutation.mutate(confirmDeleteId);
                setConfirmOpen(false);
                setConfirmDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContentUI>
      </AlertDialog>

      <DataTableCard
        title={`${filtered.length} processos`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Processo</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createCaseMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Número do processo</Label>
                  <Input
                    value={form.case_number}
                    onChange={(e) => setForm((prev) => ({ ...prev, case_number: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.client_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, client_id: e.target.value }))}
                  >
                    <option value="">Sem cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tribunal</Label>
                    <Input value={form.court} onChange={(e) => setForm((prev) => ({ ...prev, court: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Input
                      value={form.action_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, action_type: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando audiência">Aguardando audiência</option>
                    <option value="Encerrado">Encerrado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createCaseMutation.isPending}>
                  {createCaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Processo
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou número..."
              className="pl-9 bg-muted/30 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground truncate">{c.case_number}</p>
                      <p className="text-sm font-medium text-foreground truncate">{c.client?.name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.court ?? "-"}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSelectedCase(c);
                            setDetailsOpen(true);
                          }}
                        >
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={c.status === "Encerrado" || markClosedMutation.isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            markClosedMutation.mutate(c.id);
                          }}
                        >
                          Marcar como encerrado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={deleteCaseMutation.isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            setConfirmDeleteId(c.id);
                            setConfirmOpen(true);
                          }}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Tipo: <span className="text-foreground">{c.action_type ?? "-"}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", statusColors[c.status] ?? "bg-muted text-muted-foreground")}>
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Número</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Tribunal</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Cliente</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Tipo</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Responsável</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-mono text-xs text-foreground">{c.case_number}</p>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs hidden md:table-cell">{c.court ?? "-"}</td>
                      <td className="py-3 px-2 font-medium text-foreground">{c.client?.name ?? "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{c.action_type ?? "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{c.responsible_id ? c.responsible_id.slice(0, 8) : "-"}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className={cn("text-[10px]", statusColors[c.status] ?? "bg-muted text-muted-foreground")}>
                          {c.status}
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
                              onSelect={(e) => {
                                e.preventDefault();
                                setSelectedCase(c);
                                setDetailsOpen(true);
                              }}
                            >
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={c.status === "Encerrado" || markClosedMutation.isPending}
                              onSelect={(e) => {
                                e.preventDefault();
                                markClosedMutation.mutate(c.id);
                              }}
                            >
                              Marcar como encerrado
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={deleteCaseMutation.isPending}
                              onSelect={(e) => {
                                e.preventDefault();
                                setConfirmDeleteId(c.id);
                                setConfirmOpen(true);
                              }}
                            >
                              Excluir
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

export default ProcessosPage;
