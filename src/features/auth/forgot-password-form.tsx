"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await authClient.$fetch("/request-password-reset", {
        method: "POST",
        body: { email: data.email, redirectTo },
      });
      setSubmitted(true);
      toast.success("If an account exists, reset instructions were sent.");
    } catch {
      toast.error("Could not send reset email. Try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <Card className="border-0 shadow-soft-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            {submitted
              ? "Check your email for a reset link."
              : `Enter your email and we'll send reset instructions for ${APP_NAME}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register("email")} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Didn&apos;t receive it? Check spam or try again in a few minutes.
            </p>
          )}
          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
