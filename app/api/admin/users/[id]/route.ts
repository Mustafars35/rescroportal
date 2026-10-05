import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deletePortalUser, ensureAuthSchema, getSessionUser, hasPermission, updatePortalUser, SESSION_COOKIE, writeAudit } from "@/lib/auth";
import { permissions, roles, type Permission, type Role } from "@/lib/access";
export const runtime = "nodejs";
async function admin() { await ensureAuthSchema(); const user = await getSessionUser((await cookies()).get(SESSION_COOKIE)?.value); return user && hasPermission(user, "Manage Users & Roles") ? user : null; }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await admin(); if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json() as { name?: string; username?: string; password?: string; role?: Role; active?: boolean; permissions?: Permission[] };
    if (body.role && !roles.includes(body.role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    if (body.password !== undefined && body.password.length < 12) return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
    if (body.permissions?.some(value => !permissions.includes(value))) return NextResponse.json({ error: "Invalid permission." }, { status: 400 });
    const user = await updatePortalUser(id, body); if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await writeAudit(actor, "user_updated", "user", id, { fields: Object.keys(body) });
    const reauthenticationRequired = id === actor.id && Boolean(body.password || body.role || body.permissions || body.active === false);
    const response = NextResponse.json({ user, reauthenticationRequired });
    if (reauthenticationRequired) response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) { if (error instanceof Error && error.message === "LAST_ACTIVE_ADMIN") return NextResponse.json({ error: "The last active Admin cannot be demoted or deactivated." }, { status: 409 }); console.error("User update failed", error); return NextResponse.json({ error: "User could not be updated." }, { status: 503 }); }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await admin(); if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params; if (id === actor.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    if (!(await deletePortalUser(id))) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await writeAudit(actor, "user_deleted", "user", id);
    return NextResponse.json({ ok: true });
  } catch (error) { if (error instanceof Error && error.message === "LAST_ACTIVE_ADMIN") return NextResponse.json({ error: "The last active Admin cannot be deleted." }, { status: 409 }); console.error("User deletion failed", error); return NextResponse.json({ error: "User could not be deleted." }, { status: 503 }); }
}
