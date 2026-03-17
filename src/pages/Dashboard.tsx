import { AppLayout } from "@/components/AppLayout";
import { StatCard, DataTableCard } from "@/components/DashboardCards";
import { Users, Briefcase, CalendarDays, DollarSign, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, string> = {
  "Em andamento": "bg-info/10 text-info border-info/20",
  "Aguardando audiência": "bg-warning/10 text-warning border-warning/20",
  "Encerrado": "bg-success/10 text-success border-success/20",
};

const eventTypeIcons: Record<string, { icon: typeof Clock; color: string }> = {
  audiencia: { icon: AlertTriangle, color: "text-warning" },
  prazo: { icon: Clock, color: "text-destructive" },
  reuniao: { icon: Users, color: "text-info" },
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
  type EventRow = Database["public"]["Tables"]["events"]["Row"];
  type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id ?? null],
    enabled: !loading && !!user,
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const today = new Date();
      const todayDate = today.toISOString().slice(0, 10);
      const upcoming = new Date(today);
      upcoming.setDate(upcoming.getDate() + 7);
      const upcomingDate = upcoming.toISOString().slice(0, 10);

      const clientsCountRes = await supabase.from("clients").select("id", { count: "exact", head: true });
      if (clientsCountRes.error) throw clientsCountRes.error;

      const [
        casesCountResSettled,
        upcomingEventsCountResSettled,
        paymentsThisMonthResSettled,
        recentCasesResSettled,
        upcomingEventsResSettled,
      ] = await Promise.allSettled([
        supabase.from("cases").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }).gte("event_date", todayDate).lte("event_date", upcomingDate),
        supabase.from("payments").select("amount, status, created_at").gte("created_at", startOfMonth.toISOString()).lt("created_at", startOfNextMonth.toISOString()),
        supabase
          .from("cases")
          .select("id, case_number, status, created_at, client:clients(name)")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("events")
          .select("id, title, event_date, event_time, event_type")
          .gte("event_date", todayDate)
          .order("event_date", { ascending: true })
          .order("event_time", { ascending: true })
          .limit(4),
      ]);

      const casesCountRes =
        casesCountResSettled.status === "fulfilled" && !casesCountResSettled.value.error ? casesCountResSettled.value : null;
      const upcomingEventsCountRes =
        upcomingEventsCountResSettled.status === "fulfilled" && !upcomingEventsCountResSettled.value.error
          ? upcomingEventsCountResSettled.value
          : null;
      const paymentsThisMonthRes =
        paymentsThisMonthResSettled.status === "fulfilled" && !paymentsThisMonthResSettled.value.error
          ? paymentsThisMonthResSettled.value
          : null;
      const recentCasesRes =
        recentCasesResSettled.status === "fulfilled" && !recentCasesResSettled.value.error ? recentCasesResSettled.value : null;
      const upcomingEventsRes =
        upcomingEventsResSettled.status === "fulfilled" && !upcomingEventsResSettled.value.error
          ? upcomingEventsResSettled.value
          : null;

      const totalReceived = (paymentsThisMonthRes?.data ?? [])
        .filter((p) => p.status === "pago")
        .reduce((sum, p) => sum + (p.amount as PaymentRow["amount"]), 0);

      return {
        stats: {
          clients: clientsCountRes.count ?? 0,
          cases: casesCountRes?.count ?? 0,
          upcomingEvents: upcomingEventsCountRes?.count ?? 0,
          totalReceived,
        },
        recentCases: (recentCasesRes?.data ?? []) as (Pick<CaseRow, "id" | "case_number" | "status" | "created_at"> & {
          client: { name: string } | null;
        })[],
        upcomingEvents: (upcomingEventsRes?.data ?? []) as Pick<
          EventRow,
          "id" | "title" | "event_date" | "event_time" | "event_type"
        >[],
      };
    },
  });

  const totalReceived = data?.stats.totalReceived ?? 0;

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do escritório">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Clientes" value={data?.stats.clients ?? (isLoading ? "..." : 0)} icon={Users} change="Cadastrados" changeType="neutral" />
        <StatCard title="Processos" value={data?.stats.cases ?? (isLoading ? "..." : 0)} icon={Briefcase} change="No escritório" changeType="neutral" />
        <StatCard title="Prazos Próximos" value={data?.stats.upcomingEvents ?? (isLoading ? "..." : 0)} icon={CalendarDays} change="Próximos 7 dias" changeType="neutral" />
        <StatCard
          title="Receita Mensal"
          value={`R$ ${totalReceived.toLocaleString("pt-BR")}`}
          icon={DollarSign}
          change="Pagamentos pagos"
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
        <DataTableCard title="Processos Recentes">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.recentCases ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.client?.name ?? "-"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.case_number}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0 ml-3", statusColors[c.status] ?? "bg-muted text-muted-foreground")}>
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DataTableCard>
        </div>

        {/* Upcoming Events */}
        <DataTableCard title="Próximos Compromissos">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.upcomingEvents ?? []).map((e) => {
                const config = eventTypeIcons[e.event_type];
                const Icon = config?.icon || Clock;
                const time = e.event_time ? e.event_time.slice(0, 5) : "";
                return (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={cn("mt-0.5", config?.color || "text-muted-foreground")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.event_date}{time ? ` às ${time}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DataTableCard>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
