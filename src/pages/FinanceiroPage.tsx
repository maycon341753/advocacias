import { AppLayout } from "@/components/AppLayout";
import { StatCard, DataTableCard } from "@/components/DashboardCards";
import { mockPayments } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  pago: { label: "Pago", color: "bg-success/10 text-success border-success/20" },
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/20" },
  atrasado: { label: "Atrasado", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const FinanceiroPage = () => {
  const totalReceived = mockPayments.filter((p) => p.status === "pago").reduce((s, p) => s + p.amount, 0);
  const totalPending = mockPayments.filter((p) => p.status === "pendente").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = mockPayments.filter((p) => p.status === "atrasado").reduce((s, p) => s + p.amount, 0);

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
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Registrar Pagamento
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Descrição</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Valor</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Data</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((p) => {
                const config = statusConfig[p.status];
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-foreground">{p.client}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{p.description}</td>
                    <td className="py-3 px-2 text-right font-medium text-foreground">
                      R$ {p.amount.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{p.date}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="outline" className={cn("text-[10px]", config?.color)}>
                        {config?.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataTableCard>
    </AppLayout>
  );
};

export default FinanceiroPage;
