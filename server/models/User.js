import { executeQuery } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class User {
  static async findByUsername(username) {
    try {
      const results = await executeQuery(
        'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
        [username]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  static async findById(id) {
    try {
      const results = await executeQuery(
        'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
        [id]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findAll() {
    try {
      const results = await executeQuery(
        'SELECT id, username, name, email, role, role_name, role_level, is_active, created_at FROM users WHERE is_active = TRUE ORDER BY created_at DESC'
      );
      return results;
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  static async create(userData) {
    try {
      const { name, email, username, password, role = 5, role_name = 'User', role_level = 5 } = userData;
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      await executeQuery(
        `INSERT INTO users (id, username, password, name, email, role, role_name, role_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, username, hashedPassword, name, email, role, role_name, role_level]
      );

      return { id, username, name, email, role, role_name, role_level };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateRole(userId, newRole, newRoleName, newRoleLevel) {
    try {
      await executeQuery(
        'UPDATE users SET role = ?, role_name = ?, role_level = ? WHERE id = ?',
        [newRole, newRoleName, newRoleLevel, userId]
      );
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  static async validatePassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  }

  static async deactivate(userId) {
    try {
      await executeQuery(
        'UPDATE users SET is_active = FALSE WHERE id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }
}