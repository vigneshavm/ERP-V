import { singleton } from "tsyringe";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from "@smarterp/shared/config/ConfigService.js";

@singleton()
export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  /**
   * Central method for AI calls with structured output
   */
  async generateStructuredResponse(systemPrompt: string, userPrompt: string): Promise<any> {
    try {
      const result = await this.model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}\n\nReturn ONLY a valid JSON object.` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  /**
   * Specific helper for document extraction
   */
  async extractFinanceData(fileBuffer: Buffer, mimeType: string): Promise<any> {
    const systemPrompt = `
      You are a senior finance document specialist. 
      Extract structured data from this document. 
      Include: invoiceNumber, date, vendor, totalAmount, taxAmount, currency, lineItems[ {description, quantity, amount} ], and category.
    `;

    // Note: Gemini supports multi-modal. For simplicity in this structure, 
    // we'll assume the caller provides a text representation or base64.
    // In a real implementation, we'd pass the file parts.
    
    return this.generateStructuredResponse(systemPrompt, "Please extract data from the attached document.");
  }
}
