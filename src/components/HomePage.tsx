import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Settings, 
  Users, 
  Building2, 
  FolderOpen, 
  MapPin, 
  Database,
  BarChart3,
  Search,
  Bell,
  User,
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

interface HomePageProps {
  user: User;
  onModuleSelect: (module: string) => void;
  onLogout: () => void;
}

export function HomePage({ user, onModuleSelect, onLogout }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [realData, setRealData] = useState({
    totalItems: 0,
    totalCustomers: 0,
    totalQuotes: 0,
    activeProjects: 0,
    lowStockItems: 0,
    totalInventoryValue: 0
  });

  // Load real data from localStorage and API
  useEffect(() => {
    loadRealData();
    
    // Listen for data updates
    const handleDataUpdate = () => {
      loadRealData();
    };
    
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  const loadRealData = async () => {
    try {
      // Load items data
      let items = [];
      try {
        const itemsResponse = await fetch('/api/items');
        if (itemsResponse.ok) {
          items = await itemsResponse.json();
        }
      } catch (error) {
        // Fallback to localStorage
        const savedItems = localStorage.getItem('scm_items');
        if (savedItems) {
          items = JSON.parse(savedItems);
        }
      }

      // Load customers data
      let customers = [];
      try {
        const customersResponse = await fetch('/api/customers');
        if (customersResponse.ok) {
          customers = await customersResponse.json();
        }
      } catch (error) {
        // Fallback to localStorage
        const savedCustomers = localStorage.getItem('scm_customers');
        if (savedCustomers) {
          customers = JSON.parse(savedCustomers);
        }
      }

      // Load quotes data
      let quotes = [];
      const savedQuotes = localStorage.getItem('scm_quotes');
      if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
      }

      // Calculate real statistics
      const totalItems = items.length;
      const totalCustomers = customers.length;
      const totalQuotes = quotes.length;
      const activeProjects = quotes.filter(q => q.Status === 'In Progress' || q.Status === 'Draft').length;
      const lowStockItems = items.filter(item => item.StockQuantity <= (item.ReorderLevel || 10)).length;
      const totalInventoryValue = items.reduce((sum, item) => {
        const price = item.UnitPriceINR || item.UnitPrice || 0;
        const quantity = item.StockQuantity || 0;
        return sum + (price * quantity);
      }, 0);

      setRealData({
        totalItems,
        totalCustomers,
        totalQuotes,
        activeProjects,
        lowStockItems,
        totalInventoryValue
      });
    } catch (error) {
      console.error('Error loading real data:', error);
    }
  };

  const modules = [
    {
      id: 'items',
      name: 'Inventory Management',
      description: 'Manage inventory items, stock levels, and item categories',
      icon: Package,
      color: 'from-red-600 to-red-800',
      requiredLevel: 5
    },
    {
      id: 'bom',
      name: 'BOM/Assemblies',
      description: 'Bill of Materials and assembly management',
      icon: Settings,
      color: 'from-red-700 to-red-900',
      requiredLevel: 4
    },
    {
      id: 'vendors',
      name: 'Vendors',
      description: 'Supplier and vendor relationship management',
      icon: Building2,
      color: 'from-gray-800 to-black',
      requiredLevel: 4
    },
    {
      id: 'customers',
      name: 'Customers',
      description: 'Customer relationship and account management',
      icon: Users,
      color: 'from-red-800 to-black',
      requiredLevel: 4
    },
    {
      id: 'projects',
      name: 'Projects',
      description: 'Project planning, tracking, and management',
      icon: FolderOpen,
      color: 'from-gray-700 to-red-800',
      requiredLevel: 3
    },
    {
      id: 'locations',
      name: 'Locations',
      description: 'Warehouse and facility location management',
      icon: MapPin,
      color: 'from-black to-red-700',
      requiredLevel: 3
    },
    {
      id: 'sql-queries',
      name: 'SQL Query Visualizer',
      description: 'Visual SQL query builder and data analysis',
      icon: Database,
      color: 'from-red-900 to-black',
      requiredLevel: 2
    },
    {
      id: 'analytics',
      name: 'Analytics & Reports',
      description: 'Business intelligence and reporting dashboard',
      icon: BarChart3,
      color: 'from-red-600 to-black',
      requiredLevel: 2
    }
  ];

  const accessibleModules = modules.filter(module => user.roleLevel <= module.requiredLevel);

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
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-red-800/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Supply Chain Management</h1>
                <p className="text-red-300 text-sm">Enterprise Workflow System</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-medium">{user.name}</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.roleLevel)}`}>
                    {user.roleName}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-red-900/30 to-black/30 backdrop-blur-sm rounded-2xl p-8 border border-red-800/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome back, {user.name}
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Access your supply chain management modules and monitor your operations in real-time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/40 rounded-lg p-4 border border-red-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm">Active Quotes</p>
                    <p className="text-white text-2xl font-bold">{realData.activeProjects}</p>
                  </div>
                  <FolderOpen className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-red-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm">Total Items</p>
                    <p className="text-white text-2xl font-bold">{realData.totalItems.toLocaleString()}</p>
                  </div>
                  <Package className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-red-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm">Total Customers</p>
                    <p className="text-white text-2xl font-bold">{realData.totalCustomers}</p>
                  </div>
                  <Users className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Available Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accessibleModules
              .filter(module => 
                searchQuery === '' || 
                module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((module) => {
                const IconComponent = module.icon;
                return (
                  <div
                    key={module.id}
                    onClick={() => onModuleSelect(module.id)}
                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  >
                    <div className={`bg-gradient-to-br ${module.color} rounded-xl p-6 h-48 flex flex-col justify-between border border-red-800/20 shadow-2xl hover:shadow-red-500/20`}>
                      <div>
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">{module.name}</h4>
                        <p className="text-gray-200 text-sm opacity-90">{module.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-xs">
                          Level {module.requiredLevel}+
                        </span>
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                          <span className="text-white text-sm">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm">Total Quotes</p>
                  <p className="text-white text-2xl font-bold">{realData.totalQuotes}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm">Low Stock Items</p>
                  <p className="text-white text-2xl font-bold">{realData.lowStockItems}</p>
                </div>
                <Package className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm">Inventory Value</p>
                  <p className="text-white text-xl font-bold">₹{realData.totalInventoryValue.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm">System Status</p>
                  <p className="text-green-300 text-xl font-bold">Online</p>
                </div>
                <Database className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-black/40 to-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-800/20">
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => onModuleSelect('items')}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg p-4 text-left transition-colors group"
            >
              <Package className="w-6 h-6 text-red-400 mb-2 group-hover:text-red-300" />
              <p className="text-white font-medium">Add New Item</p>
              <p className="text-gray-400 text-sm">Create inventory item</p>
            </button>
            <button 
              onClick={() => onModuleSelect('quotes')}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg p-4 text-left transition-colors group"
            >
              <FileText className="w-6 h-6 text-red-400 mb-2 group-hover:text-red-300" />
              <p className="text-white font-medium">New Quote</p>
              <p className="text-gray-400 text-sm">Create customer quote</p>
            </button>
            <button 
              onClick={() => onModuleSelect('customers')}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg p-4 text-left transition-colors group"
            >
              <Users className="w-6 h-6 text-red-400 mb-2 group-hover:text-red-300" />
              <p className="text-white font-medium">New Customer</p>
              <p className="text-gray-400 text-sm">Register customer</p>
            </button>
            <button 
              onClick={() => onModuleSelect('sql-queries')}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg p-4 text-left transition-colors group"
            >
              <BarChart3 className="w-6 h-6 text-red-400 mb-2 group-hover:text-red-300" />
              <p className="text-white font-medium">View Reports</p>
              <p className="text-gray-400 text-sm">Analytics dashboard</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}