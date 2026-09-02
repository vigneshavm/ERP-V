export type SortDirection = 'asc' | 'desc';
export type Status = 'ACTIVE' | 'ARCHIVED';

export interface ICategory {
    id: string;
    name: string;
    itemCount: number;
    stockValue: number;
    gstRate: number;
    status: Status;
    health: 'GOOD' | 'ATTENTION' | 'LOW_MARGIN' | 'PROMO_NEEDED' | 'OVERSTOCKED' | 'HEALTHY' | 'LOW_TURNOVER';
    created_at: Date;
    // Legacy support fields (optional to maintain backward compatibility if needed, but strict mode prefers clean contract)
    description?: string;
    color?: string;
    isActive?: boolean;
    // True when this name has its own Category document for the tenant (created
    // via Category Manager or Settings' "Add Selected to My Categories"), as
    // opposed to only appearing here because an Item already uses it or because
    // it's part of the sector's shared master list.
    isRegistered?: boolean;
    riskFlag?: string;
    pricingHealth?: string;
    defaultUnit?: string;
    sector?: string;
    deadstockPercentage?: number;
    avgSellThroughDays?: number;
    recommendedAction?: string;
    createdAt?: string;
}

export interface IQueryFilters {
    page: number;
    limit: number;
    search?: string;
    sortBy?: keyof ICategory;
    sortOrder?: SortDirection;
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
export interface ProductType {
    id: string;
    name: string;
    shortCode?: string;
    nameTamil: string;
    gstRate: number;
    hsnCode: string;
    defaultUnit: string;
    sector: string;
}
