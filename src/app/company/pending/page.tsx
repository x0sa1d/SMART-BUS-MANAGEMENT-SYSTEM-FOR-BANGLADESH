import Link from "next/link";
import { requireAuth } from "@/lib/auth-server";
import { getCompanyForUser } from "@/actions/company.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";
import { APP_NAME } from "@/constants";

export default async function CompanyPendingPage() {
  const session = await requireAuth();
  const company = await getCompanyForUser(session.user.id);

  if (!company || company.status !== "PENDING") {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">No pending application found.</p>
            <Button asChild variant="gradient"><Link href="/">Go Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <Card className="max-w-lg w-full card-elevated">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFB703]/20">
            <Clock className="h-7 w-7 text-[#996f00]" />
          </div>
          <h1 className="text-2xl font-bold">Application Under Review</h1>
          <p className="text-muted-foreground">
            Your application for <strong>{company.name}</strong> has been submitted to {APP_NAME}.
            A Super Admin will review and approve or reject your registration.
          </p>
          <p className="text-sm text-muted-foreground">
            Applied {company.appliedAt ? new Date(company.appliedAt).toLocaleDateString() : "recently"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
            <Button asChild variant="ghost">
              <Link href="/login"><LogOut className="h-4 w-4" /> Sign in with another account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
