import React, { useState } from 'react';
import { LogOut, Users, Shield, TestTube, Settings, BarChart3 } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { RoleHierarchy } from './RoleHierarchy';
import { PermissionTester } from './PermissionTester';
import { SystemStats } from './SystemStats';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'overview' | 'users' | 'roles' | 'testing' | 'stats';

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const getRoleBadgeColor = (roleLevel: number) => {
    switch (roleLevel) {
      case 1: return 'bg-purple-100 text-purple-800 border-purple-200';
      case 2: return 'bg-red-100 text-red-800 border-red-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4: return 'bg-green-100 text-green-800 border-green-200';
      case 5: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canAccessTab = (tab: Tab) => {
    switch (tab) {
      case 'users':
        return user.roleLevel <= 2; // Admin and Super Admin only
      case 'stats':
        return user.roleLevel <= 2; // Admin and Super Admin only
      case 'testing':
        return user.roleLevel <= 3; // Manager and above
      default:
        return true;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, available: true },
    { id: 'users', name: 'User Management', icon: Users, available: canAccessTab('users') },
    { id: 'roles', name: 'Role Hierarchy', icon: Shield, available: true },
    { id: 'testing', name: 'Permission Testing', icon: TestTube, available: canAccessTab('testing') },
    { id: 'stats', name: 'System Stats', icon: Settings, available: canAccessTab('stats') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">SCM Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.roleLevel)}`}>
                  {user.roleName}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.filter(tab => tab.available).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Access Level</h3>
                  <p className="text-blue-700">Level {user.roleLevel} - {user.roleName}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    Role-based access control is active and protecting system resources.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Security Status</h3>
                  <p className="text-green-700">All Systems Protected</p>
                  <p className="text-sm text-green-600 mt-2">
                    Authentication and authorization layers are functioning properly.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Testing Module</h3>
                  <p className="text-purple-700">Dynamic Testing Active</p>
                  <p className="text-sm text-purple-600 mt-2">
                    Built-in testing capabilities for validating permissions and access.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Role Hierarchy Management (5 levels)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Dynamic Permission Testing
                  </li>
                  {user.roleLevel <= 2 && (
                    <>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        User Management & Role Assignment
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        System Statistics & Monitoring
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && <UserManagement user={user} />}
          {activeTab === 'roles' && <RoleHierarchy user={user} />}
          {activeTab === 'testing' && <PermissionTester user={user} />}
          {activeTab === 'stats' && <SystemStats user={user} />}
        </div>
      </div>
    </div>
  );
}