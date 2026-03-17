import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ClientesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    document_number: "",
    document_type: "" as "" | "cpf" | "cnpj",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, document_number, email, phone, address, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<
        ClientRow,
        "id" | "name" | "document_number" | "email" | "phone" | "address" | "created_at"
      >[];
    },
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-client-ids"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cases").select("client_id");
      if (error) throw error;
      return (data ?? []) as { client_id: string | null }[];
    },
    enabled: clients.length > 0,
  });

  const casesCountByClientId = cases.reduce<Record<string, number>>((acc, row) => {
    if (!row.client_id) return acc;
    acc[row.client_id] = (acc[row.client_id] ?? 0) + 1;
    return acc;
  }, {});

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? clients.filter((c) => {
        const haystack = `${c.name} ${c.document_number ?? ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : clients;

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const tenantId = profile?.tenant_id;
      if (!tenantId) throw new Error("Você precisa estar em um escritório para cadastrar clientes.");

      const document_number = form.document_number.trim();
      const document_type = form.document_type.trim();
      if (document_number && !document_type) throw new Error("Selecione o tipo de documento (CPF/CNPJ).");

      const payload: Database["public"]["Tables"]["clients"]["Insert"] = {
        tenant_id: tenantId,
        name: form.name.trim(),
        document_number: document_number || null,
        document_type: (document_type || null) as Database["public"]["Tables"]["clients"]["Insert"]["document_type"],
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setForm({ name: "", document_number: "", document_type: "", email: "", phone: "", address: "", notes: "" });
      toast({ title: "Cliente cadastrado!", description: "O cliente foi criado com sucesso." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar cliente.";
      toast({ title: "Erro ao cadastrar cliente", description: message, variant: "destructive" });
    },
  });

  return (
    <AppLayout title="Clientes" subtitle="Gerencie os clientes do escritório">
      <DataTableCard
        title={`${filtered.length} clientes`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createClientMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2 sm:col-span-1">
                    <Label>Tipo</Label>
                    <Select
                      value={form.document_type}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, document_type: value as "cpf" | "cnpj" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="CPF/CNPJ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Número</Label>
                    <Input
                      value={form.document_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, document_number: e.target.value }))}
                      placeholder="Somente números"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>

                <Button type="submit" className="w-full" disabled={createClientMutation.isPending}>
                  {createClientMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Cliente
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((client) => (
                <div key={client.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email ?? "-"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                      <p className="text-foreground truncate">{client.document_number ?? "-"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-foreground truncate">{client.phone ?? "-"}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="text-foreground truncate">{client.address ?? "-"}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Processos: <span className="text-foreground">{casesCountByClientId[client.id] ?? 0}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", "bg-success/10 text-success border-success/20")}>
                      Ativo
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">CPF/CNPJ</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Telefone</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Endereço</th>
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
                          <p className="text-xs text-muted-foreground">{client.email ?? "-"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{client.document_number ?? "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{client.phone ?? "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{client.address ?? "-"}</td>
                      <td className="py-3 px-2 text-center">{casesCountByClientId[client.id] ?? 0}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className={cn("text-[10px]", "bg-success/10 text-success border-success/20")}>
                          Ativo
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
          </>
        )}
      </DataTableCard>
    </AppLayout>
  );
};

export default ClientesPage;
