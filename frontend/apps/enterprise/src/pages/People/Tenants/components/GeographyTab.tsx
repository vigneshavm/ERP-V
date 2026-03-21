import React from 'react';
import { MapPin, Globe, X, Plus } from 'lucide-react';

export const GeographyTab: React.FC<{
    newTenant: any, setNewTenant: any,
    tempCity: string, setTempCity: (val: string) => void,
    addCity: () => void, removeCity: (idx: number) => void,
    tempBranch: any, setTempBranch: (val: any) => void,
    addBranch: (idx: number) => void, removeBranch: (cIdx: number, bIdx: number) => void
}> = ({
    newTenant, setNewTenant,
    tempCity, setTempCity, addCity, removeCity,
    tempBranch, setTempBranch, addBranch, removeBranch
}) => {
        // Defensive fallbacks
        const initialBranch = newTenant.initialBranch ?? { code: 'HO', name: 'Head Office', address: '', warehouse: '' };
        const locations = newTenant.locations ?? [];

        return (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-[var(--erp-bg-sunken)] p-4 rounded-lg border border-default space-y-4">
                    <h3 className="text-sm font-bold text-main mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted" />
                        Head Office Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-secondary mb-1">Branch Code</label>
                            <input
                                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={initialBranch.code}
                                onChange={e => setNewTenant({ ...newTenant, initialBranch: { ...newTenant.initialBranch, code: e.target.value } })}
                                placeholder="HO"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-secondary mb-1">Branch Name</label>
                            <input
                                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={initialBranch.name}
                                onChange={e => setNewTenant({ ...newTenant, initialBranch: { ...newTenant.initialBranch, name: e.target.value } })}
                                placeholder="Head Office"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-secondary mb-1">Address</label>
                            <input
                                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={initialBranch.address}
                                onChange={e => setNewTenant({ ...newTenant, initialBranch: { ...newTenant.initialBranch, address: e.target.value } })}
                                placeholder="Primary Location Address"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-secondary mb-1">Default Warehouse</label>
                            <input
                                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={initialBranch.warehouse}
                                onChange={e => setNewTenant({ ...newTenant, initialBranch: { ...newTenant.initialBranch, warehouse: e.target.value } })}
                                placeholder="Main Warehouse"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Additional Regions / Cities</label>
                    <div className="flex gap-2 mb-4">
                        <input
                            value={tempCity}
                            onChange={e => setTempCity(e.target.value)}
                            placeholder="Enter City Name (e.g. Chennai)"
                            className="flex-1 px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
                        />
                        <button
                            type="button"
                            onClick={addCity}
                            className="px-3 py-2 bg-[var(--erp-card)] text-main rounded-lg text-sm font-medium hover:bg-slate-700"
                        >
                            Add
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {locations.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-default rounded-lg">
                                <Globe className="w-8 h-8 text-muted mx-auto mb-2" />
                                <p className="text-xs text-muted">Head Office location will be created automatically.</p>
                                <p className="text-[10px] text-muted mt-1">Add other operating regions here if applicable.</p>
                            </div>
                        )}

                        {locations.map((loc: any, cityIdx: number) => (
                            <div key={cityIdx} className="border border-default rounded-lg overflow-hidden bg-white">
                                <div className="bg-[var(--erp-bg-sunken)] px-3 py-2 flex justify-between items-center border-b border-default">
                                    <span className="font-bold text-secondary text-sm">{loc.city}</span>
                                    <button type="button" onClick={() => removeCity(cityIdx)} className="text-muted hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-3 bg-[var(--erp-bg-sunken)]/50">
                                    <div className="space-y-2 mb-3">
                                        {loc.branches.map((br: any, brIdx: number) => (
                                            <div key={br.id} className="flex justify-between items-center bg-white p-2 rounded border border-default text-xs">
                                                <div>
                                                    <div className="font-semibold text-secondary">{br.name}</div>
                                                    <div className="text-muted truncate max-w-[150px]">{br.address}</div>
                                                </div>
                                                <button type="button" onClick={() => removeBranch(cityIdx, brIdx)} className="text-muted hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {loc.branches.length === 0 && (
                                            <p className="text-[10px] text-muted italic pl-1">No branches in this region.</p>
                                        )}
                                    </div>

                                    {tempBranch.cityIndex === cityIdx ? (
                                        <div className="bg-white p-2 rounded border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                                            <input
                                                autoFocus
                                                placeholder="Branch Name (e.g. South End)"
                                                className="w-full px-2 py-1 border border-default rounded text-xs mb-2 outline-none focus:border-blue-500"
                                                value={tempBranch.name}
                                                onChange={e => setTempBranch((prev: any) => ({ ...prev, name: e.target.value }))}
                                            />
                                            <input
                                                placeholder="Address / Area"
                                                className="w-full px-2 py-1 border border-default rounded text-xs mb-2 outline-none focus:border-blue-500"
                                                value={tempBranch.address}
                                                onChange={e => setTempBranch((prev: any) => ({ ...prev, address: e.target.value }))}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => addBranch(cityIdx)}
                                                    className="flex-1 bg-blue-600 text-white py-1 rounded text-xs font-medium hover:bg-blue-700"
                                                >
                                                    Save Branch
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTempBranch({ cityIndex: -1, name: '', address: '' })}
                                                    className="px-2 border border-default text-secondary py-1 rounded text-xs hover:bg-[var(--erp-bg-sunken)]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setTempBranch({ cityIndex: cityIdx, name: '', address: '' })}
                                            className="w-full py-1.5 border border-dashed border-slate-300 text-muted rounded text-xs hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Branch
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
