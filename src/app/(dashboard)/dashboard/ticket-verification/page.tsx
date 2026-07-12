import { requirePlatformWrite } from "@/lib/auth-server";
import { TicketVerificationContent } from "@/features/tickets/ticket-verification-content";

export const dynamic = "force-dynamic";

export default async function TicketVerificationPage() {
  await requirePlatformWrite();
  return (
    <div className="page-enter">
      <TicketVerificationContent />
    </div>
  );
}
