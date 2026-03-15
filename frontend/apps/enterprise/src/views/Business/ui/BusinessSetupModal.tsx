import { useAuthStore } from '@repo/shared';
import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from "@/shared/api/api";
import Modal from '@/shared/ui/Overlay/Modal';
import { RootState, AppDispatch } from "@/app/store/store";
import { toast } from 'react-toastify';

interface BusinessSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Sector {
    id: string;
    name: string;
}

interface BusinessType {
    id: string;
    name: string;
}

interface BusinessSetupData {
    category: string;
    businessType: string;
    businessName: string;
    phone: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

interface FormData {
    category: string;
    businessType: string;
    businessName: string;
    phone: string;
}

const BusinessSetupModal: React.FC<BusinessSetupModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const {  user  } = useAuthStore();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormData>({
        category: '', // ID
        businessType: '', // ID
        businessName: '',
        phone: '',
    });

    const [sectors, setSectors] = useState<Sector[]>([]);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (isOpen) {
                setIsLoading(true);
                try {
                    // 1. Fetch Setup Status first
                    const setupResponse = await api.get<ApiResponse<BusinessSetupData>>('/business/setup');
                    if (setupResponse.data && setupResponse.data.success) {
                        const setup = setupResponse.data.data;
                        setFormData({
                            category: setup.category || '',
                            businessType: setup.businessType || '',
                            businessName: setup.businessName || user?.shopName || '',
                            phone: setup.phone || user?.phone || '',
                        });

                        // 2. Fetch Master Data (Sectors and Types) after setup check
                        const [sectorsRes, typesRes] = await Promise.all([
                            api.get<ApiResponse<Sector[]>>('/business/sectors'),
                            api.get<ApiResponse<BusinessType[]>>('/business/types')
                        ]);

                        if (sectorsRes.data?.success) setSectors(sectorsRes.data.data);
                        if (typesRes.data?.success) setBusinessTypes(typesRes.data.data);
                    }
                } catch (error: any) {
                    logger.error("Failed to fetch setup or master data", error);
                    // Fallback to basic user data
                    if (user) {
                        setFormData(prev => ({
                            ...prev,
                            businessName: user.shopName || '',
                            phone: user.phone || ''
                        }));
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchAllData();
    }, [isOpen, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category) {
            toast.error('Please select a business category');
            return;
        }
        if (!formData.businessType) {
            toast.error('Please select a business type');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post<ApiResponse<any>>('/business/setup', formData);
            if (response.data && response.data.success) {
                toast.success('Business setup completed!');
                onClose();
            } else {
                toast.error('Failed to complete business setup');
            }
        } catch (error: any) {
            toast.error('Failed to complete business setup');
            logger.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete Your Business Profile"
            showCloseButton={false} // Force user to complete
            size="md"
        >
            <div className="space-y-4">
                <p className="text-secondary text-sm">
                    To give you the best experience, please tell us a bit more about your business.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-secondary mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter your business name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="businessType" className="block text-sm font-medium text-secondary mb-1">
                            Business Type
                        </label>
                        <select
                            id="businessType"
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select a type</option>
                            {businessTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-secondary mb-1">
                            Business Category (Sector)
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select a category</option>
                            {sectors.map((sector) => (
                                <option key={sector.id} value={sector.id}>
                                    {sector.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-secondary mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default BusinessSetupModal;
