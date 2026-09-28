import { describe, it, expect } from 'vitest';
import { buildReportCsv, csvCell, reportFileName } from './reportExport';

describe('csvCell', () => {
    it('quotes commas, quotes and newlines', () => {
        expect(csvCell('Ravi, Mukkudal')).toBe('"Ravi, Mukkudal"');
        expect(csvCell('5" hem')).toBe('"5"" hem"');
        expect(csvCell('a\nb')).toBe('"a\nb"');
    });

    it('writes numbers raw, rounded to 3 dp; blanks for missing', () => {
        expect(csvCell(4234946)).toBe('4234946');
        expect(csvCell(2.34567)).toBe('2.346');
        expect(csvCell(NaN)).toBe('');
        expect(csvCell(null)).toBe('');
        expect(csvCell(undefined)).toBe('');
    });
});

describe('buildReportCsv', () => {
    it('puts the audit block, a blank line, then the table', () => {
        const csv = buildReportCsv([['Report', 'Sales Report'], ['Data source', 'Textilesoft SQL']], ['Bill', 'Amount'], [['4243', 12450.5]]);
        expect(csv.split('\r\n')).toEqual(['Report,Sales Report', 'Data source,Textilesoft SQL', '', 'Bill,Amount', '4243,12450.5']);
    });
});

describe('reportFileName', () => {
    it('uses the report id and period', () => {
        expect(reportFileName('sales', '2026-04-01', '2026-09-23')).toBe('sales_2026-04-01_2026-09-23.csv');
        expect(reportFileName('all-parties')).toMatch(/^all-parties_\d{4}-\d{2}-\d{2}\.csv$/);
    });
});
