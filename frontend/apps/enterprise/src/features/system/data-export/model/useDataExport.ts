import { logger } from '@/shared/lib/logger';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface ExportDateRange {
    start: string;
    end: string;
}

export interface ExportConfig {
    selectedModule: string;
    format: ExportFormat;
    dateRange: ExportDateRange;
    includeHeaders: boolean;
    compressFile: boolean;
    splitMonthly: boolean;
}

export const useDataExport = () => {
    const [exporting, setExporting] = useState(false);

    const performExport = async (config: ExportConfig) => {
        try {
            setExporting(true);
            toast.info(`Preparing ${config.selectedModule} export...`);

            let endpoint = '';
            switch (config.selectedModule) {
                case 'inventory': endpoint = '/api/inventory'; break;
                case 'sales': endpoint = '/api/sales'; break;
                case 'purchase': endpoint = '/api/purchase'; break;
                case 'customers': endpoint = '/api/customers'; break;
                case 'suppliers': endpoint = '/api/suppliers'; break;
                case 'ledger': endpoint = '/api/accounting/ledger'; break;
                default: endpoint = '/api/inventory';
            }

            const response = await api.get(endpoint);
            const data = response.data;

            if (!data || (Array.isArray(data) && data.length === 0)) {
                toast.error('No data found for the selected module and range');
                return;
            }

            if (config.format === 'xlsx' || config.format === 'csv') {
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, config.selectedModule.toUpperCase());

                if (config.format === 'xlsx') {
                    XLSX.writeFile(workbook, `${config.selectedModule}_export_${new Date().getTime()}.xlsx`);
                } else {
                    XLSX.writeFile(workbook, `${config.selectedModule}_export_${new Date().getTime()}.csv`, { bookType: 'csv' });
                }
            } else if (config.format === 'pdf') {
                const doc = new jsPDF();
                doc.text(`${config.selectedModule.toUpperCase()} REPORT`, 14, 15);
                doc.setFontSize(10);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

                const headers = Object.keys(data[0]);
                const body = data.map((row: any) => headers.map(h => String(row[h] || '')));

                autoTable(doc, {
                    head: [headers],
                    body: body,
                    startY: 30,
                    styles: { fontSize: 8 }
                });

                doc.save(`${config.selectedModule}_report_${new Date().getTime()}.pdf`);
            }

            toast.success('Data exported successfully');
        } catch (error) {
            logger.error('Export error:', error);
            toast.error('Failed to export data. Please try again later.');
        } finally {
            setExporting(false);
        }
    };

    return {
        exporting,
        performExport
    };
};
