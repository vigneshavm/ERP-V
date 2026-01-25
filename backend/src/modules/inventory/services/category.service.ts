import { ICategory, IQueryFilters, IStats, ProductType } from '../interfaces/category.types.js';

const productTypes: ProductType[] = [
    { id: "PT001", name: "PILLAIYAR PARIVATTAM", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT002", name: "AMMAN PATTU", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT003", name: "THOMBU PCS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT004", name: "SAREE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT005", name: "FANCY SAREE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT006", name: "COTTON SAREE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT007", name: "PATTU SAREE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT008", name: "BLOUSE BIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT009", name: "LINING BIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT010", name: "LINING CLOTH", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT011", name: "MIDI", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT012", name: "TOP", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT013", name: "LEGINS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT014", name: "SHALL", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT015", name: "DRESS MATERIAL", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT016", name: "PANTIES", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT017", name: "CHIMMIES", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT018", name: "FANCY BLOUSE BIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT019", name: "FANCY BLOUSE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT020", name: "JEGINS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT021", name: "BABY DRESS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT022", name: "BABA SUIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Set" },
    { id: "PT023", name: "BOYS TROUSER SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Set" },
    { id: "PT024", name: "BOYS FORMAL SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT025", name: "BOYS T-SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT026", name: "BOYS COTTON PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT027", name: "BOYS JEANS PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT028", name: "GENTS CASUAL SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT029", name: "GENTS COTTON PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT030", name: "GENTS JEANS PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT031", name: "GENTS T-SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT032", name: "SHIRTTING", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT033", name: "SUITTING", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT034", name: "SHIRTTING BIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT035", name: "SUITTING BIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT036", name: "WEDDING DHOTHIE SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Set" },
    { id: "PT037", name: "BLOUSE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT038", name: "INSKIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT039", name: "CHUDITHAR", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT040", name: "CHUDITHAR MATERIAL", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Set" },
    { id: "PT041", name: "FROCK", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT042", name: "GOWN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT043", name: "WESTERN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT044", name: "BRA", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT045", name: "TIGHTS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT046", name: "GIFT BOX", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT047", name: "BOYS PANT SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Set" },
    { id: "PT048", name: "BOYS TROUSER", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT049", name: "BOYS CASUAL SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT050", name: "GENTS FORMAL SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT051", name: "DHOTHIE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT052", name: "COLOUR DHOTHIE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT053", name: "LUNCH TOWEL", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT054", name: "KAADA", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT055", name: "WINDOW SCREEN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT056", name: "PLASTIC PAAI", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT057", name: "BABY BED", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT058", name: "GENTS TRUNKS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT059", name: "GENTS KERCHIEF", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT060", name: "HAND GLOUSE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT061", name: "SOCKS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT062", name: "MASK", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT063", name: "SALVAI", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT064", name: "GENTS BANIAN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT065", name: "BOYS BANIAN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT066", name: "KIDS TRUNKS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT067", name: "UNIFORM SAREE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT068", name: "UNIFORM SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT069", name: "UNIFORM PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT070", name: "UNIFORM TROUSER", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT071", name: "T-SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT072", name: "SKIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT073", name: "PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT074", name: "DHOTHIE SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Set" },
    { id: "PT075", name: "PANT COMMEN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT076", name: "GIRLS PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT077", name: "KAAVI DHOTHIE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT078", name: "TOWEL", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT079", name: "LUNGI", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT080", name: "MULL", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT081", name: "BED SHEET", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT082", name: "BED COVER", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT083", name: "PILLOW", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT084", name: "PILLOW COVER", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT085", name: "DOOR SCREEN", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT086", name: "SCREEN CLOTH", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT087", name: "MAT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT088", name: "PAAI", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT089", name: "MOSQUATO NET", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT090", name: "BOYS TRUNKS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT091", name: "BOYS JETTY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT092", name: "GENTS JETTY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT093", name: "LADIES KERCHIEF", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT094", name: "CAP", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT095", name: "TRACK PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT096", name: "PANT 3/4", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT097", name: "SHORTS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT098", name: "RAIN COAT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT099", name: "SWETTER", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT100", name: "BED", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT101", name: "PATTIYALA PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT102", name: "SHIRT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT103", name: "PLAZO PANT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT104", name: "BAG", nameTamil: "", sector: "Textiles", gstRate: 12, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT105", name: "BIT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Meter" },
    { id: "PT106", name: "HALF SAREE", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT107", name: "BED SPREAD", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT108", name: "PETTICOAT", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT109", name: "KIDS JETTY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT110", name: "NIGHTY", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT111", name: "PATTU PAVADAI", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT112", name: "LEGANGA", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT113", name: "NIGHT DRESS", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
    { id: "PT114", name: "UNIFORM CHUDITHAR", nameTamil: "", sector: "Textiles", gstRate: 5, hsnCode: "", defaultUnit: "Piece" },
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
