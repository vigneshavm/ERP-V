import React from 'react';

interface CashBankFormSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    gridCols?: string;
}

const CashBankFormSection: React.FC<CashBankFormSectionProps> = ({
    title,
    children,
    className = "",
    gridCols = "grid-cols-1 md:grid-cols-2"
}) => (
    <div className={`space-y-4 ${className}`}>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            {title}
        </h3>
        <div className={`grid ${gridCols} gap-4`}>
            {children}
        </div>
    </div>
);

export default CashBankFormSection;
