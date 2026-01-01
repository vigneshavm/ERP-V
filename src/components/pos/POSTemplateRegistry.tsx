import React from 'react';
import { POSLogic } from '../../hooks/usePOSLogic';
import { StandardPOSTemplate } from './templates/StandardPOSTemplate.tsx';
import { TextilePOSTemplate } from './templates/TextilePOSTemplate.tsx';

interface POSTemplateRegistryProps {
    logic: POSLogic;
}

/**
 * POSTemplateRegistry
 * 
 * This component decides which POS UI template to render based on the current sector,
 * client customization, or other configuration flags.
 * 
 * It ensures that the core business logic (provided via the 'logic' prop)
 * is decoupled from the visual representation.
 */
export const POSTemplateRegistry: React.FC<POSTemplateRegistryProps> = ({ logic }) => {
    const { currentSector } = logic;

    // Determine template based on sector or custom logic
    switch (currentSector) {
        case 'Textile':
            return <TextilePOSTemplate logic={logic} />;


        case 'Pharmacy':
            // return <PharmacyPOSTemplate logic={logic} />;
            return <StandardPOSTemplate logic={logic} />;

        default:
            // Default to the standard layout
            return <StandardPOSTemplate logic={logic} />;
    }
};
