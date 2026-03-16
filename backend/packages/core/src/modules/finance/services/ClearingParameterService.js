var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { ClearingParameterRepository } from '@smarterp/shared/repositories/ClearingParameterRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
let ClearingParameterService = class ClearingParameterService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async initializeUnit(sector, tenantId, userId, userName) {
        if (!sector)
            throw new AppError("Sector is required", 400);
        const existing = await this.repo.find({ tenantId, sector });
        if (existing.length > 0)
            return { message: 'Unit already initialized', parameters: existing };
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
    async getParameters(tenantId, sector) {
        const query = { tenantId };
        if (sector)
            query.sector = sector;
        return this.repo.find(query);
    }
    async updateParameter(id, tenantId, updates, userName) {
        const param = await this.repo.findOneAndUpdate(id, tenantId, updates);
        if (!param)
            throw new AppError("Parameter not found", 404);
        info(`Clearing parameter updated by ${userName || 'Unknown'}`);
        return param;
    }
};
ClearingParameterService = __decorate([
    injectable(),
    __param(0, inject(ClearingParameterRepository)),
    __metadata("design:paramtypes", [ClearingParameterRepository])
], ClearingParameterService);
export { ClearingParameterService };
