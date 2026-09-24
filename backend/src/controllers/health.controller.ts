import type { Request, Response } from 'express';
import { healthService } from '../services/health.service';

// Controller layer: translates HTTP <-> service calls.
// Reads input from req, calls a service, and decides the status code/response.
export const healthController = {
  async getHealth(_req: Request, res: Response) {
    const report = await healthService.getHealth();
    res.status(report.status === 'ok' ? 200 : 503).json(report);
  },
};
