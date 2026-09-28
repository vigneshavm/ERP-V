# Backend Performance Optimization - Quick Reference & Implementation Checklist

## 🎯 Priority Matrix

### P0: Critical (Implement This Week)
- [ ] Fix StockAgingService N+1 queries → aggregation pipeline
- [ ] Add pagination to getAllInvoices endpoint
- [ ] Add missing compound indexes to Invoice, Item, Bill models
- [ ] Integrate Redis caching for getSalesInvoiceSummary

### P1: High (Implement Next Week)
- [ ] Refactor FinanceReportService with faceted aggregation
- [ ] Replace encrypted account lookup with HMAC index
- [ ] Add field projection to all populate() calls
- [ ] Create pagination utility for reuse across services

### P2: Medium (Implement Following Week)
- [ ] Cache inventory filter options
- [ ] Implement cache invalidation strategy
- [ ] Add query performance monitoring
- [ ] Load test with 50K+ records

---

## 📋 Implementation Checklist

### 1. Fix N+1 Query: StockAgingService

**Files to Modify:**
- `backend/src/modules/inventory/services/StockAgingService.ts`

**Changes:**
```typescript
// Before (lines 54-80): Loop-based N+1
for (const item of inStockItems) {
    const purchases = await Purchase.find({...});  // 1000 queries
}

// After: Single aggregation
const results = await Item.aggregate([...]);  // 1 query
```

**Completion:** [ ] Refactored [ ] Tested [ ] Verified 50% faster

---

### 2. Fix Memory Bloat: SalesService.getSummary

**Files to Modify:**
- `backend/src/modules/sales/services/SalesService.ts` (lines 30-45)

**Changes:**
```typescript
// Before: Loads all invoices/customers
const invoices = await this.invoiceRepository.findAll(tenantId);  // 50K docs
const customers = await this.customerRepository.findAll(tenantId);

// After: Aggregation only computes totals
const summary = await Invoice.aggregate([{$group: {...}}]);
```

**Completion:** [ ] Refactored [ ] Tested [ ] Verified 70x faster

---

### 3. Add Pagination: getAllInvoices

**Files to Modify:**
- `backend/src/modules/sales/controllers/SalesController.ts` (lines 20-28)
- `backend/src/modules/sales/services/SalesService.ts`
- `backend/src/repositories/InvoiceRepository.ts`

**Changes:**
```typescript
// Controller: Add query params
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;

// Service: Call paginated method
const result = await this.invoiceRepository.findPaginated(tenantId, page, limit);

// Response: Include pagination metadata
{ data: [...], pagination: { page, limit, total, pages } }
```

**Completion:** [ ] Repository method added [ ] Service method added [ ] Controller updated [ ] Tested

---

### 4. Add Database Indexes

**Files to Modify:**
- `backend/src/modules/sales/models/Invoice.ts`
- `backend/src/modules/inventory/models/Item.ts`
- `backend/src/modules/finance/models/Bill.ts`

**Changes Required:**

**Invoice Schema:**
```typescript
// Add after existing indexes (line ~210)
invoiceSchema.index({ tenantId: 1, isDeleted: 1, createdAt: -1 });
invoiceSchema.index({ tenantId: 1, paymentStatus: 1, createdAt: -1 });
invoiceSchema.index({ tenantId: 1, customer: 1, createdAt: -1 });
invoiceSchema.index(
    { tenantId: 1, paymentStatus: 1 },
    { partialFilterExpression: { paymentStatus: { $ne: 'paid' } } }
);
```

**Item Schema:**
```typescript
// Add after existing indexes (line ~150)
itemSchema.index({ tenantId: 1, isActive: 1 });
itemSchema.index({ tenantId: 1, brand: 1, category: 1 });
itemSchema.index({ tenantId: 1, stockQty: 1 });
```

