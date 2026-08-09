import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { getETicketData } from "@/actions/ticket.actions";
import { buildBusTicketHtml } from "@/lib/bus-ticket-html";

export const dynamic = "force-dynamic";

export default async function PrintTicketPage({
  params,
}: {
  params: Promise<{ ticketNumber: string }>;
}) {
  await requireAuth();
  const { ticketNumber } = await params;
  const result = await getETicketData(decodeURIComponent(ticketNumber));
  if (!result.success || !result.data) notFound();

  const t = result.data;
  const html = buildBusTicketHtml({
    ticketNumber: t.ticketNumber,
    verificationId: t.verificationId,
    serialNumber: t.serialNumber,
    passengerName: t.passengerName,
    companyName: t.companyName,
    source: t.source,
    destination: t.destination,
    tripDate: t.tripDate,
    departureTime: t.departureTime,
    seatNumber: t.seatNumber,
    busNumber: t.busNumber,
    fare: t.fare,
    qrDataUrl: t.qrDataUrl,
    status: t.status,
  });

  const withAutoprint = html.replace(
    "</body>",
    `<script>window.addEventListener("load",()=>{window.print();});</script></body>`
  );

  return (
    <iframe
      title={`Print ${t.ticketNumber}`}
      srcDoc={withAutoprint}
      className="fixed inset-0 h-screen w-screen border-0 bg-white"
    />
  );
}
