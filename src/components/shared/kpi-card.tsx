import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const ACCENT_STYLES = {
  green: "from-[#006A4E]/20 to-[#006A4E]/5 text-[#006A4E] dark:text-[#00a67e]",
  emerald: "from-[#00875f]/20 to-[#00875f]/5 text-[#00875f] dark:text-[#00a67e]",
  teal: "from-[#e11d48]/20 to-[#e11d48]/5 text-[#e11d48]",
  navy: "from-[#1D3557]/20 to-[#1D3557]/5 text-[#1D3557] dark:text-[#457B9D]",
  blue: "from-[#457B9D]/20 to-[#457B9D]/5 text-[#457B9D]",
  indigo: "from-[#1D3557]/20 to-[#457B9D]/5 text-[#1D3557] dark:text-[#457B9D]",
  violet: "from-[#006A4E]/15 to-[#1D3557]/10 text-[#1D3557] dark:text-[#00a67e]",
  amber: "from-[#FFB703]/25 to-[#FFB703]/5 text-[#996f00] dark:text-[#FFB703]",
  rose: "from-[#E63946]/20 to-[#E63946]/5 text-[#E63946] dark:text-[#ff5a67]",
  cyan: "from-[#00875f]/15 to-[#2A9D8F]/10 text-[#00875f]",
  orange: "from-[#FFB703]/20 to-[#E63946]/10 text-[#E63946]",
  lime: "from-[#006A4E]/15 to-[#00875f]/10 text-[#006A4E] dark:text-[#00a67e]",
  sky: "from-[#457B9D]/15 to-[#1D3557]/10 text-[#457B9D]",
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
        <div className={cn("rounded-xl bg-gradient-to-br p-2.5", accentStyle)}>
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
