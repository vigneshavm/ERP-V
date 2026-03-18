import { Request, Response } from 'express';
import { singleton } from "tsyringe";
import { JobService } from '../services/job.service.js';
import { AIService } from '../services/ai.service.js';
import Transaction from '../models/transaction.model.js';

@singleton()
export class AIController {
  constructor(
    private jobService: JobService,
    private aiService: AIService
  ) {}

  /**
   * POST /api/v1/finance/ai/predict-cashflow
   * Initiates cashflow prediction job
   */
  async predictCashflow(req: Request, res: Response) {
    try {
      const { tenantId } = (req as any).tenant || {};
      
      const job = await this.jobService.createJob(tenantId, 'prediction_calc');

      // Start processing in background
      this.calculatePredictions((job._id as any).toString(), tenantId).catch(console.error);

      return res.status(202).json({ jobId: job._id });
    } catch (error) {
      return res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to start prediction' } 
      });
    }
  }

  private async calculatePredictions(jobId: string, tenantId: string) {
    try {
      await this.jobService.updateJob(jobId, { status: 'processing', progress: 20 });
      
      // Fetch recent transaction history as input to AI
      const recentTransactions = await Transaction.find({ tenantId }).limit(50);
      
      const prediction = await this.aiService.generateStructuredResponse(
        "Generate a 30-day cashflow forecast and detect anomalies based on this transaction history.",
        JSON.stringify(recentTransactions)
      );

      await this.jobService.completeJob(jobId, prediction);
    } catch (error: any) {
      await this.jobService.failJob(jobId, { code: 'PREDICTION_FAILED', message: error.message });
    }
  }

  /**
   * POST /api/v1/finance/ai/chat
   * Conversational finance Q&A
   */
  async chat(req: Request, res: Response) {
    try {
      const { tenantId, userId } = (req as any).tenant || {};
      const { message } = req.body;

      // Simplified chat without session persistence for this snippet
      const response = await this.aiService.generateStructuredResponse(
        "You are a BizzAI Finance Assistant. Answer the user prompt based on their financial data.",
        message
      );

      return res.status(200).json({ data: response });
    } catch (error) {
      return res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to process AI chat' } 
      });
    }
  }
}
