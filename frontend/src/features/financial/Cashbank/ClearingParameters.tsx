import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import api from '../../../services/api'; // Direct API import since no slice action exists yet
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Button, Modal } from '@/components/shared';import { Input } from '@/components/shared/Input';


interface ClearingParametersProps {
    onClose: () => void;
}

const ClearingParameters: React.FC<ClearingParametersProps> = ({ onClose }) => {
    const { currentSector } = useSelector((state: RootState) => state.auth);
    const [parameters, setParameters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);

    const fetchParameters = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/finance/clearing?sector=${currentSector}`);
            setParameters(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParameters();
    }, [currentSector]);

    const handleInitialize = async () => {
        try {
            setInitializing(true);
            await api.post('/api/finance/clearing/init', { sector: currentSector });
            await fetchParameters();
        } catch (err) {
            console.error(err);
            alert('Failed to initialize unit');
        } finally {
            setInitializing(false);
        }
    };

    const handleUpdate = async (id: string, updates: any) => {
        try {
            await api.put(`/api/finance/clearing/${id}`, updates);
            await fetchParameters(); // Refresh to ensure sync
        } catch (err) {
            console.error(err);
            alert('Failed to update parameter');
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Unit Parameters"
            size="lg"
        >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic -mt-4 mb-4">Clearing Configuration for {currentSector}</p>

                    {loading ? (
                        <div className="text-center py-20">Loading Configuration...</div>
                    ) : parameters.length === 0 ? (
                        <div className="text-center py-16 space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4">
                                <Zap className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black italic uppercase">Unit Not Initialized</h4>
                            <p className="text-sm text-slate-500 max-w-md mx-auto">
                                This unit ({currentSector}) does not have clearing parameters defined. Initialize to set defaults.
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                icon={<RefreshCw className={`w-4 h-4 ${initializing ? 'animate-spin' : ''}`} />}
                                onClick={handleInitialize}
                                disabled={initializing}
                                className="mx-auto"
                            >
                                Initialize Unit Protocols
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {parameters.map((param) => (
                                <div key={param._id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-primary/20 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearing Type</p>
                                        <h4 className="text-lg font-black italic uppercase tracking-tight">{param.type}</h4>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearing Days</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={param.clearingDays}
                                                    onChange={(e) => handleUpdate(param._id, { clearingDays: parseInt(e.target.value) })}
                                                    className="w-16 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-center focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                                <span className="text-xs font-bold text-slate-500 uppercase">Days</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdate(param._id, { holidaysIncluded: !param.holidaysIncluded })}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${param.holidaysIncluded ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            >
                                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${param.holidaysIncluded ? 'translate-x-6' : ''}`} />
                                            </button>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Incl. Holidays</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck className="w-4 h-4" /> System Synchronized
                                </div>
                            </div>
                        </div>
                    )}
        </Modal>
    );
};

export default ClearingParameters;
