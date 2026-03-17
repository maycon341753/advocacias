import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  FileText,
  DollarSign,
  UserCog,
  Settings,
  Scale,
  ChevronLeft,
  ChevronRight,
  Building2,
  CreditCard,
  LogOut,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const officeItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/processos", icon: Briefcase, label: "Processos" },
  { to: "/agenda", icon: CalendarDays, label: "Agenda" },
  { to: "/documentos", icon: FileText, label: "Documentos" },
  { to: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/usuarios", icon: UserCog, label: "Usuários" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

const adminItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/escritorios", icon: Building2, label: "Escritórios" },
  { to: "/admin/planos", icon: CreditCard, label: "Planos" },
  { to: "/admin/usuarios", icon: Users, label: "Usuários" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isPlatformAdmin, signOut, profile } = useAuth();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const navItems = isPlatformAdmin && isAdminRoute ? adminItems : officeItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
          <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-heading font-semibold text-sidebar-foreground truncate">
              JurisControl
            </h1>
            <p className="text-[10px] text-sidebar-muted truncate">
              {isPlatformAdmin && isAdminRoute ? "Administração" : "Gestão Jurídica"}
            </p>
          </div>
        )}
      </div>

      {/* Admin toggle */}
      {isPlatformAdmin && !collapsed && (
        <div className="px-3 pt-3">
          <NavLink
            to={isAdminRoute ? "/" : "/admin"}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-sidebar-accent text-sidebar-primary transition-colors hover:bg-sidebar-accent/80"
          >
            <Shield className="w-4 h-4" />
            {isAdminRoute ? "Ir ao Escritório" : "Painel Admin"}
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + logout */}
      {!collapsed && profile && (
        <div className="px-3 pb-2">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
            <p className="text-[10px] text-sidebar-muted truncate">{profile.email}</p>
          </div>
        </div>
      )}

      <button
        onClick={() => signOut()}
        className="flex items-center justify-center gap-2 mx-3 mb-2 py-2 rounded-lg text-xs text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {!collapsed && "Sair"}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
