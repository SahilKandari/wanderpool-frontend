import type { Booking } from "@/lib/types/booking";

function fmt(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Generates the receipt HTML used for both PDF and print. */
export function receiptHTML(booking: Booking): string {
  const isPartial = booking.payment_mode === "partial";
  const paidPaise = booking.amount_paid_paise ?? booking.total_paise;
  const remainingPaise = booking.total_paise - paidPaise;
  const bookedOn = new Date(booking.created_at ?? Date.now()).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WanderPool Booking Confirmation — ${booking.booking_code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 20px 16px;
    }
    .page {
      width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #0f766e 0%, #16a34a 100%);
      padding: 20px 24px 18px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-logo {
      width: 32px; height: 32px;
      background: rgba(255,255,255,0.2);
      border-radius: 7px;
      font-weight: 800; font-size: 15px;
      line-height: 32px;
      text-align: center;
    }
    .brand-name { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; }
    .header-sub { font-size: 11px; opacity: 0.75; padding-left: 40px; }
    .booking-ref { text-align: right; }
    .booking-ref .label { font-size: 10px; opacity: 0.7; margin-bottom: 4px; letter-spacing: 0.05em; text-transform: uppercase; }
    .booking-ref .code {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 16px; font-weight: 700;
      background: rgba(255,255,255,0.15);
      padding: 0 10px; border-radius: 6px;
      display: inline-block;
      line-height: 30px;
      height: 30px;
    }
    /* ── Status bar ── */
    .status-bar {
      background: #f0fdf4;
      border-bottom: 1px solid #bbf7d0;
      padding: 8px 24px;
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 600; color: #15803d;
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }
    /* ── Experience block ── */
    .experience-block { padding: 16px 24px 0; }
    .experience-name {
      font-size: 17px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 5px;
    }
    .experience-meta {
      font-size: 12px; color: #64748b;
      display: flex; align-items: center; gap: 5px;
    }
    /* ── Details grid ── */
    .details-grid {
      padding: 14px 24px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .detail-item .detail-label {
      font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em;
      color: #94a3b8; font-weight: 600; margin-bottom: 3px;
    }
    .detail-item .detail-value {
      font-size: 13px; font-weight: 600; color: #1e293b;
    }
    /* ── Dividers ── */
    .divider { height: 1px; background: #f1f5f9; margin: 0 24px; }
    .divider-dashed { border: none; border-top: 1.5px dashed #e2e8f0; margin: 0 24px; }
    /* ── Guest block ── */
    .guest-block { padding: 14px 24px; }
    .section-title {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
      color: #94a3b8; font-weight: 600; margin-bottom: 8px;
    }
    .guest-name { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 3px; }
    .guest-contact { font-size: 12px; color: #64748b; line-height: 1.7; }
    /* ── Payment block ── */
    .payment-block { padding: 14px 24px; }
    .payment-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; color: #475569; padding: 4px 0;
      border-bottom: 1px solid #f8fafc;
    }
    .payment-row:last-child { border-bottom: none; }
    .payment-row.total {
      font-size: 13px; font-weight: 700; color: #1e293b; padding-top: 8px;
      border-top: 1.5px solid #e2e8f0; margin-top: 3px;
    }
    .payment-row.paid-now .val { color: #16a34a; font-weight: 700; }
    .payment-row.due .val { color: #d97706; }
    /* ── What's next ── */
    .next-block {
      background: #f8fafc; border-top: 1px solid #f1f5f9;
      padding: 14px 24px;
    }
    .next-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #475569; padding: 3px 0;
    }
    .next-dot {
      width: 5px; height: 5px; border-radius: 50%; background: #16a34a;
      flex-shrink: 0;
    }
    /* ── Footer ── */
    .footer {
      background: #0f172a; color: #94a3b8;
      padding: 12px 24px;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px;
    }
    .footer strong { color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="brand">
          <div class="brand-logo">W</div>
          <span class="brand-name">WanderPool</span>
        </div>
        <div class="header-sub">Booking Confirmation &middot; ${bookedOn}</div>
      </div>
      <div class="booking-ref">
        <div class="label">Booking ID</div>
        <div class="code">${booking.booking_code}</div>
      </div>
    </div>

    <!-- Status -->
    <div class="status-bar">
      <div class="status-dot"></div>
      Booking Confirmed &amp; Payment Received
    </div>

    <!-- Experience -->
    <div class="experience-block">
      <div class="experience-name">${booking.experience_title}</div>
      <div class="experience-meta">&#128205; ${booking.location_city ?? ""}${booking.location_name ? " &middot; " + booking.location_name : ""}</div>
    </div>

    <!-- Details grid -->
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Date</div>
        <div class="detail-value">${fmtDate(booking.slot_date)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Time</div>
        <div class="detail-value">${booking.slot_start_time ?? "—"}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Participants</div>
        <div class="detail-value">${booking.participants} ${booking.participants === 1 ? "person" : "people"}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Payment Mode</div>
        <div class="detail-value">${isPartial ? "Partial (booking fee)" : "Full payment"}</div>
      </div>
    </div>

    <hr class="divider" />

    <!-- Guest -->
    <div class="guest-block">
      <div class="section-title">Guest Details</div>
      <div class="guest-name">${booking.customer_name}</div>
      <div class="guest-contact">
        ${booking.customer_email ?? ""}${booking.customer_email && booking.customer_phone ? " &middot; " : ""}${booking.customer_phone ?? ""}
      </div>
    </div>

    <hr class="divider-dashed" />

    <!-- Payment -->
    <div class="payment-block">
      <div class="section-title">Payment Breakdown</div>
      <div class="payment-row">
        <span>Subtotal</span><span>${fmt(booking.subtotal_paise ?? booking.total_paise)}</span>
      </div>
      ${(booking.subtotal_paise - booking.total_paise) > 0 ? `<div class="payment-row"><span>Discount</span><span style="color:#16a34a">-${fmt(booking.subtotal_paise - booking.total_paise)}</span></div>` : ""}
      <div class="payment-row paid-now">
        <span>Paid now</span><span class="val">${fmt(paidPaise)}</span>
      </div>
      ${isPartial && remainingPaise > 0 ? `<div class="payment-row due"><span>Due at venue</span><span class="val">${fmt(remainingPaise)}</span></div>` : ""}
      <div class="payment-row total">
        <span>Total Amount</span><span>${fmt(booking.total_paise)}</span>
      </div>
    </div>

    <hr class="divider" />

    <!-- What's next -->
    <div class="next-block">
      <div class="section-title">What Happens Next</div>
      <div class="next-item"><div class="next-dot"></div><span>Your guide will contact you on WhatsApp within 30 minutes</span></div>
      <div class="next-item"><div class="next-dot"></div><span>You'll receive a reminder 48 hours before with meeting point details &amp; what to bring</span></div>
      <div class="next-item"><div class="next-dot"></div><span>Show this booking ID <strong>${booking.booking_code}</strong> at the venue</span></div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span><strong>WanderPool</strong> &middot; Uttarakhand Adventures</span>
      <span>Support: WhatsApp 7am&ndash;8pm</span>
    </div>
  </div>
</body>
</html>`;
}

/** Renders the receipt HTML into a canvas via a hidden iframe. */
async function renderReceiptCanvas(booking: Booking): Promise<HTMLCanvasElement> {
  const [{ default: html2canvas }] = await Promise.all([import("html2canvas")]);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:592px;height:0;opacity:0;border:none;pointer-events:none;";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(receiptHTML(booking));
  iframeDoc.close();

  // Wait for fonts/layout to settle
  await new Promise((r) => setTimeout(r, 700));

  const el = iframeDoc.body;
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f8fafc",
    width: 592,
    windowWidth: 592,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(iframe);
  return canvas;
}

/** Downloads the booking as a single-page PDF. */
export async function downloadReceiptPDF(
  booking: Booking,
  filename?: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const canvas = await renderReceiptCanvas(booking);
  const imgData = canvas.toDataURL("image/png");

  // Use a custom page size that exactly matches the canvas aspect ratio
  // so everything fits on exactly one page.
  const pxPerMm = 72 / 25.4; // jsPDF default 72dpi
  const pdfW = 210; // A4 width in mm
  const pdfH = (canvas.height / canvas.width) * pdfW;

  const pdf = new jsPDF({ unit: "mm", format: [pdfW, pdfH], orientation: "portrait" });
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

  // suppress unused var warning
  void pxPerMm;

  pdf.save(filename ?? `WanderPool-${booking.booking_code}.pdf`);
}

/** Shares the booking PDF via Web Share API. Falls back to download. */
export async function shareReceiptPDF(booking: Booking): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const canvas = await renderReceiptCanvas(booking);
  const imgData = canvas.toDataURL("image/png");

  const pdfW = 210;
  const pdfH = (canvas.height / canvas.width) * pdfW;

  const pdf = new jsPDF({ unit: "mm", format: [pdfW, pdfH], orientation: "portrait" });
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

  const pdfBlob = pdf.output("blob");
  const file = new File([pdfBlob], `WanderPool-${booking.booking_code}.pdf`, {
    type: "application/pdf",
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `WanderPool Booking — ${booking.experience_title}`,
      text: `Booking confirmed! ID: ${booking.booking_code}`,
    });
  } else if (navigator.share) {
    await navigator.share({
      title: `WanderPool Booking — ${booking.experience_title}`,
      text: `Booking ID: ${booking.booking_code}\n${booking.experience_title}\n${new Date(booking.slot_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    });
  } else {
    pdf.save(`WanderPool-${booking.booking_code}.pdf`);
  }
}
