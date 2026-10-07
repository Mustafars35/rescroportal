export const roles = ["Admin", "Customer Service", "Mesh", "Cord & Eyelet", "Frame", "Assembly", "Quality Control", "Packaging", "Transport"] as const;
export type Role = typeof roles[number];
export const permissions = ["View Dashboard", "View Order Pool", "Manage Order Pool", "Release to Production", "View Daily Production", "Manage Daily Production", "View Mesh", "Complete Mesh", "View Cord & Eyelet", "Complete Cord & Eyelet", "View Frame", "Complete Frame", "View Assembly", "Complete Assembly", "View Quality Control", "Complete Quality Control", "View Packaging", "Complete Packaging", "View All Orders", "View Factory Control Center", "View Stock", "Manage Stock", "View Shipping", "Manage Shipping", "Manage Users & Roles", "View Audit Logs", "Sync Shopify", "Export Orders", "View Factory Requests", "Create Factory Requests", "Edit Orders"] as const;
export type Permission = typeof permissions[number];
export type PortalUser = { id:string; name:string; email:string; role:Role; active:boolean; permissions:Permission[] };
export const defaultUsers: PortalUser[] = [];
export function readUsers(): PortalUser[] { return []; }
export function writeUsers(_users:PortalUser[]){ throw new Error("Users are managed by the server."); }
