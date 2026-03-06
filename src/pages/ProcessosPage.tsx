import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { mockCases } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "Em andamento": "bg-info/10 text-info border-info/20",
  "Aguardando audiência": "bg-warning/10 text-warning border-warning/20",
  "Encerrado": "bg-success/10 text-success border-success/20",
};

const ProcessosPage = () => {
  const [search, setSearch] = useState("");
  const filtered = mockCases.filter(
    (c) =>
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.number.includes(search)
  );

  return (
    <AppLayout title="Processos" subtitle="Gerencie os processos do escritório">
      <DataTableCard
        title={`${filtered.length} processos`}
        action={
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Processo
          </Button>
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
        <div className="overflow-x-auto">
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
                    <p className="font-mono text-xs text-foreground">{c.number}</p>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground text-xs hidden md:table-cell">{c.court}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{c.client}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{c.type}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{c.responsible}</td>
                  <td className="py-3 px-2 text-center">
                    <Badge variant="outline" className={cn("text-[10px]", statusColors[c.status])}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>
    </AppLayout>
  );
};

export default ProcessosPage;
