import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, reset } from "../../../redux/slices/supplierSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import SupplierForm from "../../../components/suppliers/SupplierForm";
import SupplierSubNav from "./SupplierSubNav";

const EditSupplier: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { id } = useParams<{ id: string }>();
    const { supplier, isLoading } = useSelector((state: RootState) => state.suppliers);

    useEffect(() => {
        if (id) {
            dispatch(getSupplierById(id));
        }
        return () => {
            dispatch(reset());
        };
    }, [dispatch, id]);

    if (isLoading && !supplier) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400">Loading Source Data...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const initialData = supplier ? {
        businessName: supplier.businessName || '',
        contactPersonName: supplier.contactPersonName || '',
        contactNo: supplier.contactNo || '',
        email: supplier.email || '',
        physicalAddress: supplier.physicalAddress || '',
        state: supplier.state || '',
        gstNo: supplier.gstNo || '',
        supplierType: supplier.supplierType || 'manufacturer',
        openingBalance: supplier.openingBalance || 0,
        balanceType: supplier.balanceType || 'payable',
        creditPeriod: supplier.creditPeriod || 0,
        status: supplier.status || 'active',
        supplierGroup: supplier.supplierGroup || '',
        groupId: (supplier.groupId as any)?._id || supplier.groupId || '',
    } : undefined;

    return (
        <Layout>
            <PageHeader
                title="Update Partner"
                description={`Modifying registration profile for ${supplier?.businessName || 'Strategic Partner'}`}
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers', link: '/suppliers' }, { label: 'Directory', link: '/suppliers' }, { label: 'Edit Profile' }]}
            />
            <SupplierSubNav />
            <SupplierForm mode="edit" supplierId={id} initialData={initialData} />
        </Layout>
    );
};

export default EditSupplier;

