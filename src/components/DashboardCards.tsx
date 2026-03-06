import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({ title, value, icon: Icon, change, changeType = "neutral", className }: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

interface DataTableCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function DataTableCard({ title, children, action }: DataTableCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-heading font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
