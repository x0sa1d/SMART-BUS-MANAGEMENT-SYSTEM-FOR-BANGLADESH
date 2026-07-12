import Link from "next/link";
import { requireAuth } from "@/lib/auth-server";
import { getCompanyForUser } from "@/actions/company.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ban } from "lucide-react";

export default async function CompanySuspendedPage() {
  const session = await requireAuth();
  const company = await getCompanyForUser(session.user.id);

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <Card className="max-w-lg w-full card-elevated">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
            <Ban className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Account Suspended</h1>
          <p className="text-muted-foreground">
            {company?.name ? (
              <>Access for <strong>{company.name}</strong> has been suspended. Contact support.</>
            ) : (
              "Your company account has been suspended."
            )}
          </p>
          <Button asChild variant="outline"><Link href="/">Go Home</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
