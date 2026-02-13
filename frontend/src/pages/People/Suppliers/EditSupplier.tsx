import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, reset } from "../../../redux/slices/supplierSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import Layout from "../../../components/shared/Layout";
import SupplierForm from "../../../components/suppliers/SupplierForm";
import SupplierSubNav from "./SupplierSubNav";
import { ArrowLeft } from 'lucide-react';

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
                        <p className="text-sm font-medium text-slate-400 dark:text-neutral-500">Loading supplier data...</p>
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
            <div className="max-w-5xl mx-auto pb-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/suppliers')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-neutral-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100">Edit Supplier</h1>
                            <p className="text-sm text-slate-400 dark:text-neutral-500">{supplier?.businessName || ''}</p>
                        </div>
                    </div>
                </div>
                <SupplierSubNav />
                <SupplierForm mode="edit" supplierId={id} initialData={initialData} />
            </div>
        </Layout>
    );
};

export default EditSupplier;
