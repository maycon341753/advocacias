import { AppLayout } from "@/components/AppLayout";
import { StatCard, DataTableCard } from "@/components/DashboardCards";
import { Users, Briefcase, CalendarDays, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { mockCases, mockEvents, mockPayments } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const pendingPayments = mockPayments.filter((p) => p.status !== "pago");
  const totalReceived = mockPayments
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do escritório">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Clientes Ativos" value={42} icon={Users} change="+3 este mês" changeType="positive" />
        <StatCard title="Processos" value={28} icon={Briefcase} change="5 novos" changeType="positive" />
        <StatCard title="Prazos Próximos" value={7} icon={CalendarDays} change="2 urgentes" changeType="negative" />
        <StatCard
          title="Receita Mensal"
          value={`R$ ${totalReceived.toLocaleString("pt-BR")}`}
          icon={DollarSign}
          change="+12% vs mês anterior"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
        <DataTableCard title="Processos Recentes">
          <div className="space-y-3">
            {mockCases.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.client}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.number}</p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0 ml-3", statusColors[c.status])}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </DataTableCard>
        </div>

        {/* Upcoming Events */}
        <DataTableCard title="Próximos Compromissos">
          <div className="space-y-3">
            {mockEvents.slice(0, 4).map((e) => {
              const config = eventTypeIcons[e.type];
              const Icon = config?.icon || Clock;
              return (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={cn("mt-0.5", config?.color || "text-muted-foreground")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.date} às {e.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DataTableCard>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
