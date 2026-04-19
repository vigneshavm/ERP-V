import React from 'react';
import { usePOSLogic } from "../../hooks/usePOSLogic";
import { POSTemplateRegistry } from './POSTemplateRegistry';
import Layout from "../../components/shared/Layout";

const POSModule: React.FC = () => {
    const logic = usePOSLogic();

    return (
        <Layout fullWidth>
            <POSTemplateRegistry logic={logic} />
        </Layout>
    );
};

export default POSModule;
