import React from 'react';
import { POSLogic } from '../../hooks/usePOSLogic';
import { Skeleton } from '../layout/SkeletonLoader';

const StandardPOSTemplate = React.lazy(() => import('./templates/StandardPOSTemplate.tsx'));
const TextilePOSTemplate = React.lazy(() => import('./templates/TextilePOSTemplate.tsx'));

interface POSTemplateRegistryProps {
    logic: POSLogic;
}

/**
 * POSTemplateRegistry
 * 
 * This component decides which POS UI template to render based on the current sector.
 * It uses React.lazy to ensure that only the required template is loaded,
 * reducing the initial bundle size for POS users.
 */
export const POSTemplateRegistry: React.FC<POSTemplateRegistryProps> = ({ logic }) => {
    const { currentSector } = logic;

    const renderTemplate = () => {
        switch (currentSector) {
            case 'Textile':
                return <TextilePOSTemplate logic={logic} />;
            case 'Pharmacy':
                return <StandardPOSTemplate logic={logic} />;
            default:
                return <StandardPOSTemplate logic={logic} />;
        }
    };

    return (
        <React.Suspense fallback={<div className="p-8"><Skeleton className="w-full h-[600px] rounded-3xl" /></div>}>
            {renderTemplate()}
        </React.Suspense>
    );
};
