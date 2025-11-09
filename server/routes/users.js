import express from 'express';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';
import { ROLES, getRoleById } from '../config/roles.js';
import { users } from '../data/users.js';

const router = express.Router();

// Get all users (Admin and Super Admin only)
router.get('/', authenticateToken, requirePermission('user.read'), (req, res) => {
  try {
    const userList = users.map(({ password, ...user }) => user);
    res.json(userList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user (Admin and Super Admin only)
router.post('/', authenticateToken, requirePermission('user.create'), (req, res) => {
  try {
    const { name, email, username, password, role = ROLES.USER.id } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password required' });
    }

    // Check if user exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Prevent creating users with higher privileges than current user
    const targetRole = getRoleById(role);
    if (targetRole.level < req.user.roleLevel) {
      return res.status(403).json({ 
        error: 'Cannot create user with higher privileges than your own' 
      });
    }

    // Create user
    const newUser = {
      id: (users.length + 1).toString(),
      name,
      email,
      username,
      password,
      role,
      roleName: targetRole.name,
      roleLevel: targetRole.level
    };
    
    users.push(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: { ...newUser, password: undefined }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role (Admin and Super Admin only)
router.put('/:id/role', authenticateToken, requirePermission('role.assign'), (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetRole = getRoleById(role);
    if (!targetRole) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent assigning higher privileges than current user
    if (targetRole.level < req.user.roleLevel) {
      return res.status(403).json({ 
        error: 'Cannot assign role with higher privileges than your own' 
      });
    }

    user.role = role;
    user.roleName = targetRole.name;
    user.roleLevel = targetRole.level;

    res.json({
      message: 'Role updated successfully',
      user: { ...user, password: undefined }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get roles list
router.get('/roles', authenticateToken, (req, res) => {
  try {
    // Filter roles based on user's level (can only see roles at their level or below)
    const availableRoles = Object.values(ROLES).filter(
      role => role.level >= req.user.roleLevel
    );

    res.json(availableRoles);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export { router as userRoutes };