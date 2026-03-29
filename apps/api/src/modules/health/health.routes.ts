import { Router } from 'express';
import { pool } from '../../db/client.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});
