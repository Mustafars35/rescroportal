import { NextResponse } from "next/server";
import { bootstrapAdmin, ensureAuthSchema, SESSION_COOKIE, SESSION_MAX_AGE, createSession, writeAudit } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  try {
    await ensureAuthSchema();
    const { neon } = await import("@neondatabase/serverless");
    const db = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!);
    const rows = await db`SELECT COUNT(*)::int AS count FROM portal_users`;
    return NextResponse.json({ setupRequired: Number((rows[0] as {count:number}).count) === 0 });
  } catch (error) { console.error("Setup status failed", error); return NextResponse.json({ error: "Setup service unavailable." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; username?: string; password?: string; setupToken?: string };
    if (!body.name?.trim() || !body.username?.trim() || !body.password || body.password.length < 12 || !body.setupToken) return NextResponse.json({ error: "Name, username, setup code and a password of at least 12 characters are required." }, { status: 400 });
    await ensureAuthSchema();
    const user = await bootstrapAdmin({ name: body.name, username: body.username, password: body.password, setupToken: body.setupToken });
    const token = await createSession(user.id);
    await writeAudit(user, "initial_admin_created", "user", user.id);
    const { createdAt: _createdAt, ...safeUser } = user;
    const response = NextResponse.json({ user: safeUser }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_MAX_AGE });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SETUP_TOKEN") return NextResponse.json({ error: "Setup code is invalid." }, { status: 403 });
    if (error instanceof Error && error.message === "SETUP_ALREADY_COMPLETED") return NextResponse.json({ error: "Initial setup has already been completed." }, { status: 409 });
    console.error("Initial admin setup failed", error);
    return NextResponse.json({ error: "Setup service is temporarily unavailable." }, { status: 503 });
  }
}
