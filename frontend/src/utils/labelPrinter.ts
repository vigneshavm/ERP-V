import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

export interface LabelData {
    productName: string;
    sku: string;
    sellingPrice: number;
    size?: string;
    color?: string;
    washingInstructions?: string;
}

export const printBarcodeLabels = (items: LabelData[]) => {
    // Standard 50mm x 25mm (2x1 inch) label
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 25]
    });

    items.forEach((item, index) => {
        if (index > 0) {
            doc.addPage([50, 25], 'landscape');
        }

        // Product Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(item.productName.substring(0, 30), 2, 4);

        // Barcode
        const canvas = document.createElement('canvas');
        try {
            JsBarcode(canvas, item.sku, {
                format: 'CODE128',
                width: 1,
                height: 35,
                displayValue: true,
                fontSize: 10,
                margin: 0
            });
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 2, 5, 46, 12);
        } catch (e) {
            console.error('Barcode generation error:', e);
            doc.text(`SKU: ${item.sku}`, 2, 10);
        }

        // Price, Size, Color
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(`PRICE: RS. ${item.sellingPrice}`, 2, 20);
        doc.text(`SIZE: ${item.size || '-'}`, 25, 20);
        doc.text(`COLOR: ${item.color || '-'}`, 2, 23);

        // Washing Instructions (truncated)
        const wash = item.washingInstructions ? `WASH: ${item.washingInstructions}` : 'DRY CLEAN ONLY';
        doc.text(wash.substring(0, 40), 25, 23);
    });

    // Open in new tab for printing
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};
