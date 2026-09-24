// Adds req.user, set by the requireAuth middleware on protected routes.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export {};
