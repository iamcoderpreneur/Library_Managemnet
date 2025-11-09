import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  Settings, 
  Users, 
  Building2, 
  FolderOpen, 
  MapPin, 
  Database,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  FileText
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface NavigationLayoutProps {
  user: User;
  currentModule: string;
  onModuleSelect: (module: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function NavigationLayout({ 
  user, 
  currentModule, 
  onModuleSelect, 
  onLogout, 
  children 
}: NavigationLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      requiredLevel: 5
    },
    {
      id: 'items',
      name: 'Inventory Management',
      icon: Package,
      requiredLevel: 5
    },
    {
      id: 'bom',
      name: 'BOM/Assemblies',
      icon: Settings,
      requiredLevel: 4
    },
    {
      id: 'vendors',
      name: 'Vendors',
      icon: Building2,
      requiredLevel: 4
    },
    {
      id: 'customers',
      name: 'Customers',
      icon: Users,
      requiredLevel: 4
    },
    {
      id: 'quotes',
      name: 'Quotes',
      icon: FileText,
      requiredLevel: 4
    },
    {
      id: 'projects',
      name: 'Projects',
      icon: FolderOpen,
      requiredLevel: 3
    },
    {
      id: 'locations',
      name: 'Locations',
      icon: MapPin,
      requiredLevel: 3
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      requiredLevel: 2
    },
    {
      id: 'sql-queries',
      name: 'SQL Query Visualizer',
      icon: Database,
      requiredLevel: 2
    },
    {
      id: 'analytics',
      name: 'Analytics & Reports',
      icon: BarChart3,
      requiredLevel: 2
    }
  ];

  const accessibleItems = navigationItems.filter(item => user.roleLevel <= item.requiredLevel);

  const getRoleBadgeColor = (roleLevel: number) => {
    switch (roleLevel) {
      case 1: return 'bg-gradient-to-r from-purple-600 to-purple-800 text-white';
      case 2: return 'bg-gradient-to-r from-red-600 to-red-800 text-white';
      case 3: return 'bg-gradient-to-r from-blue-600 to-blue-800 text-white';
      case 4: return 'bg-gradient-to-r from-green-600 to-green-800 text-white';
      case 5: return 'bg-gradient-to-r from-gray-600 to-gray-800 text-white';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-800 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex">
      {/* Left Navigation Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-black/50 backdrop-blur-sm border-r border-red-800/30 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-red-800/30">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                  {/* <Shield className="w-5 h-5 text-white" /> */}
                </div>
                <div>
                  {/* <h1 className="text-white font-bold text-sm">SCM System</h1>
                  <p className="text-red-300 text-xs">Supply Chain</p> */}
                  <img src="https://www.recordtek.com/wp-content/uploads/2023/08/Logo-2.png" alt=""></img>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {accessibleItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentModule === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onModuleSelect(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-red-600/30 text-white border border-red-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-red-800/30">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-white font-medium text-sm">{user.name}</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.roleLevel)}`}>
                  {user.roleName}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user.name.charAt(0)}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}