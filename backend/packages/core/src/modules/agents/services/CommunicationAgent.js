import { sendHtmlEmail } from '@smarterp/shared/utils/emailService.js';
import Expense from '@smarterp/core/modules/expense/models/Expense.js';
import PendingReview from '../models/PendingReview.js';
import { AuditStatus } from './AuditAgent.js';
export class CommunicationAgent {
    /**
     * Executes the final action based on the audit result
     */
    static async executeFinalAction(data, audit, tenantId, userId, receiptUrl) {
        if (audit.status === AuditStatus.PASS) {
            await this.fileExpense(data, tenantId, userId, receiptUrl);
            await this.notifyUser(userId, 'Expense Filed Automatically', `Your expense of ${data.amount} ${data.currency} from ${data.vendor} has been filed.`);
            return 'SUCCESS: Expense filed automatically.';
        }
        else {
            // Create PendingReview record for FLAG or FAIL (non-critical duplicates)
            await this.createReviewEntry(data, audit, tenantId, userId, receiptUrl);
            await this.notifyManager(tenantId, audit, data, receiptUrl);
            return `WARNING: Expense held for review. Reason: ${audit.reason}`;
        }
    }
    static async fileExpense(data, tenantId, userId, receiptUrl) {
        // Generate a simple expense number
        const expenseNo = `EXP-${Date.now()}`;
        await Expense.create({
            expenseNo,
            date: data.date,
            category: data.category || 'Other',
            amount: data.amount,
            description: `Auto-extracted from ${data.vendor}`,
            receipt: receiptUrl,
            createdBy: userId,
            tenantId: tenantId
        });
    }
    static async createReviewEntry(data, audit, tenantId, userId, receiptUrl) {
        await PendingReview.create({
            tenantId,
            extractedData: data,
            receiptUrl,
            auditReason: audit.reason,
            status: 'pending',
            createdBy: userId
        });
    }
    static async notifyUser(userId, subject, message) {
        // In a real system, look up user email. For now, log it.
        console.log(`[Notification to User ${userId}]: ${subject} - ${message}`);
    }
    static async notifyManager(_tenantId, audit, data, receiptUrl) {
        const managerEmail = process.env.MANAGER_EMAIL || 'manager@smarterp.ai';
        const subject = `⚠️ Expense Review Required: ${data.vendor}`;
        const html = `
            <h2>Expense Audit Alert</h2>
            <p>An expense receipt was uploaded and requires your approval.</p>
            <p><strong>Reason:</strong> ${audit.reason}</p>
            <hr>
            <table>
                <tr><td><strong>Vendor:</strong></td><td>${data.vendor}</td></tr>
                <tr><td><strong>Amount:</strong></td><td>${data.amount} ${data.currency}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${data.date.toLocaleDateString()}</td></tr>
            </table>
            <br>
            <p><a href="${receiptUrl}" style="padding: 10px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Receipt</a></p>
            <p>Click here to approve: <a href="#">Approve</a> | <a href="#">Reject</a></p>
        `;
        await sendHtmlEmail(managerEmail, subject, html);
    }
}
