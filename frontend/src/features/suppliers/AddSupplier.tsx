import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { reset } from "../../redux/slices/supplierSlice";
import { AppDispatch } from "../../redux/store";
import Layout from "../../components/shared/Layout/index";
import SupplierForm from "../../components/suppliers/SupplierForm";
import { ArrowLeft } from 'lucide-react';

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
            <div className="max-w-5xl mx-auto pb-10">
                {/* Clean Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/suppliers')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-neutral-400" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100">Add Supplier</h1>
                    </div>
                </div>

                <SupplierForm mode="add" />
            </div>
        </Layout>
    );
};

export default AddSupplier;
