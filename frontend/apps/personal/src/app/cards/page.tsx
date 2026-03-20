"use client";

import CreditCardView from '@/features/cards-and-loans/CreditCardView';
import DebitCardView from '@/features/cards-and-loans/DebitCardView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/Tabs';

export default function CardsPage() {
  return (
    <div className="view-container" style={{ paddingBottom: '100px' }}>
      <div className="view-page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>My Cards</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Manage your credit and debit cards</p>
        </div>
      </div>

      <Tabs defaultValue="credit">
        <TabsList>
          <TabsTrigger value="credit">Credit Cards</TabsTrigger>
          <TabsTrigger value="debit">Debit Cards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credit">
          <CreditCardView />
        </TabsContent>
        
        <TabsContent value="debit">
          <DebitCardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
