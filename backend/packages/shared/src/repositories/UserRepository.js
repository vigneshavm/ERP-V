var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import User from '@smarterp/core/modules/core/models/User.js';
let UserRepository = class UserRepository {
    async findByEmail(email) {
        return User.findOne({ email });
    }
    async findById(id) {
        return User.findById(id);
    }
    async create(userData) {
        return User.create(userData);
    }
    async save(user) {
        return user.save();
    }
};
UserRepository = __decorate([
    injectable(),
    singleton()
], UserRepository);
export { UserRepository };
