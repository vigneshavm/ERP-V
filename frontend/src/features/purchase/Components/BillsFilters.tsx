import React from 'react';
import { Search } from 'lucide-react';
import { Card, Input, Select } from '../../../components/shared';

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'Received', label: 'Received' },
    { value: 'Matched', label: 'Matched' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Disputed', label: 'Disputed' },
    { value: 'Hold', label: 'On Hold' },
];

const BillsFilters: React.FC<Props> = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) => {
    return (
        <Card variant="default" size="md">
            <Card.Body>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-96">
                        <Input
                            type="text"
                            placeholder="Search bill # or supplier..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            icon={<Search className="w-4 h-4 text-slate-400" />}
                        />
                    </div>
                    <Select
                        options={STATUS_OPTIONS}
                        value={statusFilter}
                        onChange={(value) => onStatusFilterChange(typeof value === 'string' ? value : value[0])}
                    />
                </div>
            </Card.Body>
        </Card>
    );
};

export default BillsFilters;
