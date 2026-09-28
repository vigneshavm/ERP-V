/**
 * DESIGN SYSTEM ENFORCEMENT CHECKLIST
 * 
 * Use this checklist to audit components and pages for design system compliance.
 * All new components MUST pass this checklist before PR submission.
 * 
 * Reference: /frontend/src/constants/designTokens.ts
 */

// ============================================
// SPACING AUDIT CHECKLIST
// ============================================

/**
 * SPACING COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] All padding uses 8px increments: 4px, 8px, 16px, 24px, 32px, 48px
 * [ ] All margins use same scale
 * [ ] All gaps/space-y use same scale
 * [ ] No hardcoded values like 12px, 20px, 6px
 * [ ] Padding in Cards: 16px (p-4/p-6), 24px (p-6/p-8), 32px (p-8) only
 * [ ] Button padding: 8px (sm), 16px (md), 24px (lg)
 * [ ] Input padding: 8px (sm), 16px (md), 24px (lg)
 * [ ] Section gaps: 24px (lg) minimum
 * ] Component spacing consistent with design tokens
 * 
 * Example scan regex:
 * / SHOULD NOT MATCH /
 * p-[0-3], p-5, p-7, p-9, p-11
 * m-[0-3], m-5, m-7, m-9, m-11
 * gap-[0-3], gap-5, gap-7, gap-9, gap-11
 * space-y-[0-3], space-y-5, space-y-7, space-y-9, space-y-11
 * padding: '[4-9]px', padding: '1[0-5]px', padding: '[2-3][0-9]px'
 */

// ============================================
// BORDER RADIUS AUDIT CHECKLIST
// ============================================

/**
 * BORDER RADIUS COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] Only use: rounded-lg (8px), rounded-2xl (4px), rounded-3xl (16px)
 * [ ] Most components use rounded-lg (8px) - this is the default
 * [ ] Buttons use rounded-2xl (4px) - subtle rounding
 * [ ] Large/prominent cards use rounded-3xl (16px) - rare
 * [ ] No rounded-sm, rounded-md, rounded-xl
 * [ ] All interactive elements have radius
 * [ ] No hardcoded borderRadius values like '6px', '12px'
 * [ ] Dark mode radius values consistent
 * 
 * Example scan regex:
 * / SHOULD NOT MATCH /
 * rounded-sm, rounded-md, rounded, rounded-xl
 * borderRadius: '[^0]', borderRadius: '1[0-2]px'
 * border-radius: '[4-7]px', border-radius: '9px'
 */

// ============================================
// TYPOGRAPHY AUDIT CHECKLIST
// ============================================

/**
 * TYPOGRAPHY COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] Page title = h1 (text-2xl font-black)
 * [ ] Section title = h2 (text-xl font-bold)
 * [ ] Subsection = h3 (text-lg font-bold)
 * [ ] Card title = h4 (text-base font-semibold)
 * [ ] Body text = text-sm (14px, font-400/500)
 * [ ] Labels/helpers = text-xs (12px, font-400/500)
 * [ ] No arbitrary text sizes (text-6xl, text-base, text-11px)
 * [ ] No mixing heading levels (h1 + h3 without h2)
 * [ ] Line heights match typography scale
 * [ ] Font weights: 400/500 for body, 600+ for headings
 * 
 * Example scan regex:
 * / SHOULD NOT MATCH /
 * text-[a-c], text-2xl, text-6xl, text-7xl
 * fontSize: '[0-9]+px' (except 10px, 12px, 14px, 16px, 20px, 24px, 28px, 32px)
 * font-thin, font-light, font-extrablack
 */

// ============================================
// SHADOW AUDIT CHECKLIST
// ============================================

/**
 * SHADOW COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] Cards at rest = shadow-sm
 * [ ] Hover/interactive = shadow-md
 * [ ] Modals = shadow-lg
 * [ ] Dropdowns/floating = shadow-xl
 * [ ] Notifications/overlays = shadow-2xl (rare)
 * [ ] No shadow-xs, shadow-inner, shadow-none on interactive elements
 * [ ] Shadows consistent in light and dark modes
 * [ ] No multiple shadows on same element
 * [ ] Shadow elevation matches component importance
 * 
 * Example audit:
 * - Card variant="default" → should have shadow-sm
 * - Hover states → should increase to shadow-md or shadow-lg
 * - Modal overlays → should have shadow-lg or shadow-xl
 * - Floating elements (tooltip, dropdown) → shadow-xl
 */

