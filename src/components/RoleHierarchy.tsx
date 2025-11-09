import React, { useState, useEffect } from 'react';
import { Shield, Users, ChevronDown, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface RoleHierarchyProps {
  user: User;
}

export function RoleHierarchy({ user }: RoleHierarchyProps) {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));

  const token = localStorage.getItem('scm_token');

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const response = await fetch('/api/testing/role-hierarchy', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setHierarchy(data.hierarchy);
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId: number) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const getRoleBadgeColor = (roleLevel: number) => {
    switch (roleLevel) {
      case 1: return 'bg-purple-500 text-white';
      case 2: return 'bg-red-500 text-white';
      case 3: return 'bg-blue-500 text-white';
      case 4: return 'bg-green-500 text-white';
      case 5: return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Role Hierarchy</h2>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Your Access Level:</strong> {user.roleName} (Level {user.roleLevel})
        </p>
        <p className="text-xs text-blue-600 mt-1">
          You can view all roles but can only manage roles at your level or below.
        </p>
      </div>

      <div className="space-y-4">
        {hierarchy.map((role) => (
          <div
            key={role.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              role.canAccess ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div
              className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
              onClick={() => toggleRole(role.id)}
            >
              <div className="flex items-center gap-3">
                {expandedRoles.has(role.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <Shield className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(role.level)}`}>
                  Level {role.level}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {role.userCount} users
                </div>
                {!role.canAccess && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    Restricted
                  </span>
                )}
              </div>
            </div>

            {expandedRoles.has(role.id) && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Permissions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {role.permissions.map((permission: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 text-xs text-gray-700 rounded"
                    >
                      {permission === '*' ? 'All Permissions' : permission}
                    </span>
                  ))}
                </div>
                
                {role.level >= user.roleLevel && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-800">
                      ✓ You have access to manage this role level
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}