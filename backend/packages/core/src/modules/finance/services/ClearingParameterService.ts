import { injectable, inject } from "tsyringe";
import { ClearingParameterRepository } from '@smarterp/shared/repositories/ClearingParameterRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';

@injectable()
export class ClearingParameterService {
    constructor(
        @inject(ClearingParameterRepository) private repo: ClearingParameterRepository
    ) { }

    async initializeUnit(sector: string, tenantId: string, userId: string, userName?: string): Promise<any> {
        if (!sector) throw new AppError("Sector is required", 400);

        const existing = await this.repo.find({ tenantId, sector });
        if (existing.length > 0) return { message: 'Unit already initialized', parameters: existing };

        const defaults = [
            { type: 'Local', clearingDays: 2, holidaysIncluded: false },
            { type: 'Outstation', clearingDays: 5, holidaysIncluded: true },
            { type: 'HighValue', clearingDays: 1, holidaysIncluded: false }
        ];

        const created = await this.repo.insertMany(defaults.map(d => ({
            ...d, sector, tenantId, userId
        })));

        info(`Unit ${sector} initialized by ${userName || 'Unknown'}`);
        return { message: 'Unit Initialized Successfully', parameters: created };
    }

    async getParameters(tenantId: string, sector?: string): Promise<any[]> {
        const query: any = { tenantId };
        if (sector) query.sector = sector;
        return this.repo.find(query);
    }

    async updateParameter(id: string, tenantId: string, updates: any, userName?: string): Promise<any> {
        const param = await this.repo.findOneAndUpdate(id, tenantId, updates);
        if (!param) throw new AppError("Parameter not found", 404);
        info(`Clearing parameter updated by ${userName || 'Unknown'}`);
        return param;
    }
}
