import React from 'react';
import { Search } from 'lucide-react';
import { Button, Input, Select } from '../../../components/shared';

interface PayablesFiltersProps {
    viewMode: 'bill-wise' | 'vendor-wise';
    onViewModeChange: (mode: 'bill-wise' | 'vendor-wise') => void;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    statusFilter: 'All' | 'Overdue' | 'Due Soon' | 'Future';
    onStatusFilterChange: (status: 'All' | 'Overdue' | 'Due Soon' | 'Future') => void;
    vendorFilter: string;
    onVendorFilterChange: (vendorId: string) => void;
    suppliers: any[];
}

const PayablesFilters: React.FC<PayablesFiltersProps> = ({
    viewMode,
    onViewModeChange,
    searchTerm,
    onSearchTermChange,
    statusFilter,
    onStatusFilterChange,
    vendorFilter,
    onVendorFilterChange,
    suppliers
}) => {
    return (
        <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                <Button
                    variant={viewMode === 'bill-wise' ? 'success' : 'tertiary'}
                    size="sm"
                    onClick={() => onViewModeChange('bill-wise')}
                >
                    Bill-wise
                </Button>
                <Button
                    variant={viewMode === 'vendor-wise' ? 'success' : 'tertiary'}
                    size="sm"
                    onClick={() => onViewModeChange('vendor-wise')}
                >
                    Vendor-wise
                </Button>
            </div>

            <div className="flex gap-2 flex-grow max-w-4xl">
                <div className="flex-grow">
                    <Input
                        type="text"
                        placeholder="Search Vendor / Bill #..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        icon={<Search className="w-4 h-4 text-slate-400" />}
                    />
                </div>

                <Select
                    options={[
                        { value: 'All', label: 'All Statuses' },
                        { value: 'Overdue', label: 'Overdue' },
                        { value: 'Due Soon', label: 'Due Soon' },
                        { value: 'Future', label: 'Future Dues' },
                    ]}
                    value={statusFilter}
                    onChange={(value) => onStatusFilterChange((typeof value === 'string' ? value : value[0]) as any)}
                />

                <Select
                    options={[
                        { value: '', label: 'All Vendors' },
                        ...suppliers.map(s => ({ value: s._id, label: s.businessName }))
                    ]}
                    value={vendorFilter}
                    onChange={(value) => onVendorFilterChange(typeof value === 'string' ? value : value[0])}
                />
            </div>
        </div>
    );
};

export default PayablesFilters;
