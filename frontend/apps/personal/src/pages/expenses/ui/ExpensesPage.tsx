"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ExpensesView from '@/features/expenses/views/ExpensesView';
import CategoryDetailsView from '@/features/expense-tracking/ui';

function ExpensesContent() {
    const searchParams = useSearchParams();
    const view = searchParams?.get('view');

    if (view === 'CategoryDetails') {
        return <CategoryDetailsView />;
    }

    return <ExpensesView />;
}

export default function ExpensesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ExpensesContent />
        </Suspense>
    );
}
