import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  Globe, 
  Save, 
  RefreshCw,
  Bell,
  Shield,
  Database,
  Palette,
  Clock,
  Users,
  Building,
  Mail,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface SettingsModuleProps {
  user: User;
}

export function SettingsModule({ user }: SettingsModuleProps) {
  const [activeTab, setActiveTab] = useState('currency');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [settings, setSettings] = useState({
    // Currency Settings
    primaryCurrency: 'INR',
    currencyMode: 'single', // 'single' or 'multi'
    selectedCurrencies: ['INR'], // For multi-currency mode
    exchangeRateSource: 'auto',
    currencyDisplayFormat: 'symbol',
    decimalPlaces: 2,
    
    // Company Settings
    companyName: 'Supply Chain Management Pvt Ltd',
    companyAddress: '123 Business Park, Electronic City, Bangalore, Karnataka 560100',
    companyPhone: '+91-80-12345678',
    companyEmail: 'info@scm-india.com',
    companyGST: '29ABCDE1234F1Z5',
    companyPAN: 'ABCDE1234F',
    companyRegistration: 'U72900KA2020PTC123456',
    
    // System Settings
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12',
    timezone: 'Asia/Kolkata',
    language: 'en',
    
    // Inventory Settings
    defaultUOM: 'nos',
    lowStockThreshold: 10,
    autoReorderEnabled: false,
    barcodeFormat: 'CODE128',
    
    // Financial Settings
    taxRate: 18, // GST rate
    paymentTermsDefault: 'Net 30',
    creditLimitDefault: 100000,
    
    // Report Settings
    reportCurrency: 'INR',
    fiscalYearStart: 'April',
    reportFormat: 'PDF',
    
    // Notification Settings
    emailNotifications: true,
    lowStockAlerts: true,
    orderStatusUpdates: true,
    systemMaintenance: true,
    
    // Security Settings
    sessionTimeout: 30,
    passwordExpiry: 90,
    twoFactorAuth: false,
    auditLogging: true,
    
    // Theme Settings
    theme: 'dark',
    accentColor: 'red',
    sidebarCollapsed: false
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('scm_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    
    // Load exchange rates if multi-currency is enabled
    if (settings.currencyMode === 'multi') {
      fetchExchangeRates();
    }
  }, []);

  // Fetch live exchange rates
  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      // Using a free API for exchange rates (you can replace with your preferred service)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${settings.primaryCurrency}`);
      const data = await response.json();
      
      if (data.rates) {
        setExchangeRates(data.rates);
        setLastUpdated(new Date().toLocaleString());
        localStorage.setItem('scm_exchange_rates', JSON.stringify({
          rates: data.rates,
          lastUpdated: new Date().toISOString(),
          baseCurrency: settings.primaryCurrency
        }));
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Load from localStorage as fallback
      const savedRates = localStorage.getItem('scm_exchange_rates');
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        setExchangeRates(parsed.rates || {});
        setLastUpdated(new Date(parsed.lastUpdated).toLocaleString());
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert currency
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    
    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
  };

  // Format currency with proper symbol and formatting
  const formatCurrency = (amount: number, currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount.toFixed(2);
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: settings.decimalPlaces,
      maximumFractionDigits: settings.decimalPlaces
    });
    
    return formatter.format(amount);
  };

  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
  ];

  const timezones = [
    'Asia/Kolkata',
    'Asia/Mumbai',
    'Asia/Delhi',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // If currency mode or primary currency changes, fetch new rates
    if ((key === 'currencyMode' && value === 'multi') || key === 'primaryCurrency') {
      setTimeout(() => fetchExchangeRates(), 100);
    }
  };

  const handleCurrencyToggle = (currencyCode: string) => {
    setSettings(prev => ({
      ...prev,
      selectedCurrencies: prev.selectedCurrencies.includes(currencyCode)
        ? prev.selectedCurrencies.filter(c => c !== currencyCode)
        : [...prev.selectedCurrencies, currencyCode]
    }));
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    setLoading(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('scm_settings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply settings to the application
      applySettings();
      
      setSaveStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const applySettings = () => {
    // In a real app, this would save to backend
    console.log('Applying settings:', settings);
    
    // Apply theme changes
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    // Apply other settings as needed
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    
    // Dispatch event for other components to react to settings changes
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      // Reset to defaults
      const defaultSettings = {
        primaryCurrency: 'INR',
        currencyMode: 'single',
        selectedCurrencies: ['INR'],
        exchangeRateSource: 'auto',
        currencyDisplayFormat: 'symbol',
        decimalPlaces: 2,
        companyName: 'Supply Chain Management Pvt Ltd',
        companyAddress: '123 Business Park, Electronic City, Bangalore, Karnataka 560100',
        companyPhone: '+91-80-12345678',
        companyEmail: 'info@scm-india.com',
        companyGST: '29ABCDE1234F1Z5',
        companyPAN: 'ABCDE1234F',
        companyRegistration: 'U72900KA2020PTC123456',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12',
        timezone: 'Asia/Kolkata',
        language: 'en',
        defaultUOM: 'nos',
        lowStockThreshold: 10,
        autoReorderEnabled: false,
        barcodeFormat: 'CODE128',
        taxRate: 18,
        paymentTermsDefault: 'Net 30',
        creditLimitDefault: 100000,
        reportCurrency: 'INR',
        fiscalYearStart: 'April',
        reportFormat: 'PDF',
        emailNotifications: true,
        lowStockAlerts: true,
        orderStatusUpdates: true,
        systemMaintenance: true,
        sessionTimeout: 30,
        passwordExpiry: 90,
        twoFactorAuth: false,
        auditLogging: true,
        theme: 'dark',
        accentColor: 'red',
        sidebarCollapsed: false
      };
      
      setSettings(defaultSettings);
      localStorage.removeItem('scm_settings');
      localStorage.removeItem('scm_exchange_rates');
      setExchangeRates({});
      setLastUpdated('');
    }
  };

  const tabs = [
    { id: 'currency', name: 'Currency & Localization', icon: DollarSign },
    { id: 'company', name: 'Company Information', icon: Building },
    { id: 'inventory', name: 'Inventory Settings', icon: Package },
    { id: 'financial', name: 'Financial Settings', icon: DollarSign },
    { id: 'system', name: 'System Preferences', icon: Settings },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette }
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-red-300">Configure application preferences and system settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={resetSettings}
                disabled={loading}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reset to Defaults</span>
              </button>
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
          
          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
              saveStatus === 'success' ? 'bg-green-900/20 border border-green-600/30' :
              saveStatus === 'error' ? 'bg-red-900/20 border border-red-600/30' :
              'bg-blue-900/20 border border-blue-600/30'
            }`}>
              {saveStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {saveStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {saveStatus === 'saving' && <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent" />}
              <span className={`${
                saveStatus === 'success' ? 'text-green-300' :
                saveStatus === 'error' ? 'text-red-300' :
                'text-blue-300'
              }`}>
                {saveStatus === 'success' && 'Settings saved successfully!'}
                {saveStatus === 'error' && 'Error saving settings. Please try again.'}
                {saveStatus === 'saving' && 'Saving settings...'}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Settings Categories</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        activeTab === tab.id
                          ? 'bg-red-600/30 text-white border border-red-500/50'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
              {/* Currency & Localization */}
              {activeTab === 'currency' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Currency & Localization Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Primary Currency</label>
                      <select
                        value={settings.primaryCurrency}
                        onChange={(e) => handleSettingChange('primaryCurrency', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Currency Mode</label>
                      <select
                        value={settings.currencyMode}
                        onChange={(e) => handleSettingChange('currencyMode', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="single">Single Currency</option>
                        <option value="multi">Multi Currency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Currency Display Format</label>
                      <select
                        value={settings.currencyDisplayFormat}
                        onChange={(e) => handleSettingChange('currencyDisplayFormat', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="symbol">Symbol (₹1,234.56)</option>
                        <option value="code">Code (INR 1,234.56)</option>
                        <option value="name">Name (Indian Rupee 1,234.56)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Decimal Places</label>
                      <select
                        value={settings.decimalPlaces}
                        onChange={(e) => handleSettingChange('decimalPlaces', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value={0}>0 (₹1,235)</option>
                        <option value={2}>2 (₹1,234.56)</option>
                        <option value={3}>3 (₹1,234.567)</option>
                      </select>
                    </div>
                  </div>

                  {settings.currencyMode === 'multi' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Selected Currencies</label>
                      
                      {/* Exchange Rates Display */}
                      {Object.keys(exchangeRates).length > 0 && (
                        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-blue-300 font-semibold">Live Exchange Rates</h5>
                            <button
                              onClick={fetchExchangeRates}
                              disabled={loading}
                              className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-2 py-1 rounded transition-colors"
                            >
                              {loading ? 'Updating...' : 'Refresh'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {settings.selectedCurrencies.map(currencyCode => {
                              const rate = exchangeRates[currencyCode];
                              const currency = currencies.find(c => c.code === currencyCode);
                              return (
                                <div key={currencyCode} className="bg-gray-800/50 p-2 rounded">
                                  <div className="text-blue-200 font-medium">{currencyCode}</div>
                                  <div className="text-gray-300">
                                    1 {settings.primaryCurrency} = {rate ? rate.toFixed(4) : 'N/A'} {currencyCode}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {lastUpdated && (
                            <div className="text-xs text-gray-400 mt-2">
                              Last updated: {lastUpdated}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {currencies.map(currency => (
                          <label key={currency.code} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.selectedCurrencies.includes(currency.code)}
                              onChange={() => handleCurrencyToggle(currency.code)}
                              className="rounded border-gray-600 text-red-600 focus:ring-red-500"
                            />
                            <div className="text-sm">
                              <span className="text-white">{currency.code}</span>
                              <span className="text-gray-400 ml-1">({currency.symbol})</span>
                              {exchangeRates[currency.code] && (
                                <div className="text-xs text-blue-300">
                                  Rate: {exchangeRates[currency.code].toFixed(4)}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      {/* Currency Converter Tool */}
                      {settings.selectedCurrencies.length > 1 && Object.keys(exchangeRates).length > 0 && (
                        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                          <h5 className="text-white font-semibold mb-3">Currency Converter</h5>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Amount</label>
                              <input
                                type="number"
                                placeholder="100"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                id="convertAmount"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">From</label>
                              <select
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                id="convertFrom"
                              >
                                {settings.selectedCurrencies.map(code => (
                                  <option key={code} value={code}>{code}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">To</label>
                              <select
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                id="convertTo"
                              >
                                {settings.selectedCurrencies.map(code => (
                                  <option key={code} value={code}>{code}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                const amount = parseFloat((document.getElementById('convertAmount') as HTMLInputElement).value);
                                const from = (document.getElementById('convertFrom') as HTMLSelectElement).value;
                                const to = (document.getElementById('convertTo') as HTMLSelectElement).value;
                                
                                if (amount && from && to) {
                                  const converted = convertCurrency(amount, from, to);
                                  const result = document.getElementById('conversionResult');
                                  if (result) {
                                    result.textContent = `${formatCurrency(amount, from)} = ${formatCurrency(converted, to)}`;
                                  }
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                            >
                              Convert
                            </button>
                          </div>
                          <div id="conversionResult" className="mt-3 text-green-300 font-medium"></div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Exchange Rate Source</label>
                    <select
                      value={settings.exchangeRateSource}
                      onChange={(e) => handleSettingChange('exchangeRateSource', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="auto">Automatic (Live Rates)</option>
                      <option value="manual">Manual Entry</option>
                      <option value="fixed">Fixed Rates</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Company Information */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Company Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleSettingChange('companyName', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">GST Number</label>
                      <input
                        type="text"
                        value={settings.companyGST}
                        onChange={(e) => handleSettingChange('companyGST', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">PAN Number</label>
                      <input
                        type="text"
                        value={settings.companyPAN}
                        onChange={(e) => handleSettingChange('companyPAN', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company Registration</label>
                      <input
                        type="text"
                        value={settings.companyRegistration}
                        onChange={(e) => handleSettingChange('companyRegistration', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={settings.companyPhone}
                        onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company Address</label>
                    <textarea
                      value={settings.companyAddress}
                      onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Inventory Settings */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Inventory Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Unit of Measurement</label>
                      <select
                        value={settings.defaultUOM}
                        onChange={(e) => handleSettingChange('defaultUOM', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="nos">Numbers (nos)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="m">Meters (m)</option>
                        <option value="ea">Each (ea)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Low Stock Threshold</label>
                      <input
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) => handleSettingChange('lowStockThreshold', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Barcode Format</label>
                      <select
                        value={settings.barcodeFormat}
                        onChange={(e) => handleSettingChange('barcodeFormat', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="CODE128">CODE128</option>
                        <option value="CODE39">CODE39</option>
                        <option value="EAN13">EAN13</option>
                        <option value="QR">QR Code</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Auto Reorder</h4>
                      <p className="text-gray-400 text-sm">Automatically create purchase orders when stock is low</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoReorderEnabled}
                        onChange={(e) => handleSettingChange('autoReorderEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Financial Settings */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Financial Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Tax Rate (%)</label>
                      <input
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="0"
                        max="50"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Payment Terms</label>
                      <select
                        value={settings.paymentTermsDefault}
                        onChange={(e) => handleSettingChange('paymentTermsDefault', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                        <option value="COD">Cash on Delivery</option>
                        <option value="Advance">Advance Payment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Credit Limit (₹)</label>
                      <input
                        type="number"
                        value={settings.creditLimitDefault}
                        onChange={(e) => handleSettingChange('creditLimitDefault', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Report Currency</label>
                      <select
                        value={settings.reportCurrency}
                        onChange={(e) => handleSettingChange('reportCurrency', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Fiscal Year Start</label>
                      <select
                        value={settings.fiscalYearStart}
                        onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="January">January</option>
                        <option value="April">April</option>
                        <option value="July">July</option>
                        <option value="October">October</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Report Format</label>
                      <select
                        value={settings.reportFormat}
                        onChange={(e) => handleSettingChange('reportFormat', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="PDF">PDF</option>
                        <option value="Excel">Excel</option>
                        <option value="CSV">CSV</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* System Preferences */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">System Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Date Format</label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (UK)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Time Format</label>
                      <select
                        value={settings.timeFormat}
                        onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="12">12 Hour (AM/PM)</option>
                        <option value="24">24 Hour</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Email Notifications</h4>
                        <p className="text-gray-400 text-sm">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Low Stock Alerts</h4>
                        <p className="text-gray-400 text-sm">Get notified when inventory is low</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.lowStockAlerts}
                          onChange={(e) => handleSettingChange('lowStockAlerts', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Order Status Updates</h4>
                        <p className="text-gray-400 text-sm">Notifications for order changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.orderStatusUpdates}
                          onChange={(e) => handleSettingChange('orderStatusUpdates', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">System Maintenance</h4>
                        <p className="text-gray-400 text-sm">Alerts for system updates and maintenance</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.systemMaintenance}
                          onChange={(e) => handleSettingChange('systemMaintenance', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Security Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="5"
                        max="480"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Password Expiry (days)</label>
                      <input
                        type="number"
                        value={settings.passwordExpiry}
                        onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                        <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorAuth}
                          onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Audit Logging</h4>
                        <p className="text-gray-400 text-sm">Log all user activities for security</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.auditLogging}
                          onChange={(e) => handleSettingChange('auditLogging', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Appearance Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                      <select
                        value={settings.theme}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Accent Color</label>
                      <select
                        value={settings.accentColor}
                        onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="purple">Purple</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Collapsed Sidebar by Default</h4>
                      <p className="text-gray-400 text-sm">Start with sidebar collapsed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sidebarCollapsed}
                        onChange={(e) => handleSettingChange('sidebarCollapsed', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}