import { AppLayout } from "@/components/AppLayout";
import { DataTableCard } from "@/components/DashboardCards";
import { Button } from "@/components/ui/button";
import { Upload, FileText, File, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockDocuments = [
  { id: "1", name: "Petição Inicial - Maria Silva.pdf", type: "PDF", size: "2.4 MB", client: "Maria Silva Santos", case: "0001234-56.2024", date: "2024-03-01" },
  { id: "2", name: "Contrato Social - ABC Ltda.docx", type: "DOCX", size: "1.1 MB", client: "Empresa ABC Ltda", case: "0005678-90.2024", date: "2024-02-20" },
  { id: "3", name: "Procuração - João Pedro.pdf", type: "PDF", size: "540 KB", client: "João Pedro Oliveira", case: "0009012-34.2024", date: "2024-03-10" },
  { id: "4", name: "Acordo Extrajudicial.pdf", type: "PDF", size: "3.2 MB", client: "Ana Beatriz Costa", case: "0003456-78.2024", date: "2024-02-28" },
  { id: "5", name: "Parecer Técnico.docx", type: "DOCX", size: "890 KB", client: "Tech Solutions S.A.", case: "0007890-12.2024", date: "2024-04-01" },
];

const DocumentosPage = () => {
  return (
    <AppLayout title="Documentos" subtitle="Gestão de documentos e arquivos">
      <DataTableCard
        title={`${mockDocuments.length} documentos`}
        action={
          <Button size="sm" className="gap-2">
            <Upload className="w-4 h-4" /> Upload
          </Button>
        }
      >
        <div className="overflow-x-auto">
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
              {mockDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {doc.type === "PDF" ? (
                        <FileText className="w-4 h-4 text-destructive shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-info shrink-0" />
                      )}
                      <span className="font-medium text-foreground truncate max-w-[200px]">{doc.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{doc.type}</Badge>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{doc.client}</td>
                  <td className="py-3 px-2 text-muted-foreground font-mono text-xs hidden lg:table-cell">{doc.case}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{doc.size}</td>
                  <td className="py-3 px-2 text-muted-foreground">{doc.date}</td>
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

export default DocumentosPage;
