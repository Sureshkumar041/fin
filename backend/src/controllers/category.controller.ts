import type { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import type { CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator';

// All routes use requireAuth, so req.user is always set here.
// Route params are validated by validateParams(idParamSchema).
export const categoryController = {
  async list(req: Request, res: Response) {
    const categories = await categoryService.list(req.user!.id);
    res.json({ categories });
  },

  async getById(req: Request<{ id: string }>, res: Response) {
    const category = await categoryService.getById(req.params.id, req.user!.id);
    res.json({ category });
  },

  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.body as CreateCategoryInput, req.user!.id);
    res.status(201).json({ category });
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const category = await categoryService.update(
      req.params.id,
      req.body as UpdateCategoryInput,
      req.user!.id,
    );
    res.json({ category });
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await categoryService.remove(req.params.id, req.user!.id);
    res.status(204).end();
  },
};
