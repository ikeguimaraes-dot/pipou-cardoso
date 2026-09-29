type RoleGrant = {
  role: string;
  unitId: string | null;
  brandId: string | null;
  groupId: string | null;
};

/** The dedicated group-level PIPOU management grant gives full visibility within Pipou.
 * Scoped RH grants retain their existing scope; this is not a founder grant.
 */
export function isPipouAdminGrant(grant: RoleGrant): boolean {
  return grant.role === "pipou_admin" && grant.unitId === null &&
    grant.brandId === null && typeof grant.groupId === "string" && grant.groupId.length > 0;
}

export function isPipouAdmin(user: { roles: readonly RoleGrant[] } | null): boolean {
  return !!user?.roles.some(isPipouAdminGrant);
}
