import type { Request, Response } from 'express';
import { contactService } from '../services/contact.service';
import type { CreateContactInput, UpdateContactInput } from '../validators/contact.validator';

// All routes use requireAuth, so req.user is always set here.
// Route params are validated by validateParams(idParamSchema).
export const contactController = {
  async list(req: Request, res: Response) {
    const contacts = await contactService.list(req.user!.id);
    res.json({ contacts });
  },

  async create(req: Request, res: Response) {
    const contact = await contactService.create(req.body as CreateContactInput, req.user!.id);
    res.status(201).json({ contact });
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const contact = await contactService.update(
      req.params.id,
      req.body as UpdateContactInput,
      req.user!.id,
    );
    res.json({ contact });
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await contactService.remove(req.params.id, req.user!.id);
    res.status(204).end();
  },
};
