import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertTriangle, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const typeConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  audiencia: { label: "Audiência", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
  prazo: { label: "Prazo", icon: Clock, color: "bg-destructive/10 text-destructive border-destructive/20" },
  reuniao: { label: "Reunião", icon: Users, color: "bg-info/10 text-info border-info/20" },
};

const AgendaPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    case_id: "" as string | "",
    event_type: "reuniao",
    event_date: "",
    event_time: "",
  });
  type EventRow = Database["public"]["Tables"]["events"]["Row"];
  type CaseRow = Database["public"]["Tables"]["cases"]["Row"];

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date, event_time, event_type, case:cases(case_number)")
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as (Pick<EventRow, "id" | "title" | "event_date" | "event_time" | "event_type"> & {
        case: { case_number: string } | null;
      })[];
    },
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-minimal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cases").select("id, case_number").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<CaseRow, "id" | "case_number">[];
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const tenantId = profile?.tenant_id;
      if (!tenantId) throw new Error("Você precisa estar em um escritório para cadastrar eventos.");
      if (!user?.id) throw new Error("Usuário não autenticado.");
      if (!form.title.trim()) throw new Error("Informe o título do evento.");
      if (!form.event_date) throw new Error("Informe a data do evento.");

      const payload: Database["public"]["Tables"]["events"]["Insert"] = {
        tenant_id: tenantId,
        case_id: form.case_id ? form.case_id : null,
        title: form.title.trim(),
        event_type: form.event_type,
        event_date: form.event_date,
        event_time: form.event_time || null,
        created_by: user.id,
      };

      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["events"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setOpen(false);
      setForm({ title: "", case_id: "", event_type: "reuniao", event_date: "", event_time: "" });
      toast({ title: "Evento criado!", description: "O evento foi cadastrado com sucesso." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar evento.";
      toast({ title: "Erro ao cadastrar evento", description: message, variant: "destructive" });
    },
  });

  return (
    <AppLayout title="Agenda" subtitle="Compromissos e prazos jurídicos">
      <DataTableCard
        title="Próximos Compromissos"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createEventMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.event_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, event_type: e.target.value }))}
                  >
                    <option value="audiencia">Audiência</option>
                    <option value="prazo">Prazo</option>
                    <option value="reuniao">Reunião</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Processo (opcional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.case_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, case_id: e.target.value }))}
                  >
                    <option value="">Sem processo</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora (opcional)</Label>
                    <Input
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm((prev) => ({ ...prev, event_time: e.target.value }))}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const config = typeConfig[event.event_type];
              const Icon = config?.icon || Clock;
              const time = event.event_time ? event.event_time.slice(0, 5) : "";
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className={cn("w-5 h-5", config?.color.split(" ")[1])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.case?.case_number ?? "-"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">{event.event_date}</p>
                    <p className="text-xs text-muted-foreground">{time || "-"}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", config?.color)}>
                    {config?.label ?? event.event_type}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </DataTableCard>
    </AppLayout>
  );
};

export default AgendaPage;
