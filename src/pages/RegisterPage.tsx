import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const [fullName, setFullName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });

    if (authError || !authData.user) {
      setLoading(false);
      toast({ title: "Erro no cadastro", description: authError?.message || "Erro desconhecido", variant: "destructive" });
      return;
    }

    const userId = authData.user.id;
    const slug = officeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // 2. Get starter plan
    const { data: plans } = await supabase.from("plans").select("id").eq("name", "Starter").single();

    // 3. Create tenant
    const { data: tenant, error: tenantError } = await supabase.from("tenants").insert({
      name: officeName,
      slug: slug + "-" + Date.now(),
      owner_id: userId,
      plan_id: plans?.id,
    }).select().single();

    if (tenantError || !tenant) {
      setLoading(false);
      toast({ title: "Erro ao criar escritório", description: tenantError?.message, variant: "destructive" });
      return;
    }

    // 4. Update profile with tenant_id
    await supabase.from("profiles").update({ tenant_id: tenant.id, full_name: fullName }).eq("user_id", userId);

    // 5. Assign office_admin role
    await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "office_admin" as Database["public"]["Enums"]["app_role"] });

    // 6. Create subscription
    await supabase.from("subscriptions").insert({
      tenant_id: tenant.id,
      plan_id: plans?.id || tenant.plan_id!,
      status: "trial" as Database["public"]["Enums"]["subscription_status"],
    });

    setLoading(false);
    toast({ title: "Escritório criado!", description: "Seu escritório foi cadastrado com sucesso." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mx-auto">
            <Scale className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground">JurisControl</h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            Comece agora a gestão digital do seu escritório de advocacia.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">JurisControl</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Cadastre seu Escritório</h2>
            <p className="text-muted-foreground mt-1">Crie sua conta e comece a usar em minutos.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Seu Nome Completo</Label>
              <Input placeholder="Dr. João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>Nome do Escritório</Label>
              <Input placeholder="Silva & Associados" value={officeName} onChange={(e) => setOfficeName(e.target.value)} required className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="contato@escritorio.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-muted/30" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Escritório
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
