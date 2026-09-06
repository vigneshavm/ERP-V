import { Sale } from "../types/sales";
import { Tenant, Branch } from "../types/tenant";
import { generateReceiptJSON } from './receiptGenerator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to generate HTML string (shared between print and download)
const generateReceiptHTML = (sale: Sale, tenant: Tenant, branch: Branch): string => {
  const { receipt_data } = generateReceiptJSON(sale, tenant, branch);
  const { header, transaction_details, items, totals, tax_details, footer } = receipt_data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt #${transaction_details.bill_no}</title>
        <style>
          body { 
            background: white; 
            color: black; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px;
            margin: 0;
            padding: 20px;
            width: 80mm; /* Standard Thermal Paper Width */
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { border-bottom: 1px dashed #000; text-align: left; padding-bottom: 5px; color: #000; font-size: 10px; font-weight: bold; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; font-weight: bold; }
          .header p { margin: 5px 0; font-size: 12px; color: #000; text-transform: uppercase; }
          .dashed-line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .details { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 15px; font-weight: bold; }
          .totals { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 16px; font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px;}
          .tax-breakdown { font-size: 10px; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #000; }
          .feed { height: 50px; } 
          @page { margin: 0; size: auto; }
        </style>
      </head>
      <body>
        <div id="receipt-content">
            <div class="header">
            ${header.logo_url ? `<img src="${header.logo_url}" style="width: 100%; height: auto; display: block; margin: 0 auto 10px auto; image-rendering: -webkit-optimize-contrast;" alt="Store Logo" />` : `<h1>${header.store_name}</h1>`}
            <p>${header.store_address}</p>
            ${header.gstin ? `<p>GSTIN: ${header.gstin}</p>` : ''}
            <div class="dashed-line"></div>
            </div>

            <div class="details">
                <span>Bill No: ${transaction_details.bill_no}</span>
                <span>${transaction_details.date}</span>
                <span>${transaction_details.time}</span>
            </div>
            <div class="dashed-line"></div>

            <table class="items">
            <thead>
                <tr>
                <th style="width: 35%; text-align: left;">NAME</th>
                <th style="width: 15%; text-align: right;">RATE</th>
                <th style="width: 15%; text-align: right;">MTR</th>
                <th style="width: 15%; text-align: right;">QTY</th>
                <th style="width: 20%; text-align: right;">AMT</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item) => `
                <tr>
                    <td style="text-align: left;">${item.name}</td>
                    <td style="text-align: right;">${item.rate.toFixed(2)}</td>
                    <td style="text-align: right;">${item.mtr ? item.mtr.toFixed(2) : '0'}</td>
                    <td style="text-align: right;">${item.quantity}</td>
                    <td style="text-align: right;">${item.amount.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
            </table>
            
            <div class="dashed-line"></div>

            <div class="totals">
            ${totals.discount_total && totals.discount_total > 0 ? `
            <div class="total-row">
                <span>Subtotal</span>
                <span>${(totals.subtotal ?? (totals.net_total + totals.discount_total)).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>Discount</span>
                <span>-${totals.discount_total.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row">
                <span>Net Total</span>
                <span>${totals.net_total.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
                <span>Final Total</span>
                <span>${totals.final_total.toFixed(2)}</span>
            </div>
            <div class="total-row" style="margin-top: 5px;">
                <span>Total Quantity: ${totals.total_quantity}</span>
            </div>
            </div>

            <table style="width: 100%; font-size: 12px; margin-top: 5px; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="text-align: left;  padding: 2px 0;">GST%</th>
                        <th style="text-align: right; padding: 2px 0;">Taxable</th>
                        <th style="text-align: right; padding: 2px 0;">CGST</th>
                        <th style="text-align: right; padding: 2px 0;">SGST</th>
                        <th style="text-align: right; padding: 2px 0;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${(() => {
                        const slabs: any[] = tax_details.gst_slabs && tax_details.gst_slabs.length > 0
                            ? tax_details.gst_slabs
                            : [{ rate: tax_details.gst_percentage, taxableValue: tax_details.taxable_value, cgst: tax_details.cgst_amount, sgst: tax_details.sgst_amount }];
                        return slabs.map((s: any) => `
                            <tr>
                                <td style="text-align: left;  padding: 2px 0; font-weight: bold;">${s.rate}%</td>
                                <td style="text-align: right; padding: 2px 0; font-weight: bold;">${(s.taxableValue ?? s.taxable_value ?? 0).toFixed(2)}</td>
                                <td style="text-align: right; padding: 2px 0; font-weight: bold;">${(s.cgst ?? s.cgst_amount ?? 0).toFixed(2)}</td>
                                <td style="text-align: right; padding: 2px 0; font-weight: bold;">${(s.sgst ?? s.sgst_amount ?? 0).toFixed(2)}</td>
                                <td style="text-align: right; padding: 2px 0; font-weight: bold;">${((s.cgst ?? s.cgst_amount ?? 0) + (s.sgst ?? s.sgst_amount ?? 0)).toFixed(2)}</td>
                            </tr>
                        `).join('');
                    })()}
                </tbody>
            </table>

            <div class="dashed-line"></div>

            <div class="footer">
            <p>${footer.message_1}</p>
            <p style="margin-top: 10px; font-weight: bold;">${footer.message_2}</p>
            </div>
            
            <!-- Feed Spacer -->
            <div class="feed"></div>
        </div>
      </body>
    </html>
  `;
};

export const printSaleReceipt = (sale: Sale, tenant: Tenant, branch: Branch, onAfterPrint?: () => void) => {
  const htmlContent = generateReceiptHTML(sale, tenant, branch);

  // Use a hidden iframe instead of a new window for "Silent" printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.srcdoc = htmlContent;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Print failed", e);
      }
    }

    // Execute callback immediately after print dialog closes (print() is blocking in most browsers)
    // This gives us the best chance to restore fullscreen while the "interaction" is still fresh-ish.
    if (onAfterPrint) onAfterPrint();

    // Remove after a delay to ensure print dialog has cleanly detached from internal states
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };
};

export const downloadSaleReceiptPDF = async (sale: Sale, tenant: Tenant, branch: Branch) => {
  // We need to render the HTML to a visible container to capture it with html2canvas
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '80mm'; // Receipt width
  container.style.background = 'white';
  container.style.padding = '20px';

  // Reset basic styles to ensure correct capture
  container.style.color = 'black';
  container.style.fontFamily = "'Courier New', Courier, monospace";

  // Extract body content from the full HTML
  const fullHtml = generateReceiptHTML(sale, tenant, branch);
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, 'text/html');
  const content = doc.getElementById('receipt-content'); // We added this ID in generateReceiptHTML

  if (content) {
    container.innerHTML = content.innerHTML;
    // Re-inject styles manually or rely on inline styles we used. 
    // The HTML we generated uses <style> in head, which won't apply to this isolated div easily unless we scope it.
    // BUT, we used inline styles for table cells mostly.
    // To be safe, let's append the style block too.
    const styleBlock = doc.querySelector('style');
    if (styleBlock) {
      container.appendChild(styleBlock.cloneNode(true));
    }

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2, // Improve quality
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)] // Auto height based on width ratio
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * (80 / canvas.width));
      pdf.save(`Receipt-${sale.id}.pdf`);
    } catch (error) {
      console.error("PDF Download failed", error);
      alert("Could not generate PDF.");
    } finally {
      document.body.removeChild(container);
    }
  }
};
