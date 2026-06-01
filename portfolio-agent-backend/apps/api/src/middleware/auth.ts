const PUBLIC_PATHS = [
  "/health",
  "/api/v1/health",
  "/api/docs",
  "/api/v1/auth/local-session",
  "/api/v1/events/stream",
];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path.startsWith(p));
}

export function checkAuth(token: string, request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const bearer = authHeader.replace("Bearer ", "");
    return bearer === token;
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader && token) {
    return cookieHeader.includes(`auth_session=${token}`);
  }

  return false;
}
