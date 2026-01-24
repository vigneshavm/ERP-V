import { Request, Response, NextFunction } from "express";

export class HealthController {
    public getHealth(req: Request, res: Response, next: NextFunction): void {
        res.status(200).json({
            status: 'success',
            message: '🚀 SmartERPAI Backend is running...',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
}
