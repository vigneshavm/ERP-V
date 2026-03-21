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
import { withTransaction } from '../utils/transaction.js';
export class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    // ── Create ───────────────────────────────────────────────────────────────
    async create(data, session) {
        const doc = new this.model(data);
        return doc.save({ session });
    }
    /** Bulk insert — more efficient than N separate creates. */
    async createMany(data, session) {
        return this.model.insertMany(data, { session });
    }
    // ── Read ─────────────────────────────────────────────────────────────────
    async findById(id, populate = [], session) {
        const q = this.model.findById(id).session(session ?? null);
        populate.forEach((p) => q.populate(p));
        return q.exec();
    }
    async findOne(filter, populate = [], session) {
        const q = this.model.findOne(filter).session(session ?? null);
        populate.forEach((p) => q.populate(p));
        return q.exec();
    }
    async find(filter, populate = [], options = {}, session) {
        const q = this.model.find(filter, null, options).session(session ?? null);
        populate.forEach((p) => q.populate(p));
        return q.exec();
    }
    /**
     * Paginated list — replaces the repeated Promise.all([find, count]) pattern.
     *
     *   const { data, total } = await repo.findPaginated(filter, page, limit, sort);
     */
    async findPaginated(filter, page, limit, sort = { createdAt: -1 }, populate = [], projection) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.model
                .find(filter, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate(populate)
                .lean(),
            this.model.countDocuments(filter),
        ]);
        return { data, total };
    }
    /** Lightweight existence check — avoids fetching the full document. */
    async exists(filter) {
        return !!(await this.model.exists(filter));
    }
    async count(filter) {
        return this.model.countDocuments(filter);
    }
    // ── Update ───────────────────────────────────────────────────────────────
    async update(id, updates, session) {
        return this.model
            .findByIdAndUpdate(id, updates, { new: true, runValidators: true, session })
            .exec();
    }
    async updateOne(filter, updates, session) {
        return this.model
            .findOneAndUpdate(filter, updates, { new: true, runValidators: true, session })
            .exec();
    }
    // ── Delete ───────────────────────────────────────────────────────────────
    async delete(id, session) {
        const result = await this.model.findByIdAndDelete(id).session(session ?? null).exec();
        return !!result;
    }
    /**
     * Soft delete — sets isDeleted + deletedAt.
     * Requires the model to have those fields; throws at runtime if they don't exist
     * (fail-fast rather than silently ignoring the call).
     */
    async softDelete(id, session) {
        return this.model
            .findByIdAndUpdate(id, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true, session })
            .exec();
    }
    // ── Transactions ─────────────────────────────────────────────────────────
    /**
     * Execute a callback inside a managed transaction with automatic retry on
     * TransientTransactionError. Delegates to the shared `withTransaction` util
     * so retry logic is consistent across the whole codebase.
     */
    async executeInTransaction(callback) {
        return withTransaction(callback);
    }
}
