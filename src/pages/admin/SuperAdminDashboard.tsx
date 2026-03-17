import { AppLayout } from "@/components/AppLayout";
import { StatCard, DataTableCard } from "@/components/DashboardCards";
import { Building2, Users, DollarSign, Briefcase, MoreHorizontal, Eye, Pause, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { data: tenants = [] } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*, plans(name)");
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id");
      return data || [];
    },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(price_monthly)");
      return data || [];
    },
  });

  const totalRevenue = subscriptions.reduce((sum, s) => sum + ((s.plans as any)?.price_monthly || 0), 0);

  return (
    <AppLayout title="Painel Administrativo" subtitle="Gestão da plataforma JurisControl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Escritórios" value={tenants.length} icon={Building2} change="Total cadastrados" changeType="neutral" />
        <StatCard title="Usuários Ativos" value={profiles.length} icon={Users} change="Em toda plataforma" changeType="neutral" />
        <StatCard title="Receita Mensal" value={`R$ ${totalRevenue.toLocaleString("pt-BR")}`} icon={DollarSign} change="Assinaturas ativas" changeType="positive" />
        <StatCard title="Assinaturas" value={subscriptions.length} icon={Briefcase} change="Planos contratados" changeType="neutral" />
      </div>

      <DataTableCard title="Escritórios Cadastrados" action={<Button size="sm">+ Novo Escritório</Button>}>
        <div className="space-y-2">
          {tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum escritório cadastrado ainda.</p>
          ) : (
            tenants.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{(t.plans as any)?.name || "Sem plano"} · {t.slug}</p>
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
                      <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem><Pause className="w-4 h-4 mr-2" /> Suspender</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
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
