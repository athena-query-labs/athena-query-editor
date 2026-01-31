import { Request, Response, NextFunction } from 'express'

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const email = req.header('X-Email')
  if (!email) {
    res.status(401).json({ error: 'Missing X-Email header' })
    return
  }
  req.userEmail = email
  next()
}
