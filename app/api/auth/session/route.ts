import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.json({ user: await getSessionUser((await cookies()).get(SESSION_COOKIE)?.value) }); }
  catch (error) { console.error("Session lookup failed", error); return NextResponse.json({ error: "Session service unavailable." }, { status: 503 }); }
}
