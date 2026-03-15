import React from 'react';
import { usePOSLogic, POSLogic } from "@/features/pos-checkout/lib/usePOSLogic";
import { POSTemplateRegistry } from './POSTemplateRegistry';

const POSModule: React.FC = () => {
    const logic = usePOSLogic();

    return (
        <POSTemplateRegistry logic={logic} />
    );
};

export default POSModule;
