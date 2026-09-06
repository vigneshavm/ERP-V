import React from 'react';
import PurchaseEntry from '../purchase/PurchaseEntry';

/**
 * Wholesale/Retail (WR) Billing: bulk purchase intake.
 *
 * The legacy WholeSaleRetailEntry screen this replaces was, per its own page <title>, actually a
 * purchase-entry variant that mirrored the core Purchasing/GRN grid field-for-field (brand,
 * design, color, size, rate, GST%, discount) plus a bulk/wholesale rate. Rather than duplicate
 * PurchaseEntry.tsx's ~1600 lines of item-grid, PDF-import and design-set logic, this renders
 * that same screen in its WHOLESALE channel -- see PurchaseEntry.tsx's `channel` prop.
 */
const WRPurchaseEntry: React.FC = () => <PurchaseEntry channel="WHOLESALE" />;

export default WRPurchaseEntry;
