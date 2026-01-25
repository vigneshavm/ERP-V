
import { GoogleGenAI, Type } from "@google/genai";
import { ScannedInvoice } from "../../../src/types/purchase";
import { Product } from "../../../src/types/product";

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

export const getProductRecommendations = async (query: string, products: Product[]): Promise<{ recommendationText: string, recommendedIds: string[] }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  // Simplify product context for the model
  const inventoryList = products.map(p =>
    `ID: ${p.id} | Name: ${p.name} | Type: ${p.productType} | Category: ${p.category} | Price: ${p.price} | Stock: ${p.stock}`
  ).join('\n');

  const prompt = `
    You are an intelligent retail assistant for an ERP storefront.
    
    Current Inventory Context:
    ${inventoryList}

    User Question: "${query}"

    Instructions:
    1. Think deeply about the user's request. Consider intent, style, budget, and specific attributes.
    2. Select the most appropriate products from the inventory list above that match the user's criteria.
    3. If the user asks for something generic (e.g., "outfit"), pick a matching combination of items.
    4. Provide a friendly, helpful response explaining your selection.
    5. Return the result strictly as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendationText: { type: Type.STRING },
          recommendedIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("AI Parse Error", e);
      return { recommendationText: "I couldn't process the results properly. Please try again.", recommendedIds: [] };
    }
  }

  throw new Error("No response from AI");
};

export const searchProductsByImage = async (imageFile: File, products: Product[]): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  // Simplify product context
  const inventoryList = products.map(p =>
    `ID: ${p.id} | Name: ${p.name} | Type: ${p.productType} | Category: ${p.category} | Color/Desc: ${p.name}`
  ).join('\n');

  // Use Gemini 3 Flash for fast multimodal reasoning
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: imageFile.type, data: base64Data } },
        {
          text: `Look at this image. Search through the following inventory list and identify items that visually match this product (similar style, color, type).
        
        Inventory:
        ${inventoryList}
        
        Return ONLY a JSON object with an array of matching product IDs.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchedIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  if (response.text) {
    try {
      const result = JSON.parse(response.text);
      return result.matchedIds || [];
    } catch (e) {
      console.error("Visual Search Parse Error", e);
      return [];
    }
  }
  return [];
};
