"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { setHomePathCookie } from "@/lib/redirect";
import { resolvePostLoginPath } from "@/lib/auth-flow";
import { Loader2 } from "lucide-react";

export function StartRedirect() {
  const router = useRouter();
  const [message, setMessage] = useState("Redirecting to your dashboard…");

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      try {
        const { data } = await authClient.getSession();
        if (cancelled) return;

        if (!data?.user) {
          router.replace("/login");
          return;
        }

        const home = await resolvePostLoginPath({ user: data.user });
        setHomePathCookie(home);
        router.refresh();
        router.replace(home);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }

    redirect();

    const timeout = window.setTimeout(() => {
      if (!cancelled) setMessage("Still connecting… check your network or try signing in again.");
    }, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
