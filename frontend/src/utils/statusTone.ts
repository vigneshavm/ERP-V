/**
 * One place that decides which colour a business status gets.
 * Screens pass the status; they never pick a colour themselves.
 * Colours come from the tokens in index.css (--color-success etc.).
 */

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

/** Badge recipe per tone: text + soft fill + line. */
export const TONE_CLASSES: Record<Tone, string> = {
    success: 'text-success bg-success-soft border-success-line',
    warning: 'text-warning bg-warning-soft border-warning-line',
    danger: 'text-danger bg-danger-soft border-danger-line',
    info: 'text-info bg-info-soft border-info-line',
    neutral: 'text-secondary bg-input border-default',
    brand: 'text-primary bg-primary-soft border-transparent'
};

/** Text-only colour per tone, for inline values such as a negative balance. */
export const TONE_TEXT: Record<Tone, string> = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
    neutral: 'text-secondary',
    brand: 'text-primary'
};

/**
 * success = done / money in / available
 * warning = needs attention soon
 * danger  = a problem now
 * info    = in progress or a neutral fact that still needs a label
 * neutral = draft / inactive / not started
 */
export const STATUS_TONE: Record<string, Tone> = {
    // Sales & payments
    PAID: 'success',
    SETTLED: 'success',
    COMPLETED: 'success',
    CLEARED: 'success',
    CLEAR: 'success',
    SOLD: 'success',
    NO_DUES: 'success',
    PARTIAL: 'warning',
    PARTIALLY_PAID: 'warning',
    PART_PAID: 'warning',
    UNPAID: 'warning',
    PENDING: 'warning',
    DUE_SOON: 'warning',
    NEAR_CREDIT_LIMIT: 'warning',
    OVERDUE: 'danger',
    CANCELLED: 'danger',
    BOUNCED: 'danger',
    DEFAULTED: 'danger',
    REJECTED: 'danger',
    FAILED: 'danger',
    OVER_CREDIT_LIMIT: 'danger',
    RETURNED: 'info',
    REFUNDED: 'info',
    SENT: 'info',

    // Purchase & GRN
    RECEIVED: 'success',
    APPROVED: 'success',
    POSTED: 'success',
    PARTIALLY_RECEIVED: 'warning',
    SUBMITTED: 'warning',
    AWAITING_APPROVAL: 'warning',
    SHORT_SUPPLY: 'danger',
    ORDERED: 'info',
    SENT_TO_VENDOR: 'info',
    IN_TRANSIT: 'info',

    // Inventory
    IN_STOCK: 'success',
    LOW_STOCK: 'warning',
    AGED: 'warning',
    OUT_OF_STOCK: 'danger',
    DAMAGED: 'danger',
    WRITTEN_OFF: 'danger',
    TRANSFER: 'info',

    // Cash & bank
    RECONCILED: 'success',
    UNRECONCILED: 'warning',
    CASH_SHORT: 'danger',

    // Staff & payroll
    PRESENT: 'success',
    HALF: 'warning',
    HALF_DAY: 'warning',
    QUARTER: 'warning',
    ABSENT: 'danger',
    OVERTIME: 'info',
    ON_LEAVE: 'neutral',

    // Sync & system
    SYNCED: 'success',
    ACTIVE: 'success',
    LIVE: 'success',
    OFFLINE: 'warning',
    CONFLICT: 'danger',
    LOCKED: 'danger',
    SYNCING: 'info',
    PROCESSING: 'info',

    // Purchase bills, returns, estimates, debit notes
    MATCHED: 'success',
    ACCEPTED: 'success',
    CREDITED: 'success',
    COMPLETE: 'success',
    PENDING_APPROVAL: 'warning',
    DISPUTED: 'danger',
    BILLED: 'info',
    INITIATED: 'info',
    ACKNOWLEDGED: 'info',
    HOLD: 'neutral',
    REVERSED: 'neutral',

    // Imports & processing results
    PROCESSED: 'success',
    VALID: 'success',
    WARNING: 'warning',
    ERROR: 'danger',

    // Not started / switched off
    DRAFT: 'neutral',
    INACTIVE: 'neutral',
    NEW: 'neutral',
    NOT_CONNECTED: 'neutral'
};

/** "Partially paid", "partially-paid" and "PARTIALLY_PAID" all become PARTIALLY_PAID. */
export const normalizeStatus = (status: string): string =>
    status.trim().toUpperCase().replace(/[\s-]+/g, '_');

/** Unknown statuses fall back to neutral so nothing renders uncoloured. */
export const getStatusTone = (status: string | null | undefined): Tone =>
    (status && STATUS_TONE[normalizeStatus(status)]) || 'neutral';

/** "PARTIALLY_RECEIVED" -> "Partially received" */
export const formatStatusLabel = (status: string): string => {
    const words = normalizeStatus(status).toLowerCase().split('_').filter(Boolean);
    const text = words.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};
