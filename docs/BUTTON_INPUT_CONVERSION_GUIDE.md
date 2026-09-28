# Raw Button/Input Conversion Guide - 700+ Elements

**Status**: Bulk conversion strategy for 501 raw buttons + 202 raw inputs across 140+ files

## Problem Scale
- **Raw `<button>` tags**: 501 across 117 files
- **Raw `<input>` tags**: 202 across 71 files
- **Total elements**: 703 to convert
- **Target**: Replace with shared `Button` and `Input` components

---

## VS Code Find & Replace Patterns

Use these regex patterns in VS Code Find & Replace (Ctrl+H) to automate bulk conversions:

### Pattern 1: Simple Raw Buttons Without onClick/Props
**Find:**
```
<button\s+className="([^"]+)"\s*>\s*([^<]+)\s*<\/button>
```

**Replace:**
```
<Button className="$1">$2</Button>
```

---

### Pattern 2: Raw Buttons With onClick
**Find:**
```
<button\s+onClick=\{([^}]+)\}\s+className="([^"]+)"\s*>\s*([^<]*)\s*<\/button>
```

**Replace:**
```
<Button onClick={$1} className="$2">$3</Button>
```

---

### Pattern 3: Raw Input Fields (Text)
**Find:**
```
<input\s+type="text"\s+placeholder="([^"]+)"\s+className="([^"]+)"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s*/>
```

**Replace:**
```
<Input type="text" placeholder="$1" className="$2" value={$3} onChange={$4} />
```

---

### Pattern 4: Date Input Fields
**Find:**
```
<input\s+type="date"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="([^"]+)"\s*/>
```

**Replace:**
```
<Input type="date" value={$1} onChange={$2} className="$3" />
```

---

### Pattern 5: Number Input Fields
**Find:**
```
<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+placeholder="([^"]+)"\s+className="([^"]+)"\s*/>
```

**Replace:**
```
<Input type="number" value={$1} onChange={$2} placeholder="$3" className="$4" />
```

---

## Top 10 Files by Priority (High Impact First)

| Rank | File | Elements | Status |
|------|------|----------|--------|
| 1 | `frontend/src/features/inventory/CategoryManager.tsx` | 18 | ⏳ Pending |
| 2 | `frontend/src/features/tenants/TenantSignUp.tsx` | 18 | ⏳ Pending |
| 3 | `frontend/src/features/sales/salesInvoices/SalesInvoiceDetail.tsx` | 17 | ⏳ Pending |
| 4 | `frontend/src/features/pos/POSCartGrid.tsx` | 17 | ⏳ Pending |
| 5 | `frontend/src/features/inventory/SerializedUnitLookup.tsx` | 15 | ⏳ Pending |
| 6 | `frontend/src/features/expenses/DailyFinance.tsx` | 15 | ⏳ Pending |
| 7 | `frontend/src/features/system/Data/components/BarcodeGenerator.tsx` | 15 | ⏳ Pending |
| 8 | `frontend/src/features/purchase/PurchaseExpress.tsx` | 13 | ⏳ Pending |
| 9 | `frontend/src/features/pos/templates/StandardPOSTemplate.tsx` | 12 | ⏳ Pending |
| 10 | `frontend/src/features/purchase/PurchaseOrderForm.tsx` | 12 | ⏳ Pending |

---

## Required Imports (Add to Each File)

After conversion, ensure these imports exist at the top:

```typescript
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
```

---

## Implementation Steps

### Option A: Manual VS Code Search & Replace (Fastest)
1. Open **Find & Replace** (Ctrl+H) in VS Code
2. Use regex patterns above sequentially
3. Test on one file first, then apply across workspace
4. Verify TypeScript errors afterward

### Option B: Automated Bulk Processing
1. Run in terminal:
   ```bash
   npm run lint:fix  # If configured for Button/Input updates
   ```

### Option C: Agent-Assisted (Recommended for scale)
This guide documents all patterns needed for an automated tool to process all 140+ files.

---

## Before/After Examples

### Button Conversion
```jsx
// BEFORE
<button
  onClick={() => setStep(2)}
  className="px-4 py-2 bg-primary text-white rounded-lg font-bold"
>
  Next Step
</button>

// AFTER
<Button
  onClick={() => setStep(2)}
  className="px-4 py-2 bg-primary text-white rounded-lg font-bold"
>
  Next Step
</Button>
```

### Input Conversion
```jsx
// BEFORE
<input
  type="text"
  placeholder="Search..."
  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

// AFTER
<Input
  type="text"
  placeholder="Search..."
  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

---

## Special Cases to Handle Manually

### 1. Checkbox Inputs
**Keep as-is** (Do not convert):
```jsx
<input type="checkbox" ... />  // ✅ Leave unchanged
```

### 2. Hidden Inputs
**Keep as-is**:
```jsx
<input type="hidden" ... />  // ✅ Leave unchanged
```

### 3. Radio Inputs
**Keep as-is**:
```jsx
<input type="radio" ... />  // ✅ Leave unchanged
```

### 4. File Upload Inputs
**Keep as-is**:
```jsx
<input type="file" ... />  // ✅ Leave unchanged
```

### 5. Buttons with Complex JSX Inside
**Manual review required**:
```jsx
<button ...>
  <Icon /> <span>Text</span>  // Needs manual conversion
</button>
```

---

## Validation Checklist

After conversion:

- [ ] Run `npm run build --workspace=frontend` - Zero TypeScript errors
- [ ] Run `npm run lint --workspace=frontend` - All lint rules pass
- [ ] Verify no broken imports
- [ ] Check Button/Input components render correctly
- [ ] Test on light and dark modes
- [ ] Visual regression check on high-impact files

---

## Files Completed So Far
- ✅ (none yet - awaiting batch processing)

---

## Token Saving Strategy

Given scale (700+ elements), this approach:
- ✅ Reduces manual file-by-file editing
- ✅ Uses VS Code's efficient Find & Replace
- ✅ Scales to all 140+ files at once
- ✅ Minimal human token budget required

---

## Next Steps

1. **Use VS Code Find & Replace** with patterns above to convert bulk files
2. **Run type checking** (`npm run build --workspace=frontend`)
3. **Fix any remaining manual cases**
4. **Update session memory** with completion status

**Estimated Time**: 30-45 minutes using VS Code Find & Replace  
**Estimated Files Touched**: 140+  
**Estimated Elements Converted**: 700+

