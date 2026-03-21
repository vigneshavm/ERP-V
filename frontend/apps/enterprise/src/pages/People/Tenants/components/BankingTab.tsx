import React from 'react';
import { Building2 } from 'lucide-react';

export const BankingTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    // Defensive fallback for bankingDetails
    const bankingDetails = newTenant.bankingDetails ?? {
        bankName: '', accountNumber: '', accountHolderName: '', ifsc: '', booksStartDate: '', financialYearClosing: '03-31'
    };

    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-[var(--erp-bg-sunken)] p-4 rounded-lg border border-default space-y-4">
                <h3 className="text-sm font-bold text-main mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted" />
                    Banking Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-secondary mb-1">Bank Name</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={bankingDetails.bankName}
                            onChange={e => setNewTenant({ ...newTenant, bankingDetails: { ...newTenant.bankingDetails, bankName: e.target.value } })}
                            placeholder="e.g. HDFC Bank"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Account Number</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={bankingDetails.accountNumber}
                            onChange={e => setNewTenant({ ...newTenant, bankingDetails: { ...newTenant.bankingDetails, accountNumber: e.target.value } })}
                            placeholder="Use robust masking in production"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">IFSC Code</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                            value={bankingDetails.ifsc}
                            onChange={e => setNewTenant({ ...newTenant, bankingDetails: { ...newTenant.bankingDetails, ifsc: e.target.value.toUpperCase() } })}
                            placeholder="HDFC0001234"
                            maxLength={11}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-secondary mb-1">Account Holder Name</label>
                        <input
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={bankingDetails.accountHolderName}
                            onChange={e => setNewTenant({ ...newTenant, bankingDetails: { ...newTenant.bankingDetails, accountHolderName: e.target.value } })}
                            placeholder="Registered Business Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Books Start Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={bankingDetails.booksStartDate}
                            onChange={e => setNewTenant({ ...newTenant, bankingDetails: { ...newTenant.bankingDetails, booksStartDate: e.target.value } })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Financial Year Closing</label>
                        <select
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={bankingDetails.financialYearClosing}
                            onChange={e => setNewTenant({ ...newTenant, bankingDetails: { ...newTenant.bankingDetails, financialYearClosing: e.target.value } })}
                        >
                            <option value="03-31">March 31 (India/UK)</option>
                            <option value="12-31">December 31 (US/Global)</option>
                            <option value="06-30">June 30 (Australia)</option>
                            <option value="09-30">September 30</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
