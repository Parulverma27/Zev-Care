/**
 * pdfInvoiceGenerator.js
 * Generates and downloads a clean, printable PDF tax invoice for Zevota Care bookings.
 */
import { Platform } from 'react-native';

export function downloadInvoicePDF(booking) {
  if (!booking) return;

  const invoiceNum = `INV-2026-${(booking.booking_id || '000125').replace('BK-', '')}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const serviceCharge = Number(booking.service_charge || 0);
  const partsCharge = Number(booking.parts_charge || 0);
  const labourCharge = Number(booking.labour_charge || 0);
  const discountAmount = Number(booking.discount_amount || 0);
  const totalBill = Number(booking.total_bill || (serviceCharge + partsCharge + labourCharge - discountAmount));
  const gstAmount = Math.round(totalBill * 0.18 / 1.18);
  const baseAmount = totalBill - gstAmount;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNum} - Zevota Care</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-logo {
      display: inline-block;
      background: #1e3a8a;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 18px;
      letter-spacing: 1px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }
    .invoice-title-box {
      text-align: right;
    }
    .invoice-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .invoice-num {
      font-size: 13px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 6px;
      background: ${booking.bill_status === 'PAID' ? '#dcfce7' : '#dbeafe'};
      color: ${booking.bill_status === 'PAID' ? '#15803d' : '#1e40af'};
      border: 1px solid ${booking.bill_status === 'PAID' ? '#86efac' : '#93c5fd'};
    }
    .grid {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    .col {
      flex: 1;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .col-title {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .col-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .col-text {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 14px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .total-section {
      background: #1e3a8a;
      color: #ffffff;
      padding: 18px 24px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .total-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #bfdbfe;
    }
    .total-val {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .stamp-box {
      border: 2px dashed #2563eb;
      padding: 8px 14px;
      border-radius: 6px;
      color: #1e3a8a;
      font-weight: 800;
      text-align: center;
      font-size: 10px;
    }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-logo">ZEVOTA CARE</div>
        <div class="brand-sub">Zevota Home Care Technologies Pvt Ltd</div>
        <div class="brand-sub">GSTIN: 27AAACZ1234F1Z9 · CIN: U74999MH2026PTC384920</div>
        <div class="brand-sub">Level 14, Zevota Towers, BKC, Mumbai - 400051</div>
      </div>
      <div class="invoice-title-box">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-num">${invoiceNum}</div>
        <div class="brand-sub">Date: ${currentDate}</div>
        <div class="status-badge">${booking.bill_status === 'PAID' ? 'PAID VIA WALLET' : 'ESTIMATE BILL SENT'}</div>
      </div>
    </div>

    <div class="grid">
      <div class="col">
        <div class="col-title">Billed To (Customer)</div>
        <div class="col-name">${booking.user_name || 'Valued Customer'}</div>
        <div class="col-text">Phone: ${booking.user_phone || 'N/A'}</div>
        <div class="col-text">Address: ${booking.address_text || 'Mumbai, Maharashtra'}</div>
      </div>
      <div class="col">
        <div class="col-title">Service & Technician Details</div>
        <div class="col-name">${booking.service_name || 'Home Service'}</div>
        <div class="col-text">Booking ID: ${booking.booking_id}</div>
        <div class="col-text">Technician: ${booking.provider_name || 'Assigned Partner'}</div>
        <div class="col-text">Category: ${booking.category_name || 'Home Repair'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item & Description</th>
          <th style="text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>Service Visit & Inspection Fee</strong><br>
            <span style="font-size: 11px; color: #64748b;">Technician visit, diagnosis & initial inspection</span>
          </td>
          <td style="text-align: right; font-weight: 700;">₹${serviceCharge.toLocaleString()}</td>
        </tr>
        <tr>
          <td>2</td>
          <td>
            <strong>Replacement Spare Parts & Components</strong><br>
            <span style="font-size: 11px; color: #64748b;">Genuine factory replacement parts</span>
          </td>
          <td style="text-align: right; font-weight: 700;">₹${partsCharge.toLocaleString()}</td>
        </tr>
        <tr>
          <td>3</td>
          <td>
            <strong>Technician Labour & Workmanship</strong><br>
            <span style="font-size: 11px; color: #64748b;">Professional repair, fitting & safety check</span>
          </td>
          <td style="text-align: right; font-weight: 700;">₹${labourCharge.toLocaleString()}</td>
        </tr>
        ${discountAmount > 0 ? `
        <tr>
          <td>4</td>
          <td>
            <strong style="color: #16a34a;">Active Membership / Plan Discount</strong>
          </td>
          <td style="text-align: right; font-weight: 700; color: #16a34a;">-₹${discountAmount.toLocaleString()}</td>
        </tr>` : ''}
        <tr>
          <td colspan="2" style="text-align: right; font-weight: 700;">Subtotal (Excl. Tax)</td>
          <td style="text-align: right; font-weight: 700;">₹${baseAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right; color: #64748b;">IGST @ 18% (Included in total)</td>
          <td style="text-align: right; color: #64748b;">₹${gstAmount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div>
        <div class="total-label">TOTAL AMOUNT PAYABLE</div>
        <div style="font-size: 11px; color: #93c5fd;">Includes all applicable taxes & 30-day warranty</div>
      </div>
      <div class="total-val">₹${totalBill.toLocaleString()}</div>
    </div>

    <div class="footer">
      <div>
        <div><strong>30-Day Service Warranty Guaranteed</strong></div>
        <div>Support: support@zevotacare.com | +91 (022) 6900-4800</div>
        <div>Computer generated invoice. No physical signature required.</div>
      </div>
      <div class="stamp-box">
        ZEVOTA CARE<br>OFFICIAL INVOICE
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      // Fallback download if popup blocked
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNum}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}
