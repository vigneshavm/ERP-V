import { singleton } from "tsyringe";
import { AIService } from "./ai.service.js";
import { JobService } from "./job.service.js";
import Document from "../models/document.model.js";

@singleton()
export class DocumentProcessingService {
  constructor(
    private aiService: AIService,
    private jobService: JobService
  ) {}

  async processDocument(jobId: string, tenantId: string, filename: string, fileUrl: string) {
    try {
      await this.jobService.updateJob(jobId, { status: 'processing', progress: 10 });

      // In a real scenario, we'd download the file and send to AI
      // For now, we simulate the AI extraction call
      const extractedData = await this.aiService.generateStructuredResponse(
        "Extract finance data: invoiceNumber, date, vendor, totalAmount, currency",
        `Process file: ${filename} from ${fileUrl}`
      );

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
    } catch (error: any) {
      await this.jobService.failJob(jobId, {
        code: 'EXTRACTION_FAILED',
        message: error.message || 'AI extraction failed'
      });
    }
  }
}
