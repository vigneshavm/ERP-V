import { ICategory, IQueryFilters, IStats, ProductType } from '../interfaces/category.types.js';

const productTypes: ProductType[] = [
    { id: "PT001", name: "PILLAIYAR PARIVATTAM", shortCode: "PIV", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT002", name: "AMMAN PATTU", shortCode: "AMP", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT003", name: "THOMBU PCS", shortCode: "TPC", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT004", name: "SAREE", shortCode: "SAR", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT005", name: "FANCY SAREE", shortCode: "FSY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT006", name: "COTTON SAREE", shortCode: "CSY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT007", name: "PATTU SAREE", shortCode: "PSY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT008", name: "BLOUSE BIT", shortCode: "BLB", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT009", name: "LINING BIT", shortCode: "LNB", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT010", name: "LINING CLOTH", shortCode: "LNC", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT011", name: "MIDI", shortCode: "MID", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT012", name: "TOP", shortCode: "TOP", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT013", name: "LEGINS", shortCode: "LEG", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT118", name: "OTHERS", shortCode: "OTH", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
];

export class CategoryService {
    private categories: ICategory[] = [];

    constructor() {
        this.categories = this.generateMockData();
    }

    private generateMockData(): ICategory[] {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];

        return productTypes.map((pt, index) => {
            const itemCount = Math.floor(Math.random() * 500);
            const stockValue = itemCount * Math.floor(Math.random() * 1000 + 100);
            const deadstockPercentage = Math.floor(Math.random() * 40);

            let riskFlag: string = 'HEALTHY';
            if (deadstockPercentage > 30) riskFlag = 'LOW_TURNOVER';
            else if (stockValue > 100000 && deadstockPercentage > 15) riskFlag = 'OVERSTOCKED';

            const pricingHealth: string = Math.random() > 0.7 ? 'LOW_MARGIN' : (deadstockPercentage > 25 ? 'PROMO_NEEDED' : 'GOOD');
            const sector = 'Textiles';

            return {
                id: pt.id,
                name: pt.name,
                description: `Category for ${pt.name.toLowerCase()}`,
                color: colors[index % colors.length],
                itemCount,
                stockValue,
                status: 'ACTIVE',
                isActive: true,
                deadstockPercentage,
                avgSellThroughDays: Math.floor(Math.random() * 60 + 5),
                riskFlag,
                recommendedAction: riskFlag === 'LOW_TURNOVER' ? 'Relocate stock' : 'Maintain levels',
                gstCompliance: 'OK',
                pricingHealth,
                sector,
                health: riskFlag === 'HEALTHY' ? 'GOOD' : 'ATTENTION',
                gstRate: pt.gstRate,
                defaultUnit: pt.defaultUnit,
                created_at: new Date(),
                createdAt: new Date().toISOString()
            } as ICategory;
        });
    }

    public findAll(filters: IQueryFilters): { data: ICategory[]; total: number } {
        let { page = 1, limit = 25, search = '', sortBy = 'created_at', sortOrder = 'desc', sector = '' } = filters;

        let filtered = [...this.categories];

        // 0. Sector Filtering
        if (sector && sector !== 'General') {
            filtered = filtered.filter(cat => cat.sector === sector);
        }

        // 1. Searching
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(searchLower) ||
                (cat.description && cat.description.toLowerCase().includes(searchLower))
            );
        }

        // 2. Sorting
        if (sortBy) {
            filtered.sort((a, b) => {
                // 
                let valA = a[sortBy];
                // 
                let valB = b[sortBy];

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA === undefined || valB === undefined) return 0;

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // 3. Pagination
        const total = filtered.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filtered.slice(startIndex, endIndex);

        return { data: paginatedData, total };
    }

    public findById(id: string): ICategory | undefined {
        return this.categories.find(cat => cat.id === id);
    }

    public getStats(): IStats {
        const totalCategories = this.categories.length;
        const totalItems = this.categories.reduce((sum, cat) => sum + cat.itemCount, 0);
        const totalStockValue = this.categories.reduce((sum, cat) => sum + cat.stockValue, 0);
        const avgItemsPerCategory = totalCategories > 0 ? Math.round(totalItems / totalCategories) : 0;

        return {
            totalCategories,
            totalItems,
            totalStockValue,
            avgItemsPerCategory
        };
    }
}
