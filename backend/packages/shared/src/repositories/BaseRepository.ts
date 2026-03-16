import { Model, Document, ClientSession, FilterQuery, UpdateQuery, QueryOptions } from "mongoose";
import { injectable } from "tsyringe";

export abstract class BaseRepository<T extends Document> {
  protected readonly model: Model<T>;

  protected constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const document = new this.model(data);
    return document.save({ session }) as Promise<T>;
  }

  async findById(id: string, populate: string[] = [], session?: ClientSession): Promise<T | null> {
    const query = this.model.findById(id).session(session || null);
    if (populate.length > 0) {
      populate.forEach((p) => query.populate(p));
    }
    return query.exec();
  }

  async findOne(filter: FilterQuery<T>, populate: string[] = [], session?: ClientSession): Promise<T | null> {
    const query = this.model.findOne(filter).session(session || null);
    if (populate.length > 0) {
      populate.forEach((p) => query.populate(p));
    }
    return query.exec();
  }

  async find(filter: FilterQuery<T>, populate: string[] = [], options: QueryOptions = {}, session?: ClientSession): Promise<T[]> {
    const query = this.model.find(filter, null, options).session(session || null);
    if (populate.length > 0) {
      populate.forEach((p) => query.populate(p));
    }
    return query.exec();
  }

  async update(id: string, updates: UpdateQuery<T>, session?: ClientSession): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updates, { new: true, session }).exec();
  }

  async delete(id: string, session?: ClientSession): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).session(session || null).exec();
    return !!result;
  }

  async executeInTransaction<R>(callback: (session: ClientSession) => Promise<R>): Promise<R> {
    const session = await this.model.db.startSession();
    try {
      let result: any;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result as R;
    } finally {
      await session.endSession();
    }
  }
}
