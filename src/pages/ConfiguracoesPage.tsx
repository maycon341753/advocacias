import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Scale } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";

const ConfiguracoesPage = () => {
  const [devOpen, setDevOpen] = useState(false);

  useEffect(() => {
    setDevOpen(true);
  }, []);

  return (
    <AppLayout title="Configurações" subtitle="White-label e preferências do escritório">
      <Dialog open={devOpen} onOpenChange={setDevOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Em desenvolvimento</DialogTitle>
            <DialogDescription>Esta área ainda está em desenvolvimento. Algumas ações podem não funcionar corretamente.</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setDevOpen(false)} className="w-full">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-2xl space-y-8">
        {/* Branding */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
          <h3 className="font-heading font-semibold text-foreground mb-4">Identidade Visual</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
                <Scale className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <Button variant="outline" size="sm">Alterar Logo</Button>
                <p className="text-xs text-muted-foreground mt-1">PNG ou SVG, máx. 2MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome da Plataforma</Label>
              <Input defaultValue="JurisControl" className="bg-muted/30" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Colors */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
          <h3 className="font-heading font-semibold text-foreground mb-4">Cores do Sistema</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary border border-border" />
                <Input defaultValue="#1e3a5f" className="bg-muted/30 font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-accent border border-border" />
                <Input defaultValue="#c97d1a" className="bg-muted/30 font-mono text-sm" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Domain */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
          <h3 className="font-heading font-semibold text-foreground mb-4">Domínio Personalizado</h3>
          <div className="space-y-2">
            <Label>Domínio</Label>
            <Input placeholder="meuescritorio.com.br" className="bg-muted/30" />
            <p className="text-xs text-muted-foreground">Configure o DNS do seu domínio para apontar para a plataforma.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="w-full sm:w-auto">Salvar Alterações</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ConfiguracoesPage;
