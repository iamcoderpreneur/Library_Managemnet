// Simple in-memory user storage with username-based authentication
export const users = [
  {
    id: '1',
    username: 'superadmin',
    password: 'admin123',
    name: 'Super Administrator',
    email: 'superadmin@scm.com',
    role: 1,
    roleName: 'Super Admin',
    roleLevel: 1
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    email: 'admin@scm.com',
    role: 2,
    roleName: 'Admin',
    roleLevel: 2
  },
  {
    id: '3',
    username: 'manager',
    password: 'manager123',
    name: 'Manager',
    email: 'manager@scm.com',
    role: 3,
    roleName: 'Manager',
    roleLevel: 3
  },
  {
    id: '4',
    username: 'supervisor',
    password: 'supervisor123',
    name: 'Supervisor',
    email: 'supervisor@scm.com',
    role: 4,
    roleName: 'Supervisor',
    roleLevel: 4
  },
  {
    id: '5',
    username: 'user',
    password: 'user123',
    name: 'User',
    email: 'user@scm.com',
    role: 5,
    roleName: 'User',
    roleLevel: 5
  }
];

export function findUserByUsername(username) {
  return users.find(user => user.username === username);
}

export function validatePassword(user, password) {
  return user.password === password;
}