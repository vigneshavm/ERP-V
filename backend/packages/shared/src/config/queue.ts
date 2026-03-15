/**
 * Background Job Queue Configuration
 * Uses Bull + Redis for async email and PDF generation
 * 
 * Setup:
 * 1. Install: npm install bull ioredis
 * 2. Start Redis: docker run -d -p 6379:6379 redis:alpine
 * 3. Set REDIS_URL in .env
 */

//  - bull types may not be installed
import Bull from 'bull';
import fs from 'fs';

// Type definitions for bull (when @types/bull is not available)
type Queue<_T = any> = any;
type Job<T = any> = Bull.Job<T> | any;
type JobOptions = any;

// Types
interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

interface PdfJobData {
    type: 'invoice' | string;
    data: any;
}

interface EmailJobResult {
    success: boolean;
    to: string;
    subject: string;
}

interface PdfJobResult {
    success: boolean;
    type: string;
    size: number;
}

// Redis connection configuration
const redisConfig = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
    },
};

// Email queue for async email sending
export const emailQueue: Queue<EmailJobData> = new Bull('email', redisConfig);

// PDF queue for async PDF generation
export const pdfQueue: Queue<PdfJobData> = new Bull('pdf', redisConfig);

// Configure queue options
const queueOptions: JobOptions = {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2s delay, exponentially increase
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
};

// Email job processor
emailQueue.process(async (job: Job<EmailJobData>): Promise<EmailJobResult> => {
    const { to, subject, html, text } = job.data;

    // Import email service dynamically to avoid circular dependencies
    //  - module may not exist in src
    const { sendHtmlEmail } = await import('../utils/emailService.js') as {
        sendHtmlEmail: (to: string, subject: string, html: string, text?: string | null) => Promise<boolean>;
    };

    try {
        await sendHtmlEmail(to, subject, html, text);
        return { success: true, to, subject };
    } catch (error) {
        throw new Error(`Email send failed: ${(error as Error).message}`);
    }
});

// PDF job processor
pdfQueue.process(async (job: Job<PdfJobData>): Promise<PdfJobResult> => {
    const { type, data } = job.data;

    // Import PDF generator dynamically
    //  - module may not exist yet
    const { generateInvoicePDF } = await import('../utils/invoiceGenerator.js') as {
        generateInvoicePDF: (data: any) => Promise<string>;
    };

    try {
        let pdfBuffer: Buffer;

        switch (type) {
            case 'invoice': {
                const filePath = await generateInvoicePDF(data);
                pdfBuffer = fs.readFileSync(filePath);
                break;
            }
            // Add more PDF types as needed
            default:
                throw new Error(`Unknown PDF type: ${type}`);
        }

        return { success: true, type, size: pdfBuffer.length };
    } catch (error) {
        throw new Error(`PDF generation failed: ${(error as Error).message}`);
    }
});

// Queue event listeners
emailQueue.on('completed', (job: Job<EmailJobData>, result: EmailJobResult) => {
    console.log(`✅ Email job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job: Job<EmailJobData>, err: Error) => {
    console.error(`❌ Email job ${job.id} failed:`, err.message);
});

pdfQueue.on('completed', (job: Job<PdfJobData>, result: PdfJobResult) => {
    console.log(`✅ PDF job ${job.id} completed:`, result);
});

pdfQueue.on('failed', (job: Job<PdfJobData>, err: Error) => {
    console.error(`❌ PDF job ${job.id} failed:`, err.message);
});

// Helper functions to add jobs
export const queueEmail = async (
    to: string,
    subject: string,
    html: string,
    text: string = ''
): Promise<Job<EmailJobData>> => {
    return await emailQueue.add(
        { to, subject, html, text },
        queueOptions
    );
};

export const queuePDF = async (type: string, data: any): Promise<Job<PdfJobData>> => {
    return await pdfQueue.add(
        { type, data },
        queueOptions
    );
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📦 Closing job queues...');
    await emailQueue.close();
    await pdfQueue.close();
    console.log('✅ Job queues closed');
});

export default { emailQueue, pdfQueue, queueEmail, queuePDF };
