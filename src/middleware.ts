import { verifyToken, type JWTPayload } from "../lib/auth";

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function extractUser(req: Request): JWTPayload | null {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  return verifyToken(token);
}

export function requireAuth(req: Request): JWTPayload {
  const user = extractUser(req);
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}
