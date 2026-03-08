import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthAlertProps {
    type: 'error' | 'success' | 'info';
    title?: string;
    message: string;
}

const config = {
    error: {
        bg: 'bg-rose-500/[0.03]',
        border: 'border-rose-500/20',
        icon: XCircle,
        iconColor: 'text-rose-500',
        titleColor: 'text-rose-400',
        textColor: 'text-rose-400/80',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]',
    },
    success: {
        bg: 'bg-emerald-500/[0.03]',
        border: 'border-emerald-500/20',
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
        titleColor: 'text-emerald-400',
        textColor: 'text-emerald-400/80',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    },
    info: {
        bg: 'bg-indigo-500/[0.03]',
        border: 'border-indigo-500/20',
        icon: Info,
        iconColor: 'text-indigo-400',
        titleColor: 'text-indigo-300',
        textColor: 'text-indigo-300/80',
        glow: 'shadow-[0_0_20px_rgba(99,102,241,0.1)]',
    },
};

const AuthAlert: React.FC<AuthAlertProps> = ({ type, title, message }) => {
    if (!message) return null;

    const c = config[type] || config.info;
    const Icon = c.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`${c.bg} border ${c.border} ${c.glow} rounded-2xl p-4 flex items-start gap-4 backdrop-blur-xl relative overflow-hidden group`}
            role="alert"
        >
            {/* Ambient inner glow */}
            <div className={`absolute top-0 left-0 w-1 h-full ${c.iconColor.replace('text-', 'bg-')} opacity-40`} />
            
            <div className="shrink-0 mt-0.5 relative">
                <Icon className={`w-5 h-5 ${c.iconColor} group-hover:scale-110 transition-transform duration-500`} />
                <Icon className={`w-5 h-5 ${c.iconColor} absolute inset-0 blur-sm opacity-50`} />
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
                {title && (
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${c.titleColor} italic`}>
                        {title}
                    </p>
                )}
                <p className={`text-[12px] font-bold ${c.textColor} leading-tight italic`}>
                    {message}
                </p>
            </div>
        </motion.div>
    );
};

export default AuthAlert;
