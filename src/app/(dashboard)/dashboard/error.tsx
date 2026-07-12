"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  const isPrismaStale = error.message.includes("busCompany") || error.message.includes("Cannot read properties of undefined");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Dashboard failed to load</h2>
      <p className="text-muted-foreground max-w-md">
        {isPrismaStale
          ? "The database client is out of date. Restart the dev server after running: npm run db:generate"
          : error.message || "Something went wrong loading dashboard data."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="gradient">Try again</Button>
        <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
      </div>
    </div>
  );
}
