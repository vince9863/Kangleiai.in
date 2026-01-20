import { Request, Response, NextFunction } from 'express';

const token = process.env.API_TOKEN || 'testtoken123';

export default function auth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = String(auth).split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || parts[1] !== token) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  // attach demo user
  (req as any).user = { id: 'demo-user', name: 'Demo User' };
  next();
}