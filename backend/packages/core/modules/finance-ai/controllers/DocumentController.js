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
import { DocumentProcessingService } from '../services/document-processing.service.js';
import { JobService } from '../services/job.service.js';
let DocumentController = class DocumentController {
    documentProcessingService;
    jobService;
    constructor(documentProcessingService, jobService) {
        this.documentProcessingService = documentProcessingService;
        this.jobService = jobService;
    }
    /**
     * POST /api/v1/finance/documents/upload
     * Initiates AI extraction from an invoice or receipt
     */
    async uploadDocument(req, res) {
        try {
            const { tenantId } = req.tenant || {};
            const { filename, fileUrl } = req.body;
            if (!filename || !fileUrl) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'filename and fileUrl are required' }
                });
            }
            // Create a job for extraction
            const job = await this.jobService.createJob(tenantId, 'document_extraction');
            // Start processing in background (Async Job Pattern)
            this.documentProcessingService.processDocument(job._id.toString(), tenantId, filename, fileUrl)
                .catch((err) => console.error("Document Background Processing Error:", err));
            return res.status(202).json({
                jobId: job._id,
                message: 'Document upload initiated and processing started'
            });
        }
        catch (error) {
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
    async getJobStatus(req, res) {
        try {
            const { tenantId } = req.tenant || {};
            const { jobId } = req.params;
            const job = await this.jobService.getJobStatus(jobId, tenantId);
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
        }
        catch (error) {
            return res.status(500).json({
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch job status' }
            });
        }
    }
};
DocumentController = __decorate([
    singleton(),
    __metadata("design:paramtypes", [DocumentProcessingService,
        JobService])
], DocumentController);
export { DocumentController };
