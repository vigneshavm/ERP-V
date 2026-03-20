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
import { AIService } from "./ai.service.js";
import { JobService } from "./job.service.js";
import Document from "../models/document.model.js";
let DocumentProcessingService = class DocumentProcessingService {
    aiService;
    jobService;
    constructor(aiService, jobService) {
        this.aiService = aiService;
        this.jobService = jobService;
    }
    async processDocument(jobId, tenantId, filename, fileUrl) {
        try {
            await this.jobService.updateJob(jobId, { status: 'processing', progress: 10 });
            // In a real scenario, we'd download the file and send to AI
            // For now, we simulate the AI extraction call
            const extractedData = await this.aiService.generateStructuredResponse("Extract finance data: invoiceNumber, date, vendor, totalAmount, currency", `Process file: ${filename} from ${fileUrl}`);
            await this.jobService.updateJob(jobId, { progress: 80 });
            // Save to document collection
            const doc = new Document({
                tenantId,
                filename,
                fileUrl,
                status: 'completed',
                extractedData
            });
            await doc.save();
            await this.jobService.completeJob(jobId, { documentId: doc._id, extractedData });
        }
        catch (error) {
            await this.jobService.failJob(jobId, {
                code: 'EXTRACTION_FAILED',
                message: error.message || 'AI extraction failed'
            });
        }
    }
};
DocumentProcessingService = __decorate([
    singleton(),
    __metadata("design:paramtypes", [AIService,
        JobService])
], DocumentProcessingService);
export { DocumentProcessingService };
