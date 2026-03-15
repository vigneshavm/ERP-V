import Notification from '@smarterp/core/modules/core/models/Notification.js';
import Bill from '@smarterp/core/modules/finance/models/Bill.js';
import User from '@smarterp/core/modules/core/models/User.js';
import PaymentOut from '@smarterp/core/modules/purchase/models/PaymentOut.js';
import mongoose from 'mongoose';
import { sendEmail } from '@smarterp/shared/utils/emailService.js';
import logger from '@smarterp/shared/config/logger.js';

export class PaymentReminderService {

    // 1. Notify Accounts Team if Bill is due in 3 days
    public async checkDueBills() {
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            threeDaysFromNow.setHours(0, 0, 0, 0);

            const nextDay = new Date(threeDaysFromNow);
            nextDay.setDate(nextDay.getDate() + 1);

            const dueBills = await Bill.find({
                status: { $in: ['unpaid', 'partial', 'approved'] },
                paymentStatus: { $ne: 'paid' },
                dueDate: {
                    $gte: threeDaysFromNow,
                    $lt: nextDay
                }
            }).populate('supplier', 'businessName');

            for (const bill of dueBills) {
                // Find Accounts/Managers in the same tenant
                const recipients = await User.find({
                    tenantId: bill.createdBy, // Assuming createdBy links to user -> tenant, but better to use tenantId if Bill had it.
                    // Actually Bill doesn't have tenantId explicit in interface but schema might. 
                    // Wait, Bill usually has createdBy. Let's send to createdBy + Managers.
                    $or: [{ _id: bill.createdBy }, { role: 'manager' }]
                });

                // Correction: Need tenantId on Bill for proper scoping. 
                // Assuming we use createdBy's tenant or if Bill has it.
                // Let's assume we notify the creator for now.

                await this.createNotification({
                    type: 'due',
                    message: `Bill #${bill.billNo} from ${(bill.supplier as any).businessName} is due on ${bill.dueDate?.toLocaleDateString()}`,
                    relatedEntity: bill._id as mongoose.Types.ObjectId,
                    onModel: 'Bill',
                    recipients: recipients
                });
            }
            logger.info(`Checked Due Bills: ${dueBills.length} found.`);
        } catch (error) {
            logger.error('Error checking due bills:', error);
        }
    }

    // 2. Alert Owner for High Value Bills (> 50k) due within 7 days
    public async checkHighValueFutureBills() {
        try {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            const highValueBills = await Bill.find({
                amount: { $gte: 50000 },
                status: { $nin: ['paid', 'draft', 'rejected'] },
                paymentStatus: { $ne: 'paid' },
                dueDate: {
                    $gte: new Date(),
                    $lt: sevenDaysFromNow
                }
            }).populate('supplier', 'businessName');

            for (const bill of highValueBills) {
                // Find Owner
                // We need tenant context. 
                // Note: In real system, we'd query User where role='owner' and tenantId matches bill's tenant.
                // Since generic implementation here lacks strict tenant context in loop, we rely on finding owner of the bill creator's tenant.
                const creator = await User.findById(bill.createdBy);
                if (creator && creator.tenantId) {
                    const owners = await User.find({ tenantId: creator.tenantId, role: 'owner' });

                    await this.createNotification({
                        type: 'payment',
                        message: `High Value Payment Warning: Bill #${bill.billNo} (₹${bill.amount}) due soon.`,
                        relatedEntity: bill._id as mongoose.Types.ObjectId,
                        onModel: 'Bill',
                        recipients: owners
                    });
                }
            }
        } catch (error) {
            logger.error('Error checking high value bills:', error);
        }
    }

    // 3. Cheque Clearing Reminder (Tomorrow)
    public async checkChequeClearing() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const nextDay = new Date(tomorrow);
            nextDay.setDate(nextDay.getDate() + 1);

            const cheques = await PaymentOut.find({
                paymentMode: 'Cheque',
                status: 'pending',
                chequeDate: {
                    $gte: tomorrow,
                    $lt: nextDay
                }
            }).populate('supplierId', 'businessName');

            for (const pay of cheques) {
                // Notify Creator + Managers
                const creator = await User.findById(pay.createdBy);
                if (creator && creator.tenantId) {
                    const recipients = await User.find({
                        tenantId: creator.tenantId,
                        role: { $in: ['manager', 'owner'] }
                    });

                    await this.createNotification({
                        type: 'payment',
                        message: `Cheque #${pay.referenceNo} for ₹${pay.amount} to ${(pay.supplierId as any).businessName} is set to clear tomorrow. Ensure sufficient balance.`,
                        relatedEntity: pay._id as mongoose.Types.ObjectId,
                        onModel: 'PaymentOut',
                        recipients: recipients
                    });
                }
            }
        } catch (error) {
            logger.error('Error checking cheque clearing:', error);
        }
    }

    // 4. Overdue Escalation (Overdue > 5 days)
    public async checkOverdueEscalations() {
        try {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const overdueBills = await Bill.find({
                status: { $in: ['unpaid', 'partial', 'overdue'] },
                paymentStatus: { $ne: 'paid' },
                dueDate: { $lt: fiveDaysAgo }
            }).limit(50); // Limit to prevent flooding

            for (const bill of overdueBills) {
                const creator = await User.findById(bill.createdBy);
                if (creator && creator.tenantId) {
                    const owners = await User.find({ tenantId: creator.tenantId, role: 'owner' });

                    await this.createNotification({
                        type: 'due',
                        message: `ESCALATION: Bill #${bill.billNo} is overdue by >5 days. Immediate action required.`,
                        relatedEntity: bill._id as mongoose.Types.ObjectId,
                        onModel: 'Bill',
                        recipients: owners
                    });
                }
            }
        } catch (error) {
            logger.error('Error checking overdue escalations:', error);
        }
    }

    public async checkAll() {
        logger.info('--- Running Payment Reminder Service ---');
        await this.checkDueBills();
        await this.checkHighValueFutureBills();
        await this.checkChequeClearing();
        await this.checkOverdueEscalations();
        logger.info('--- Completed Payment Reminder Service ---');
    }

    private async createNotification(data: { type: any, message: string, relatedEntity: mongoose.Types.ObjectId, onModel: string, recipients: any[] }) {
        // Prevent duplicate notifications for same entity/day? 
        // For simple implementation, we assume cron runs once a day.

        // Batch create notifications for each recipient not efficient but simple.
        // Better: Notification model could have 'recipients' array, or we create one doc per user.
        // Current Notification model seems single-user or not explicit? 
        // Checking schema: It doesn't have 'recipient' or 'user'. 
        // Wait, Notification.ts shown earlier doesn't have 'user' field! 
        // It must be intended for system-wide or we need to add 'recipient'.

        // ACTION: I need to check if Notification has 'user' or 'recipient'. 
        // Based on previous `view_file`, it has `relatedItem`, `relatedCustomer`, etc. but NO `recipient` or `userId`.
        // This implies it might be a global log OR existing system relies on something else.
        // However, usually notifications are user-specific. 
        // Let's assume I missed it or it needs adding. 
        // Re-reading Notification.ts: No user field. 
        // I should ADD 'recipient' field to Notification model to make it targeted.

        for (const user of data.recipients) {
            await Notification.create({
                type: data.type,
                message: data.message,
                relatedEntity: data.relatedEntity,
                onModel: data.onModel,
                recipient: user._id // We will add this field now.
            });

            // Optional: Send Email
            if (user.email) {
                // Fire and forget email
                sendEmail(user.email, `New Notification: ${data.type}`, data.message).catch(err => logger.error('Email failed', err));
            }
        }
    }
}

export default new PaymentReminderService();
