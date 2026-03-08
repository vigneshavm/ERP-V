import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AuthAlertProps {
    type: 'error' | 'success' | 'info';
    title?: string;
    message: string;
}

const config = {
    error: {
        bg: 'bg-red-500/[0.06]',
        border: 'border-red-500/15',
        icon: AlertCircle,
        iconColor: 'text-red-400',
        titleColor: 'text-red-300',
        textColor: 'text-red-300/80',
        dot: 'bg-red-400',
    },
    success: {
        bg: 'bg-emerald-500/[0.06]',
        border: 'border-emerald-500/15',
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
        titleColor: 'text-emerald-300',
        textColor: 'text-emerald-300/80',
        dot: 'bg-emerald-400',
    },
    info: {
        bg: 'bg-sky-500/[0.06]',
        border: 'border-sky-500/15',
        icon: Info,
        iconColor: 'text-sky-400',
        titleColor: 'text-sky-300',
        textColor: 'text-sky-300/80',
        dot: 'bg-sky-400',
    },
};

const AuthAlert: React.FC<AuthAlertProps> = ({ type, title, message }) => {
    if (!message) return null;

    const c = config[type] || config.info;
    const Icon = c.icon;

    return (
        <div
            className={`${c.bg} border ${c.border} rounded-xl p-4 flex items-start gap-3`}
            role="alert"
            style={{ animation: 'alertIn 0.35s ease-out' }}
        >
            <div className="shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${c.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                {title && (
                    <p className={`text-xs font-bold ${c.titleColor} mb-0.5`}>{title}</p>
                )}
                <p className={`text-[11px] font-medium ${c.textColor} leading-relaxed`}>{message}</p>
            </div>

            <style>{`
                @keyframes alertIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AuthAlert;
