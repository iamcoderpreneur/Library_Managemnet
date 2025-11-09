import express from 'express';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';
import { ROLES, hasPermission, canAccessLevel } from '../config/roles.js';
import { users } from '../data/users.js';

const router = express.Router();

// Test role permissions
router.post('/role-permissions', authenticateToken, (req, res) => {
  try {
    const { permission } = req.body;
    
    if (!permission) {
      return res.status(400).json({ error: 'Permission required for testing' });
    }

    const testResults = {
      user: req.user,
      permission,
      hasAccess: hasPermission(req.user.role, permission),
      timestamp: new Date().toISOString()
    };

    res.json({
      message: 'Permission test completed',
      results: testResults
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Test role hierarchy
router.get('/role-hierarchy', authenticateToken, requirePermission('audit.view'), (req, res) => {
  try {
    const hierarchy = Object.values(ROLES).map(role => ({
      ...role,
      userCount: users.filter(u => u.role === role.id).length,
      canAccess: canAccessLevel(req.user.roleLevel, role.level)
    }));

    res.json({
      message: 'Role hierarchy test completed',
      currentUser: req.user,
      hierarchy: hierarchy.sort((a, b) => a.level - b.level)
    });
  } catch (error) {
    console.error('Error fetching role hierarchy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Test user access to specific features
router.post('/feature-access', authenticateToken, (req, res) => {
  try {
    const { features } = req.body;
    
    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'Features array required' });
    }

    const testResults = features.map(feature => ({
      feature,
      hasAccess: hasPermission(req.user.role, feature),
      userRole: req.user.roleName
    }));

    res.json({
      message: 'Feature access test completed',
      user: req.user,
      results: testResults
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system statistics (Admin+ only)
router.get('/system-stats', authenticateToken, requireRole(2), (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      activeUsers: users.length,
      roleDistribution: Object.values(ROLES).map(role => ({
        role: role.name,
        count: users.filter(u => u.role === role.id).length
      })),
      testExecutedBy: req.user,
      timestamp: new Date().toISOString()
    };

    res.json({
      message: 'System statistics retrieved',
      stats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export { router as testRoutes };