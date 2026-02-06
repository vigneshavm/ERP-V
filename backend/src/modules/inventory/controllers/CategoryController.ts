import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';
import { ICategory, IPaginatedResponse, IQueryFilters, SortDirection } from '../interfaces/category.types.js';

const categoryService = new CategoryService();

export class CategoryController {

    /**
     * @swagger
     * /api/inventory/categories:
     *   get:
     *     summary: Get all inventory categories
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 25
     *         description: Number of items per page
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term for category names
     *       - in: query
     *         name: sector
     *         schema:
     *           type: string
     *         description: Filter categories by sector
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [id, name, sector, createdAt, updatedAt]
     *         description: Field to sort by
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Sort order (asc or desc)
     *     responses:
     *       200:
     *         description: List of categories
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PaginatedCategoryResponse'
     *       500:
     *         description: Internal Server Error
     */
    public getAllCategories = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            // 1. Input Sanitization & Parsing
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.max(1, parseInt(req.query.limit as string) || 25);
            const search = (req.query.search as string || '').trim();
            const sector = (req.query.sector as string || '').trim();

            const sortBy = req.query.sortBy as keyof ICategory | undefined;

            // Support both 'sortOrder' and 'order' params
            const sortOrderRaw = (req.query.sortOrder || req.query.order) as string;
            const sortOrder = (['asc', 'desc'].includes(sortOrderRaw)
                ? sortOrderRaw as SortDirection
                : 'desc');

            const filters: IQueryFilters = { page, limit, search, sortBy, sortOrder, sector };

            // 2. Call Service Layer
            const tenantId = authReq.tenantId as string;
            const { data, total } = await categoryService.findAll(tenantId, filters);
            const stats = await categoryService.getStats(tenantId);

            // 3. Construct Response Envelope
            const totalPages = Math.ceil(total / limit);

            const response: IPaginatedResponse<ICategory> = {
                success: true,
                data,
                stats,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };

            res.status(200).json(response);

        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    };
}
