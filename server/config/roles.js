export const ROLES = {
  SUPER_ADMIN: {
    id: 1,
    name: 'Super Admin',
    level: 1,
    permissions: ['*'], // All permissions
    description: 'Full system access and control'
  },
  ADMIN: {
    id: 2,
    name: 'Admin',
    level: 2,
    permissions: [
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'role.assign',
      'system.configure',
      'audit.view'
    ],
    description: 'Administrative access with user management'
  },
  MANAGER: {
    id: 3,
    name: 'Manager',
    level: 3,
    permissions: [
      'user.read',
      'user.update',
      'inventory.manage',
      'orders.manage',
      'reports.generate',
      'team.manage'
    ],
    description: 'Managerial access to operations and teams'
  },
  SUPERVISOR: {
    id: 4,
    name: 'Supervisor',
    level: 4,
    permissions: [
      'user.read',
      'inventory.view',
      'orders.view',
      'orders.update',
      'reports.view',
      'team.view'
    ],
    description: 'Supervisory access to day-to-day operations'
  },
  USER: {
    id: 5,
    name: 'User',
    level: 5,
    permissions: [
      'profile.read',
      'profile.update',
      'inventory.view',
      'orders.create',
      'orders.view'
    ],
    description: 'Basic user access for standard operations'
  }
};

export const getRoleById = (id) => {
  return Object.values(ROLES).find(role => role.id === id);
};

export const getRoleByName = (name) => {
  return Object.values(ROLES).find(role => role.name === name);
};

export const hasPermission = (userRole, requiredPermission) => {
  const role = getRoleById(userRole);
  if (!role) return false;
  
  // Super Admin has all permissions
  if (role.permissions.includes('*')) return true;
  
  return role.permissions.includes(requiredPermission);
};

export const canAccessLevel = (userRoleLevel, requiredLevel) => {
  return userRoleLevel <= requiredLevel;
};