import { useState, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';

export interface BarcodeFormData {
    itemName: string;
    sku: string;
    price: string | number;
    barcodeType: string;
    quantity: number;
    paperSize: string;
    includePrice: boolean;
    includeName: boolean;
}

export const useBarcodeGenerator = () => {
    const [generated, setGenerated] = useState(false);
    const [bulkGenerated, setBulkGenerated] = useState(false);
    const [error, setError] = useState('');
    
    const barcodeRef = useRef<SVGSVGElement>(null);
    const bulkBarcodeRefs = useRef<(SVGSVGElement | null)[]>([]);

    const computeEAN13CheckDigit = (digits12: string) => {
        const nums = digits12.split('').map((d) => parseInt(d, 10));
        const sum = nums.reduce((acc, n, idx) => acc + n * (idx % 2 === 0 ? 1 : 3), 0);
        return String((10 - (sum % 10)) % 10);
    };

    const computeUPCACheckDigit = (digits11: string) => {
        const nums = digits11.split('').map((d) => parseInt(d, 10));
        const oddSum = nums.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
        const evenSum = nums.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
        const total = oddSum * 3 + evenSum;
        return String((10 - (total % 10)) % 10);
    };

    const validateBarcode = (value: string, type: string) => {
        if (!value || value.trim() === '') return 'Please enter a SKU/Barcode value';
        
        switch (type) {
            case 'EAN13':
                if (!/^\d{12,13}$/.test(value.replace(/\s/g, ''))) return 'EAN13 requires 12 or 13 digits';
                break;
            case 'UPC':
                if (!/^\d{11,12}$/.test(value.replace(/\s/g, ''))) return 'UPC requires 11 or 12 digits';
                break;
        }
        return null;
    };

    const renderBarcode = (ref: SVGSVGElement | null, value: string, type: string) => {
        if (!ref || !value) return;
        try {
            const format = type === 'UPC' ? 'UPC' : type;
            let codeVal = value.replace(/\s/g, '');
            if (format === 'CODE39') codeVal = codeVal.toUpperCase();
            if (format === 'EAN13' && /^\d{12}$/.test(codeVal)) codeVal += computeEAN13CheckDigit(codeVal);
            if (format === 'UPC' && /^\d{11}$/.test(codeVal)) codeVal += computeUPCACheckDigit(codeVal);

            JsBarcode(ref, codeVal, {
                format,
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 14,
                margin: 10,
            });
        } catch (e) {
            console.error('Barcode render error', e);
        }
    };

    return {
        generated,
        setGenerated,
        bulkGenerated,
        setBulkGenerated,
        error,
        setError,
        barcodeRef,
        bulkBarcodeRefs,
        validateBarcode,
        renderBarcode,
        computeEAN13CheckDigit,
        computeUPCACheckDigit
    };
};
