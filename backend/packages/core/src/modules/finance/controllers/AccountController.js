import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { AccountService } from '../services/AccountService.js';
export const getAccounts = asyncHandler(async (req, res) => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const accounts = await service.getAccounts(tenantId);
    res.status(200).json(accounts);
});
export const createAccount = asyncHandler(async (req, res) => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const account = await service.createAccount(req.body, tenantId);
    res.status(201).json(account);
});
export const updateAccount = asyncHandler(async (req, res) => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const account = await service.updateAccount(req.params.id, tenantId, req.body);
    res.status(200).json(account);
});
export const deleteAccount = asyncHandler(async (req, res) => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user?.tenantId;
    await service.deleteAccount(req.params.id, tenantId);
    res.status(204).send();
});
export const seedAccounts = asyncHandler(async (req, res) => {
    const service = container.resolve(AccountService);
    const tenantId = req.tenantId || req.user?.tenantId;
    await service.seedInitialAccounts(tenantId);
    res.status(200).json({ message: "Initial accounts seeded successfully" });
});
const AccountController = { getAccounts, createAccount, updateAccount, deleteAccount, seedAccounts };
export default AccountController;