**Bill Schema:**
```typescript
// Add after existing indexes (line ~161)
billSchema.index({ supplier: 1, status: 1 });
billSchema.index({ paymentStatus: 1, dueDate: 1 });
billSchema.index({ tenantId: 1, date: 1 });
```

**Verification Script:**
```bash
# After adding indexes, run:
node scripts/validate-indexes.ts
```

**Completion:** [ ] Invoice indexes added [ ] Item indexes added [ ] Bill indexes added [ ] Validation passed

---

### 5. Integrate Redis Caching

**Files to Modify:**
- `backend/src/modules/sales/services/SalesService.ts`
- `backend/src/modules/inventory/services/InventoryService.ts`
- Create: `backend/src/services/cacheService.ts` (if not exists)

**Changes:**
```typescript
// SalesService.getSummary
async getSummary(tenantId: Types.ObjectId): Promise<any> {
    const cacheKey = `sales:summary:${tenantId}`;
    
    // Try cache
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    
    // Compute
    const summary = await Invoice.aggregate([...]);
    
    // Cache 5 minutes
    await setCache(cacheKey, summary, 300);
    return summary;
}
```

**Completion:** [ ] CacheService created [ ] SalesService updated [ ] InventoryService updated [ ] Cache invalidation added

---

### 6. Optimize FinanceReportService Queries

**Files to Modify:**
- `backend/src/modules/finance/services/FinanceReportService.ts` (lines 98-170)

**Changes:**
- Replace 8+ separate find() queries with single `$facet` aggregation
- Remove `.populate()` in favor of `$lookup` with field projection
- Combine related aggregations (bills + allocations) into one query

**Before:**
```
- Invoice.find() + populate (network round-trip)
- Return.find()
- PaymentIn.find() + populate
- Bill.find() + populate
- PaymentOut.find()
- PurchasePayment.find()
- Expense.find()
- CashbankTransaction.find()
- PaymentOut.aggregate() (SEPARATE aggregation)
Total: 9 queries
```

**After:**
```
- Single faceted aggregation combining all sources
Total: 1 query
```

**Completion:** [ ] Aggregation pipeline written [ ] Tested [ ] Verified 8x faster

---

### 7. Optimize Query Projections

**Files to Modify:**
- `backend/src/modules/sales/controllers/SalesInvoiceController.ts`
- `backend/src/modules/inventory/controllers/InventoryController.ts`
- All controllers using `.populate()`

**Changes:**
```typescript
// Before
Invoice.findOne({...})
    .populate('customer')  // Fetches entire document
    .populate('items.item')

// After - Project only needed fields
Invoice.findOne({...})
    .select('invoiceNo items subtotal tax totalAmount customer')
    .populate('customer', 'name phone email')
    .populate('items.item', 'name sku price')
    .lean()
```

**Completion:** [ ] All controllers reviewed [ ] Projections added [ ] Response size audited

---

### 8. Fix Encrypted Field Lookup

**Files to Modify:**
- `backend/src/repositories/CashBankRepository.ts` (lines 18-25)
- `backend/src/modules/finance/models/BankAccount.ts`

**Changes:**
```typescript
// Add HMAC field to BankAccount schema
const bankAccountSchema = new Schema({
    accountNumber: { type: String, required: true },     // Encrypted
    accountNumberHash: { type: String, index: true },    // Deterministic
    // ...
});

// Update lookup to use hash
async findAccountByNumber(accountNumber: string, userId: string) {
    const hash = crypto.createHash('sha256')
        .update(accountNumber + process.env.ACCOUNT_HASH_SALT)
        .digest('hex');
    
    return BankAccount.findOne({ userId, accountNumberHash: hash });
}
```

**Completion:** [ ] Schema updated [ ] Lookup refactored [ ] Migration script created

---

## 🧪 Testing Checklist

### Performance Tests
```bash
# Test stale code vs optimized
npm run test:performance -- --module sales --scenario summary --records 50000

# Compare response times
npm run perf:before && npm run perf:after

# Load test with concurrent users
npm run loadtest -- --users 100 --duration 300
```

