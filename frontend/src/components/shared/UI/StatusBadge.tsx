import React from 'react';
import { Tone, TONE_CLASSES, getStatusTone, formatStatusLabel } from '../../../utils/statusTone';

interface StatusBadgeProps {
    /** Business status, e.g. "PAID", "Overdue", "LOW_STOCK". Decides the colour. */
    status: string | null | undefined;
    /** Text to show instead of the formatted status, e.g. "Overdue 12 days". */
    label?: React.ReactNode;
    /** Force a tone when the status alone doesn't decide it. */
    tone?: Tone;
    size?: 'sm' | 'md';
    className?: string;
}

/**
 * The only badge screens should use for a status. Colour always comes with
 * words, so the meaning never depends on colour alone.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, tone, size = 'md', className = '' }) => {
    const resolved = tone ?? getStatusTone(status);
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${sizeClasses} ${TONE_CLASSES[resolved]} ${className}`}
        >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {label ?? (status ? formatStatusLabel(status) : 'Unknown')}
        </span>
    );
};

export default StatusBadge;
