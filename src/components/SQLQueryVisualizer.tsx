import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Play, 
  Save, 
  Download, 
  Table, 
  Eye,
  Code,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
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

interface SQLQueryVisualizerProps {
  user: User;
}

interface DatabaseTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey?: boolean;
    foreignKey?: string;
  }>;
  data: any[];
}

export function SQLQueryVisualizer({ user }: SQLQueryVisualizerProps) {
  const [selectedTable, setSelectedTable] = useState('items');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showSchema, setShowSchema] = useState(true);
  const [database, setDatabase] = useState<Record<string, DatabaseTable>>({});
  const [error, setError] = useState<string | null>(null);

  // Initialize database structure
  useEffect(() => {
    loadDatabaseStructure();
  }, []);

  // Refresh data when component mounts or when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      loadDatabaseStructure();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when data is updated
    window.addEventListener('dataUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleStorageChange);
    };
  }, []);

  const loadDatabaseStructure = async () => {
    try {
      // Load items from API or localStorage
      let items = [];
      let customers = [];
      let quotes = [];
      let locations = [];

      try {
        // Try to load from API first
        const itemsResponse = await fetch('/api/items');
        if (itemsResponse.ok) {
          items = await itemsResponse.json();
        }
      } catch (error) {
        console.log('API not available, loading from localStorage');
      }

      // Fallback to localStorage
      if (items.length === 0) {
        const savedItems = localStorage.getItem('scm_items');
        if (savedItems) {
          items = JSON.parse(savedItems);
        }
      }

      const savedCustomers = localStorage.getItem('scm_customers');
      if (savedCustomers) {
        customers = JSON.parse(savedCustomers);
      }

      const savedQuotes = localStorage.getItem('scm_quotes');
      if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
      }

      // Default locations
      locations = [
        {
          LocationID: 1,
          LocationCode: 'WH001',
          LocationName: 'Main Warehouse',
          LocationType: 'Warehouse',
          Address: '789 Storage St, Warehouse District, WD 11111',
          Capacity: 10000.00,
          CurrentUtilization: 65.5,
          ManagerID: 'manager@scm.com',
          IsActive: true
        },
        {
          LocationID: 2,
          LocationCode: 'FAC001',
          LocationName: 'Production Facility A',
          LocationType: 'Factory',
          Address: '321 Manufacturing Ave, Industrial Zone, IZ 22222',
          Capacity: 5000.00,
          CurrentUtilization: 80.2,
          ManagerID: 'supervisor@scm.com',
          IsActive: true
        }
      ];

      const dbStructure = {
        items: {
          name: 'Items',
          columns: [
            { name: 'ItemID', type: 'int', nullable: false, primaryKey: true },
            { name: 'ItemCode', type: 'varchar(50)', nullable: false },
            { name: 'ItemName', type: 'varchar(255)', nullable: false },
            { name: 'Description', type: 'text', nullable: true },
            { name: 'Category', type: 'varchar(100)', nullable: true },
            { name: 'UnitPrice', type: 'decimal(10,2)', nullable: false },
            { name: 'StockQuantity', type: 'int', nullable: false },
            { name: 'ReorderLevel', type: 'int', nullable: false },
            { name: 'UOM', type: 'varchar(20)', nullable: true },
            { name: 'LocationID', type: 'int', nullable: true, foreignKey: 'Locations.LocationID' },
            { name: 'CreatedDate', type: 'datetime', nullable: false },
            { name: 'IsActive', type: 'bit', nullable: false }
          ],
          data: items
        },
        customers: {
          name: 'Customers',
          columns: [
            { name: 'CustomerID', type: 'int', nullable: false, primaryKey: true },
            { name: 'CustomerCode', type: 'varchar(50)', nullable: false },
            { name: 'CustomerName', type: 'varchar(255)', nullable: false },
            { name: 'ContactPerson', type: 'varchar(100)', nullable: true },
            { name: 'Email', type: 'varchar(255)', nullable: true },
            { name: 'Phone', type: 'varchar(20)', nullable: true },
            { name: 'Address', type: 'text', nullable: true },
            { name: 'GSTNumber', type: 'varchar(15)', nullable: false },
            { name: 'CreditLimit', type: 'decimal(12,2)', nullable: true },
            { name: 'PaymentTerms', type: 'varchar(50)', nullable: true },
            { name: 'IsActive', type: 'bit', nullable: false }
          ],
          data: customers
        },
        quotes: {
          name: 'Quotes',
          columns: [
            { name: 'QuoteID', type: 'int', nullable: false, primaryKey: true },
            { name: 'QuoteNumber', type: 'varchar(50)', nullable: false },
            { name: 'CustomerName', type: 'varchar(255)', nullable: false },
            { name: 'ContactPerson', type: 'varchar(100)', nullable: true },
            { name: 'Email', type: 'varchar(255)', nullable: true },
            { name: 'Phone', type: 'varchar(20)', nullable: true },
            { name: 'QuoteDate', type: 'date', nullable: false },
            { name: 'ValidUntil', type: 'date', nullable: false },
            { name: 'Status', type: 'varchar(50)', nullable: false },
            { name: 'Subtotal', type: 'decimal(12,2)', nullable: false },
            { name: 'TaxAmount', type: 'decimal(12,2)', nullable: false },
            { name: 'TotalAmount', type: 'decimal(12,2)', nullable: false },
            { name: 'IsActive', type: 'bit', nullable: false }
          ],
          data: quotes
        },
        locations: {
          name: 'Locations',
          columns: [
            { name: 'LocationID', type: 'int', nullable: false, primaryKey: true },
            { name: 'LocationCode', type: 'varchar(50)', nullable: false },
            { name: 'LocationName', type: 'varchar(255)', nullable: false },
            { name: 'LocationType', type: 'varchar(50)', nullable: false },
            { name: 'Address', type: 'text', nullable: true },
            { name: 'Capacity', type: 'decimal(10,2)', nullable: true },
            { name: 'CurrentUtilization', type: 'decimal(5,2)', nullable: true },
            { name: 'ManagerID', type: 'varchar(50)', nullable: true },
            { name: 'IsActive', type: 'bit', nullable: false }
          ],
          data: locations
        }
      };

      setDatabase(dbStructure);
      
      // Generate initial query if none exists
      if (!sqlQuery) {
        setSqlQuery(`SELECT * FROM ${selectedTable}`);
      }
    } catch (error) {
      console.error('Error loading database structure:', error);
      setError('Failed to load database structure');
    }
  };

  const executeQuery = (query: string): any[] => {
    try {
      setError(null);
      
      // Simple SQL parser for basic SELECT queries
      const trimmedQuery = query.trim().toUpperCase();
      
      if (trimmedQuery.startsWith('SELECT')) {
        // Extract table name from query
        const fromMatch = query.match(/FROM\s+(\w+)/i);
        if (fromMatch) {
          const tableName = fromMatch[1].toLowerCase();
          const table = database[tableName];
          
          if (table) {
            let results = [...table.data];
            
            // Handle WHERE clause
            const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
            if (whereMatch) {
              const whereClause = whereMatch[1];
              results = results.filter(row => {
                // Simple WHERE clause parsing
                if (whereClause.includes('=')) {
                  const [column, value] = whereClause.split('=').map(s => s.trim());
                  const cleanValue = value.replace(/['"]/g, '');
                  return String(row[column]) === cleanValue;
                }
                if (whereClause.includes('LIKE')) {
                  const [column, value] = whereClause.split('LIKE').map(s => s.trim());
                  const cleanValue = value.replace(/['"]/g, '').replace(/%/g, '');
                  return String(row[column]).toLowerCase().includes(cleanValue.toLowerCase());
                }
                if (whereClause.includes('>')) {
                  const [column, value] = whereClause.split('>').map(s => s.trim());
                  return Number(row[column]) > Number(value);
                }
                if (whereClause.includes('<')) {
                  const [column, value] = whereClause.split('<').map(s => s.trim());
                  return Number(row[column]) < Number(value);
                }
                return true;
              });
            }
            
            // Handle ORDER BY clause
            const orderMatch = query.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
            if (orderMatch) {
              const column = orderMatch[1];
              const direction = orderMatch[2]?.toUpperCase() || 'ASC';
              results.sort((a, b) => {
                const aVal = a[column];
                const bVal = b[column];
                if (direction === 'DESC') {
                  return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
              });
            }
            
            // Handle LIMIT clause
            const limitMatch = query.match(/LIMIT\s+(\d+)/i);
            if (limitMatch) {
              const limit = parseInt(limitMatch[1]);
              results = results.slice(0, limit);
            }
            
            return results;
          } else {
            throw new Error(`Table '${tableName}' not found`);
          }
        } else {
          throw new Error('Invalid SELECT query: FROM clause not found');
        }
      } else if (trimmedQuery.startsWith('SHOW TABLES')) {
        return Object.keys(database).map(name => ({ table_name: name }));
      } else if (trimmedQuery.startsWith('DESCRIBE') || trimmedQuery.startsWith('DESC')) {
        const tableMatch = query.match(/(?:DESCRIBE|DESC)\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const table = database[tableName];
          if (table) {
            return table.columns.map(col => ({
              Field: col.name,
              Type: col.type,
              Null: col.nullable ? 'YES' : 'NO',
              Key: col.primaryKey ? 'PRI' : (col.foreignKey ? 'MUL' : ''),
              Default: null,
              Extra: col.primaryKey ? 'auto_increment' : ''
            }));
          }
        }
      }
      
      throw new Error('Unsupported query type. Only SELECT, SHOW TABLES, and DESCRIBE are supported.');
    } catch (error) {
      throw error;
    }
  };

  const executeCurrentQuery = async () => {
    setIsExecuting(true);
    try {
      const results = executeQuery(sqlQuery);
      setQueryResults(results);
      
      // Add to history
      if (!queryHistory.includes(sqlQuery)) {
        setQueryHistory(prev => [sqlQuery, ...prev.slice(0, 9)]);
      }
      setError(null);
    } catch (error) {
      console.error('Query execution error:', error);
      setError(error instanceof Error ? error.message : 'Query execution failed');
      setQueryResults([]);
    } finally {
      setIsExecuting(false);
    }
  };

  const generateQuery = (type: 'select' | 'describe' | 'show_tables' | 'count' | 'where') => {
    const table = database[selectedTable];
    let query = '';

    switch (type) {
      case 'select':
        query = `SELECT * FROM ${selectedTable}`;
        break;
      case 'describe':
        query = `DESCRIBE ${selectedTable}`;
        break;
      case 'show_tables':
        query = 'SHOW TABLES';
        break;
      case 'count':
        query = `SELECT COUNT(*) as total_records FROM ${selectedTable}`;
        break;
      case 'where':
        if (selectedTable === 'items') {
          query = `SELECT * FROM ${selectedTable} WHERE StockQuantity < ReorderLevel`;
        } else if (selectedTable === 'customers') {
          query = `SELECT * FROM ${selectedTable} WHERE IsActive = 1`;
        } else {
          query = `SELECT * FROM ${selectedTable} WHERE IsActive = 1`;
        }
        break;
    }
    
    setSqlQuery(query);
  };

  const refreshData = () => {
    loadDatabaseStructure();
  };

  const exportResults = () => {
    if (queryResults.length === 0) return;
    
    const csv = [
      Object.keys(queryResults[0]).join(','),
      ...queryResults.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableNames = Object.keys(database);
  const currentTable = database[selectedTable];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">SQL Query Visualizer</h1>
                <p className="text-red-300">Interactive database query builder and analyzer</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
              <button
                onClick={() => setShowSchema(!showSchema)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showSchema 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Schema
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Tables</p>
                <p className="text-white text-2xl font-bold">{tableNames.length}</p>
              </div>
              <Table className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Items in DB</p>
                <p className="text-white text-2xl font-bold">{database.items?.data?.length || 0}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Customers</p>
                <p className="text-white text-2xl font-bold">{database.customers?.data?.length || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Query Results</p>
                <p className="text-white text-2xl font-bold">{queryResults.length}</p>
              </div>
              <Search className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Schema Panel */}
          {showSchema && (
            <div className="lg:col-span-1">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Table className="w-5 h-5 mr-2 text-red-400" />
                  Database Schema
                </h3>
                
                <div className="space-y-4">
                  {tableNames.map((tableName) => (
                    <div key={tableName} className="border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setSelectedTable(tableName)}
                        className={`w-full p-3 text-left transition-colors ${
                          selectedTable === tableName
                            ? 'bg-red-600/30 text-white border-red-500'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{tableName}</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                            {database[tableName]?.data?.length || 0} rows
                          </span>
                        </div>
                      </button>
                      
                      {selectedTable === tableName && currentTable && (
                        <div className="bg-gray-900/50 p-3 border-t border-gray-700">
                          <div className="space-y-2">
                            {currentTable.columns.map((column, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className={`font-mono ${column.primaryKey ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  {column.name}
                                  {column.primaryKey && <span className="ml-1 text-yellow-500">🔑</span>}
                                  {column.foreignKey && <span className="ml-1 text-blue-500">🔗</span>}
                                </span>
                                <span className="text-gray-500">{column.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Query Builder and Results */}
          <div className={showSchema ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="space-y-6">
              {/* Query Builder */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Code className="w-5 h-5 mr-2 text-red-400" />
                    Query Builder
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => generateQuery('select')}
                      className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded text-sm hover:bg-blue-600/30 transition-colors"
                    >
                      SELECT *
                    </button>
                    <button
                      onClick={() => generateQuery('count')}
                      className="px-3 py-1 bg-green-600/20 text-green-300 rounded text-sm hover:bg-green-600/30 transition-colors"
                    >
                      COUNT
                    </button>
                    <button
                      onClick={() => generateQuery('where')}
                      className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded text-sm hover:bg-yellow-600/30 transition-colors"
                    >
                      WHERE
                    </button>
                    <button
                      onClick={() => generateQuery('describe')}
                      className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded text-sm hover:bg-purple-600/30 transition-colors"
                    >
                      DESCRIBE
                    </button>
                    <button
                      onClick={() => generateQuery('show_tables')}
                      className="px-3 py-1 bg-red-600/20 text-red-300 rounded text-sm hover:bg-red-600/30 transition-colors"
                    >
                      SHOW TABLES
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="Enter your SQL query here..."
                  />
                  
                  {error && (
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={executeCurrentQuery}
                        disabled={isExecuting || !sqlQuery.trim()}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {isExecuting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Execute Query</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          const savedQueries = localStorage.getItem('sql_queries') || '[]';
                          const queries = JSON.parse(savedQueries);
                          queries.push({
                            query: sqlQuery,
                            timestamp: new Date().toISOString(),
                            table: selectedTable
                          });
                          localStorage.setItem('sql_queries', JSON.stringify(queries.slice(-20)));
                        }}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      Table: <span className="text-red-400 font-medium capitalize">{selectedTable}</span>
                      {currentTable && (
                        <span className="ml-2">({currentTable.data.length} rows)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Query Results */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-red-400" />
                    Query Results
                  </h3>
                  {queryResults.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {queryResults.length} rows returned
                      </span>
                      <button 
                        onClick={exportResults}
                        className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  )}
                </div>

                {queryResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {Object.keys(queryResults[0]).map((column) => (
                            <th key={column} className="text-left p-3 text-gray-300 font-medium">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                            {Object.values(row).map((value: any, cellIdx) => (
                              <td key={cellIdx} className="p-3 text-gray-300">
                                {typeof value === 'boolean' ? (
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    value ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
                                  }`}>
                                    {value ? 'True' : 'False'}
                                  </span>
                                ) : typeof value === 'number' ? (
                                  <span className="text-blue-300">{value}</span>
                                ) : value === null ? (
                                  <span className="text-gray-500 italic">NULL</span>
                                ) : (
                                  <span>{String(value)}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No results to display</p>
                    <p className="text-gray-500 text-sm">Execute a query to see results here</p>
                  </div>
                )}
              </div>

              {/* Query History */}
              {queryHistory.length > 0 && (
                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Query History</h3>
                  <div className="space-y-2">
                    {queryHistory.map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSqlQuery(query)}
                        className="w-full text-left p-3 bg-gray-800/30 hover:bg-gray-700/30 rounded-lg transition-colors"
                      >
                        <code className="text-sm text-gray-300 font-mono">{query}</code>
                      </button>
                    ))}
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