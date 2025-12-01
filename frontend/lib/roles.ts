export const roleDashboardMap: Record<string, string> = {
  CHILD: '/dashboard/child',
  PARENT: '/dashboard/parent',
  TEACHER: '/dashboard/teacher',
  ADMIN: '/dashboard/admin',
};

export function pathForRole(role?: string | null) {
  return roleDashboardMap[role ?? 'CHILD'] ?? '/dashboard/child';
}
