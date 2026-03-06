import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { mockClients } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ClientesPage = () => {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Clientes" subtitle="Gerencie os clientes do escritório">
      <DataTableCard
        title={`${filtered.length} clientes`}
        action={
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        }
      >
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
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
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Nome</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">CPF/CNPJ</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Telefone</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Cidade</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Processos</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{client.cpfCnpj}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{client.phone}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{client.city}</td>
                  <td className="py-3 px-2 text-center">{client.casesCount}</td>
                  <td className="py-3 px-2 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        client.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {client.status === "active" ? "Ativo" : "Inativo"}
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

export default ClientesPage;