### Unit Tests
- [ ] StockAgingService aggregation produces same results as loop
- [ ] SalesService.getSummary cache invalidation works
- [ ] Pagination correctly handles edge cases (page 0, limit > total)
- [ ] Indexes are created on all required fields

### Integration Tests
- [ ] Finance reports still calculate correctly after aggregation changes
- [ ] Cache hits don't stale data
- [ ] Encrypted field hash lookup returns same results

---

## 📊 Success Metrics

Track these metrics before and after implementation:

### Query Performance
| Scenario | Before | Target | Status |
|----------|--------|--------|--------|
| getSalesInvoiceSummary (50K invoices) | 8.5s | 120ms | [ ] |
| getAllInvoices (50K, page 1) | 12.3s | 45ms | [ ] |
| getStockAgingAnalysis (1K items) | 45s | 1.2s | [ ] |
| buildFinanceReport (10K entries) | 22s | 2.8s | [ ] |

### Payload Size
| Endpoint | Before | Target | Status |
|----------|--------|--------|--------|
| getAllInvoices | 15MB | 2MB | [ ] |
| FinanceReport | 25MB | 3.5MB | [ ] |
| InventoryList | 12MB | 1.8MB | [ ] |

### Database Metrics
| Metric | Before | Target |
|--------|--------|--------|
| Queries per request | 9-12 | 1-2 |
| Index hit rate | 40% | >95% |
| Cache hit rate | 0% | 70% |

---

## 🚨 Common Pitfalls

### Don't
- ❌ Use `exec()` inside loops (N+1 guaranteed)
- ❌ Fetch full documents then filter in memory
- ❌ Skip field projection on large collections
- ❌ Forget to add `tenantId` to all index keys
- ❌ Cache without TTL (causes stale data)

### Do
- ✅ Use aggregation for complex queries
- ✅ Filter and project at database layer
- ✅ Always limit populate fields
- ✅ Create compound indexes for common patterns
- ✅ Invalidate cache on writes

---

## 📚 Reference Files

**Analysis Reports:**
- `BACKEND_PERFORMANCE_ANALYSIS.md` - Detailed issues with line numbers
- `BACKEND_PERFORMANCE_OPTIMIZATION_GUIDE.md` - Code examples for each pattern

**Models to Check:**
- `backend/src/modules/sales/models/Invoice.ts` - Invoice indexes
- `backend/src/modules/inventory/models/Item.ts` - Item indexes
- `backend/src/modules/finance/models/Bill.ts` - Bill indexes
- `backend/src/modules/finance/models/BankAccount.ts` - Encrypted fields

**Services to Optimize:**
1. `SalesService.ts` - getSummary() memory bloat
2. `StockAgingService.ts` - N+1 loop queries
3. `FinanceReportService.ts` - Multiple sequential queries
4. `InventoryService.ts` - getAllItemsWithPagination pagination

**Controllers to Update:**
1. `SalesController.ts` - Add pagination params
2. `InventoryController.ts` - Add pagination params
3. `SalesInvoiceController.ts` - Add field projection

---

## 🔄 Rollback Plan

If optimization causes issues:

1. **Aggregation Query Changed Results:**
   - Compare output records manually
   - Check calculation logic in aggregation pipeline
   - Verify $group stages

2. **Cache Stale Data:**
   - Reduce TTL temporarily
   - Add manual cache invalidation
   - Check change streams setup

3. **Index Doesn't Improve Performance:**
   - Run `explain()` to verify index is used
   - Check field order in compound indexes
   - Consider partial index instead

---

## 📝 Sign-Off

- [ ] P0 Items Complete
- [ ] P1 Items Complete
- [ ] Performance Metrics Verified
- [ ] Load Tests Passed
- [ ] Code Review Approved
- [ ] Deployed to Production

