import type { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";

/**
 * Authenticated user id resolved from a verified Supabase access token.
 *
 * Set by {@link requireAuth} on the request so downstream handlers can enforce
 * resource ownership without re-verifying the JWT.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Express middleware that requires a valid Supabase access token.
 *
 * The mobile client sends its Supabase session token in the
 * `Authorization: Bearer <token>` header. We verify it with Supabase (which
 * checks the signature and expiry) and attach the resolved user id to the
 * request. Requests without a valid token are rejected with 401 before any
 * handler runs.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    req.log.warn(
      { err: error?.message },
      "Rejected request with invalid access token",
    );
    res.status(401).json({ error: "Invalid or expired access token" });
    return;
  }

  req.userId = data.user.id;
  next();
}
