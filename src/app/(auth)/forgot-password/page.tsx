import { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { Loader2 } from "lucide-react";

function ForgotPasswordFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
