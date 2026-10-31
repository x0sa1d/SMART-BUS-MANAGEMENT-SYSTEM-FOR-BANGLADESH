import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const ACCENT_STYLES = {
  green: "bg-bd-green/12 text-bd-green",
  emerald: "bg-bd-green/12 text-bd-green",
  teal: "bg-accent/12 text-accent",
  navy: "bg-bd-green/12 text-bd-green",
  blue: "bg-bd-green/12 text-bd-green",
  indigo: "bg-bd-green/12 text-bd-green",
  violet: "bg-bd-green/12 text-bd-green",
  amber: "bg-accent/12 text-accent",
  rose: "bg-destructive/12 text-destructive",
  cyan: "bg-bd-green/12 text-bd-green",
  orange: "bg-accent/12 text-accent",
  lime: "bg-bd-green/12 text-bd-green",
  sky: "bg-bd-green/12 text-bd-green",
} as const;

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  format?: "number" | "currency" | "percent";
  className?: string;
  accent?: keyof typeof ACCENT_STYLES;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  format = "number",
  className,
  accent = "green",
}: KpiCardProps) {
  const formattedValue =
    format === "currency" ? formatCurrency(Number(value)) :
    format === "percent" ? `${value}%` :
    typeof value === "number" ? value.toLocaleString() : value;

  const accentStyle = ACCENT_STYLES[accent];

  return (
    <Card className={cn("card-elevated overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-xl p-2.5", accentStyle)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{formattedValue}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend !== undefined && (
          <p className={cn("text-xs mt-1 font-medium", trend >= 0 ? "text-primary" : "text-destructive")}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% passenger growth
          </p>
        )}
      </CardContent>
    </Card>
  );
}
