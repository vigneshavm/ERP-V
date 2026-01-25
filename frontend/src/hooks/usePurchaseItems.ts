import { useState, useCallback, useMemo } from 'react';

export interface PurchaseItem {
    id?: string; // Optional ID if editing existing
    product_id?: string;
    product_name: string;
    sku?: string;
    quantity: number;
    rate: number;
    tax_percent: number;
    discount_amount: number;
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
            rate: product.cost_price || product.rate || 0,
            tax_percent: product.tax_percent || 0,
            discount_amount: 0,
            line_total: product.cost_price || product.rate || 0
        }]);
    }, []);

    const updateItem = useCallback((index: number, field: keyof PurchaseItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index], [field]: value };

            // Recalculate line total if relevant fields change
            if (['quantity', 'rate', 'tax_percent', 'discount_amount'].includes(field as string)) {
                const base = item.quantity * item.rate;
                const tax = base * (item.tax_percent / 100);
                item.line_total = base + tax - item.discount_amount;
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
        const tax = items.reduce((sum, i) => sum + ((i.quantity * i.rate) * (i.tax_percent / 100)), 0);
        const discount = items.reduce((sum, i) => sum + i.discount_amount, 0);
        return {
            subtotal,
            tax,
            discount,
            total: subtotal + tax - discount
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
