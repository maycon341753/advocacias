import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { mockEvents } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  audiencia: { label: "Audiência", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
  prazo: { label: "Prazo", icon: Clock, color: "bg-destructive/10 text-destructive border-destructive/20" },
  reuniao: { label: "Reunião", icon: Users, color: "bg-info/10 text-info border-info/20" },
};

const AgendaPage = () => {
  return (
    <AppLayout title="Agenda" subtitle="Compromissos e prazos jurídicos">
      <DataTableCard
        title="Próximos Compromissos"
        action={
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Evento
          </Button>
        }
      >
        <div className="space-y-3">
          {mockEvents.map((event) => {
            const config = typeConfig[event.type];
            const Icon = config?.icon || Clock;
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
                  <p className="text-xs text-muted-foreground">{event.caseNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">{event.date}</p>
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", config?.color)}>
                  {config?.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </DataTableCard>
    </AppLayout>
  );
};

export default AgendaPage;
