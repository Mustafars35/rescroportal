import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPortalUser, ensureAuthSchema, getSessionUser, hasPermission, listUsers, SESSION_COOKIE, writeAudit } from "@/lib/auth";
import { permissions, roles, type Permission, type Role } from "@/lib/access";
export const runtime = "nodejs";
async function admin() { await ensureAuthSchema(); const user = await getSessionUser((await cookies()).get(SESSION_COOKIE)?.value); return user && hasPermission(user, "Manage Users & Roles") ? user : null; }
export async function GET() {
  try { const actor = await admin(); if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); return NextResponse.json({ users: await listUsers(), roles, permissions }); }
  catch (error) { console.error("User list failed", error); return NextResponse.json({ error: "User service unavailable." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const actor = await admin(); if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json() as { name?: string; username?: string; password?: string; role?: Role; active?: boolean; permissions?: Permission[] };
    if (!body.name?.trim() || !body.username?.trim() || !body.password || body.password.length < 12 || !roles.includes(body.role as Role)) return NextResponse.json({ error: "Name, username, role and a password of at least 12 characters are required." }, { status: 400 });
    if (body.role !== "Admin" && body.permissions?.some(value => !permissions.includes(value))) return NextResponse.json({ error: "Invalid permission." }, { status: 400 });
    const user = await createPortalUser({ name: body.name, username: body.username, password: body.password, role: body.role as Role, active: body.active ?? true, permissions: body.permissions ?? [] });
    await writeAudit(actor, "user_created", "user", user.id, { username: user.email, role: user.role });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (String(error).includes("unique")) return NextResponse.json({ error: "That username is already in use." }, { status: 409 });
    console.error("User creation failed", error); return NextResponse.json({ error: "User could not be created." }, { status: 503 });
  }
}
