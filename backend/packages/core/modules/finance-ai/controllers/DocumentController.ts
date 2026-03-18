import { Request, Response } from 'express';
import { singleton } from "tsyringe";
import { DocumentProcessingService } from '../services/document-processing.service.js';
import { JobService } from '../services/job.service.js';

@singleton()
export class DocumentController {
  constructor(
    private documentProcessingService: DocumentProcessingService,
    private jobService: JobService
  ) {}

  /**
   * POST /api/v1/finance/documents/upload
   * Initiates AI extraction from an invoice or receipt
   */
  async uploadDocument(req: Request, res: Response) {
    try {
      const { tenantId } = (req as any).tenant || {};
      const { filename, fileUrl } = req.body;

      if (!filename || !fileUrl) {
        return res.status(400).json({ 
          error: { code: 'BAD_REQUEST', message: 'filename and fileUrl are required' } 
        });
      }

      // Create a job for extraction
      const job = await this.jobService.createJob(tenantId, 'document_extraction');

      // Start processing in background (Async Job Pattern)
      this.documentProcessingService.processDocument((job._id as any).toString(), tenantId, filename, fileUrl)
        .catch((err: any) => console.error("Document Background Processing Error:", err));

      return res.status(202).json({ 
        jobId: job._id, 
        message: 'Document upload initiated and processing started' 
      });
    } catch (error) {
      console.error("Document Controller Error:", error);
      return res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to initiate document processing' } 
      });
    }
  }

  /**
   * GET /api/v1/finance/jobs/:jobId
   * Standardized polling endpoint for all financial AI jobs
   */
  async getJobStatus(req: Request, res: Response) {
    try {
      const { tenantId } = (req as any).tenant || {};
      const { jobId } = req.params;

      const job = await this.jobService.getJobStatus(jobId as string, tenantId as string);
      if (!job) {
        return res.status(404).json({ 
          error: { code: 'NOT_FOUND', message: 'Job not found' } 
        });
      }

      return res.status(200).json({ 
        data: {
          jobId: job._id,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error
        }
      });
    } catch (error) {
      return res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch job status' } 
      });
    }
  }
}
