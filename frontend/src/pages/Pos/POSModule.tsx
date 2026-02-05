import React from 'react';
import { usePOSLogic } from "../../hooks/usePOSLogic";
import { POSTemplateRegistry } from './POSTemplateRegistry';

const POSModule: React.FC = () => {
    const logic = usePOSLogic();

    return (
        <POSTemplateRegistry logic={logic} />
    );
};

export default POSModule;
