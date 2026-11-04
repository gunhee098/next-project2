import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_ISSUER = "blog-app";
const JWT_AUDIENCE = "blog-users";

async function verifyAuthToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    maxTokenAge: "24h",
  });

  if (
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.sessionId !== "string" ||
    !payload.sessionId
  ) {
    throw new Error("Invalid token payload");
  }

  return payload;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth-token")?.value;
  const jwtSecret = process.env.JWT_SECRET;

  // Do not protect authentication endpoints or static assets.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const protectedPaths = ["/blog", "/dashboard", "/profile"];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isLoginPage = pathname === "/";

  if (isLoginPage && token && jwtSecret) {
    try {
      await verifyAuthToken(token, jwtSecret);
      return NextResponse.redirect(new URL("/blog", req.url));
    } catch {
      // Invalid or expired tokens remain on the login page.
    }
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token || !jwtSecret) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (!jwtSecret && token) {
      response.cookies.delete("auth-token");
    }
    return response;
  }

  try {
    await verifyAuthToken(token, jwtSecret);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
