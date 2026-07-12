import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

export default function UnauthorizedPage() {
  return (
    <div className="auth-shell flex-col gap-4 text-center">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
      <LinkButton href="/start" variant="gradient">Go to Dashboard</LinkButton>
      <Link href="/" className="text-sm text-primary hover:underline">Back to home</Link>
    </div>
  );
}
