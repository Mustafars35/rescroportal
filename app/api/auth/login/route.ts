import { NextResponse } from "next/server";
import { authenticate, createSession, ensureAuthSchema, SESSION_COOKIE, SESSION_MAX_AGE, writeAudit } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    if (!body.username || !body.password) return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    await ensureAuthSchema();
    const user = await authenticate(body.username, body.password);
    if (!user) return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
    const token = await createSession(user.id);
    await writeAudit(user, "login", "auth", user.id);
    const { createdAt: _createdAt, ...safeUser } = user;
    const response = NextResponse.json({ user: safeUser });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_MAX_AGE });
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Login service is temporarily unavailable." }, { status: 503 });
  }
}
