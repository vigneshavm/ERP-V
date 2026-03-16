var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import RefreshToken from '@smarterp/core/modules/core/models/RefreshToken.js';
let RefreshTokenRepository = class RefreshTokenRepository {
    async create(tokenData) {
        return RefreshToken.create(tokenData);
    }
    async findByToken(token) {
        return RefreshToken.findOne({ token });
    }
    async revokeAllForUser(userId) {
        await RefreshToken.updateMany({ user: userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date(), revokeReason: 'force_logout' });
    }
    async revokeForReuse(userId) {
        await RefreshToken.updateMany({ user: userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date(), revokeReason: 'token_reuse_detected' });
    }
};
RefreshTokenRepository = __decorate([
    injectable(),
    singleton()
], RefreshTokenRepository);
export { RefreshTokenRepository };
