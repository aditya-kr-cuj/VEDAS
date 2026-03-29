import type { Request, Response } from 'express';
import { confirmPasswordReset, requestPasswordReset } from './password.service.js';

export async function requestPasswordResetHandler(req: Request, res: Response): Promise<void> {
  const result = await requestPasswordReset(req.body.email);
  res.status(200).json(result);
}

export async function confirmPasswordResetHandler(req: Request, res: Response): Promise<void> {
  const result = await confirmPasswordReset({
    token: req.body.token,
    newPassword: req.body.newPassword
  });
  res.status(200).json(result);
}
