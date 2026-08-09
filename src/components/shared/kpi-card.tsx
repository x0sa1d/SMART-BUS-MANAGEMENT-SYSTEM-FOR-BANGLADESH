import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const ACCENT_STYLES = {
  green: "from-[#006A4E]/20 to-[#006A4E]/5 text-[#006A4E] dark:text-[#1a9b74]",
  emerald: "from-[#006A4E]/20 to-[#006A4E]/5 text-[#006A4E] dark:text-[#1a9b74]",
  teal: "from-[#F42A41]/20 to-[#F42A41]/5 text-[#F42A41]",
  navy: "from-[#006A4E]/20 to-[#006A4E]/5 text-[#006A4E] dark:text-[#1a9b74]",
  blue: "from-[#006A4E]/15 to-[#F42A41]/10 text-[#006A4E]",
  indigo: "from-[#006A4E]/20 to-[#006A4E]/5 text-[#006A4E] dark:text-[#1a9b74]",
  violet: "from-[#006A4E]/15 to-[#F42A41]/10 text-[#006A4E] dark:text-[#1a9b74]",
  amber: "from-[#F42A41]/20 to-[#F42A41]/5 text-[#F42A41]",
  rose: "from-[#F42A41]/20 to-[#F42A41]/5 text-[#F42A41] dark:text-[#ff5a6b]",
  cyan: "from-[#006A4E]/15 to-[#006A4E]/10 text-[#006A4E]",
  orange: "from-[#F42A41]/20 to-[#006A4E]/10 text-[#F42A41]",
  lime: "from-[#006A4E]/15 to-[#006A4E]/10 text-[#006A4E] dark:text-[#1a9b74]",
  sky: "from-[#006A4E]/15 to-[#F42A41]/10 text-[#006A4E]",
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
