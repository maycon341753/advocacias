import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/hooks/useScreenSize";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { profile, roles } = useAuth();
  const { isMobile } = useScreenSize();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const roleLabelMap: Record<string, string> = {
    platform_admin: "Super Admin",
    office_admin: "Administrador",
    lawyer: "Advogado",
    assistant: "Assistente",
  };
  const roleLabel = roles.length > 0 ? roleLabelMap[roles[0]] || roles[0] : "Usuário";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {!isMobile && (
        <AppSidebar
          variant="desktop"
          collapsed={desktopCollapsed}
          onToggleCollapsed={() => setDesktopCollapsed((v) => !v)}
        />
      )}

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <AppSidebar variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-all duration-300", isMobile ? "ml-0" : desktopCollapsed ? "ml-[72px]" : "ml-[260px]")}>
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)} aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground truncate">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 w-64 h-9 bg-muted/50 border-none text-sm" />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">{profile?.full_name || "Usuário"}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
