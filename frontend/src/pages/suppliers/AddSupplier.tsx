import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { reset } from '../../redux/slices/supplierSlice';
import { AppDispatch, RootState } from '../../redux/store';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SupplierForm from '../../components/suppliers/SupplierForm';

const AddSupplier: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    return (
        <Layout>
            <PageHeader
                title="Onboard Supplier"
                description="Initialize a new strategic partner record in the global procurement database"
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers', link: '/suppliers' }, { label: 'Directory', link: '/suppliers' }, { label: 'Onboard New' }]}
            />
            <SupplierForm mode="add" />
        </Layout>
    );
};

export default AddSupplier;