// ============================================
// COLOR AUDIT CHECKLIST
// ============================================

/**
 * COLOR COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] All semantic colors use CSS variables
 * [ ] No hardcoded hex colors (#fff, #000, #e74c3c)
 * [ ] Primary actions = Button variant="primary"
 * [ ] Success state = variant="success" or text-success
 * [ ] Warning state = variant="warning" or text-warning
 * [ ] Danger state = variant="danger" or text-danger
 * [ ] Text colors: text-slate-900 (primary), text-slate-600 (secondary), text-slate-500 (muted)
 * [ ] Dark mode: text-white, text-slate-400, text-slate-500
 * [ ] Background: bg-white, bg-slate-50, bg-slate-100
 * [ ] No random color combinations
 * [ ] Contrast ratio ≥ 4.5:1 for WCAG AA
 * 
 * Example scan:
 * No: className="text-blue-600" → use className="text-primary"
 * No: style={{ color: '#e74c3c' }} → use className="text-danger"
 */

// ============================================
// COMPONENT SIZE AUDIT CHECKLIST
// ============================================

/**
 * SIZE COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * Button Heights:
 * [ ] sm = 32px (2rem)
 * [ ] md = 40px (2.5rem) - default
 * [ ] lg = 48px (3rem) - rare
 * 
 * Input Heights:
 * [ ] sm = 32px (2rem)
 * [ ] md = 40px (2.5rem) - default
 * [ ] lg = 48px (3rem) - rare
 * 
 * Icon Sizes:
 * [ ] xs = 16px (1rem)
 * [ ] sm = 20px (1.25rem)
 * [ ] md = 24px (1.5rem) - default
 * [ ] lg = 32px (2rem)
 * [ ] xl = 40px (2.5rem) - rare
 * 
 * [ ] All components use size prop (sm/md/lg)
 * [ ] No arbitrary heights (h-12, h-16, h-20)
 */

// ============================================
// Z-INDEX AUDIT CHECKLIST
// ============================================

/**
 * Z-INDEX COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] z-auto for default layer (1)
 * [ ] z-1000 for dropdowns/floating
 * [ ] z-1050 for modals/dialogs
 * [ ] z-9999 for notifications/toasts (highest)
 * [ ] No arbitrary z-index (z-10, z-50, z-500)
 * [ ] Modal backdrop = z-1040 (below modal)
 * [ ] Consistent layering (no z-index wars)
 * [ ] Multiple modals properly stacked
 * 
 * Hierarchy:
 * z-1      = base/default
 * z-1000   = dropdowns, popovers
 * z-1020   = sticky headers
 * z-1040   = modal backdrop
 * z-1050   = modal window
 * z-9999   = notifications/toast
 */

// ============================================
// ACCESSIBILITY AUDIT CHECKLIST
// ============================================

/**
 * A11Y COMPLIANCE WITH DESIGN SYSTEM
 * 
 * ✅ Required Checks:
 * 
 * Contrast:
 * [ ] Primary text vs background ≥ 4.5:1
 * [ ] Secondary text vs background ≥ 4.5:1
 * [ ] Focus indicators ≥ 3:1
 * [ ] Disabled state clearly visible
 * 
 * Focus States:
 * [ ] All interactive elements focusable
 * [ ] Focus ring: ring-2 ring-primary (consistent)
 * [ ] Focus visible on keyboard navigation
 * [ ] Focus not hidden by z-index
 * 
 * ARIA:
 * [ ] Buttons have aria-label or text content
 * [ ] Form inputs have associated labels
 * [ ] Modals have role="dialog"
 * [ ] Icons-only buttons have aria-label
 * [ ] Loading states: aria-busy="true"
 * [ ] Disabled states: aria-disabled="true"
 * 
 * Keyboard Navigation:
 * [ ] All controls keyboard accessible
 * [ ] Tab order logical
 * [ ] Escape closes modals/dropdowns
 * [ ] Enter/Space activates buttons
 */

// ============================================
// DARK MODE AUDIT CHECKLIST
// ============================================

