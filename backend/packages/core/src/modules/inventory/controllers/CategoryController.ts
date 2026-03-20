import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';
import { ICategory, IPaginatedResponse, IQueryFilters, SortDirection } from '@smarterp/shared/interfaces/category.types.js';
import { asyncHandler }    from '@smarterp/shared/utils/asyncHandler.js';
import { requireTenantId } from '@smarterp/shared/utils/tenantContext.js';
import { parsePagination } from '@smarterp/shared/utils/pagination.js';

const categoryService = new CategoryService();

export class CategoryController {
    public getAllCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const tenantId = requireTenantId(req);
        const { page, limit } = parsePagination(req.query, 25);
        const search    = (req.query.search  as string || '').trim();
        const sector    = (req.query.sector  as string || '').trim();
        const sortBy    = req.query.sortBy   as keyof ICategory | undefined;
        const sortOrder = (['asc', 'desc'].includes(req.query.sortOrder as string) ? req.query.sortOrder as SortDirection : 'desc');

        const filters: IQueryFilters = { page, limit, search, sortBy, sortOrder, sector };
        const [{ data, total }, stats] = await Promise.all([
            categoryService.findAll(tenantId, filters),
            categoryService.getStats(tenantId),
        ]);

        const response: IPaginatedResponse<ICategory> = { success: true, data, stats, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
        res.status(200).json(response);
    });
}
