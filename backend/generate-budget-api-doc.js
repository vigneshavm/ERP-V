const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, Footer
} = require('docx');
const fs = require('fs');

const C = {
  primary: '2C3E50', accent: '8E44AD', green: '27AE60', orange: 'E67E22',
  red: 'E74C3C', teal: '16A085', headerBg: '2C3E50', rowAlt: 'F8F5FC',
  border: 'CCCCCC', white: 'FFFFFF', text: '2C3E50', muted: '7F8C8D',
};

const methodColors = { GET: '27AE60', POST: '2E86AB', PATCH: 'E67E22', PUT: 'E67E22', DELETE: 'E74C3C' };
const border = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const borders = { top: border, bottom: border, left: border, right: border };

const cell = (text, opts = {}) => new TableCell({
  borders,
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
  verticalAlign: 'center',
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({
      text,
      font: opts.mono ? 'Courier New' : 'Arial',
      size: opts.header ? 20 : 18,
      bold: opts.bold || opts.header || false,
      color: opts.color || (opts.header ? C.white : C.text),
    })]
  })]
});

const methodBadge = (method) => new TableCell({
  borders,
  width: { size: 1100, type: WidthType.DXA },
  shading: { fill: methodColors[method] || '555555', type: ShadingType.CLEAR },
  verticalAlign: 'center',
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: method, font: 'Arial', size: 17, bold: true, color: C.white })]
  })]
});

const hRow = (cols, widths) => new TableRow({
  children: cols.map((c, i) => cell(c, { header: true, bg: C.headerBg, color: C.white, width: widths[i] }))
});
const dRow = (cols, widths, alt = false) => new TableRow({
  children: cols.map((c, i) => cell(c, { bg: alt ? C.rowAlt : C.white, width: widths[i] }))
});
const endpointRow = (method, path, desc, auth, alt = false) => new TableRow({
  children: [
    methodBadge(method),
    cell(path, { bg: alt ? C.rowAlt : C.white, width: 3300, mono: true, size: 17 }),
    cell(desc, { bg: alt ? C.rowAlt : C.white, width: 2760 }),
    cell(auth, { bg: alt ? C.rowAlt : C.white, width: 1760, color: C.muted, size: 16 }),
  ]
});

const endpointTable = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1100, 3300, 2760, 1760],
  rows: [
    new TableRow({ children: [
      cell('Method',      { header: true, bg: C.headerBg, color: C.white, width: 1100 }),
      cell('Endpoint',    { header: true, bg: C.headerBg, color: C.white, width: 3300 }),
      cell('Description', { header: true, bg: C.headerBg, color: C.white, width: 2760 }),
      cell('Auth',        { header: true, bg: C.headerBg, color: C.white, width: 1760 }),
    ]}),
    ...rows.map((r, i) => endpointRow(r[0], r[1], r[2], r[3], i % 2 !== 0))
  ]
});

const paramTable = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2000, 1400, 800, 5160],
  rows: [
    hRow(['Field', 'Type', 'Required', 'Description'], [2000, 1400, 800, 5160]),
    ...rows.map((r, i) => dRow(r, [2000, 1400, 800, 5160], i % 2 !== 0))
  ]
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 },
  children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: C.primary })]
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 4 } },
  children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: C.accent })]
});
const body = (text, opts = {}) => new Paragraph({
  spacing: { after: 100 },
  children: [new TextRun({ text, font: 'Arial', size: 20, color: opts.color || C.text, bold: opts.bold, italics: opts.italic })]
});
const code = (text) => new Paragraph({
  spacing: { after: 60 },
  shading: { fill: 'F4F6F8', type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.accent, space: 8 } },
  indent: { left: 360 },
  children: [new TextRun({ text, font: 'Courier New', size: 18, color: '2C3E50' })]
});
const spacer = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [new TextRun('')] }));

