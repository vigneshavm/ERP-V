import React, { useState, useEffect, useCallback } from 'react';
import { Store, MapPin, Phone, Layers, Loader2, Plus, Check, CheckCircle2 } from 'lucide-react';
import { GeneralTabProps } from './types';
import api from '../../../services/api';

interface BusinessSectorData {
    _id: string;
    id?: string;
    name: string;
    description?: string;
}

interface ProductCategoryData {
    _id: string;
    id?: string;
    name: string;
    description?: string;
    gstRate?: number;
    defaultUnit?: string;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
    appName, setAppName, businessType, setBusinessType,
    addressLine1, setAddressLine1, city, setCity, state, setState, pincode, setPincode,
    phone, setPhone, email, setEmail, website, setWebsite
}) => {
    const [sectors, setSectors] = useState<BusinessSectorData[]>([]);
    const [categories, setCategories] = useState<ProductCategoryData[]>([]);
    const [isLoadingSectors, setIsLoadingSectors] = useState<boolean>(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);

    // Which of this sector's mapped Product Categories the user has checked,
    // to be copied into their own tenant-scoped Category collection (the same
    // one Category Manager and the Inventory "Register SKU" dropdown read
    // from). Selecting here doesn't change anything by itself -- it only
    // takes effect once "Add Selected" actually calls the create-category API.
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<Set<string>>(new Set());
    const [isAddingCategories, setIsAddingCategories] = useState<boolean>(false);
    const [addCategoriesResult, setAddCategoriesResult] = useState<{ added: number; existed: number; failed: number } | null>(null);

    // The tenant's real, already-registered Category names (lower-cased) --
    // this is what makes the checklist reflect actual data instead of
    // resetting every time the tab reopens or the sector changes. Sourced
    // from the same GET /api/inventory/categories the Register SKU dropdown
    // uses; its `isRegistered` flag is true only for names backed by a real
    // Category document for this tenant (not just item usage or sector
    // master data), which is exactly what "already added" should mean here.
    const [registeredCategoryNames, setRegisteredCategoryNames] = useState<Set<string>>(new Set());
    const [isLoadingRegistered, setIsLoadingRegistered] = useState<boolean>(false);

    const fetchRegisteredCategories = useCallback(async () => {
        setIsLoadingRegistered(true);
        try {
            const res = await api.get('/api/inventory/categories', { params: { limit: 100000 } });
            const rows: Array<{ name: string; isRegistered?: boolean }> = res.data?.data || [];
            setRegisteredCategoryNames(
                new Set(rows.filter(r => r.isRegistered).map(r => r.name.toLowerCase()))
            );
        } catch (err) {
            console.error('Failed to fetch registered categories:', err);
            // Leave whatever was already known rather than wiping the
            // "Added" state to empty on a transient failure.
        } finally {
            setIsLoadingRegistered(false);
        }
    }, []);

    // 0. Load the tenant's real registered-category set once on mount, so the
    // checklist below opens already synced with the database.
    useEffect(() => {
        fetchRegisteredCategories();
    }, [fetchRegisteredCategories]);

    // 1. Fetch Business Sectors from DB API
    useEffect(() => {
        const fetchSectors = async () => {
            setIsLoadingSectors(true);
            try {
                const res = await api.get('/api/business-sectors');
                if (res.data?.success && Array.isArray(res.data.data)) {
                    setSectors(res.data.data);
                    // Set initial businessType if empty
                    if (!businessType && res.data.data.length > 0) {
                        setBusinessType(res.data.data[0].name);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch business sectors:', err);
                // Fallback default sectors
                setSectors([
                    { _id: '1', name: 'Textile & Garments Retail' },
                    { _id: '2', name: 'Electronics Store' },
                    { _id: '3', name: 'Pharmacy' },
                    { _id: '4', name: 'Supermarket' }
                ]);
            } finally {
                setIsLoadingSectors(false);
            }
        };
        fetchSectors();
    }, []);

    // 2. Fetch Mapped Product Categories dynamically whenever businessType changes
    useEffect(() => {
        if (!businessType) return;

        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const res = await api.get('/api/product-categories', {
                    params: { sectorName: businessType }
                });
                if (res.data?.success && Array.isArray(res.data.data)) {
                    setCategories(res.data.data);
                } else {
                    setCategories([]);
                }
            } catch (err) {
                console.error('Failed to fetch mapped categories:', err);
                setCategories([]);
            } finally {
                setIsLoadingCategories(false);
            }
            // A fresh sector's list means any previous selection/result no
            // longer applies to what's on screen.
            setSelectedCategoryNames(new Set());
            setAddCategoriesResult(null);
        };

        fetchCategories();
    }, [businessType]);

    const toggleCategorySelection = (name: string) => {
        setSelectedCategoryNames(prev => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    };

    // Already-registered categories aren't selectable -- there's nothing more
    // for "Add Selected" to do for them, and they're shown as "Added" instead.
    const selectableCategories = categories.filter(c => !registeredCategoryNames.has(c.name.toLowerCase()));
    const allSelected = selectableCategories.length > 0 && selectedCategoryNames.size === selectableCategories.length;
    const toggleSelectAll = () => {
        setSelectedCategoryNames(allSelected ? new Set() : new Set(selectableCategories.map(c => c.name)));
    };

    // Copies each checked sector category into the tenant's own Category
    // collection via the same POST /api/inventory/categories that Category
    // Manager's "New Category" button uses. That endpoint already rejects a
    // duplicate name (either an existing Category doc or an Item already
    // using it) with a 400 -- treated here as "already added", not a failure,
    // since re-selecting an already-registered category is a normal thing to
    // do, not an error a manager needs to see as broken.
    const handleAddSelectedCategories = async () => {
        if (selectedCategoryNames.size === 0) return;
        setIsAddingCategories(true);
        setAddCategoriesResult(null);

        const targets = categories.filter(c => selectedCategoryNames.has(c.name));
        const outcomes = await Promise.allSettled(
            targets.map(cat =>
                api.post('/api/inventory/categories', {
                    name: cat.name,
                    description: cat.description,
                    gstRate: cat.gstRate,
                    defaultUnit: cat.defaultUnit
                })
            )
        );

        let added = 0, existed = 0, failed = 0;
        outcomes.forEach(outcome => {
            if (outcome.status === 'fulfilled') {
                added++;
                return;
            }
            const message: string = outcome.reason?.response?.data?.message || '';
            if (outcome.reason?.response?.status === 400 && /already exists/i.test(message)) {
                existed++;
            } else {
                failed++;
            }
        });

        setAddCategoriesResult({ added, existed, failed });
        setSelectedCategoryNames(new Set());
        setIsAddingCategories(false);
        // Re-sync against the real database instead of assuming the calls
        // above succeeded -- this is what flips freshly-added chips over to
        // the "Added" state immediately, and what makes it persist correctly
        // on the next visit to this tab.
        fetchRegisteredCategories();
    };

    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Business Identity Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-none">Business Identity</h3>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Core details about your organization</p>
                    </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Official App / Business Name</label>
                            <input
                                type="text"
                                value={appName}
                                onChange={e => setAppName(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm"
                                placeholder="e.g. Acme Enterprise"
                            />
                        </div>

                        {/* DB-Driven Business Sector Select */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                <span>Business Sector</span>
                                {isLoadingSectors && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                            </label>
                            <select
                                value={businessType}
                                onChange={e => setBusinessType(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm"
                            >
                                {sectors.map(sec => (
                                    <option key={sec._id || sec.name} value={sec.name}>
                                        {sec.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamically Mapped Product Categories -- selectable, so a manager can
                        pick the ones relevant to their shop and copy them into their own
                        Category list (Category Manager / the Register SKU dropdown) instead
                        of getting all of them by default. */}
                    <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80">
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                                    Mapped Product Categories ({categories.length})
                                </h4>
                                {(isLoadingCategories || isLoadingRegistered) && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-1" />}
                            </div>

                            {selectableCategories.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="text-[10px] font-extrabold text-primary uppercase tracking-widest hover:underline"
                                    >
                                        {allSelected ? 'Clear all' : 'Select all'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddSelectedCategories}
                                        disabled={selectedCategoryNames.size === 0 || isAddingCategories}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isAddingCategories ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Plus className="w-3.5 h-3.5" />
                                        )}
                                        Add Selected{selectedCategoryNames.size > 0 ? ` (${selectedCategoryNames.size})` : ''} to My Categories
                                    </button>
                                </div>
                            )}
                        </div>

                        {addCategoriesResult && (
                            <p className="text-xs font-bold mb-3 text-emerald-600 dark:text-emerald-400">
                                {addCategoriesResult.added > 0 && `${addCategoriesResult.added} added to your Categories`}
                                {addCategoriesResult.existed > 0 && `${addCategoriesResult.added > 0 ? ' · ' : ''}${addCategoriesResult.existed} already in your Categories`}
                                {addCategoriesResult.failed > 0 && (
                                    <span className="text-rose-600 dark:text-rose-400">{(addCategoriesResult.added > 0 || addCategoriesResult.existed > 0) ? ' · ' : ''}{addCategoriesResult.failed} failed</span>
                                )}
                            </p>
                        )}

                        {categories.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => {
                                    const isRegistered = registeredCategoryNames.has(cat.name.toLowerCase());
                                    const isSelected = selectedCategoryNames.has(cat.name);

                                    if (isRegistered) {
                                        // Already backed by a real Category document for this
                                        // tenant -- nothing for "Add Selected" to do, so this
                                        // renders as a plain, non-interactive "Added" state
                                        // rather than a togglable checkbox with no effect.
                                        return (
                                            <div
                                                key={cat._id || cat.name}
                                                title="Already in your Categories"
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{cat.name}</span>
                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Added</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            type="button"
                                            key={cat._id || cat.name}
                                            onClick={() => toggleCategorySelection(cat.name)}
                                            aria-pressed={isSelected}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-xs border transition-all text-left ${
                                                isSelected
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-primary/40'
                                            }`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                            </span>
                                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{cat.name}</span>
                                            {cat.description && (
                                                <span className="text-[10px] text-neutral-400 font-medium">({cat.description})</span>
                                            )}
                                            {typeof cat.gstRate === 'number' && (
                                                <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                                    {cat.gstRate}% GST
                                                </span>
                                            )}
                                            {cat.defaultUnit && (
                                                <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5">
                                                    {cat.defaultUnit}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-neutral-400 italic">No product categories mapped for this sector.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Address & Presence Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-success" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-none">Registered Address</h3>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Primary location for official records</p>
                    </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Street / Building Address</label>
                            <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">State</label>
                                <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-none">Contact Information</h3>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Official communication channels</p>
                    </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Phone</label>
                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Website</label>
                            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all font-bold shadow-sm" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GeneralTab;
