import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/habeas-data"];

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth");

  // Unauthenticated → login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated on /login → redirect by role
  if (token && pathname.startsWith("/login")) {
    if (token.role === "administrador") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (token.role === "auditor") {
      return NextResponse.redirect(new URL("/history", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /admin only for administrador
  if (pathname.startsWith("/admin") && token?.role !== "administrador") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /dashboard is for evaluadores — redirect admin and auditor away
  if (pathname === "/dashboard") {
    if (token?.role === "administrador") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (token?.role === "auditor") {
      return NextResponse.redirect(new URL("/history", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.glb$|.*\\.png$|.*\\.jpg$|.*\\.pdf$).*)"],
};
