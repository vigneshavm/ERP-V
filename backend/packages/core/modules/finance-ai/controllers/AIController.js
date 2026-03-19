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
import { JobService } from '../services/job.service.js';
import { AIService } from '../services/ai.service.js';
import Transaction from '../models/transaction.model.js';
let AIController = class AIController {
    jobService;
    aiService;
    constructor(jobService, aiService) {
        this.jobService = jobService;
        this.aiService = aiService;
    }
    /**
     * POST /api/v1/finance/ai/predict-cashflow
     * Initiates cashflow prediction job
     */
    async predictCashflow(req, res) {
        try {
            const { tenantId } = req.tenant || {};
            const job = await this.jobService.createJob(tenantId, 'prediction_calc');
            // Start processing in background
            this.calculatePredictions(job._id.toString(), tenantId).catch(console.error);
            return res.status(202).json({ jobId: job._id });
        }
        catch (error) {
            return res.status(500).json({
                error: { code: 'INTERNAL_ERROR', message: 'Failed to start prediction' }
            });
        }
    }
    async calculatePredictions(jobId, tenantId) {
        try {
            await this.jobService.updateJob(jobId, { status: 'processing', progress: 20 });
            // Fetch recent transaction history as input to AI
            const recentTransactions = await Transaction.find({ tenantId }).limit(50);
            const prediction = await this.aiService.generateStructuredResponse("Generate a 30-day cashflow forecast and detect anomalies based on this transaction history.", JSON.stringify(recentTransactions));
            await this.jobService.completeJob(jobId, prediction);
        }
        catch (error) {
            await this.jobService.failJob(jobId, { code: 'PREDICTION_FAILED', message: error.message });
        }
    }
    /**
     * POST /api/v1/finance/ai/chat
     * Conversational finance Q&A
     */
    async chat(req, res) {
        try {
            const { tenantId, userId } = req.tenant || {};
            const { message } = req.body;
            // Simplified chat without session persistence for this snippet
            const response = await this.aiService.generateStructuredResponse("You are a BizzAI Finance Assistant. Answer the user prompt based on their financial data.", message);
            return res.status(200).json({ data: response });
        }
        catch (error) {
            return res.status(500).json({
                error: { code: 'INTERNAL_ERROR', message: 'Failed to process AI chat' }
            });
        }
    }
};
AIController = __decorate([
    singleton(),
    __metadata("design:paramtypes", [JobService,
        AIService])
], AIController);
export { AIController };
