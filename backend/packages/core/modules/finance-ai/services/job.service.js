var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { singleton } from "tsyringe";
import Job from "../models/job.model.js";
let JobService = class JobService {
    /**
     * Create a new async job
     */
    async createJob(tenantId, type) {
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
    async updateJob(jobId, updates) {
        return await Job.findByIdAndUpdate(jobId, updates, { new: true });
    }
    /**
     * Complete a job with results
     */
    async completeJob(jobId, result) {
        return await Job.findByIdAndUpdate(jobId, {
            status: 'completed',
            progress: 100,
            result
        }, { new: true });
    }
    /**
     * Fail a job with error details
     */
    async failJob(jobId, error) {
        return await Job.findByIdAndUpdate(jobId, {
            status: 'failed',
            error
        }, { new: true });
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId, tenantId) {
        return await Job.findOne({ _id: jobId, tenantId });
    }
};
JobService = __decorate([
    singleton()
], JobService);
export { JobService };
