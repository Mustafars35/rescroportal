export const roles = ["Admin", "Customer Service", "Mesh", "Cord & Eyelet", "Frame", "Assembly", "Quality Control", "Packaging", "Transport"] as const;
export type Role = typeof roles[number];
export const permissions = ["View Order Pool", "Manage Order Pool", "Release to Production", "View Daily Production", "Manage Daily Production", "View All Orders", "View Factory Control Center", "Manage Users & Roles", "View Audit Logs", "Sync Shopify", "Export Orders"] as const;
export type Permission = typeof permissions[number];
export type PortalUser = { id:string; name:string; email:string; role:Role; active:boolean; permissions:Permission[] };
const key = "rescro-demo-users";
export const defaultUsers: PortalUser[] = [
  {id:"usr-admin",name:"Portal Admin",email:"admin@example.com",role:"Admin",active:true,permissions:[...permissions]},
  {id:"usr-mesh",name:"Mesh Operator",email:"mesh@example.com",role:"Mesh",active:true,permissions:["View Daily Production"]},
  {id:"usr-cs",name:"Customer Service",email:"service@example.com",role:"Customer Service",active:true,permissions:["View Order Pool","Manage Order Pool","Release to Production","View Daily Production"]},
];
export function readUsers(): PortalUser[] { if(typeof window==="undefined") return defaultUsers; try { const saved=localStorage.getItem(key); return saved?JSON.parse(saved):defaultUsers; } catch { return defaultUsers; } }
export function writeUsers(users:PortalUser[]){localStorage.setItem(key,JSON.stringify(users)); window.dispatchEvent(new Event("rescro-users-updated"));}
