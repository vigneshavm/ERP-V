import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { formatCurrency } from '@repo/shared';

interface AnomalyAlertProps {
    isOpen: boolean;
    onClose: () => void;
    onDispute: () => void;
    amount: number;
    reason?: string;
    isDisputing?: boolean;
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({
    isOpen,
    onClose,
    onDispute,
    amount,
    reason,
    isDisputing
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    background: 'var(--bg-color)',
                    opacity: 0.95,
                    backdropFilter: 'blur(8px)'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            background: 'var(--surface-overlay)',
                            borderRadius: '32px',
                            padding: '32px',
                            maxWidth: '440px',
                            width: '100%',
                            border: '1px solid rgba(255, 149, 0, 0.3)',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                            textAlign: 'center',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '40px',
                            background: 'rgba(255, 149, 0, 0.1)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '0 auto 24px',
                            color: 'var(--warning-color, #FF9500)'
                        }}>
                            <ShieldAlert size={40} />
                        </div>

                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
                            Unusual Spend Flagged
                        </h2>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
                            {reason || `This ${formatCurrency(amount)} transaction seems unusual compared to your normal spending patterns.`}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Button
                                size="large"
                                fullWidth
                                onClick={onDispute}
                                isLoading={isDisputing}
                                style={{
                                    background: 'var(--warning-color, #FF9500)',
                                    color: 'black',
                                    fontWeight: 700
                                }}
                                icon={!isDisputing && <AlertTriangle size={20} />}
                            >
                                {isDisputing ? 'Disputing...' : 'One-Tap Dispute'}
                            </Button>

                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={onClose}
                                disabled={isDisputing}
                                style={{ color: 'var(--text-secondary)' }}
                                icon={<ArrowLeft size={18} />}
                            >
                                It&apos;s correct, keep it
                            </Button>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '24px' }}>
                            Disputing will immediately reverse the transaction and restore your balance.
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
