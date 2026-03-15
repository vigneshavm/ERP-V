export type CategoryStatus = 'ACTIVE' | 'ARCHIVED';
export type CategoryHealth = 'GOOD' | 'ATTENTION' | 'LOW_MARGIN' | 'PROMO_NEEDED' | 'OVERSTOCKED' | 'HEALTHY' | 'LOW_TURNOVER';

export interface ICategory {
    id: string;
    name: string;
    // Extended fields to maintain data integrity with previous implementation
    description?: string;
    color?: string;
    itemCount: number;
    stockValue: number;
    gstRate: number;
    status: boolean | CategoryStatus; // Handling legacy boolean vs new string
    isActive?: boolean; // Legacy support
    health: CategoryHealth;
    riskFlag?: string; // Legacy support
    pricingHealth?: string; // Legacy support
    defaultUnit?: string;
    sector?: string;
    deadstockPercentage?: number;
    avgSellThroughDays?: number;
    recommendedAction?: string;
    created_at: Date | string;
    createdAt?: string; // Legacy support
}

export interface IQueryFilters {
    page: number;
    limit: number;
    search?: string;
    sortBy?: keyof ICategory | string;
    sortOrder?: 'asc' | 'desc';
    sector?: string;
}

export interface IStats {
    totalCategories: number;
    totalItems: number;
    totalStockValue: number;
    avgItemsPerCategory: number;
}

export interface IPaginatedResponse<T> {
    success: boolean;
    data: T[];
    stats?: IStats;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
