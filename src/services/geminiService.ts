
import { GoogleGenAI, Type } from "@google/genai";
import { ScannedInvoice } from "../../types";

export const parseInvoiceWithGemini = async (file: File): Promise<ScannedInvoice> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const model = "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        },
        {
          text: `Extract the following details from this invoice: Vendor Name, Date, and a list of items (Name, Quantity, Unit Cost, Product Type). 
          IMPORTANT: 
          1. If items have different sizes, colors, or variants listed as separate lines or entries, extract them as SEPARATE items. Do not merge them.
          2. Example: "Shirt Size 40" and "Shirt Size 42" must be two different items in the list.
          3. 'Product Type' should be generic like 'Shirt', 'Mobile', 'Rice', 'Oil'.
          4. Return a valid JSON object strictly matching this schema.`
        }
      ]
    },
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
                sku: { type: Type.STRING, description: "Optional SKU if visible" },
                productType: { type: Type.STRING, description: "Generic type e.g. Shirt, Mobile" }
              }
            }
          },
          total: { type: Type.NUMBER }
        }
      }
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text) as ScannedInvoice;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Failed to parse invoice data.");
    }
  }
  
  throw new Error("No response from Gemini.");
};
