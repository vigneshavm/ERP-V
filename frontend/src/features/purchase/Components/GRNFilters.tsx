import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { Button, Card, Input, Select } from '../../../components/shared';

interface GRNFiltersProps {
    searchTerm: string;
    statusFilter: string;
    dateFrom: string;
    dateTo: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onClear: () => void;
}

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Status' },
    { value: 'COMPLETE', label: 'Complete' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PENDING', label: 'Pending' },
];

const GRNFilters: React.FC<GRNFiltersProps> = ({
    searchTerm,
    statusFilter,
    dateFrom,
    dateTo,
    onSearchChange,
    onStatusChange,
    onDateFromChange,
    onDateToChange,
    onClear
}) => {
    return (
        <Card variant="default" size="md">
            <Card.Body className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-secondary font-bold uppercase mb-1 block">Search</label>
                    <Input
                        type="text"
                        placeholder="GRN #, PO #, or Vendor..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        icon={<Search className="w-4 h-4 text-slate-400" />}
                    />
                </div>

                <div>
                    <label className="text-xs text-secondary font-bold uppercase mb-1 block">From Date</label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={e => onDateFromChange(e.target.value)}
                        icon={<Calendar className="w-4 h-4 text-slate-400" />}
                    />
                </div>

                <div>
                    <label className="text-xs text-secondary font-bold uppercase mb-1 block">To Date</label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={e => onDateToChange(e.target.value)}
                        icon={<Calendar className="w-4 h-4 text-slate-400" />}
                    />
                </div>

                <div>
                    <label className="text-xs text-secondary font-bold uppercase mb-1 block">Status</label>
                    <Select
                        options={STATUS_OPTIONS}
                        value={statusFilter}
                        onChange={(value) => onStatusChange(typeof value === 'string' ? value : value[0])}
                    />
                </div>

                <Button variant="secondary" size="md" onClick={onClear}>
                    Clear
                </Button>
            </Card.Body>
        </Card>
    );
};

export default GRNFilters;
