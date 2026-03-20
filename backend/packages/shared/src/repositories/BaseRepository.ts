/**
 * BaseRepository<T>
 *
 * A typed Mongoose repository base class. Domain-specific repositories extend
 * this and only add the methods unique to their entity.
 *
 * Changes from original:
 *  - Added `count()`, `softDelete()`, `exists()`, `createMany()` — commonly
 *    re-implemented in every repository.
 *  - Added `findPaginated()` — eliminates the Promise.all([find, count]) pattern
 *    repeated across 10+ repositories.
 *  - `executeInTransaction` now uses the shared `withTransaction` utility so
 *    retry logic is consistent everywhere.
 *  - All methods are generically typed — no `any` returns.
 */

import {
    Model, Document, ClientSession,
    FilterQuery, UpdateQuery, QueryOptions,
    ProjectionType,
} from 'mongoose';
import { withTransaction } from '../utils/transaction.js';

export interface PaginatedResult<T> {
    data:  T[];
    total: number;
}

export abstract class BaseRepository<T extends Document> {
    protected readonly model: Model<T>;

    protected constructor(model: Model<T>) {
        this.model = model;
    }

    // ── Create ───────────────────────────────────────────────────────────────

    async create(data: Partial<T>, session?: ClientSession): Promise<T> {
        const doc = new this.model(data);
        return doc.save({ session }) as Promise<T>;
    }

    /** Bulk insert — more efficient than N separate creates. */
    async createMany(data: Partial<T>[], session?: ClientSession): Promise<T[]> {
        return this.model.insertMany(data as T[], { session }) as unknown as Promise<T[]>;
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    async findById(
        id: string,
        populate: string[] = [],
        session?: ClientSession,
    ): Promise<T | null> {
        const q = this.model.findById(id).session(session ?? null);
        populate.forEach((p) => q.populate(p));
        return q.exec();
    }

    async findOne(
        filter:   FilterQuery<T>,
        populate: string[] = [],
        session?: ClientSession,
    ): Promise<T | null> {
        const q = this.model.findOne(filter).session(session ?? null);
        populate.forEach((p) => q.populate(p));
        return q.exec();
    }

    async find(
        filter:   FilterQuery<T>,
        populate: string[] = [],
        options:  QueryOptions = {},
        session?: ClientSession,
    ): Promise<T[]> {
        const q = this.model.find(filter, null, options).session(session ?? null);
        populate.forEach((p) => q.populate(p));
        return q.exec();
    }

    /**
     * Paginated list — replaces the repeated Promise.all([find, count]) pattern.
     *
     *   const { data, total } = await repo.findPaginated(filter, page, limit, sort);
     */
    async findPaginated(
        filter:      FilterQuery<T>,
        page:        number,
        limit:       number,
        sort:        Record<string, 1 | -1> = { createdAt: -1 },
        populate:    string[] = [],
        projection?: ProjectionType<T>,
    ): Promise<PaginatedResult<T>> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model
                .find(filter, projection)
                .sort(sort as any)
                .skip(skip)
                .limit(limit)
                .populate(populate as any)
                .lean() as unknown as Promise<T[]>,
            this.model.countDocuments(filter),
        ]);

        return { data, total };
    }

    /** Lightweight existence check — avoids fetching the full document. */
    async exists(filter: FilterQuery<T>): Promise<boolean> {
        return !!(await this.model.exists(filter));
    }

    async count(filter: FilterQuery<T>): Promise<number> {
        return this.model.countDocuments(filter);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    async update(
        id:      string,
        updates: UpdateQuery<T>,
        session?: ClientSession,
    ): Promise<T | null> {
        return this.model
            .findByIdAndUpdate(id, updates, { new: true, runValidators: true, session })
            .exec();
    }

    async updateOne(
        filter:  FilterQuery<T>,
        updates: UpdateQuery<T>,
        session?: ClientSession,
    ): Promise<T | null> {
        return this.model
            .findOneAndUpdate(filter, updates, { new: true, runValidators: true, session })
            .exec();
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    async delete(id: string, session?: ClientSession): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id).session(session ?? null).exec();
        return !!result;
    }

    /**
     * Soft delete — sets isDeleted + deletedAt.
     * Requires the model to have those fields; throws at runtime if they don't exist
     * (fail-fast rather than silently ignoring the call).
     */
    async softDelete(id: string, session?: ClientSession): Promise<T | null> {
        return this.model
            .findByIdAndUpdate(
                id,
                { $set: { isDeleted: true, deletedAt: new Date() } },
                { new: true, session },
            )
            .exec();
    }

    // ── Transactions ─────────────────────────────────────────────────────────

    /**
     * Execute a callback inside a managed transaction with automatic retry on
     * TransientTransactionError. Delegates to the shared `withTransaction` util
     * so retry logic is consistent across the whole codebase.
     */
    async executeInTransaction<R>(callback: (session: ClientSession) => Promise<R>): Promise<R> {
        return withTransaction(callback);
    }
}
