import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Scale className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Recuperar Senha</h2>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted/30" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar link
            </Button>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">Voltar ao login</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
