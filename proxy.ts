import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission, permissionForPath, SESSION_COOKIE } from "@/lib/auth";

const publicPaths = new Set(["/login", "/setup", "/api/auth/login", "/api/auth/logout", "/api/auth/session", "/api/auth/setup"]);
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (publicPaths.has(path) || path.startsWith("/_next/") || path === "/favicon.svg" || path === "/rescro-logo.png") return NextResponse.next();
  try {
    const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) {
      if (path.startsWith("/api/")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      const target = new URL("/login", request.url);
      target.searchParams.set("next", path + request.nextUrl.search);
      return NextResponse.redirect(target);
    }
    if ((path.startsWith("/factory-control-center") || path.startsWith("/pool")) && user.role !== "Admin") return NextResponse.redirect(new URL("/unauthorized", request.url));
    if (path === "/" && !hasPermission(user,"View Dashboard") && hasPermission(user,"View Daily Production")) return NextResponse.redirect(new URL("/daily-production",request.url));
    const permission = permissionForPath(path);
    if (permission && !hasPermission(user, permission)) {
      if (path.startsWith("/api/")) return NextResponse.json({ error: "Permission denied." }, { status: 403 });
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (path === "/login" || path === "/setup") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  } catch (error) {
    console.error("Request authorization failed", error);
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Authorization service unavailable." }, { status: 503 });
    return NextResponse.redirect(new URL("/login?service=unavailable", request.url));
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
