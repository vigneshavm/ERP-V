import React, { useEffect, useState } from 'react';
import { Undo, Redo, X } from 'lucide-react';
import { undo, redo } from '@repo/shared';
import { motion, AnimatePresence } from 'framer-motion';

interface UndoRedoControlsProps {
    onAction: () => void;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ onAction }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [lastAction, setLastAction] = useState<string | null>(null);

    // Provide a way to trigger visibility from outside if needed, 
    // but for now, we'll listen for keyboard shortcuts and show it on Ctrl+Z
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                await undo();
                setLastAction('Undo performed');
                setIsVisible(true);
                onAction();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                await redo();
                setLastAction('Redo performed');
                setIsVisible(true);
                onAction();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onAction]);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setIsVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleUndo = async () => {
        await undo();
        setLastAction('Undo performed');
        onAction();
    };

    const handleRedo = async () => {
        await redo();
        setLastAction('Redo performed');
        onAction();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        bottom: '80px', // Above bottom nav
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        width: 'calc(100% - 32px)',
                        maxWidth: '400px'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{lastAction}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleUndo}
                            style={{
                                background: 'var(--surface-overlay)',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Undo size={18} />
                        </button>
                        <button
                            onClick={handleRedo}
                            style={{
                                background: 'var(--surface-overlay)',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Redo size={18} />
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
