import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './components/HomePage';
import { SQLQueryVisualizer } from './components/SQLQueryVisualizer';
import { ItemsModule } from './components/ItemsModule';
import { CustomersModule } from './components/CustomersModule';
import { SettingsModule } from './components/SettingsModule';
import { QuoteModule } from './components/QuoteModule';
import { NavigationLayout } from './components/NavigationLayout';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginForm'; // ✅ new LoginPage component

function AppContent() {
  const { user, logout, login } = useAuth();
  const [currentModule, setCurrentModule] = useState<string>('home');

  // Agar user login nahi hai to LoginPage show hoga
  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  // Render modules if user logged in
  const renderModule = () => {
    try {
      switch (currentModule) {
        case 'sql-queries':
          return (
            <NavigationLayout
              user={user}
              currentModule={currentModule}
              onModuleSelect={setCurrentModule}
              onLogout={logout}
            >
              <SQLQueryVisualizer user={user} />
            </NavigationLayout>
          );
        case 'items':
          return (
            <NavigationLayout
              user={user}
              currentModule={currentModule}
              onModuleSelect={setCurrentModule}
              onLogout={logout}
            >
              <ItemsModule user={user} />
            </NavigationLayout>
          );
        case 'customers':
          return (
            <NavigationLayout
              user={user}
              currentModule={currentModule}
              onModuleSelect={setCurrentModule}
              onLogout={logout}
            >
              <CustomersModule user={user} />
            </NavigationLayout>
          );
        case 'quotes':
          return (
            <NavigationLayout
              user={user}
              currentModule={currentModule}
              onModuleSelect={setCurrentModule}
              onLogout={logout}
            >
              <QuoteModule user={user} />
            </NavigationLayout>
          );
        case 'settings':
          return (
            <NavigationLayout
              user={user}
              currentModule={currentModule}
              onModuleSelect={setCurrentModule}
              onLogout={logout}
            >
              <SettingsModule user={user} />
            </NavigationLayout>
          );
        default:
          return (
            <NavigationLayout
              user={user}
              currentModule={currentModule}
              onModuleSelect={setCurrentModule}
              onLogout={logout}
            >
              <HomePage user={user} onModuleSelect={setCurrentModule} onLogout={logout} />
            </NavigationLayout>
          );
      }
    } catch (error) {
      console.error('Error rendering module:', error);
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Rendering Error</h1>
            <p className="text-red-300 mb-4">There was an error loading the module.</p>
            <button
              onClick={() => setCurrentModule('home')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
  };

  return renderModule();
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
