import { injectable, singleton } from "tsyringe";
import RefreshToken from "../models/RefreshToken.js";
import { IRefreshToken } from "../interfaces/IRefreshToken.js";

@injectable()
@singleton()
export class RefreshTokenRepository {
    async create(tokenData: Partial<IRefreshToken>): Promise<IRefreshToken> {
        return RefreshToken.create(tokenData);
    }

    async findByToken(token: string): Promise<IRefreshToken | null> {
        return RefreshToken.findOne({ token });
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await RefreshToken.updateMany(
            { user: userId, isRevoked: false },
            { isRevoked: true, revokedAt: new Date(), revokeReason: 'force_logout' }
        );
    }

    async revokeForReuse(userId: string): Promise<void> {
        await RefreshToken.updateMany(
            { user: userId, isRevoked: false },
            { isRevoked: true, revokedAt: new Date(), revokeReason: 'token_reuse_detected' }
        );
    }
}
