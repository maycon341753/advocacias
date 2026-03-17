import { AppLayout } from "@/components/AppLayout";
import { StatCard, DataTableCard } from "@/components/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pago: { label: "Pago", color: "bg-success/10 text-success border-success/20" },
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/20" },
  atrasado: { label: "Atrasado", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const FinanceiroPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    status: "pendente",
    due_date: "",
    client_id: "" as string | "",
  });
  const [editForm, setEditForm] = useState({
    amountCents: 0,
    status: "pendente",
  });
  type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
  type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
  type PaymentListItem = Pick<
    PaymentRow,
    "id" | "description" | "amount" | "status" | "due_date" | "paid_at" | "created_at"
  > & { client: { name: string } | null };

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, description, amount, status, due_date, paid_at, created_at, client:clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentListItem[];
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

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const tenantId = profile?.tenant_id;
      if (!tenantId) throw new Error("Você precisa estar em um escritório para registrar pagamentos.");
      if (!form.description.trim()) throw new Error("Informe a descrição.");
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor válido.");

      const payload: Database["public"]["Tables"]["payments"]["Insert"] = {
        tenant_id: tenantId,
        client_id: form.client_id ? form.client_id : null,
        description: form.description.trim(),
        amount,
        status: form.status as Database["public"]["Tables"]["payments"]["Insert"]["status"],
        due_date: form.due_date || null,
      };

      const { error } = await supabase.from("payments").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setOpen(false);
      setForm({ description: "", amount: "", status: "pendente", due_date: "", client_id: "" });
      toast({ title: "Pagamento registrado!", description: "A movimentação foi cadastrada com sucesso." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao registrar pagamento.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!editingPaymentId) throw new Error("Pagamento não selecionado.");
      const amount = editForm.amountCents / 100;
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor válido.");
      const payload: Partial<Database["public"]["Tables"]["payments"]["Update"]> = {
        amount,
        status: editForm.status as Database["public"]["Tables"]["payments"]["Update"]["status"],
        paid_at: editForm.status === "pago" ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("payments").update(payload).eq("id", editingPaymentId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setEditOpen(false);
      setEditingPaymentId(null);
      setEditForm({ amountCents: 0, status: "pendente" });
      toast({ title: "Pagamento atualizado!", description: "Valor e status foram atualizados." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao atualizar pagamento.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const formatBRLFromCents = (cents: number) => {
    const value = (cents || 0) / 100;
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseBRLToCents = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const cents = digits ? Number(digits) : 0;
    return Number.isFinite(cents) ? cents : 0;
  };

  const totalReceived = payments.filter((p) => p.status === "pago").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pendente").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "atrasado").reduce((s, p) => s + p.amount, 0);

  return (
    <AppLayout title="Financeiro" subtitle="Controle de honorários e pagamentos">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Recebido" value={`R$ ${totalReceived.toLocaleString("pt-BR")}`} icon={DollarSign} changeType="positive" change="Este mês" />
        <StatCard title="Pendente" value={`R$ ${totalPending.toLocaleString("pt-BR")}`} icon={TrendingUp} changeType="neutral" change="Aguardando" />
        <StatCard title="Atrasado" value={`R$ ${totalOverdue.toLocaleString("pt-BR")}`} icon={AlertCircle} changeType="negative" change="Requer atenção" />
      </div>

      <DataTableCard
        title="Movimentações"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Registrar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Pagamento</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createPaymentMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.client_id}
                    onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
                  >
                    <option value="">Sem cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Data de vencimento (opcional)</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
                </div>

                <Button type="submit" className="w-full" disabled={createPaymentMutation.isPending}>
                  {createPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Pagamento</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updatePaymentMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={formatBRLFromCents(editForm.amountCents)}
                  onChange={(e) => setEditForm((p) => ({ ...p, amountCents: parseBRLToCents(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={updatePaymentMutation.isPending}>
                {updatePaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar alterações
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
              {payments.map((p) => {
                const config = statusConfig[p.status];
                const date = p.due_date ?? p.created_at.slice(0, 10);
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.client?.name ?? "-"}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => {
                          setEditingPaymentId(p.id);
                          setEditForm({ amountCents: Math.round(Number(p.amount) * 100), status: p.status });
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        R$ <span className="text-foreground font-medium">{p.amount.toLocaleString("pt-BR")}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]", config?.color ?? "bg-muted text-muted-foreground")}>
                        {config?.label ?? p.status}
                      </Badge>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">Data: {date}</div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Cliente</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Descrição</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Valor</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Data</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const config = statusConfig[p.status];
                    const date = p.due_date ?? p.created_at.slice(0, 10);
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 font-medium text-foreground">{p.client?.name ?? "-"}</td>
                        <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{p.description}</td>
                        <td className="py-3 px-2 text-right font-medium text-foreground">
                          R$ {p.amount.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{date}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant="outline" className={cn("text-[10px]", config?.color ?? "bg-muted text-muted-foreground")}>
                            {config?.label ?? p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingPaymentId(p.id);
                              setEditForm({ amountCents: Math.round(Number(p.amount) * 100), status: p.status });
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DataTableCard>
    </AppLayout>
  );
};

export default FinanceiroPage;
