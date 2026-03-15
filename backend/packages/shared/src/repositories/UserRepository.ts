import { injectable, singleton } from "tsyringe";
import User from '@smarterp/core/modules/core/models/User.js';
import { IUser } from '@smarterp/shared/interfaces/IUser.js';

@injectable()
@singleton()
export class UserRepository {
    async findByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email });
    }

    async findById(id: string): Promise<IUser | null> {
        return User.findById(id);
    }

    async create(userData: Partial<IUser>): Promise<IUser> {
        return User.create(userData);
    }

    async save(user: IUser): Promise<IUser> {
        return user.save();
    }
}
