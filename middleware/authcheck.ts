import { type Request, type Response, type NextFunction } from "express";
export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (req.user === undefined) {
    res.status(401).redirect("/login");
  } else {
    next();
  }
}
