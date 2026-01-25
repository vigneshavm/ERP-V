import { Request, Response } from "express";

export const getSettings = async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented" });
};

export const updateSettings = async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented" });
};

export const updatePassword = async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented" });
};
