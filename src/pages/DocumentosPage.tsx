import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { Button } from "@/components/ui/button";
import { Upload, FileText, File, MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentUI,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DocumentosPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", client_id: "" as string | "", case_id: "" as string | "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
  type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
  type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
  type DocumentListItem = Pick<DocumentRow, "id" | "name" | "file_type" | "file_size" | "file_url" | "created_at"> & {
    client: { name: string } | null;
    case: { case_number: string } | null;
  };

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, file_type, file_size, file_url, created_at, client:clients(name), case:cases(case_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentListItem[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-minimal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as Pick<ClientRow, "id" | "name">[];
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const tenantId = profile?.tenant_id;
      if (!tenantId) throw new Error("Você precisa estar em um escritório para enviar documentos.");
      if (!user?.id) throw new Error("Usuário não autenticado.");
      if (!file) throw new Error("Selecione um arquivo.");

      const displayName = form.name.trim() || file.name;
      const safeName = file.name.replace(/[^\w.\-()\s]/g, "_");
      const objectPath = `${tenantId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(objectPath, file, { upsert: false, contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("documents").getPublicUrl(objectPath);
      const fileUrl = publicData.publicUrl;

      const payload: Database["public"]["Tables"]["documents"]["Insert"] = {
        tenant_id: tenantId,
        client_id: form.client_id ? form.client_id : null,
        case_id: form.case_id ? form.case_id : null,
        name: displayName,
        file_type: file.type || file.name.split(".").pop() || null,
        file_size: file.size,
        file_url: fileUrl,
        created_by: user.id,
      };

      const { error: insertError } = await supabase.from("documents").insert(payload);
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpen(false);
      setFile(null);
      setForm({ name: "", client_id: "", case_id: "" });
      toast({ title: "Upload concluído!", description: "O documento foi enviado com sucesso." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao enviar documento.";
      toast({ title: "Erro no upload", description: message, variant: "destructive" });
    },
  });

  const extractStoragePathFromPublicUrl = (url: string) => {
    const marker = "/storage/v1/object/public/documents/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const path = url.slice(idx + marker.length);
    return decodeURIComponent(path);
  };

  const deleteDocumentMutation = useMutation({
    mutationFn: async (doc: DocumentListItem) => {
      const path = extractStoragePathFromPublicUrl(doc.file_url);
      if (path) {
        const { error: storageError } = await supabase.storage.from("documents").remove([path]);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Documento excluído!", description: "O documento foi removido." });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Erro ao excluir documento.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <AppLayout title="Documentos" subtitle="Gestão de documentos e arquivos">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContentUI>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmOpen(false);
                setConfirmDeleteId(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDeleteId) return;
                const doc = documents.find((d) => d.id === confirmDeleteId);
                if (!doc) return;
                deleteDocumentMutation.mutate(doc);
                setConfirmOpen(false);
                setConfirmDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContentUI>
      </AlertDialog>

      <DataTableCard
        title={`${documents.length} documentos`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto">
                <Upload className="w-4 h-4" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  uploadMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Arquivo</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
                </div>

                <div className="space-y-2">
                  <Label>Nome (opcional)</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.client_id}
                    onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
                  >
                    <option value="">Sem cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Processo (opcional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.case_id}
                    onChange={(e) => setForm((p) => ({ ...p, case_id: e.target.value }))}
                  >
                    <option value="">Sem processo</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_number}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enviar
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
          <>
            <div className="space-y-3 md:hidden">
              {documents.map((doc) => {
                const type = (doc.file_type ?? doc.name.split(".").pop() ?? "").toUpperCase();
                const isPdf = type === "PDF";
                const size = doc.file_size == null ? "-" : formatBytes(doc.file_size);
                const date = doc.created_at.slice(0, 10);
                return (
                  <div key={doc.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        {isPdf ? (
                          <FileText className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <File className="w-4 h-4 text-info shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.client?.name ?? "-"} · {doc.case?.case_number ?? "-"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              window.open(doc.file_url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            Abrir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async (e) => {
                              e.preventDefault();
                              try {
                                await navigator.clipboard.writeText(doc.file_url);
                                toast({ title: "Link copiado!", description: "O link do documento foi copiado." });
                              } catch {
                                toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
                              }
                            }}
                          >
                            Copiar link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={deleteDocumentMutation.isPending}
                            onSelect={(e) => {
                              e.preventDefault();
                              setConfirmDeleteId(doc.id);
                              setConfirmOpen(true);
                            }}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] shrink-0">{type || "-"}</Badge>
                      <div className="text-xs text-muted-foreground">{size}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Data: {date}</div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Documento</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Cliente</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Processo</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Tamanho</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Data</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const type = (doc.file_type ?? doc.name.split(".").pop() ?? "").toUpperCase();
                    const isPdf = type === "PDF";
                    const size = doc.file_size == null ? "-" : formatBytes(doc.file_size);
                    const date = doc.created_at.slice(0, 10);
                    return (
                      <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {isPdf ? (
                              <FileText className="w-4 h-4 text-destructive shrink-0" />
                            ) : (
                              <File className="w-4 h-4 text-info shrink-0" />
                            )}
                            <span className="font-medium text-foreground truncate max-w-[200px]">{doc.name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">{type || "-"}</Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{doc.client?.name ?? "-"}</td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs hidden lg:table-cell">{doc.case?.case_number ?? "-"}</td>
                        <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{size}</td>
                        <td className="py-3 px-2 text-muted-foreground">{date}</td>
                        <td className="py-3 px-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  window.open(doc.file_url, "_blank", "noopener,noreferrer");
                                }}
                              >
                                Abrir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={async (e) => {
                                  e.preventDefault();
                                  try {
                                    await navigator.clipboard.writeText(doc.file_url);
                                    toast({ title: "Link copiado!", description: "O link do documento foi copiado." });
                                  } catch {
                                    toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
                                  }
                                }}
                              >
                                Copiar link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                disabled={deleteDocumentMutation.isPending}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setConfirmDeleteId(doc.id);
                                  setConfirmOpen(true);
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DataTableCard>
    </AppLayout>
  );
};

export default DocumentosPage;
