import type { Permission, Role } from "./types";

const learnerPermissions = new Set<Permission>([
  "submit_work",
  "log_activity",
  "create_quest",
]);

const mentorPermissions = new Set<Permission>([
  "submit_work",
  "approve_milestone",
  "import_workbook",
  "manage_settings",
  "log_activity",
  "create_quest",
]);

export function can(role: Role, permission: Permission): boolean {
  return (role === "mentor" ? mentorPermissions : learnerPermissions).has(permission);
}
