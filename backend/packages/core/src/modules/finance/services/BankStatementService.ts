import { injectable, inject } from "tsyringe";
import { BankStatementRepository } from '@smarterp/shared/repositories/BankStatementRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

@injectable()
export class BankStatementService {
    constructor(
        @inject(BankStatementRepository) private repo: BankStatementRepository
    ) { }

    async uploadAndExtract(file: Express.Multer.File, userId: string): Promise<any> {
        if (!file) throw new AppError("No bank statement file uploaded", 400);

        const prompt = `
            Extract itemized bank transactions from this bank statement.
            Identify:
            1. accountHolder (Name of the person/company owning the account)
            2. bankName (Name of the bank)
            3. statementPeriod (The period this statement covers)
            4. transactions (An array of objects containing: date, description, amount, type, reference, balance)

            Rules:
            1. 'type' MUST be exactly 'credit' or 'debit'.
            2. 'amount' MUST be a positive number.
            3. 'date' MUST be in ISO format (YYYY-MM-DD) or a recognizable standard date string.
            4. 'balance' is optional but preferred if available.
            5. Return ONLY a valid JSON object matching this schema:
            {
                "accountHolder": "string",
                "bankName": "string",
                "statementPeriod": "string",
                "transactions": [
                    {
                        "date": "string",
                        "description": "string",
                        "amount": number,
                        "type": "credit" | "debit",
                        "reference": "string",
                        "balance": number
                    }
                ]
            }
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: file.buffer.toString('base64'),
                            mimeType: file.mimetype
                        }
                    }
                ]
            }]
        });

        let text = result.text || '';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedData;
        try {
            extractedData = JSON.parse(text);
        } catch {
            throw new AppError("AI returned malformed JSON data for bank statement", 500);
        }

        const transactionsToSave = extractedData.transactions.map((t: any) => ({
            date: new Date(t.date),
            description: t.description,
            amount: t.amount,
            type: t.type,
            reference: t.reference || '',
            balance: t.balance || 0,
            userId,
            status: 'pending'
        }));

        await this.repo.insertMany(transactionsToSave);

        return extractedData;
    }

    async getTransactions(userId: string, status?: string): Promise<any[]> {
        return this.repo.findTransactions(userId, status);
    }
}
