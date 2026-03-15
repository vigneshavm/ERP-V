"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@repo/shared';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    showCloseIcon?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '420px',
    showCloseIcon = true
}) => {
    const { t } = useLanguage();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 1500,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    {/* Backdrop Click Handler */}
                    <div
                        style={{ position: 'absolute', inset: 0, zIndex: -1 }}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="glass-card"
                        style={{
                            width: '100%',
                            maxWidth: maxWidth,
                            background: 'var(--card-bg)',
                            padding: '28px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            position: 'relative',
                            zIndex: 1
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{title}</h3>
                            {showCloseIcon && (
                                <button
                                    onClick={onClose}
                                    aria-label={t('common.close') || 'Close'}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        padding: '4px',
                                        cursor: 'pointer'
                                    }}
                                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'var(--surface-overlay-strong)'}
                                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'var(--surface-overlay)'}
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
