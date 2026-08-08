"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { signIn, authClient } from "@/lib/auth-client";
import { setHomePathCookie } from "@/lib/redirect";
import { resolvePostLoginPath, safeNextPath } from "@/lib/auth-flow";
import { loginSchema, type LoginInput } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

const DEMO_EMAIL = "admin@smartbus.com";
const DEMO_PASSWORD = "Admin@12345";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const nextPath = safeNextPath(searchParams.get("next"));
  const [loading, setLoading] = useState(false);
  const [autoDemoAttempted, setAutoDemoAttempted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: isDemo ? { email: DEMO_EMAIL, password: DEMO_PASSWORD } : undefined,
  });

  const completeLogin = useCallback(async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) {
      toast.error(result.error.message || "Invalid credentials");
      return false;
    }

    await authClient.getSession();
    toast.success("Welcome back!");
    const home = await resolvePostLoginPath({ next: nextPath, user: result.data?.user ?? null });
    setHomePathCookie(home);
    router.refresh();
    router.replace(home);
    return true;
  }, [nextPath, router]);

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await completeLogin(data.email, data.password);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDemoLogin = async () => {
    setLoading(true);
    try {
      await completeLogin(DEMO_EMAIL, DEMO_PASSWORD);
    } catch {
      toast.error("Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDemo || autoDemoAttempted) return;
    setAutoDemoAttempted(true);

    (async () => {
      setLoading(true);
      try {
        await completeLogin(DEMO_EMAIL, DEMO_PASSWORD);
      } catch {
        toast.error("Demo login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isDemo, autoDemoAttempted, completeLogin]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <Card className="border-0 shadow-soft-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white font-bold">SBM</div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to {APP_NAME}</CardDescription>
          {isDemo && (
            <Badge className="mx-auto bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
              Demo mode. Signing in automatically…
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" defaultValue={isDemo ? DEMO_EMAIL : undefined} {...register("email")} />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-10" defaultValue={isDemo ? DEMO_PASSWORD : undefined} {...register("password")} />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </Button>
            {isDemo && (
              <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={onDemoLogin}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enter Demo Dashboard
              </Button>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/register" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
          {!isDemo && (
            <p className="mt-3 text-center text-sm">
              <Link href="/login?demo=1" className="text-primary font-medium hover:underline">Try the live demo →</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