/**
 * DARK MODE COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] All colors have dark: variant
 * [ ] Text: dark:text-white, dark:text-slate-400
 * [ ] Backgrounds: dark:bg-slate-900, dark:bg-slate-800
 * [ ] Borders: dark:border-slate-700
 * [ ] Shadows visible in dark mode
 * [ ] No hardcoded colors in dark mode
 * [ ] Test with prefers-color-scheme: dark
 * [ ] All components render correctly both modes
 * [ ] Images/logos have dark mode versions if needed
 * [ ] Contrast ≥ 4.5:1 in both modes
 * 
 * Example:
 * ✅ className="text-slate-900 dark:text-white"
 * ✅ className="bg-white dark:bg-slate-900"
 * ❌ className="text-black" (no dark variant)
 * ❌ className="bg-blue-500" (missing dark version)
 */

// ============================================
// CODE AUDIT CHECKLIST
// ============================================

/**
 * CODE QUALITY
 * 
 * ✅ Required Checks:
 * 
 * [ ] Imports designTokens where used
 * [ ] No inline style objects for common properties
 * [ ] ClassName concatenation clean and readable
 * [ ] No unnecessary wrapper divs
 * [ ] Semantic HTML tags (button, input, section, etc)
 * [ ] No console.log or debug code
 * [ ] TypeScript types exported properly
 * [ ] Comments document non-obvious decisions
 * [ ] No unused imports or variables
 * [ ] PropTypes or TypeScript interfaces defined
 * [ ] Component properly memoized if needed
 * 
 * Lint Checks:
 * [ ] eslint --fix passes
 * [ ] No TypeScript errors (npm run build)
 * [ ] No warnings in console
 * [ ] No unused classes
 * [ ] No CSS conflicts
 */

// ============================================
// RESPONSIVE AUDIT CHECKLIST
// ============================================

/**
 * RESPONSIVE COMPLIANCE
 * 
 * ✅ Required Checks:
 * 
 * [ ] Mobile first approach (no max-width default)
 * [ ] Breakpoints: sm (640px), md (768px), lg (1024px)
 * [ ] Spacing increases on larger screens
 * [ ] Typography scales appropriately
 * [ ] Touch targets ≥ 44px (mobile accessibility)
 * [ ] Tested on: 320px, 640px, 768px, 1024px, 1280px, 1536px
 * [ ] No horizontal scroll
 * [ ] Images responsive (max-w-full)
 * [ ] Grid columns adapt to screen size
 * 
 * Example:
 * ✅ className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
 * ✅ className="text-sm md:text-base lg:text-lg"
 * ✅ className="p-4 md:p-6 lg:p-8"
 */

// ============================================
// COMPONENT-SPECIFIC CHECKLISTS
// ============================================

/**
 * BUTTON COMPONENT
 * 
 * [ ] Variant selected: primary, secondary, danger, etc
 * [ ] Size selected: sm, md, lg
 * [ ] Loading state shows spinner
 * [ ] Disabled state has reduced opacity + cursor-not-allowed
 * [ ] Focus ring visible: ring-2 ring-primary ring-offset-2
 * [ ] Text is readable in all states
 * [ ] Icon aligned properly (left/right)
 * [ ] Full width only when intentional
 */

/**
 * INPUT COMPONENT
 * 
 * [ ] Type selected: text, email, password, number, tel, url, search
 * [ ] Size selected: sm, md, lg
 * [ ] Status state: default, success, error, warning
 * [ ] Placeholder text visible and readable
 * [ ] Label properly associated (htmlFor)
 * [ ] Required indicator (*) shown
 * [ ] Validation message appears below
 * [ ] Password toggle works and accessible
 * [ ] Error/success/warning icons show correctly
 * [ ] Help text descriptive and clear
 */

/**
 * CARD COMPONENT
 * 
 * [ ] Variant selected: default, elevated, flat, outlined
 * [ ] Size selected: sm, md, lg
 * [ ] Header has trailing element if needed
 * [ ] Body content readable with proper line-height
 * [ ] Footer action buttons aligned properly
 * [ ] Scrollable body has fixed height
 * [ ] Full height fills available space
 * [ ] Shadow matches variant (default=sm, elevated=lg)
 */

/**
 * MODAL / DIALOG
 * 
 * [ ] Backdrop: z-1040 with overlay opacity
 * [ ] Modal: z-1050 centered on screen
 * [ ] Escape key closes modal
 * [ ] Click outside closes (if dismissible)
 * [ ] Focus trapped inside modal
 * [ ] Title and content accessible
 * [ ] Actions (buttons) at bottom
 * [ ] No scrolling behind modal
 */

