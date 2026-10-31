import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { Loader2 } from "lucide-react";

function ResetPasswordFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-shell">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
