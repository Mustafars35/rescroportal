import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { permissions, roles, type Permission, type PortalUser, type Role } from "@/lib/access";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "rescro_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;
const sql = () => {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
};

export { SESSION_COOKIE, SESSION_MAX_AGE };
export type AuthUser = PortalUser & { createdAt: string };
export type SessionUser = Omit<AuthUser, "createdAt">;

export async function ensureAuthSchema() {
  const db = sql();
  await db`CREATE TABLE IF NOT EXISTS portal_users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS portal_sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await db`CREATE INDEX IF NOT EXISTS portal_sessions_user_idx ON portal_sessions(user_id)`;
  await db`CREATE TABLE IF NOT EXISTS portal_audit_logs (
    id TEXT PRIMARY KEY, actor_user_id TEXT REFERENCES portal_users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL,
    entity_id TEXT, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export function normalizeUsername(value: string) { return value.trim().toLowerCase(); }
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, key] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const toUser = (row: Record<string, unknown>): AuthUser => ({
  id: String(row.id), name: String(row.name), email: String(row.username),
  role: roles.includes(row.role as Role) ? row.role as Role : "Customer Service",
  active: Boolean(row.active),
  permissions: (Array.isArray(row.permissions) ? row.permissions : []) as Permission[],
  createdAt: new Date(String(row.created_at)).toISOString(),
});

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await sql()`INSERT INTO portal_sessions (id,user_id,expires_at) VALUES (${tokenHash(token)},${userId},NOW() + INTERVAL '14 days')`;
  return token;
}
export async function deleteSession(token: string) {
  if (!token) return;
  await sql()`DELETE FROM portal_sessions WHERE id=${tokenHash(token)}`;
}
export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await sql()`SELECT u.id,u.name,u.username,u.role,u.active,u.permissions,u.created_at FROM portal_sessions s JOIN portal_users u ON u.id=s.user_id WHERE s.id=${tokenHash(token)} AND s.expires_at>NOW() AND u.active=TRUE LIMIT 1`;
  if (!rows[0]) return null;
  const { createdAt: _createdAt, ...user } = toUser(rows[0] as Record<string, unknown>);
  return user;
}
export async function writeAudit(actor: Pick<SessionUser,"id"|"name">, action: string, entityType: string, entityId: string | null, details: unknown = {}) {
  await sql()`INSERT INTO portal_audit_logs (id,actor_user_id,actor_name,action,entity_type,entity_id,details) VALUES (${randomBytes(16).toString("hex")},${actor.id},${actor.name},${action},${entityType},${entityId},${JSON.stringify(details)}::jsonb)`;
}
export async function listUsers(): Promise<AuthUser[]> {
  const rows = await sql()`SELECT id,name,username,role,active,permissions,created_at FROM portal_users ORDER BY created_at ASC`;
  return rows.map(row => toUser(row as Record<string, unknown>));
}
export function hasPermission(user: SessionUser, permission: Permission) {
  return user.role === "Admin" || user.permissions.includes(permission);
}
export function permissionForPath(path: string): Permission | null {
  if (path === "/") return "View Dashboard";
  if (path.startsWith("/user-management")) return "Manage Users & Roles";
  if (path.startsWith("/audit-logs")) return "View Audit Logs";
  if (path.startsWith("/shipping")) return "View Shipping";
  if (path.startsWith("/stock-management")) return "View Stock";
  // The current Factory Control Center route hosts the Order Pool workspace.
  if (path.startsWith("/factory-control-center")) return "View Order Pool";
  if (path.startsWith("/pool")) return "View Order Pool";
  if (path.startsWith("/orders")) return "View All Orders";
  if (["/live-production", "/production-overview", "/station-performance", "/delayed-risk"].some(route => path.startsWith(route))) return "View Daily Production";
  return null;
}
export async function authenticate(username: string, password: string) {
  await ensureAuthSchema();
  await applyConfiguredAdminRecovery(username, password);
  const rows = await sql()`SELECT id,name,username,password_hash,role,active,permissions,created_at FROM portal_users WHERE username=${normalizeUsername(username)} LIMIT 1`;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row || !Boolean(row.active) || !(await verifyPassword(password, String(row.password_hash)))) return null;
  return toUser(row);
}

