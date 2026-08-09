import { cn } from "@/lib/utils";

export type BusTicketCardData = {
  ticketNumber: string;
  verificationId: string;
  serialNumber: string;
  passengerName?: string;
  companyName?: string;
  source: string;
  destination: string;
  tripDate: string;
  departureTime: string;
  seatNumber: string;
  busNumber: string;
  qrDataUrl: string;
  className?: string;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[56px_1fr] items-center gap-2">
      <span className="text-[11px] font-extrabold tracking-wide text-slate-700">{label}</span>
      <span className="min-h-8 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

export function BusTicketCard({
  ticketNumber,
  verificationId,
  serialNumber,
  passengerName,
  companyName,
  source,
  destination,
  tripDate,
  departureTime,
  seatNumber,
  busNumber,
  qrDataUrl,
  className,
}: BusTicketCardData) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-2 border-[#ff8c42] bg-[#f8f9fa] shadow-[0_12px_32px_-16px_rgba(255,140,66,0.45)]",
        className
      )}
    >
      <div className="flex flex-col md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="bg-[#ff8c42] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white sm:text-base">
            Bus Ticket
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[1.35fr_0.7fr_0.75fr] sm:items-start">
            <div className="space-y-2">
              <Field label="DATE" value={tripDate} />
              <Field label="TIME" value={departureTime} />
              <Field label="FROM" value={source} />
              <Field label="TO" value={destination} />
            </div>
            <div className="space-y-2.5">
              <div className="rounded-md border border-slate-300 bg-white px-3 py-2">
                <p className="text-[11px] font-extrabold tracking-wide text-slate-500">Bus No.</p>
                <p className="text-lg font-extrabold text-slate-900">{busNumber}</p>
              </div>
              <div className="rounded-md border border-slate-300 bg-white px-3 py-2">
                <p className="text-[11px] font-extrabold tracking-wide text-slate-500">Seat No.</p>
                <p className="text-lg font-extrabold text-slate-900">{seatNumber}</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Ticket QR code" className="h-[110px] w-[110px]" />
              <p className="mt-1 font-mono text-[11px] font-bold tracking-wide text-slate-800">{serialNumber}</p>
            </div>
          </div>
          <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
            {passengerName && <span>Passenger: <strong className="text-slate-700">{passengerName}</strong> · </span>}
            {companyName && <span>Operator: <strong className="text-slate-700">{companyName}</strong> · </span>}
            Ticket: <strong className="text-slate-700">{ticketNumber}</strong> · Verify:{" "}
            <strong className="font-mono text-slate-700">{verificationId}</strong>
          </div>
        </div>

        <div className="relative border-t-2 border-dashed border-[#ff8c42] md:w-[240px] md:border-l-2 md:border-t-0">
          <div className="flex min-h-[52px] items-center justify-center bg-[#ff8c42] px-3 py-2 text-center text-xs font-extrabold uppercase leading-tight tracking-[0.08em] text-white">
            Passenger
            <br />
            Ticket
          </div>
          <div className="space-y-1.5 px-3 py-3 text-xs">
            {[
              ["DATE :", tripDate],
              ["TIME :", departureTime],
              ["FROM :", source],
              ["TO :", destination],
              ["BUS NO :", busNumber],
              ["SEAT NO :", seatNumber],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-2 border-b border-slate-200 py-1">
                <span className="font-extrabold text-slate-500">{label}</span>
                <span className="text-right font-bold text-slate-900">{value}</span>
              </div>
            ))}
            <div className="flex flex-col items-center pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Passenger stub QR" className="h-24 w-24" />
              <p className="mt-1 font-mono text-[11px] font-bold tracking-wide">{serialNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
