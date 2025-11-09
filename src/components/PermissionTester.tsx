import React, { useState } from 'react';
import { TestTube, CheckCircle, XCircle, Play } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface PermissionTesterProps {
  user: User;
}

export function PermissionTester({ user }: PermissionTesterProps) {
  const [testPermission, setTestPermission] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [featureTests, setFeatureTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('scm_token');

  const commonPermissions = [
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'role.assign',
    'system.configure',
    'audit.view',
    'inventory.manage',
    'orders.manage',
    'reports.generate',
    'team.manage',
    'inventory.view',
    'orders.view',
    'orders.update',
    'reports.view',
    'team.view',
    'profile.read',
    'profile.update',
    'orders.create'
  ];

  const testSinglePermission = async () => {
    if (!testPermission) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/testing/role-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permission: testPermission }),
      });

      const data = await response.json();
      setTestResults(data.results);
    } catch (error) {
      console.error('Failed to test permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const testMultipleFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/testing/feature-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ features: commonPermissions }),
      });

      const data = await response.json();
      setFeatureTests(data.results);
    } catch (error) {
      console.error('Failed to test features:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dynamic Permission Testing</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-blue-600" />
              Single Permission Test
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Permission
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPermission}
                    onChange={(e) => setTestPermission(e.target.value)}
                    placeholder="e.g., user.create, inventory.manage"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={testSinglePermission}
                    disabled={loading || !testPermission}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Quick Tests:</p>
                <div className="flex flex-wrap gap-2">
                  {['user.create', 'role.assign', 'inventory.manage', 'orders.view'].map((permission) => (
                    <button
                      key={permission}
                      onClick={() => setTestPermission(permission)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md transition-colors"
                    >
                      {permission}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Feature Test</h3>
            <button
              onClick={testMultipleFeatures}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              Test All Features
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {testResults && (
            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${
                  testResults.hasAccess 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResults.hasAccess ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      testResults.hasAccess ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResults.hasAccess ? 'Access Granted' : 'Access Denied'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p><strong>Permission:</strong> {testResults.permission}</p>
                    <p><strong>Your Role:</strong> {testResults.user.roleName}</p>
                    <p><strong>Tested At:</strong> {new Date(testResults.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {featureTests.length > 0 && (
            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Access Summary</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {featureTests.map((test, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      test.hasAccess 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {test.hasAccess ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">{test.feature}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      test.hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {test.hasAccess ? 'Allowed' : 'Denied'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {featureTests.filter(t => t.hasAccess).length}
                    </p>
                    <p className="text-sm text-gray-600">Accessible</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {featureTests.filter(t => !t.hasAccess).length}
                    </p>
                    <p className="text-sm text-gray-600">Restricted</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}