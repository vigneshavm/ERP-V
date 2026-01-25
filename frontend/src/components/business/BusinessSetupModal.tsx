import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import Modal from '../Modal';
import { updateProfile } from '../../redux/slices/authSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { toast } from 'react-toastify';

interface BusinessSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BusinessSetupModal: React.FC<BusinessSetupModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading } = useSelector((state: RootState) => state.auth);

    const [formData, setFormData] = useState({
        businessCategory: '',
        businessType: '',
        shopName: '',
        phone: '',
    });

    const [sectors, setSectors] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchSectors = async () => {
            try {
                const response = await api.get('/api/business/sectors');
                if (response.data && response.data.success) {
                    setSectors(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch sectors", error);
            }
        };
        fetchSectors();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                businessCategory: user.businessCategory || '',
                businessType: user.businessType || '',
                shopName: user.shopName || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.businessCategory) {
            toast.error('Please select a business category');
            return;
        }
        if (!formData.businessType) {
            toast.error('Please select a business type');
            return;
        }

        try {
            await dispatch(updateProfile(formData)).unwrap();
            toast.success('Business details updated successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to update business details');
            console.error(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete Your Business Profile"
            showCloseButton={false} // Force user to complete or use a dedicated skip button if needed
            size="md"
        >
            <div className="space-y-4">
                <p className="text-secondary text-sm">
                    To give you the best experience, please tell us a bit more about your business.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="shopName" className="block text-sm font-medium text-secondary mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            id="shopName"
                            name="shopName"
                            value={formData.shopName}
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
                            <option value="retail">Retail</option>
                            <option value="wholesale">Wholesale</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="businessCategory" className="block text-sm font-medium text-secondary mb-1">
                            Business Category (Sector)
                        </label>
                        <select
                            id="businessCategory"
                            name="businessCategory"
                            value={formData.businessCategory}
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
