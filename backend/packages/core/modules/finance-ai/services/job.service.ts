import { singleton } from "tsyringe";
import Job, { IJob } from "../models/job.model.js";

@singleton()
export class JobService {
  /**
   * Create a new async job
   */
  async createJob(tenantId: string, type: IJob['type']): Promise<IJob> {
    const job = new Job({
      tenantId,
      type,
      status: 'pending',
      progress: 0
    });
    return await job.save();
  }

  /**
   * Update job status and progress
   */
  async updateJob(jobId: string, updates: Partial<IJob>): Promise<IJob | null> {
    return await Job.findByIdAndUpdate(jobId, updates, { new: true });
  }

  /**
   * Complete a job with results
   */
  async completeJob(jobId: string, result: any): Promise<IJob | null> {
    return await Job.findByIdAndUpdate(jobId, {
      status: 'completed',
      progress: 100,
      result
    }, { new: true });
  }

  /**
   * Fail a job with error details
   */
  async failJob(jobId: string, error: { code: string, message: string, details?: any }): Promise<IJob | null> {
    return await Job.findByIdAndUpdate(jobId, {
      status: 'failed',
      error
    }, { new: true });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, tenantId: string): Promise<IJob | null> {
    return await Job.findOne({ _id: jobId, tenantId });
  }
}
