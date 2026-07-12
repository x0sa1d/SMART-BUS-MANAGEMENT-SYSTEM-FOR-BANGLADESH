import Link from "next/link";
import { requireAuth } from "@/lib/auth-server";
import { getCompanyForUser } from "@/actions/company.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default async function CompanyRejectedPage() {
  const session = await requireAuth();
  const company = await getCompanyForUser(session.user.id);

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <Card className="max-w-lg w-full card-elevated">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Application Rejected</h1>
          <p className="text-muted-foreground">
            {company?.name ? (
              <>Your application for <strong>{company.name}</strong> was not approved.</>
            ) : (
              "Your company application was not approved."
            )}
          </p>
          {company?.rejectionReason && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-left">
              <p className="font-medium mb-1">Reason:</p>
              <p className="text-muted-foreground">{company.rejectionReason}</p>
            </div>
          )}
          <Button asChild variant="gradient">
            <Link href="/register-company">Submit New Application</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
