import api from '@/shared/api/api';
import { DueAdjustment } from "@/features/expense-tracking/model/dueSlice";
import { AxiosRequestConfig } from 'axios';

const API_URL = "/due/";

// Create due adjustment
const createDueAdjustment = async (adjustmentData: Partial<DueAdjustment>, token: string): Promise<DueAdjustment> => {
    const config: AxiosRequestConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await api.post(API_URL + "adjust", adjustmentData, config);
    return response.data;
};

// Get all due adjustments
const getDueAdjustments = async (token: string): Promise<DueAdjustment[]> => {
    const config: AxiosRequestConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await api.get(API_URL + "adjustments", config);
    return response.data;
};

// Get customer due adjustments
const getCustomerDueAdjustments = async (customerId: string, token: string): Promise<{ adjustments: DueAdjustment[] }> => {
    const config: AxiosRequestConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await api.get(
        API_URL + `customer/${customerId}/adjustments`,
        config
    );
    return response.data;
};

const dueService = {
    createDueAdjustment,
    getDueAdjustments,
    getCustomerDueAdjustments,
};

export default dueService;