// A one-time, operator-configured recovery. Only a password matching the
// configured salted hash can consume it; the audit ID prevents replay.
async function applyConfiguredAdminRecovery(username: string, password: string) {
  const configuration = process.env.RESCRO_ADMIN_RECOVERY;
  if (!configuration) return;
  const recovery = JSON.parse(configuration) as { id: string; username: string; passwordHash: string };
  if (!/^[a-f0-9]{32}$/.test(recovery.id) || normalizeUsername(username) !== recovery.username || !(await verifyPassword(password, recovery.passwordHash))) return;
  const db = sql();
  await db`WITH claimed AS (
    INSERT INTO portal_audit_logs (id,actor_user_id,actor_name,action,entity_type,entity_id,details)
    SELECT ${'recovery-' + recovery.id},id,name,'admin_password_recovered','user',id,'{"source":"authorized_operator_recovery"}'::jsonb
    FROM portal_users WHERE username=${recovery.username} AND role='Admin' AND active=TRUE
    ON CONFLICT (id) DO NOTHING RETURNING actor_user_id
  ), updated AS (
    UPDATE portal_users SET password_hash=${recovery.passwordHash},updated_at=NOW()
    FROM claimed WHERE portal_users.id=claimed.actor_user_id RETURNING portal_users.id
  ) DELETE FROM portal_sessions WHERE user_id IN (SELECT id FROM updated)`;
}
export async function createPortalUser(input: { name: string; username: string; password: string; role: Role; active: boolean; permissions: Permission[] }) {
  const db = sql();
  const username = normalizeUsername(input.username);
  const id = randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(input.password);
  const assigned = input.role === "Admin" ? [...permissions] : input.permissions.filter(value => permissions.includes(value));
  const rows = await db`INSERT INTO portal_users (id,name,username,password_hash,role,active,permissions) VALUES (${id},${input.name.trim()},${username},${passwordHash},${input.role},${input.active},${JSON.stringify(assigned)}::jsonb) RETURNING id,name,username,role,active,permissions,created_at`;
  return toUser(rows[0] as Record<string, unknown>);
}
export async function updatePortalUser(id: string, input: { name?: string; username?: string; password?: string; role?: Role; active?: boolean; permissions?: Permission[] }) {
  const rows = await sql()`SELECT id,name,username,password_hash,role,active,permissions,created_at FROM portal_users WHERE id=${id} LIMIT 1`;
  if (!rows[0]) return null;
  const current = rows[0] as Record<string, unknown>;
  const role = input.role ?? current.role as Role;
  const willRemainActiveAdmin = role === "Admin" && (input.active ?? Boolean(current.active));
  if (current.role === "Admin" && Boolean(current.active) && !willRemainActiveAdmin) {
    const adminRows = await sql()`SELECT COUNT(*)::int AS count FROM portal_users WHERE role='Admin' AND active=TRUE`;
    if (Number((adminRows[0] as {count:number}).count) <= 1) throw new Error("LAST_ACTIVE_ADMIN");
  }
  const assigned = role === "Admin" ? [...permissions] : (input.permissions ?? current.permissions as Permission[]).filter(value => permissions.includes(value));
  const passwordHash = input.password ? await hashPassword(input.password) : current.password_hash;
  const updated = await sql()`UPDATE portal_users SET name=${input.name?.trim() ?? current.name as string},username=${input.username ? normalizeUsername(input.username) : current.username as string},password_hash=${passwordHash as string},role=${role},active=${input.active ?? Boolean(current.active)},permissions=${JSON.stringify(assigned)}::jsonb,updated_at=NOW() WHERE id=${id} RETURNING id,name,username,role,active,permissions,created_at`;
  if (input.active === false || input.password || input.role || input.permissions) {
    await sql()`DELETE FROM portal_sessions WHERE user_id=${id}`;
  }
  return toUser(updated[0] as Record<string, unknown>);
}
export async function deletePortalUser(id: string) {
  const existing = await sql()`SELECT role,active FROM portal_users WHERE id=${id} LIMIT 1`;
  if (existing[0] && (existing[0] as {role:string;active:boolean}).role === "Admin" && Boolean((existing[0] as {active:boolean}).active)) {
    const adminRows = await sql()`SELECT COUNT(*)::int AS count FROM portal_users WHERE role='Admin' AND active=TRUE`;
    if (Number((adminRows[0] as {count:number}).count) <= 1) throw new Error("LAST_ACTIVE_ADMIN");
  }
  const rows = await sql()`DELETE FROM portal_users WHERE id=${id} RETURNING id`;
  return rows.length > 0;
}
export async function bootstrapAdmin(input: { name: string; username: string; password: string; setupToken: string }) {
  const expected = process.env.RESCRO_SETUP_TOKEN;
  if (!expected || !input.setupToken) throw new Error("INVALID_SETUP_TOKEN");
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(input.setupToken);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) throw new Error("INVALID_SETUP_TOKEN");
  const rows = await sql()`SELECT COUNT(*)::int AS count FROM portal_users`;
  if (Number((rows[0] as {count:number}).count) > 0) throw new Error("SETUP_ALREADY_COMPLETED");
  return createPortalUser({ ...input, role: "Admin", active: true, permissions: [...permissions] });
}
