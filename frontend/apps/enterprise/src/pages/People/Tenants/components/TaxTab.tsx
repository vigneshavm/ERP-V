import React from 'react';
import { AlertCircle } from 'lucide-react';

export const TaxTab: React.FC<{ newTenant: any, setNewTenant: any }> = ({ newTenant, setNewTenant }) => {
    // Defensive fallback for taxDetails
    const taxDetails = newTenant.taxDetails ?? {
        taxSystem: 'GST', gstin: '', pan: '', isGstEnabled: true, isEInvoiceEnabled: false, isEWayBillEnabled: false
    };

    return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Taxation Configuration</label>
                    <div className="flex gap-4 mb-3">
                        {['GST', 'VAT', 'NONE'].map(sys => (
                            <label key={sys} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="taxSystem" value={sys}
                                    checked={taxDetails.taxSystem === sys}
                                    onChange={() => setNewTenant({ ...newTenant, taxDetails: { ...newTenant.taxDetails, taxSystem: sys as any } })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">{sys}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {taxDetails.taxSystem !== 'NONE' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {taxDetails.taxSystem === 'GST' ? 'GSTIN Number' : 'VAT Number'}
                            </label>
                            <input
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                                value={taxDetails.gstin}
                                onChange={e => setNewTenant({ ...newTenant, taxDetails: { ...newTenant.taxDetails, gstin: e.target.value.toUpperCase() } })}
                                placeholder={taxDetails.taxSystem === 'GST' ? '22AAAAA0000A1Z5' : 'VAT123456'}
                                maxLength={15}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
                            <input
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                                value={taxDetails.pan}
                                onChange={e => setNewTenant({ ...newTenant, taxDetails: { ...newTenant.taxDetails, pan: e.target.value.toUpperCase() } })}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                            />
                        </div>
                        <div className="col-span-2 flex gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taxDetails.isEInvoiceEnabled}
                                    onChange={e => setNewTenant({ ...newTenant, taxDetails: { ...newTenant.taxDetails, isEInvoiceEnabled: e.target.checked } })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Enable e-Invoicing</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taxDetails.isEWayBillEnabled}
                                    onChange={e => setNewTenant({ ...newTenant, taxDetails: { ...newTenant.taxDetails, isEWayBillEnabled: e.target.checked } })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Enable e-Way Bill</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
                <div className="flex gap-2">
                    <div className="shrink-0 pt-0.5">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-800">
                        Ensure GSTIN and PAN numbers are valid. Incorrect tax details may lead to invoicing errors.
                    </p>
                </div>
            </div>
        </div>
    );
};
