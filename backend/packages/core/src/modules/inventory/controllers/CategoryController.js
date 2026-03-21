import { CategoryService } from '../services/category.service.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { requireTenantId } from '@smarterp/shared/utils/tenantContext.js';
import { parsePagination } from '@smarterp/shared/utils/pagination.js';
const categoryService = new CategoryService();
export class CategoryController {
    getAllCategories = asyncHandler(async (req, res) => {
        const tenantId = requireTenantId(req);
        const { page, limit } = parsePagination(req.query, 25);
        const search = (req.query.search || '').trim();
        const sector = (req.query.sector || '').trim();
        const sortBy = req.query.sortBy;
        const sortOrder = (['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'desc');
        const filters = { page, limit, search, sortBy, sortOrder, sector };
        const [{ data, total }, stats] = await Promise.all([
            categoryService.findAll(tenantId, filters),
            categoryService.getStats(tenantId),
        ]);
        const response = { success: true, data, stats, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
        res.status(200).json(response);
    });
}
