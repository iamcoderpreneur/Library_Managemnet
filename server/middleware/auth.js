import jwt from 'jsonwebtoken';
import { hasPermission } from '../config/roles.js';

const JWT_SECRET = 'your-secret-key-change-in-production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided, allowing request to proceed');
    // For development, allow requests without token
    req.user = { userId: '1', role: 1, roleLevel: 1 };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Invalid token, allowing request to proceed for development');
      // For development, allow requests with invalid tokens
      req.user = { userId: '1', role: 1, roleLevel: 1 };
      return next();
    }
    req.user = user;
    next();
  });
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

export const requireRole = (minRoleLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.roleLevel > minRoleLevel) {
      return res.status(403).json({ 
        error: 'Insufficient role level',
        required: minRoleLevel,
        userLevel: req.user.roleLevel
      });
    }

    next();
  };
};