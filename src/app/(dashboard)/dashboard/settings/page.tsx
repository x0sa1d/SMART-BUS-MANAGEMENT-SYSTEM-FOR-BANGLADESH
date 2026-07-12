import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const settings = await db.settings.findFirst();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">System configuration</p></div>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><span className="text-muted-foreground">Company:</span> {settings?.companyName || "Smart Bus Management"}</p>
          <p><span className="text-muted-foreground">Currency:</span> {settings?.currency || "BDT"}</p>
          <p><span className="text-muted-foreground">Booking Fee:</span> ৳{Number(settings?.bookingFee || 0)}</p>
          <p><span className="text-muted-foreground">Tax Rate:</span> {Number(settings?.taxRate || 0)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
