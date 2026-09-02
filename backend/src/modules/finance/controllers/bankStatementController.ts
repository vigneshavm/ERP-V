import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import BankStatementTransaction from '../models/BankStatementTransaction.js';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * AI-powered extraction of bank statements from PDF using Gemini Vision
 */
export const uploadStatement = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No bank statement file uploaded' });
        }

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
            model: "gemini-2.5-flash",
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: req.file.buffer.toString('base64'),
                            mimeType: req.file.mimetype
                        }
                    }
                ]
            }]
        });

        const response = result;
        let text = response.text || '';

        // Clean up text if it contains markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedData;
        try {
            extractedData = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error for Bank Statement. Raw Text:', text);
            throw new Error('AI returned malformed JSON data for bank statement');
        }

        // Save transactions to database
        const userId = (req as any).user?._id; // Assuming authMiddleware populated req.user
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated properly' });
        }

        const transactionsToSave = extractedData.transactions.map((t: any) => ({
            date: new Date(t.date),
            description: t.description,
            amount: t.amount,
            type: t.type,
            reference: t.reference || '',
            balance: t.balance || 0,
            userId: userId,
            status: 'pending'
        }));

        await BankStatementTransaction.insertMany(transactionsToSave);

        return res.status(200).json({
            success: true,
            data: extractedData,
            message: "Bank statement analysis complete and transactions saved."
        });
    } catch (error: any) {
        console.error('Bank Statement Extraction Error:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze bank statement', error: error.message });
    }
};

/**
 * Fetch all bank statement transactions for the logged-in user
 */
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const { status } = req.query;
        const filter: any = { userId };
        if (status) {
            filter.status = status;
        }

        const transactions = await BankStatementTransaction.find(filter).sort({ date: -1 });

        return res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error: any) {
        console.error('Fetch Transactions Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
};
