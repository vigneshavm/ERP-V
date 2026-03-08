import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Zod Schema for Receipt Data
 * Uses coercion to handle AI variability in string/number formats
 */
const ReceiptSchema = z.object({
    vendor: z.string().min(1, "Vendor name is required"),
    date: z.string().pipe(z.coerce.date()), // Gracefully handles AI string dates
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().default('INR'),
    category: z.string().optional(),
    items: z.array(z.object({
        name: z.string(),
        qty: z.coerce.number(),
        price: z.coerce.number()
    })).optional(),
    taxAmount: z.coerce.number().optional().default(0),
});

export type ExtractedReceipt = z.infer<typeof ReceiptSchema>;

export class ExtractionAgent {
    /**
     * Extracts structured data from a receipt image buffer
     */
    static async extractFromImage(buffer: Buffer, mimeType: string): Promise<ExtractedReceipt> {
        const prompt = `
            You are "The Clerk", an expert receipt extraction agent. 
            Extract data from this receipt. If specific fields are missing, make your best guess based on context or leave null.
            
            Format your response as a JSON object with:
            - vendor (Business/Store name)
            - date (Best guess of receipt date, ISO format)
            - amount (Total amount paid)
            - currency (Currency code, default INR)
            - category (e.g., Food, Travel, Utilities)
            - items (Array of {name, qty, price})
            - taxAmount (Total tax if listed)

            Rules:
            1. Return ONLY JSON.
            2. Do not include markdown formatting in the response.
            3. Ensure types match (amount/price should be numbers).
        `;

        try {
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType
                    }
                }
            ]);

            const response = await result.response;
            let text = response.text();

            // Clean up possible markdown code blocks
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const rawJson = JSON.parse(text);
            
            // Validate and transform with Zod
            const parsedData = ReceiptSchema.parse(rawJson);
            
            return parsedData;
        } catch (error) {
            console.error('ExtractionAgent Error:', error);
            if (error instanceof z.ZodError) {
                throw new Error(`Data validation failed: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw new Error('Failed to extract data from receipt image.');
        }
    }
}
