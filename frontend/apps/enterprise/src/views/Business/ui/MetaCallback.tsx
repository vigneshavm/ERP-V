import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from "@/shared/ui/Layout";
import api from '@/shared/api/api';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const MetaCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting to Meta...');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setStatus('error');
            setMessage('Authorization failed or was cancelled.');
            return;
        }

        if (!code) {
            setStatus('error');
            setMessage('No authorization code received.');
            return;
        }

        const connectMeta = async () => {
            try {
                const response = await api.post('/marketing/meta/auth/callback', { code });
                const data = response.data;

                if (data.success) {
                    setStatus('success');
                    setMessage('Successfully connected to Meta! Redirecting...');
                    setTimeout(() => {
                        navigate('/business/marketing-tools');
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Failed to connect to Meta.');
                }
            } catch (err: any) {
                logger.error(err);
                setStatus('error');
                setMessage('An error occurred while connecting.');
            }
        };

        connectMeta();
    }, [searchParams, navigate]);

    return (
        <Layout>
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            <h2 className="text-xl font-bold text-slate-800">Connecting...</h2>
                            <p className="text-slate-500">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Connected!</h2>
                            <p className="text-slate-500">{message}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
                            <p className="text-slate-500">{message}</p>
                            <button
                                onClick={() => navigate('/business/marketing-tools')}
                                className="mt-4 px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Return to Marketing
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default MetaCallback;