// ──────────────────────────────────────────────────────────────────
const children = [

  // Cover
  new Paragraph({ spacing: { before: 1440, after: 160 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Personal Budget Planner', font: 'Arial', size: 56, bold: true, color: C.primary })] }),
  new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'REST API Reference', font: 'Arial', size: 40, color: C.accent })] }),
  new Paragraph({ spacing: { after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Version 1.0  ·  Node.js + Express  ·  PostgreSQL', font: 'Arial', size: 22, color: C.muted })] }),
  new Paragraph({ spacing: { after: 1440 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Generated: ${new Date().toDateString()}`, font: 'Arial', size: 20, italics: true, color: C.muted })] }),
  new Paragraph({ children: [new PageBreak()] }),

  // 1. Overview
  h1('1. Overview'),
  body('This document describes all REST API endpoints for the Personal Budget Planner. The API replaces the in-memory mockState.ts used in the frontend and provides a persistent, multi-session backend on port 4000.'),
  ...spacer(),
  h2('Base URL'),
  code('https://api.yourdomain.com/api/v1'),
  code('Development: http://localhost:4000/api/v1'),
  ...spacer(),
  h2('Authentication'),
  body('All endpoints except /auth/register, /auth/login, /auth/refresh, /auth/forgot-password, and /auth/reset-password require a Bearer token:'),
  code('Authorization: Bearer <accessToken>'),
  body('Access tokens expire after 30 minutes. Refresh tokens are valid for 30 days (suitable for a mobile-style personal finance app).'),
  ...spacer(),
  h2('Response Envelope'),
  code('{ "success": true, "data": { ... } }'),
  code('{ "success": false, "message": "Validation failed", "errors": { "field": ["reason"] } }'),
  ...spacer(),
  h2('All Modules at a Glance'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 2000, 4960],
    rows: [
      hRow(['Module', 'Base Path', 'Purpose'], [2400, 2000, 4960]),
      ...[ ['Auth',          '/auth',          'Register, login, refresh, PIN lock, profile'],
           ['Dashboard',     '/dashboard',     'Wealth snapshot, 12-month summaries, SMS alerts'],
           ['Expenses',      '/expenses',      'Transactions, categories, anomaly detection'],
           ['Budget',        '/budget',        'Monthly budgets, item allocations, mode toggle'],
           ['Goals',         '/goals',         'Savings goals with daily nudge calculation'],
           ['Loans',         '/loans',         'Borrowed/lent tracker with payment recording'],
           ['Accounts',      '/accounts',      'Bank accounts and wallets'],
           ['Cards',         '/cards',         'Credit and debit card management'],
           ['Notifications', '/notifications', 'Alert inbox (anomaly, predictive, system)'],
           ['Reports',       '/reports',       'Stats, yearly insights, recurring bills, export'],
           ['Transactions',  '/transactions',  'All-transactions view, calendar, contacts'],
           ['Settings',      '/settings',      'Preferences, backup, data clear'],
      ].map((r, i) => dRow(r, [2400, 2000, 4960], i % 2 !== 0))
    ]
  }),

  new Paragraph({ children: [new PageBreak()] }),

  // 2. Auth
  h1('2. Authentication  /api/v1/auth'),
  body('Handles account creation, login, token management, PIN-based app lock, and password recovery.'),
  ...spacer(),
  h2('Endpoints'),
  endpointTable([
    ['POST',  '/auth/register',       'Create new personal account',                  'Public'],
    ['POST',  '/auth/login',          'Authenticate and get tokens',                  'Public'],
    ['POST',  '/auth/refresh',        'Get new access token with refresh token',      'Public'],
    ['POST',  '/auth/logout',         'Revoke current session',                       'Authenticated'],
    ['GET',   '/auth/me',             'Get current user profile',                     'Authenticated'],
    ['PUT',   '/auth/profile',        'Update name, currency, avatar',                'Authenticated'],
    ['POST',  '/auth/forgot-password','Request password reset email',                 'Public'],
    ['POST',  '/auth/reset-password', 'Complete password reset with token',           'Public'],
    ['POST',  '/auth/pin/set',        'Set or update 4–6 digit app lock PIN',         'Authenticated'],
    ['POST',  '/auth/pin/verify',     'Verify PIN to unlock app',                     'Authenticated'],
  ]),
  ...spacer(),
  h2('POST /auth/register — Request Body'),
  paramTable([
    ['email',    'string', 'Yes', 'Valid email. Will be the login identifier.'],
    ['password', 'string', 'Yes', 'Min 8 characters.'],
    ['name',     'string', 'Yes', 'Display name (shown in dashboard greeting).'],
    ['currency', 'string', 'No',  '3-letter ISO code (INR, USD, EUR…). Defaults to INR.'],
  ]),
  body('On success: returns accessToken, refreshToken, and user object. Default expense categories are auto-seeded.', { italic: true }),
  ...spacer(),
  h2('POST /auth/pin/set — Request Body'),
  paramTable([
    ['pin', 'string', 'Yes', '4 to 6 digit numeric PIN. Stored as bcrypt hash.'],
  ]),

  new Paragraph({ children: [new PageBreak()] }),

  // 3. Dashboard
  h1('3. Dashboard  /api/v1/dashboard'),
  body('Provides the primary home screen data: user wealth, rolling 12-month income/expense summaries, and pending SMS import count.'),
  ...spacer(),
  h2('Endpoints'),
  endpointTable([
    ['GET', '/dashboard',                   'Full home dashboard payload',                  'Authenticated'],
    ['GET', '/dashboard/summary/:year/:month', 'Income/expense totals for a specific month', 'Authenticated'],
  ]),
  ...spacer(),
  h2('GET /dashboard — Response Shape'),
  code('{ "profile": { "totalWealth": 125000, "currency": "INR" },'),
  code('  "monthlySummaries": [ { "month": "Mar 2026", "income": 60000, "expense": 35000,'),
  code('    "budget": 50000, "progress": 70.0, "showPredictive": false, "isCurrentMonth": true } ],'),
  code('  "smsTransfers": { "pendingCount": 3, "lastDetected": "2026-03-15T10:00:00Z" } }'),

  new Paragraph({ children: [new PageBreak()] }),

  // 4. Expenses
  h1('4. Expenses & Categories  /api/v1/expenses'),
  body('Core module: records every expense/income transaction, manages categories with budget limits, and detects spending anomalies automatically.'),
  ...spacer(),
  h2('Endpoints'),
  endpointTable([
    ['GET',    '/expenses',                    'List transactions (filterable, paginated)',      'Authenticated'],
    ['POST',   '/expenses',                    'Record expense or income (runs anomaly check)',  'Authenticated'],
    ['GET',    '/expenses/:id',                'Get single transaction',                         'Authenticated'],
    ['PATCH',  '/expenses/:id',                'Edit name, notes, or category',                 'Authenticated'],
    ['DELETE', '/expenses/:id',                'Delete transaction & reverse wealth impact',     'Authenticated'],
    ['POST',   '/expenses/:id/dispute',        'Dispute transaction — mark & reverse impact',   'Authenticated'],
    ['POST',   '/expenses/bulk/delete',        'Bulk delete by ID list',                        'Authenticated'],
    ['POST',   '/expenses/bulk/recategorize',  'Move transactions to a new category',           'Authenticated'],
    ['GET',    '/expenses/history/summary',    'Monthly spend breakdown by category',           'Authenticated'],
    ['GET',    '/expenses/anomaly/check',      'Pre-check if an amount would flag as anomaly',  'Authenticated'],
    ['GET',    '/expenses/categories',         'List categories with live current-month spend', 'Authenticated'],
    ['POST',   '/expenses/categories',         'Create a new category',                         'Authenticated'],
    ['PATCH',  '/expenses/categories/:id',     'Update category name, icon, color, limit',      'Authenticated'],
    ['DELETE', '/expenses/categories/:id',     'Delete category (un-links its transactions)',   'Authenticated'],
  ]),
  ...spacer(),
  h2('GET /expenses — Query Filters'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 1400, 6160],
    rows: [
      hRow(['Filter', 'Type', 'Description'], [1800, 1400, 6160]),
      ...[ ['categoryId', 'UUID',    'Filter by category'],
           ['type',       'string',  'expense | income'],
           ['from',       'date',    'Start date (YYYY-MM-DD)'],
           ['to',         'date',    'End date (YYYY-MM-DD)'],
           ['anomaly',    'boolean', 'true = show only anomaly-flagged transactions'],
           ['search',     'string',  'Searches name and notes'],
           ['page',       'integer', 'Page number (default 1)'],
           ['limit',      'integer', 'Items per page (default 30, max 100)'],
      ].map((r, i) => dRow(r, [1800, 1400, 6160], i % 2 !== 0))
    ]
  }),
  ...spacer(),
  h2('POST /expenses — Request Body'),
  paramTable([
    ['amount',        'number',  'Yes', 'Positive amount (any currency).'],
    ['categoryId',    'UUID',    'Yes', 'Category to log the transaction under.'],
    ['name',          'string',  'Yes', 'Short label (e.g. "Zomato order", "Salary").'],
    ['type',          'string',  'No',  'expense | income. Defaults to expense.'],
    ['date',          'string',  'No',  'Date in YYYY-MM-DD. Defaults to today.'],
    ['time',          'string',  'No',  'Time in HH:MM. Defaults to now.'],
    ['notes',         'string',  'No',  'Optional detail notes.'],
    ['paymentMethod', 'string',  'No',  'cash | card | upi | bank_transfer | other'],
    ['accountId',     'UUID',    'No',  'Linked bank account or wallet.'],
  ]),
  body('Response includes isAnomaly: true and anomalyReason if the amount is >3× the category average. A warning notification is auto-created when an anomaly is detected.', { italic: true }),
  ...spacer(),
  h2('Anomaly Detection Logic'),
  body('Server mirrors the frontend checkAnomaly function. If the last 5 transactions in the same category average to X, and the new amount > 3X, the transaction is flagged. Requires at least 3 prior transactions to trigger.'),
  ...spacer(),
  h2('POST /expenses/categories — Request Body'),
  paramTable([
    ['name',  'string', 'Yes', 'Category display name.'],
    ['icon',  'string', 'Yes', 'Emoji or icon identifier.'],
    ['color', 'string', 'Yes', 'Hex color code (#RRGGBB).'],
    ['limit', 'number', 'Yes', 'Monthly spending limit (0 for income categories).'],
    ['type',  'string', 'No',  'expense | income. Defaults to expense.'],
    ['emoji', 'string', 'No',  'Separate emoji field if different from icon.'],
  ]),

  new Paragraph({ children: [new PageBreak()] }),

  // 5. Budget
  h1('5. Budget  /api/v1/budget'),
  body('Manages monthly budget plans and per-category allocations. Supports zero-based and flexible modes — mirroring the frontend BudgetView.'),
  ...spacer(),
  h2('Endpoints'),
  endpointTable([
    ['GET',    '/budget',                    'Get budget for a month (auto-creates if missing)', 'Authenticated'],
    ['PATCH',  '/budget/mode',               'Switch zero-based ↔ flexible mode',              'Authenticated'],
    ['PUT',    '/budget/items/:categoryId',  'Set allocation for a category this month',       'Authenticated'],
    ['DELETE', '/budget/items/:categoryId',  'Remove a category from the budget',              'Authenticated'],
  ]),
  ...spacer(),
  h2('GET /budget — Query Parameters'),
  paramTable([['month', 'string', 'No', 'Target month in YYYY-MM format. Defaults to current month.']]),
  body('If no budget exists for the month, one is automatically created with mode = flexible and total = 0.', { italic: true }),
  ...spacer(),
  h2('PUT /budget/items/:categoryId — Request Body'),
  paramTable([
    ['amount', 'number', 'Yes', 'Allocated budget for this category in the specified month.'],
    ['month',  'string', 'No',  'Month in YYYY-MM format. Defaults to current month.'],
  ]),
  body('Budget total is automatically recalculated as the sum of all item allocations after each update.', { italic: true }),
  ...spacer(),
  h2('Budget Modes'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 7160],
    rows: [
      hRow(['Mode', 'Behaviour'], [2200, 7160]),
      dRow(['zero-based', 'Every rupee must be assigned. Total allocations should equal monthly income.'], [2200, 7160], false),
      dRow(['flexible',   'Allocations are guidelines. Unallocated money is tracked but not enforced.'],   [2200, 7160], true),
    ]
  }),

  new Paragraph({ children: [new PageBreak()] }),

  // 6. Goals
  h1('6. Goals  /api/v1/goals'),
  body('Savings goals with target, current amount, deadline, and a daily_nudge (auto-calculated as remaining ÷ days left).'),
  ...spacer(),
  h2('Endpoints'),
  endpointTable([
    ['GET',   '/goals',              'List all goals sorted by deadline',       'Authenticated'],
    ['POST',  '/goals',              'Create a new savings goal',               'Authenticated'],
    ['PATCH', '/goals/:id',          'Update goal metadata (name, target, etc)','Authenticated'],
    ['PATCH', '/goals/:id/progress', 'Update current saved amount',             'Authenticated'],
    ['DELETE','/goals/:id',          'Delete a goal',                           'Authenticated'],
  ]),
  ...spacer(),
  h2('POST /goals — Request Body'),
  paramTable([
    ['name',     'string', 'Yes', 'Goal name (e.g. "Emergency Fund", "Goa Trip").'],
    ['target',   'number', 'Yes', 'Total amount to save.'],
    ['current',  'number', 'No',  'Already saved amount. Defaults to 0.'],
    ['deadline', 'string', 'Yes', 'Target date in ISO 8601 (YYYY-MM-DD).'],
    ['icon',     'string', 'Yes', 'Emoji or icon identifier.'],
    ['color',    'string', 'Yes', 'Hex color code (#RRGGBB).'],
  ]),
  body('daily_nudge is auto-calculated as: (target − current) ÷ days_until_deadline.', { italic: true }),

  new Paragraph({ children: [new PageBreak()] }),

  // 7. Loans
  h1('7. Loans  /api/v1/loans'),
  body('Tracks money borrowed and lent. Recording a payment adjusts the user\'s total wealth accordingly: paying back borrowed money reduces wealth; receiving back lent money increases it.'),
  ...spacer(),
  h2('Endpoints'),
  endpointTable([
    ['GET',    '/loans',             'List all loans sorted by deadline',   'Authenticated'],
    ['POST',   '/loans',             'Add a new loan or lending record',    'Authenticated'],
    ['PATCH',  '/loans/:id',         'Update loan metadata',                'Authenticated'],
    ['POST',   '/loans/:id/payment', 'Record a payment against a loan',    'Authenticated'],
    ['DELETE', '/loans/:id',         'Delete a loan record',               'Authenticated'],
  ]),
  ...spacer(),
  h2('POST /loans — Request Body'),
  paramTable([
    ['name',          'string', 'Yes', 'Loan name (e.g. "Home Loan HDFC").'],
    ['bank',          'string', 'Yes', 'Lender or counterparty name.'],
    ['total',         'number', 'Yes', 'Total loan amount.'],
    ['current',       'number', 'No',  'Amount repaid so far. Defaults to 0.'],
    ['interestRate',  'number', 'Yes', 'Annual interest rate as a percentage.'],
    ['tenureMonths',  'integer','Yes', 'Loan tenure in months.'],
    ['type',          'string', 'Yes', 'Borrowed | Lent'],
    ['deadline',      'string', 'Yes', 'Expected payoff date (ISO 8601).'],
    ['icon',          'string', 'Yes', 'Emoji or icon identifier.'],
    ['color',         'string', 'Yes', 'Hex color code.'],
  ]),
  ...spacer(),
  h2('POST /loans/:id/payment — Request Body'),
  paramTable([['amount', 'number', 'Yes', 'Payment amount. Cannot exceed remaining balance.']]),

  new Paragraph({ children: [new PageBreak()] }),

  // 8. Accounts & Cards
  h1('8. Accounts & Cards'),
  ...spacer(),
  h2('Bank Accounts  /api/v1/accounts'),
  endpointTable([
    ['GET',    '/accounts',     'List all bank accounts / wallets',     'Authenticated'],
    ['POST',   '/accounts',     'Add a new account',                    'Authenticated'],
    ['PATCH',  '/accounts/:id', 'Update name, color, or selected flag', 'Authenticated'],
    ['DELETE', '/accounts/:id', 'Remove an account',                   'Authenticated'],
  ]),
  ...spacer(),
  h2('POST /accounts — Request Body'),
  paramTable([
    ['name',    'string', 'Yes', 'Account display name (e.g. "HDFC Savings").'],
    ['type',    'string', 'Yes', 'Savings | Checking | Current | Wallet'],
    ['balance', 'number', 'Yes', 'Opening balance.'],
    ['color',   'string', 'Yes', 'Hex color for UI display.'],
  ]),
  ...spacer(),
  h2('Credit Cards  /api/v1/cards/credit'),
  endpointTable([
    ['GET',    '/cards/credit',     'List all credit cards sorted by due date', 'Authenticated'],
    ['POST',   '/cards/credit',     'Add a credit card',                        'Authenticated'],
    ['DELETE', '/cards/credit/:id', 'Remove a credit card',                    'Authenticated'],
  ]),
  ...spacer(),
  h2('POST /cards/credit — Request Body'),
  paramTable([
    ['bank',     'string', 'Yes', 'Issuing bank name.'],
    ['cardName', 'string', 'Yes', 'Card product name (e.g. "HDFC Diners Black").'],
    ['last4',    'string', 'Yes', '4-digit card number suffix.'],
    ['network',  'string', 'Yes', 'Visa | Mastercard | RuPay | Amex | Discover'],
    ['limit',    'number', 'Yes', 'Credit limit amount.'],
    ['dueDate',  'string', 'Yes', 'Next bill due date (ISO 8601).'],
    ['minDue',   'number', 'No',  'Minimum due amount. Defaults to 0.'],
    ['color',    'string', 'Yes', 'Primary card colour (hex).'],
    ['gradient', 'string', 'No',  'CSS gradient string for card UI.'],
  ]),
  ...spacer(),
  h2('Debit Cards  /api/v1/cards/debit'),
  endpointTable([
    ['GET',    '/cards/debit',     'List all debit cards', 'Authenticated'],
    ['POST',   '/cards/debit',     'Add a debit card',     'Authenticated'],
    ['DELETE', '/cards/debit/:id', 'Remove a debit card',  'Authenticated'],
  ]),

  new Paragraph({ children: [new PageBreak()] }),

  // 9. Notifications
  h1('9. Notifications  /api/v1/notifications'),
  body('Stores system alerts including anomaly warnings, predictive budget alerts, and bill reminders. Populated automatically by the expense and budget modules.'),
  ...spacer(),
  endpointTable([
    ['GET',    '/notifications',          'List last 50 notifications, newest first', 'Authenticated'],
    ['PATCH',  '/notifications/:id/read', 'Mark a single notification as read',       'Authenticated'],
    ['PATCH',  '/notifications/read-all', 'Mark all notifications as read',           'Authenticated'],
    ['DELETE', '/notifications/:id',      'Delete a notification',                   'Authenticated'],
  ]),
  ...spacer(),
  h2('Notification Types'),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 7560],
    rows: [
      hRow(['type', 'When created'], [1800, 7560]),
      dRow(['warning', 'Anomaly detected — transaction is >3× category average'],           [1800, 7560], false),
      dRow(['info',    'Monthly budget usage crosses 90% (showPredictive trigger)'],         [1800, 7560], true),
      dRow(['success', 'Goal reached or loan fully repaid'],                                 [1800, 7560], false),
      dRow(['error',   'Pending SMS import requires user review'],                           [1800, 7560], true),
    ]
  }),

  new Paragraph({ children: [new PageBreak()] }),

  // 10. Reports
  h1('10. Reports  /api/v1/reports'),
  body('Analytics endpoints that replace StatsAnalytics, YearlyInsights, and DetailedReports from the frontend.'),
  ...spacer(),
  endpointTable([
    ['GET', '/reports/stats',    'Bar chart data (6 months) + remaining budget',   'Authenticated'],
    ['GET', '/reports/yearly',   'Full-year monthly totals + top 10 categories',   'Authenticated'],
    ['GET', '/reports/recurring','Recurring bills and subscriptions list',          'Authenticated'],
    ['GET', '/reports/detailed', 'All transactions for a date range with totals',  'Authenticated'],
  ]),
  ...spacer(),
  h2('GET /reports/yearly — Query Parameters'),
  paramTable([['year', 'integer', 'No', 'Year to report on. Defaults to current year.']]),
  ...spacer(),
  h2('GET /reports/detailed — Query Parameters'),
  paramTable([
    ['from', 'date', 'Yes', 'Start date in YYYY-MM-DD.'],
    ['to',   'date', 'Yes', 'End date in YYYY-MM-DD.'],
  ]),
  body('Response includes the full transaction list plus a totals object: { expense: number, income: number }.', { italic: true }),

  new Paragraph({ children: [new PageBreak()] }),

  // 11. Transactions (Calendar)
  h1('11. Transactions  /api/v1/transactions'),
  body('All-transactions view used by the financial calendar and MonthlyDetailList components. Provides data with full category metadata attached.'),
  ...spacer(),
  endpointTable([
    ['GET', '/transactions',         'All transactions with category info, sorted newest first', 'Authenticated'],
    ['GET', '/transactions/monthly', 'Monthly totals grouped by category',                      'Authenticated'],
    ['GET', '/transactions/contacts','Contact list for split / transfer UX',                    'Authenticated'],
  ]),
  ...spacer(),
  h2('GET /transactions/monthly — Query Parameters'),
  paramTable([['month', 'string', 'No', 'YYYY-MM format. Defaults to current month.']]),

  new Paragraph({ children: [new PageBreak()] }),

  // 12. Settings
  h1('12. Settings  /api/v1/settings'),
  body('User preferences, data backup, and account data management.'),
  ...spacer(),
  endpointTable([
    ['GET',  '/settings',          'Get all user preference settings',              'Authenticated'],
    ['PUT',  '/settings',          'Update one or more preferences',                'Authenticated'],
    ['POST', '/settings/backup',   'Export full account data as JSON',             'Authenticated'],
    ['POST', '/settings/data/clear','Wipe all transactions, goals, loans (keep account)', 'Authenticated'],
  ]),
  ...spacer(),
  h2('PUT /settings — Request Body (all fields optional)'),
  paramTable([
    ['theme',    'string', 'No', 'light | dark | system'],
    ['language', 'string', 'No', 'en | hi | ta | es'],
    ['currency', 'string', 'No', '3-letter ISO currency code'],
  ]),
  ...spacer(),
  h2('POST /settings/backup — Response'),
  body('Returns a full JSON snapshot of the user\'s data including profile, categories, transactions, goals, loans, accounts, credit cards, and budget. Use this as the frontend backup/restore feature\'s data source.', { italic: true }),

  new Paragraph({ children: [new PageBreak()] }),

  // 13. DB Schema
  h1('13. Database Tables'),
  body('Quick reference for the PostgreSQL schema that backs this API.'),
  ...spacer(),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      hRow(['Table', 'Key Columns'], [2400, 6960]),
      ...[ ['users',             'id, email, password_hash, name, currency, total_wealth, pin_hash, settings (JSONB)'],
           ['categories',        'id, user_id, name, icon, emoji, color, type, limit_amount'],
           ['transactions',      'id, user_id, category_id, name, amount, type, date, time, is_anomaly, disputed'],
           ['monthly_summaries', 'user_id, month_date, total_income, total_expense, budget_total'],
           ['budgets',           'id, user_id, month, total_amount, mode'],
           ['budget_items',      'id, budget_id, category_id, total_amount, spent, overspent'],
           ['goals',             'id, user_id, name, target, current, deadline, daily_nudge'],
           ['loans',             'id, user_id, name, bank, total, current, interest_rate, type'],
           ['accounts',          'id, user_id, name, type, balance, income, expense'],
           ['credit_cards',      'id, user_id, bank, card_name, last4, card_limit, spent, due_date'],
           ['debit_cards',       'id, user_id, bank, card_name, last4, account_id'],
           ['notifications',     'id, user_id, type, title, message, amount, read, created_at'],
           ['recurring_bills',   'id, user_id, name, amount, frequency, next_due_date'],
           ['sms_transactions',  'id, user_id, sender, amount, type, status, raw_message'],
           ['contacts',          'id, user_id, name, initials, color'],
           ['password_reset_tokens', 'user_id, token, expires_at'],
      ].map((r, i) => dRow(r, [2400, 6960], i % 2 !== 0))
    ]
  }),

  ...spacer(2),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 8 } },
    children: [new TextRun({ text: 'Personal Budget Planner API  ·  v1.0  ·  Confidential', font: 'Arial', size: 18, italics: true, color: C.muted })]
  }),
];

const doc = new Document({
  numbering: { config: [] },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20, color: C.text } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: C.primary },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: C.accent },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
          children: [
            new TextRun({ text: 'Budget Planner API  ·  Page ', font: 'Arial', size: 18, color: C.muted }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: C.muted }),
            new TextRun({ text: ' of ', font: 'Arial', size: 18, color: C.muted }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: C.muted }),
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/Budget-Planner-API-Reference.docx', buf);
  console.log('Done');
});
