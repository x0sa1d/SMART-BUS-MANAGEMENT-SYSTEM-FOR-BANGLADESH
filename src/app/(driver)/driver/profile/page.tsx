import { requireAuth } from "@/lib/auth-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DriverProfilePage() {
  const session = await requireAuth();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Profile</h1></div>
      <Card className="max-w-md"><CardHeader><CardTitle>Driver Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {session.user.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {session.user.email}</p>
        </CardContent>
      </Card>
    </div>
  );
}
