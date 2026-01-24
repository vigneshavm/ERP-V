import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';
import { ICategory, IPaginatedResponse, IQueryFilters, SortDirection } from '../types/category.types.js';

const categoryService = new CategoryService();

export class CategoryController {

    public getCategories = async (req: Request, res: Response) => {
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
            const { data, total } = categoryService.findAll(filters); // In a real DB app this would be awaited
            const stats = categoryService.getStats();

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
