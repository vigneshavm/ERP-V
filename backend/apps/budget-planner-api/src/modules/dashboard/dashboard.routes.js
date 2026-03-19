"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const index_1 = require("../../middleware/index");
const router = (0, express_1.Router)();
router.use(index_1.authenticate);
/**
 * GET /api/v1/dashboard
 * Returns profile wealth, monthly summaries (12 months), SMS transfer summary.
 */
router.get('/', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        const profileR = await database_1.db.query('SELECT total_wealth, currency FROM users WHERE id = $1', [uid]);
        // 12-month rolling summaries
        const summariesR = await database_1.db.query(`SELECT
         TO_CHAR(month_date, 'Mon YYYY') AS month,
         EXTRACT(YEAR FROM month_date)  AS year,
         EXTRACT(MONTH FROM month_date) AS month_num,
         total_income   AS income,
         total_expense  AS expense,
         budget_total   AS budget,
         LEAST(100, ROUND((total_expense::numeric / NULLIF(budget_total,0)) * 100, 1)) AS progress,
         (total_expense::numeric / NULLIF(budget_total,0)) > 0.9 AS show_predictive,
         (EXTRACT(YEAR FROM month_date) = EXTRACT(YEAR FROM NOW())
          AND EXTRACT(MONTH FROM month_date) = EXTRACT(MONTH FROM NOW())) AS is_current_month
       FROM monthly_summaries
       WHERE user_id = $1
       ORDER BY month_date DESC
       LIMIT 12`, [uid]);
        // SMS / bank alert pending count
        const smsR = await database_1.db.query(`SELECT COUNT(*) AS pending_count, MAX(created_at) AS last_detected
       FROM sms_transactions WHERE user_id = $1 AND status = 'pending'`, [uid]);
        res.json({
            success: true,
            data: {
                profile: {
                    totalWealth: profileR.rows[0]?.total_wealth ?? 0,
                    currency: profileR.rows[0]?.currency ?? 'INR',
                },
                monthlySummaries: summariesR.rows,
                smsTransfers: {
                    pendingCount: Number(smsR.rows[0]?.pending_count ?? 0),
                    lastDetected: smsR.rows[0]?.last_detected ?? null,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/dashboard/summary/:year/:month
 * Single month income/expense breakdown.
 */
router.get('/summary/:year/:month', async (req, res, next) => {
    try {
        const { year, month } = req.params;
        const result = await database_1.db.query(`SELECT
         SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END) AS income,
         SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense,
         COUNT(*) AS transaction_count
       FROM transactions t
       WHERE t.user_id = $1
         AND EXTRACT(YEAR  FROM t.date::date) = $2
         AND EXTRACT(MONTH FROM t.date::date) = $3`, [req.user.sub, year, month]);
        res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
