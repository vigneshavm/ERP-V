import React, { useState } from 'react';
import SalesReport from './sales/SalesReport';
import CategoryWiseSalesReport from './CategoryWiseSalesReport';
import ProductWiseSalesReport from './ProductWiseSalesReport';
import DeadStockReport from './DeadStockReport';
import StockAnalysisReport from './StockAnalysisReport';

const SECTIONS = [
    { id: 'bills', label: 'Sales bills', page: SalesReport },
    { id: 'categories', label: 'Categories', page: CategoryWiseSalesReport },
    { id: 'products', label: 'Products', page: ProductWiseSalesReport },
    { id: 'inventory', label: 'Aged inventory', page: DeadStockReport },
    { id: 'stock-analysis', label: 'Stock aging & sales analysis', page: StockAnalysisReport },
] as const;

const SalesInventoryAnalysis: React.FC = () => {
    const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('bills');
    const Page = SECTIONS.find(item => item.id === section)!.page;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales & Inventory Analysis</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sales bills, category and product performance, and inventory aging.</p>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
                {SECTIONS.map(item => (
                    <button key={item.id} type="button" aria-pressed={section === item.id} onClick={() => setSection(item.id)}
                        className={`px-4 py-3 text-sm font-semibold border-b-2 ${section === item.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                        {item.label}
                    </button>
                ))}
            </div>
            <Page />
        </div>
    );
};

export default SalesInventoryAnalysis;