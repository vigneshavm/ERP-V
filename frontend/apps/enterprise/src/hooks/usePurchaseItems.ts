import { useState, useCallback, useMemo } from 'react';
import { PurchaseOrderItem } from "@repo/shared";

export const usePurchaseItems = (initialItems: PurchaseOrderItem[] = []) => {
    const [items, setItems] = useState<PurchaseOrderItem[]>(initialItems);

    const addItem = useCallback((product: any) => {
        const newItem: PurchaseOrderItem = {
            product_id: product.id || product._id,
            product_name: product.name,
            sku: product.sku || '',
            quantity: 1,
            unit: product.unit || 'pcs',
            rate: product.cost_price || product.rate || 0,
            tax_percent: product.tax_percent || 0,
            tax_type: 'GST',
            discount_amount: 0,
            line_total: product.cost_price || product.rate || 0
        };
        setItems(prev => [...prev, newItem]);
    }, []);

    const updateItem = useCallback((index: number, updates: Partial<PurchaseOrderItem>) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index], ...updates };

            const base = (item.quantity * item.rate) - (item.discount_amount || 0);
            const tax = base * (item.tax_percent / 100);
            item.line_total = base + tax;

            newItems[index] = item;
            return newItems;
        });
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
        const discount = items.reduce((sum, i) => sum + (i.discount_amount || 0), 0);
        const taxableAmount = subtotal - discount;
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
        totals
    };
};

