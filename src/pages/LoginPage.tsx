import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      const userId = data.user?.id;
      if (userId) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
        const isPlatformAdmin = (roles ?? []).some((r) => r.role === "platform_admin");
        navigate(isPlatformAdmin ? "/admin/dashboard" : "/");
        return;
      }
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mx-auto">
            <Scale className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground">JurisControl</h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            A plataforma completa de gestão jurídica para o seu escritório de advocacia.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">JurisControl</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-1">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-muted/30" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">Esqueceu a senha?</Link>
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Cadastre seu escritório</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
