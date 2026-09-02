import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * AI-powered extraction from images/PDFs using Gemini Vision
 */
export const extractSupplierFromInvoice = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No invoice file uploaded' });
        }

        const prompt = `
            Extract the following details from this invoice image:
            1. businessName (The name of the company/vendor issuing the invoice)
            2. contactNo (Phone number of the vendor)
            3. email (Email address of the vendor)
            4. gstNo (GST/Tax identification number of the vendor)
            5. physicalAddress (Full address of the vendor)
            6. supplierType (Categorize as one of: manufacturer, wholesaler, retailer, service_provider)

            Return ONLY a valid JSON object strictly matching this schema:
            {
                "businessName": "string",
                "contactNo": "string",
                "email": "string",
                "gstNo": "string",
                "physicalAddress": "string",
                "supplierType": "string"
            }
        `;

        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
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

        if (!text || text.trim() === '') {
            throw new Error('Empty response from AI model');
        }

        // Clean up text if it contains markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedData;
        try {
            extractedData = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error. Raw Text:', text);
            throw new Error('AI returned malformed JSON data');
        }

        return res.status(200).json({
            success: true,
            data: extractedData,
            message: "Invoice analysis complete. Field mapping successful."
        });
    } catch (error: any) {
        console.error('Invoice Extraction Error:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze invoice', error: error.message });
    }
};

/**
 * AI-powered extraction from pasted text using Gemini
 */
export const extractSupplierFromText = async (req: Request, res: Response) => {
    try {
        const { text: inputText } = req.body;

        if (!inputText || inputText.trim() === '') {
            return res.status(400).json({ success: false, message: 'No text provided for extraction' });
        }

        const prompt = `
            Extract the following details from this text describing a supplier/vendor:
            1. businessName (The name of the company/vendor)
            2. contactNo (Phone number, mobile, or landline)
            3. email (Email address)
            4. gstNo (GST/Tax identification number)
            5. physicalAddress (Full address)
            6. supplierType (Categorize as one of: manufacturer, wholesaler, retailer, service_provider)

            Text:
            "${inputText}"

            Return ONLY a valid JSON object strictly matching this schema:
            {
                "businessName": "string",
                "contactNo": "string",
                "email": "string",
                "gstNo": "string",
                "physicalAddress": "string",
                "supplierType": "string"
            }
        `;

        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }]
        });

        const response = result;
        let text = response.text || '';

        if (!text || text.trim() === '') {
            throw new Error('Empty response from AI model');
        }

        // Clean up text if it contains markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedData;
        try {
            extractedData = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error. Raw Text:', text);
            throw new Error('AI returned malformed JSON data');
        }

        return res.status(200).json({
            success: true,
            data: extractedData,
            message: "Text analysis complete. Field mapping successful."
        });
    } catch (error: any) {
        console.error('Text Extraction Error:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze text', error: error.message });
    }
};

/**
 * AI-powered extraction for Purchase Invoices (Items, Qty, Cost)
 */
export const extractPurchaseInvoice = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No invoice file uploaded' });
        }

        const prompt = `
            Extract itemized purchase details from this invoice.
            Identify:
            1. vendor (The name of the vendor/supplier)
            2. date (The invoice date)
            3. items (An array of objects containing: name, qty, cost, sku, productType)
            4. total (The total invoice amount)

            Rules:
            1. If items have different variants (sizes, colors), list them as SEPARATE items.
            2. 'productType' should be generic (e.g., 'Shirt', 'Mobile', 'Tablets').
            3. Return ONLY a valid JSON object matching this schema:
            {
                "vendor": "string",
                "date": "string (ISO or common format)",
                "items": [
                    {
                        "name": "string",
                        "qty": number,
                        "cost": number,
                        "sku": "string (optional)",
                        "productType": "string"
                    }
                ],
                "total": number
            }
        `;

        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
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
            console.error('JSON Parse Error for Purchase Invoice. Raw Text:', text);
            throw new Error('AI returned malformed JSON data for purchase invoice');
        }

        return res.status(200).json({
            success: true,
            data: extractedData,
            message: "Purchase invoice analysis complete."
        });
    } catch (error: any) {
        console.error('Purchase Invoice Extraction Error:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze purchase invoice', error: error.message });
    }
};


