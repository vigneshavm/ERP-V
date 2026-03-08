// Type declaration for jspdf-autotable
declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';

    interface AutoTableOptions {
        head?: any[][];
        body?: any[][];
        startY?: number;
        styles?: {
            fontSize?: number;
            cellPadding?: number;
            [key: string]: any;
        };
        headStyles?: {
            [key: string]: any;
        };
        [key: string]: any;
    }

    export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
