import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST() {
  try { await deleteSession((await cookies()).get(SESSION_COOKIE)?.value ?? ""); }
  catch (error) { console.error("Logout session removal failed", error); }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
