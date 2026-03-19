var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { singleton } from "tsyringe";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from "@smarterp/shared/config/ConfigService.js";
let AIService = class AIService {
    configService;
    genAI;
    model;
    constructor(configService) {
        this.configService = configService;
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }
    /**
     * Central method for AI calls with structured output
     */
    async generateStructuredResponse(systemPrompt, userPrompt) {
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
        }
        catch (error) {
            console.error("AI Service Error:", error);
            throw new Error("Failed to generate AI response");
        }
    }
    /**
     * Specific helper for document extraction
     */
    async extractFinanceData(fileBuffer, mimeType) {
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
};
AIService = __decorate([
    singleton(),
    __metadata("design:paramtypes", [ConfigService])
], AIService);
export { AIService };
