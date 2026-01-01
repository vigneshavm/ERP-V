import { Sale } from '../types/sales';

export const printSaleReceipt = (sale: Sale, tenantName: string, branchName: string) => {
    // Construct the printable document
    const printWindow = window.open('', '_blank', 'width=400,height=600');

    if (!printWindow) {
        alert("Please allow popups to print the receipt.");
        return;
    }

    const itemsHtml = sale.items.map(item => `
    <tr>
      <td style="padding: 8px 0;">
        <div style="font-weight: bold;">${item.name}</div>
        <div style="font-size: 10px; color: #666;">${item.sku}</div>
      </td>
      <td style="padding: 8px 0; text-align: center; vertical-align: top;">${item.qty}</td>
      <td style="padding: 8px 0; text-align: right; vertical-align: top;">${item.price.toFixed(2)}</td>
      <td style="padding: 8px 0; text-align: right; font-weight: bold; vertical-align: top;">${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

    const subtotal = (sale.total / (sale.taxMode === 'EXCLUSIVE' ? 1.18 : 1)).toFixed(2);
    const tax = (sale.total - parseFloat(subtotal)).toFixed(2);

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt #${sale.id}</title>
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
          th { border-bottom: 1px dashed #000; text-align: left; padding-bottom: 5px; color: #666; font-size: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
          .header p { margin: 5px 0; font-size: 10px; color: #666; text-transform: uppercase; }
          .dashed-line { border-bottom: 1px dashed #ccc; margin: 15px 0; }
          .details { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 15px; }
          .totals { border-top: 2px solid #000; pt-10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 16px; font-weight: bold; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; }
          @page { margin: 0; size: auto; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${tenantName}</h1>
          <p>${sale.sector} &bull; ${branchName}</p>
          <div class="dashed-line"></div>
        </div>

        <div class="details">
          <div>
            <p>Bill No: <strong>#${sale.id}</strong></p>
          </div>
          <div style="text-align: right;">
            <p>Date: ${new Date(sale.date).toLocaleDateString()}</p>
            <p>${new Date(sale.date).toLocaleTimeString()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹${subtotal}</span>
          </div>
          ${sale.taxMode === 'EXCLUSIVE' ? `
            <div class="total-row" style="color: #666;">
              <span>Tax (18%)</span>
              <span>₹${tax}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>TOTAL</span>
            <span>₹${sale.total.toFixed(2)}</span>
          </div>
          <div class="total-row" style="font-size: 10px; margin-top: 5px;">
            <span>Payment Mode</span>
            <span style="text-transform: uppercase; font-weight: bold;">${sale.paymentMethod}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>No returns without invoice.</p>
          <p style="margin-top: 20px; opacity: 0.3;">Powered by EnterpriseMgr</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
};
