import { Sale } from '../types/sales';
import { Tenant, Branch } from '../types/tenant';
import { generateReceiptJSON } from './receiptGenerator';

export const printSaleReceipt = (sale: Sale, tenant: Tenant, branch: Branch) => {
  // Generate structured receipt data
  const { receipt_data } = generateReceiptJSON(sale, tenant, branch);
  const { header, transaction_details, items, totals, tax_details, footer } = receipt_data;

  // Construct the printable document
  const printWindow = window.open('', '_blank', 'width=400,height=600');

  if (!printWindow) {
    alert("Please allow popups to print the receipt.");
    return;
  }

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px 0;">
        <div style="font-weight: bold;">${item.name}</div>
        <!-- SKU handled if available in item logic, or if mapped in generator -->
      </td>
      <td style="padding: 8px 0; text-align: center; vertical-align: top;">${item.quantity}</td>
      <td style="padding: 8px 0; text-align: right; vertical-align: top;">${item.rate.toFixed(2)}</td>
      <td style="padding: 8px 0; text-align: right; font-weight: bold; vertical-align: top;">${item.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
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
                    <th style="text-align: left; padding: 2px 0;">GST%</th>
                    <th style="text-align: right; padding: 2px 0;">Taxable</th>
                    <th style="text-align: right; padding: 2px 0;">GST</th>
                    <th style="text-align: right; padding: 2px 0;">CGST</th>
                    <th style="text-align: right; padding: 2px 0;">SGST</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: left; padding: 2px 0; font-weight: bold;">${tax_details.gst_percentage}%</td>
                    <td style="text-align: right; padding: 2px 0; font-weight: bold;">${tax_details.taxable_value.toFixed(2)}</td>
                    <td style="text-align: right; padding: 2px 0; font-weight: bold;">${(tax_details.cgst_amount + tax_details.sgst_amount).toFixed(2)}</td>
                    <td style="text-align: right; padding: 2px 0; font-weight: bold;">${tax_details.cgst_amount.toFixed(2)}</td>
                    <td style="text-align: right; padding: 2px 0; font-weight: bold;">${tax_details.sgst_amount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <div class="dashed-line"></div>

        <div class="footer">
          <p>${footer.message_1}</p>
          <p style="margin-top: 10px; font-weight: bold;">${footer.message_2}</p>
        </div>
        
        <!-- Feed Spacer -->
        <div class="feed"></div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.focus(); // Ensure window has focus
              window.print();
            }, 500);
          };
          
          window.onafterprint = function() {
              window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