/**
 * DROPDOWN / SELECT
 * 
 * [ ] Trigger button shows current value
 * [ ] Menu appears below/above as needed
 * [ ] z-index: z-1000
 * [ ] Arrow icon indicates open/closed
 * [ ] Keyboard navigation works (arrow keys)
 * [ ] ESC closes menu
 * [ ] Click outside closes menu
 * [ ] Hover state on options
 * [ ] Selected option highlighted
 */

/**
 * TABLE / DATA GRID
 * 
 * [ ] Header row sticky at top
 * [ ] Zebra striping: alternate row colors
 * [ ] Hover state on rows
 * [ ] Column alignment: text-left (default), text-right (numbers), text-center (actions)
 * [ ] Padding consistent: 12px/16px per cell
 * [ ] Sorting indicators on headers
 * [ ] Pagination controls below table
 * [ ] Empty state message if no data
 */

// ============================================
// TESTING CHECKLIST
// ============================================

/**
 * MANUAL TESTING
 * 
 * [ ] Visual inspection matches design
 * [ ] All states tested (hover, focus, active, disabled)
 * [ ] Keyboard navigation works
 * [ ] Screen reader test (NVDA, JAWS, VoiceOver)
 * [ ] Light mode rendering
 * [ ] Dark mode rendering
 * [ ] Mobile (320px) rendering
 * [ ] Tablet (768px) rendering
 * [ ] Desktop (1024px) rendering
 * [ ] Form submission works
 * [ ] Error messages display
 * [ ] Success messages display
 * [ ] Loading states show
 * [ ] No visual regressions
 */

/**
 * AUTOMATED TESTING
 * 
 * [ ] Unit tests pass
 * [ ] Integration tests pass
 * [ ] E2E tests pass (if applicable)
 * [ ] Coverage ≥ 80%
 * [ ] No console warnings
 * [ ] No TypeScript errors
 * [ ] ESLint passes
 * [ ] axe-core a11y audit passes
 */

/**
 * PERFORMANCE TESTING
 * 
 * [ ] Lighthouse score ≥ 80
 * [ ] Rendering time < 100ms
 * [ ] No layout shifts (CLS)
 * [ ] Images optimized
 * [ ] Bundle size acceptable
 */

// ============================================
// PR SUBMISSION CHECKLIST
// ============================================

/**
 * BEFORE SUBMITTING PR
 * 
 * [ ] All design system checklists passed
 * [ ] Code formatted (Prettier)
 * [ ] Linting passes (ESLint)
 * [ ] TypeScript compilation passes (npm run build)
 * [ ] Tests passing (npm run test)
 * [ ] No console errors/warnings
 * [ ] No hardcoded values (uses designTokens)
 * [ ] Dark mode tested
 * [ ] Mobile responsive tested
 * [ ] Accessibility audit passed
 * [ ] PR description explains changes
 * [ ] Screenshots included (if UI changes)
 * [ ] No breaking changes (or documented)
 * [ ] Dependencies documented (if added)
 */

// ============================================
// AUTOMATED AUDIT COMMANDS
// ============================================

/**
 * RUN THESE COMMANDS TO VALIDATE
 * 
 * npm run lint          # Check for linting errors
 * npm run build         # Verify TypeScript compilation
 * npm run test          # Run test suite
 * npm run type-check    # Strict type checking
 * 
 * Optional (if available):
 * npm run a11y          # Accessibility audit
 * npm run sonarqube     # Code quality analysis
 * npm run lighthouse    # Performance audit
 */

export const DESIGN_SYSTEM_CHECKLIST = {
  spacing: 'Use 8px base unit: 4px, 8px, 16px, 24px, 32px, 48px',
  radius: 'Use only: rounded-2xl (4px), rounded-lg (8px), rounded-3xl (16px)',
  typography: 'Use h1-h4 for titles, text-sm for body, text-xs for labels',
  shadows: 'sm (cards), md (hover), lg (modals), xl (dropdowns)',
  colors: 'Use CSS variables, never hardcode hex colors',
  sizes: 'sm/md/lg for buttons/inputs, match design tokens',
  zIndex: 'Use: 1000 (dropdown), 1050 (modal), 9999 (notification)',
  accessibility: 'Contrast ≥ 4.5:1, keyboard navigation, ARIA labels',
  darkMode: 'Always include dark: variants for all colors',
  responsive: 'Mobile first, test all breakpoints',
};

export default DESIGN_SYSTEM_CHECKLIST;
