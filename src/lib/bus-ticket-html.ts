export type BusTicketHtmlData = {
  ticketNumber: string;
  verificationId: string;
  serialNumber: string;
  passengerName: string;
  companyName: string;
  source: string;
  destination: string;
  tripDate: string;
  departureTime: string;
  seatNumber: string;
  busNumber: string;
  fare: number;
  qrDataUrl: string;
  status: string;
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Classic orange two-part bus ticket HTML (download / print). */
export function buildBusTicketHtml(t: BusTicketHtmlData): string {
  const from = esc(t.source);
  const to = esc(t.destination);
  const date = esc(t.tripDate);
  const time = esc(t.departureTime);
  const busNo = esc(t.busNumber);
  const seatNo = esc(t.seatNumber);
  const serial = esc(t.serialNumber);
  const verificationId = esc(t.verificationId);
  const passenger = esc(t.passengerName);
  const company = esc(t.companyName);
  const ticketNo = esc(t.ticketNumber);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bus Ticket ${ticketNo}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 24px;
      background: #F7F3E9;
      font-family: Inter, "Segoe UI", Arial, Helvetica, sans-serif;
      color: #292B26;
    }
    .ticket {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      background: #ffffff;
      border: 2px solid #F28C28;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 12px 32px -16px rgba(242, 140, 40, 0.4);
    }
    .main { flex: 1 1 72%; min-width: 0; }
    .stub {
      flex: 0 0 28%;
      border-left: 2px dashed #F28C28;
      position: relative;
    }
    .stub::before, .stub::after {
      content: "";
      position: absolute;
      left: -9px;
      width: 16px; height: 16px;
      background: #F7F3E9;
      border-radius: 999px;
    }
    .stub::before { top: -8px; }
    .stub::after { bottom: -8px; }
    .bar {
      background: #F28C28;
      color: #fff;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 12px 16px;
      font-size: 18px;
    }
    .stub .bar {
      font-size: 13px;
      line-height: 1.25;
      text-align: center;
      min-height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .body { padding: 16px; }
    .grid {
      display: grid;
      grid-template-columns: 1.4fr 0.7fr 0.7fr;
      gap: 12px;
      align-items: start;
    }
    .fields { display: grid; gap: 8px; }
    .row { display: grid; grid-template-columns: 64px 1fr; gap: 8px; align-items: center; }
    .label {
      font-size: 12px; font-weight: 800; letter-spacing: 0.04em; color: #292B26;
    }
    .box {
      border: 1px solid #E8E2D5;
      border-radius: 4px;
      background: #fff;
      min-height: 30px;
      padding: 6px 10px;
      font-weight: 600;
      font-size: 14px;
    }
    .meta {
      display: grid;
      gap: 10px;
    }
    .meta-box {
      border: 1px solid #E8E2D5;
      border-radius: 6px;
      background: #fff;
      padding: 8px 10px;
    }
    .meta-box .k {
      font-size: 11px; font-weight: 800; color: #92938B; letter-spacing: 0.04em;
    }
    .meta-box .v {
      font-size: 18px; font-weight: 800; margin-top: 2px;
    }
    .qr-wrap { text-align: center; }
    .qr-wrap img { width: 110px; height: 110px; image-rendering: pixelated; }
    .serial {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-top: 4px;
      font-family: ui-monospace, monospace;
      color: #5C3D1E;
    }
    .stub-body { padding: 12px 14px; font-size: 12px; }
    .stub-line {
      display: flex; justify-content: space-between; gap: 8px;
      padding: 5px 0; border-bottom: 1px solid #E8E2D5;
    }
    .stub-line span:first-child { font-weight: 800; color: #92938B; }
    .stub-line span:last-child { font-weight: 700; text-align: right; }
    .stub-qr { text-align: center; margin-top: 12px; }
    .stub-qr img { width: 96px; height: 96px; }
    .foot {
      max-width: 860px; margin: 14px auto 0;
      font-size: 12px; color: #6b7280; text-align: center;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .ticket { box-shadow: none; }
      .foot { display: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="main">
      <div class="bar">Bus Ticket</div>
      <div class="body">
        <div class="grid">
          <div class="fields">
            <div class="row"><div class="label">DATE</div><div class="box">${date}</div></div>
            <div class="row"><div class="label">TIME</div><div class="box">${time}</div></div>
            <div class="row"><div class="label">FROM</div><div class="box">${from}</div></div>
            <div class="row"><div class="label">TO</div><div class="box">${to}</div></div>
          </div>
          <div class="meta">
            <div class="meta-box"><div class="k">Bus No.</div><div class="v">${busNo}</div></div>
            <div class="meta-box"><div class="k">Seat No.</div><div class="v">${seatNo}</div></div>
          </div>
          <div class="qr-wrap">
            <img src="${t.qrDataUrl}" alt="Ticket QR" />
            <div class="serial">${serial}</div>
          </div>
        </div>
        <p style="margin:14px 0 0;font-size:12px;color:#6b7280;">
          Passenger: <strong>${passenger}</strong> · Operator: <strong>${company}</strong> · Ticket: <strong>${ticketNo}</strong> · Verify: <strong>${verificationId}</strong>
        </p>
      </div>
    </div>
    <div class="stub">
      <div class="bar">Passenger<br/>Ticket</div>
      <div class="stub-body">
        <div class="stub-line"><span>DATE :</span><span>${date}</span></div>
        <div class="stub-line"><span>TIME :</span><span>${time}</span></div>
        <div class="stub-line"><span>FROM :</span><span>${from}</span></div>
        <div class="stub-line"><span>TO :</span><span>${to}</span></div>
        <div class="stub-line"><span>BUS NO :</span><span>${busNo}</span></div>
        <div class="stub-line"><span>SEAT NO :</span><span>${seatNo}</span></div>
        <div class="stub-qr">
          <img src="${t.qrDataUrl}" alt="Stub QR" />
          <div class="serial">${serial}</div>
        </div>
      </div>
    </div>
  </div>
  <p class="foot">Show this ticket at boarding. Admin scans QR or enters serial / verification ID. Status: ${esc(t.status)} · Fare: ৳${t.fare}</p>
</body>
</html>`;
}
