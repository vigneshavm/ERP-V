import { useState, useCallback, useMemo } from 'react';

export interface PurchaseItem {
    id?: string; // Optional ID if editing existing
    product_id?: string;
    product_name: string;
    sku?: string;
    quantity: number;
    unit?: string;
    rate: number;
    tax_percent: number;
    tax_type?: 'GST' | 'IGST' | 'VAT' | 'None';
    discount_amount: number;
    discount_percent?: number;
    line_total: number;
    [key: string]: any; // Allow extra fields
}

export const usePurchaseItems = (initialItems: PurchaseItem[] = []) => {
    const [items, setItems] = useState<PurchaseItem[]>(initialItems);

    const addItem = useCallback((product: any) => {
        setItems(prev => [...prev, {
            product_id: product.id,
            product_name: product.name,
            sku: product.sku || '',
            quantity: 1,
            unit: product.unit || 'pcs',
            rate: product.cost_price || product.rate || 0,
            tax_percent: product.tax_percent || 0,
            tax_type: product.tax_type || 'GST',
            discount_amount: 0,
            discount_percent: 0,
            line_total: product.cost_price || product.rate || 0
        }]);
    }, []);

    const updateItem = useCallback((index: number, field: keyof PurchaseItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index], [field]: value };

            // Recalculate line total if relevant fields change
            if (['quantity', 'rate', 'tax_percent', 'discount_amount', 'discount_percent'].includes(field as string)) {
                // Handle Discount % vs Amount
                if (field === 'discount_percent') {
                    item.discount_amount = (item.quantity * item.rate) * (value / 100);
                } else if (field === 'discount_amount') {
                    item.discount_percent = value / (item.quantity * item.rate) * 100 || 0;
                }

                const base = (item.quantity * item.rate) - item.discount_amount;

                // Automatic Qty-based discount (Auto-apply 5% if qty > 50)
                if (item.quantity > 50 && item.discount_percent === 0) {
                    item.discount_percent = 5;
                    item.discount_amount = (item.quantity * item.rate) * 0.05;
                }

                const tax = base * (item.tax_percent / 100);
                item.line_total = base + tax;
            }

            newItems[index] = item;
            return newItems;
        });
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearItems = useCallback(() => {
        setItems([]);
    }, []);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
        const discount = items.reduce((sum, i) => sum + (i.discount_amount || 0), 0);
        const taxableAmount = subtotal - discount;

        // Simple aggregate tax for now, details calculated in Form
        const tax = items.reduce((sum, i) => {
            const itemBase = (i.quantity * i.rate) - (i.discount_amount || 0);
            return sum + (itemBase * (i.tax_percent / 100));
        }, 0);

        return {
            subtotal,
            tax,
            discount,
            total: taxableAmount + tax
        };
    }, [items]);

    return {
        items,
        setItems,
        addItem,
        updateItem,
        removeItem,
        clearItems,
        totals
    };
};
