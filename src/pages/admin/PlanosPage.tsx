import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2 } from "lucide-react";

const PlanosPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price_monthly: "", max_users: "", max_cases: "", max_storage_mb: "" });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("price_monthly");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        price_monthly: parseFloat(form.price_monthly),
        max_users: parseInt(form.max_users),
        max_cases: parseInt(form.max_cases),
        max_storage_mb: parseInt(form.max_storage_mb),
      };
      if (editPlan) {
        await supabase.from("plans").update(payload).eq("id", editPlan.id);
      } else {
        await supabase.from("plans").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setOpen(false);
      setEditPlan(null);
      toast({ title: editPlan ? "Plano atualizado!" : "Plano criado!" });
    },
  });

  const openNew = () => {
    setEditPlan(null);
    setForm({ name: "", description: "", price_monthly: "", max_users: "5", max_cases: "50", max_storage_mb: "512" });
    setOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      price_monthly: String(plan.price_monthly),
      max_users: String(plan.max_users),
      max_cases: String(plan.max_cases),
      max_storage_mb: String(plan.max_storage_mb),
    });
    setOpen(true);
  };

  return (
    <AppLayout title="Gestão de Planos" subtitle="Configure os planos de assinatura">
      <DataTableCard
        title="Planos Disponíveis"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>+ Novo Plano</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-muted/30" /></div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted/30" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Preço Mensal (R$)</Label><Input type="number" step="0.01" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} required className="bg-muted/30" /></div>
                  <div className="space-y-2"><Label>Máx. Usuários</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} required className="bg-muted/30" /></div>
                  <div className="space-y-2"><Label>Máx. Processos</Label><Input type="number" value={form.max_cases} onChange={(e) => setForm({ ...form, max_cases: e.target.value })} required className="bg-muted/30" /></div>
                  <div className="space-y-2"><Label>Armazenamento (MB)</Label><Input type="number" value={form.max_storage_mb} onChange={(e) => setForm({ ...form, max_storage_mb: e.target.value })} required className="bg-muted/30" /></div>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editPlan ? "Salvar" : "Criar Plano"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan: any) => (
              <div key={plan.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-semibold text-foreground">{plan.name}</h4>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(plan)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-2xl font-heading font-bold text-primary">R$ {plan.price_monthly}<span className="text-sm font-body text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>👥 Até {plan.max_users} usuários</p>
                  <p>📁 Até {plan.max_cases} processos</p>
                  <p>💾 {plan.max_storage_mb >= 1024 ? `${(plan.max_storage_mb / 1024).toFixed(0)} GB` : `${plan.max_storage_mb} MB`} de armazenamento</p>
                </div>
                <Badge variant="outline" className={plan.is_active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {plan.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DataTableCard>
    </AppLayout>
  );
};

export default PlanosPage;
