import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureAuthSchema, getSessionUser, hasPermission, SESSION_COOKIE } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  try {
    await ensureAuthSchema();
    const user = await getSessionUser((await cookies()).get(SESSION_COOKIE)?.value);
    if (!user || !hasPermission(user, "View Audit Logs")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { neon } = await import("@neondatabase/serverless");
    const db = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!);
    const rows = await db`SELECT id,actor_name,action,entity_type,entity_id,details,created_at FROM portal_audit_logs ORDER BY created_at DESC LIMIT 500`;
    return NextResponse.json({ logs: rows });
  } catch (error) { console.error("Audit log read failed", error); return NextResponse.json({ error: "Audit log service unavailable." }, { status: 503 }); }
}
