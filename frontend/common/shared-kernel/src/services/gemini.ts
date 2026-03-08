import { GoogleGenAI, Type } from "@google/genai";
import { Product, ScannedInvoice } from "../types";

// Note: In a real MFE, we would likely pass the API key or use a proxy
export const getProductRecommendations = async (
    apiKey: string,
    query: string,
    products: Product[]
): Promise<{ recommendationText: string, recommendedIds: string[] }> => {
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });

    const inventoryList = products.map(p =>
        `${p.id}|${p.name}|${p.category}|${p.sellingPrice}|${p.stockQty}`
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
        model: 'gemini-1.5-flash',
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

export const searchProductsByImage = async (
    apiKey: string,
    imageFile: File,
    products: Product[]
): Promise<string[]> => {
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

    const inventoryList = products.map(p =>
        `ID: ${p.id} | Name: ${p.name} | Type: ${p.productType} | Category: ${p.category} | Color/Desc: ${p.name}`
    ).join('\n');

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
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
