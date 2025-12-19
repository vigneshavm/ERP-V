import { GoogleGenAI, Type } from "@google/genai";
import { ScannedInvoice } from "../../types";

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';


export const extractInvoiceData = async (base64Data: string,mimeType: string): Promise<ScannedInvoice> => {


   const ai = new GoogleGenAI({ apiKey: API_KEY });

 const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Please extract the following information from this invoice document in a structured JSON format. 
            For each line item, extract the quantity, unit rate, and final amount. 
            CRITICAL: 
            1. Look for a Product Code, SKU, or Part Number for each item and put it in the 'sku' field.
            2. Assign a suggested 'category' for each item from this list
            If unsure about SKU or Category, leave them blank.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendor: { type: Type.STRING },
          date: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                qty: { type: Type.NUMBER },
                cost: { type: Type.NUMBER },
                sku: { type: Type.STRING, description: "Optional SKU if visible" }
              }
            }
          },
          total: { type: Type.NUMBER }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data extracted from the document.");
  
  return JSON.parse(text) as ScannedInvoice;
};
