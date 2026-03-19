import { Request, Response } from 'express';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { container } from 'tsyringe';
import { AccountService } from '../services/AccountService.js';

export const getAccounts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user!.tenantId;
    const accounts = await service.getAccounts(tenantId);
    res.status(200).json(accounts);
});

export const createAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user!.tenantId;
    const account = await service.createAccount(req.body, tenantId);
    res.status(201).json(account);
});

export const updateAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user!.tenantId;
    const account = await service.updateAccount(req.params.id as string, tenantId as string, req.body);
    res.status(200).json(account);
});

export const deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user!.tenantId;
    await service.deleteAccount(req.params.id as string, tenantId as string);
    res.status(204).send();
});

export const seedAccounts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user!.tenantId;
    await service.seedInitialAccounts(tenantId);
    res.status(200).json({ message: "Initial accounts seeded successfully" });
});

const AccountController = { getAccounts, createAccount, updateAccount, deleteAccount, seedAccounts };
export default AccountController;
