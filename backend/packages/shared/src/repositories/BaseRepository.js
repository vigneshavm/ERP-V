export class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data, session) {
        const document = new this.model(data);
        return document.save({ session });
    }
    async findById(id, populate = [], session) {
        const query = this.model.findById(id).session(session || null);
        if (populate.length > 0) {
            populate.forEach((p) => query.populate(p));
        }
        return query.exec();
    }
    async findOne(filter, populate = [], session) {
        const query = this.model.findOne(filter).session(session || null);
        if (populate.length > 0) {
            populate.forEach((p) => query.populate(p));
        }
        return query.exec();
    }
    async find(filter, populate = [], options = {}, session) {
        const query = this.model.find(filter, null, options).session(session || null);
        if (populate.length > 0) {
            populate.forEach((p) => query.populate(p));
        }
        return query.exec();
    }
    async update(id, updates, session) {
        return this.model.findByIdAndUpdate(id, updates, { new: true, session }).exec();
    }
    async delete(id, session) {
        const result = await this.model.findByIdAndDelete(id).session(session || null).exec();
        return !!result;
    }
    async executeInTransaction(callback) {
        const session = await this.model.db.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                result = await callback(session);
            });
            return result;
        }
        finally {
            await session.endSession();
        }
    }
}
