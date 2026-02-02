import React from 'react';

interface SupplierFormProps {
    mode: 'add' | 'edit';
    supplierId?: string;
    initialData?: any;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ mode, supplierId, initialData }) => {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">{mode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}</h2>
            <p className="text-slate-500">Form implementation coming soon...</p>
            {/* Minimal placeholder content */}
            <div className="mt-4">
                <p>Mode: {mode}</p>
                {supplierId && <p>ID: {supplierId}</p>}
            </div>
        </div>
    );
};

export default SupplierForm;
