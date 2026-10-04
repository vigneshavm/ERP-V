import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { setReturnFromLine } from '../../redux/slices/posSlice';
import type { CartItem } from '../../types/sales';

interface Source {
    bill: string;
    sourceLineNo: number;
    date: string;
    qtySold: number;
    qtyRemaining: number;
    paidEach: number;
    gst: number;
}

/**
 * Shown on a returned (RETURN) cart line: which bill the item was bought on. The refund is exactly what was
 * paid on that bill's line, so when the same barcode was sold at different prices the cashier must pick one
 * (the server refuses the bill otherwise). With a single price it is optional and just shows the amount.
 */
export const ReturnBillPicker: React.FC<{ item: CartItem }> = ({ item }) => {
    const dispatch = useDispatch();
    const [sources, setSources] = useState<Source[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        setError('');
        api.get('/api/pos/return-sources', { params: { item: item.id } })
            .then(({ data }) => { if (alive) setSources(data?.data?.sources ?? []); })
            .catch((e) => { if (alive) setError(e?.response?.data?.message || 'Could not load the item\'s sales'); });
        return () => { alive = false; };
    }, [item.id]);

    const availableSources = sources.filter((source) => source.qtyRemaining > 0);
    const prices = new Set(availableSources.map((s) => `${s.paidEach}|${s.gst}`));
    const mustChoose = prices.size > 1;
    if (error) return <p className="text-[10px] text-danger mt-0.5">{error}</p>;
    if (!availableSources.length) return <p className="text-[10px] text-danger mt-0.5">No unreturned sale quantity was found for this barcode.</p>;

    return (
        <div className="mt-1">
            <select
                aria-label="Bought on bill"
                value={item.returnFromLine ? String(item.returnFromLine) : ''}
                onChange={(e) => {
                    const source = availableSources.find((option) => option.sourceLineNo === Number(e.target.value));
                    if (source) dispatch(setReturnFromLine({ id: item.id, bill: source.bill, lineNo: source.sourceLineNo }));
                }}
                className={`text-[10px] rounded border px-1 py-0.5 bg-white dark:bg-slate-800 ${mustChoose && !item.returnFromLine ? 'border-danger text-danger' : 'border-slate-300'}`}
            >
                <option value="">{mustChoose || availableSources.length > 1 ? 'Choose the sale line this item came from…' : `Bought on: ${availableSources[0].bill} (₹${availableSources[0].paidEach.toFixed(2)})`}</option>
                {availableSources.map((s) => (
                    <option key={s.sourceLineNo} value={s.sourceLineNo}>
                        {s.bill} · {s.date} · {s.qtyRemaining} left · refund ₹{s.paidEach.toFixed(2)}
                    </option>
                ))}
            </select>
        </div>
    );
};
