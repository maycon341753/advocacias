import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { mockUsers } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  administrador: "Admin",
  advogado: "Advogado",
  assistente: "Assistente",
};

const UsuariosPage = () => {
  return (
    <AppLayout title="Usuários" subtitle="Gerencie a equipe do escritório">
      <DataTableCard
        title={`${mockUsers.length} usuários`}
        action={
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Usuário
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Nome</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Email</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Função</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-medium text-foreground">{user.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-2 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        user.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.status === "active" ? "Ativo" : "Inativo"}
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

export default UsuariosPage;
