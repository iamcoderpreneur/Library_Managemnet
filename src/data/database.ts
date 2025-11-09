// Simulated SQL Server Database Structure
export interface DatabaseTable {
  name: string;
  columns: Column[];
  data: any[];
  relationships: Relationship[];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: string;
}

export interface Relationship {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

// Items Table
export const itemsTable: DatabaseTable = {
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
    { name: 'LocationID', type: 'int', nullable: true, foreignKey: 'Locations.LocationID' },
    { name: 'CreatedDate', type: 'datetime', nullable: false },
    { name: 'IsActive', type: 'bit', nullable: false }
  ],
  data: [
  
  ],
  relationships: [
    { table: 'Items', column: 'LocationID', referencedTable: 'Locations', referencedColumn: 'LocationID' }
  ]
};

// BOM/Assemblies Table
export const bomTable: DatabaseTable = {
  name: 'BOM',
  columns: [
    { name: 'BOMID', type: 'int', nullable: false, primaryKey: true },
    { name: 'ParentItemID', type: 'int', nullable: false, foreignKey: 'Items.ItemID' },
    { name: 'ChildItemID', type: 'int', nullable: false, foreignKey: 'Items.ItemID' },
    { name: 'Quantity', type: 'decimal(10,3)', nullable: false },
    { name: 'UnitOfMeasure', type: 'varchar(20)', nullable: false },
    { name: 'EffectiveDate', type: 'datetime', nullable: false },
    { name: 'ExpiryDate', type: 'datetime', nullable: true },
    { name: 'IsActive', type: 'bit', nullable: false }
  ],
  data: [
    {
      BOMID: 1,
      ParentItemID: 3,
      ChildItemID: 1,
      Quantity: 2.5,
      UnitOfMeasure: 'pieces',
      EffectiveDate: '2024-01-01',
      ExpiryDate: null,
      IsActive: true
    }
  ],
  relationships: [
    { table: 'BOM', column: 'ParentItemID', referencedTable: 'Items', referencedColumn: 'ItemID' },
    { table: 'BOM', column: 'ChildItemID', referencedTable: 'Items', referencedColumn: 'ItemID' }
  ]
};

// Vendors Table
export const vendorsTable: DatabaseTable = {
  name: 'Vendors',
  columns: [
    { name: 'VendorID', type: 'int', nullable: false, primaryKey: true },
    { name: 'VendorCode', type: 'varchar(50)', nullable: false },
    { name: 'VendorName', type: 'varchar(255)', nullable: false },
    { name: 'ContactPerson', type: 'varchar(100)', nullable: true },
    { name: 'Email', type: 'varchar(255)', nullable: true },
    { name: 'Phone', type: 'varchar(20)', nullable: true },
    { name: 'Address', type: 'text', nullable: true },
    { name: 'PaymentTerms', type: 'varchar(50)', nullable: true },
    { name: 'Rating', type: 'decimal(3,2)', nullable: true },
    { name: 'IsActive', type: 'bit', nullable: false }
  ],
  data: [
    {
      VendorID: 1,
      VendorCode: 'VEN001',
      VendorName: 'Steel Dynamics Inc',
      ContactPerson: 'John Smith',
      Email: 'john@steeldynamics.com',
      Phone: '+1-555-0123',
      Address: '123 Industrial Ave, Steel City, SC 12345',
      PaymentTerms: 'Net 30',
      Rating: 4.5,
      IsActive: true
    }
  ],
  relationships: []
};

// Customers Table
export const customersTable: DatabaseTable = {
  name: 'Customers',
  columns: [
    { name: 'CustomerID', type: 'int', nullable: false, primaryKey: true },
    { name: 'CustomerCode', type: 'varchar(50)', nullable: false },
    { name: 'CustomerName', type: 'varchar(255)', nullable: false },
    { name: 'ContactPerson', type: 'varchar(100)', nullable: true },
    { name: 'Email', type: 'varchar(255)', nullable: true },
    { name: 'Phone', type: 'varchar(20)', nullable: true },
    { name: 'Address', type: 'text', nullable: true },
    { name: 'CreditLimit', type: 'decimal(12,2)', nullable: true },
    { name: 'PaymentTerms', type: 'varchar(50)', nullable: true },
    { name: 'IsActive', type: 'bit', nullable: false }
  ],
  data: [
    {
      CustomerID: 1,
      CustomerCode: 'CUS001',
      CustomerName: 'ABC Manufacturing',
      ContactPerson: 'Sarah Johnson',
      Email: 'sarah@abcmfg.com',
      Phone: '+1-555-0456',
      Address: '456 Business Blvd, Commerce City, CC 67890',
      CreditLimit: 50000.00,
      PaymentTerms: 'Net 15',
      IsActive: true
    }
  ],
  relationships: []
};

// Projects Table
export const projectsTable: DatabaseTable = {
  name: 'Projects',
  columns: [
    { name: 'ProjectID', type: 'int', nullable: false, primaryKey: true },
    { name: 'ProjectCode', type: 'varchar(50)', nullable: false },
    { name: 'ProjectName', type: 'varchar(255)', nullable: false },
    { name: 'Description', type: 'text', nullable: true },
    { name: 'CustomerID', type: 'int', nullable: true, foreignKey: 'Customers.CustomerID' },
    { name: 'StartDate', type: 'datetime', nullable: false },
    { name: 'EndDate', type: 'datetime', nullable: true },
    { name: 'Status', type: 'varchar(50)', nullable: false },
    { name: 'Budget', type: 'decimal(12,2)', nullable: true },
    { name: 'ActualCost', type: 'decimal(12,2)', nullable: true },
    { name: 'ProjectManager', type: 'varchar(100)', nullable: true },
    { name: 'IsActive', type: 'bit', nullable: false }
  ],
  data: [
    {
      ProjectID: 1,
      ProjectCode: 'PRJ001',
      ProjectName: 'Industrial Equipment Assembly',
      Description: 'Complete assembly line for industrial equipment',
      CustomerID: 1,
      StartDate: '2024-02-01',
      EndDate: '2024-06-30',
      Status: 'In Progress',
      Budget: 250000.00,
      ActualCost: 125000.00,
      ProjectManager: 'Mike Wilson',
      IsActive: true
    }
  ],
  relationships: [
    { table: 'Projects', column: 'CustomerID', referencedTable: 'Customers', referencedColumn: 'CustomerID' }
  ]
};

// Locations Table
export const locationsTable: DatabaseTable = {
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
  data: [
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
  ],
  relationships: []
};

export const database = {
  Items: itemsTable,
  BOM: bomTable,
  Vendors: vendorsTable,
  Customers: customersTable,
  Projects: projectsTable,
  Locations: locationsTable
};

// SQL Query Builder and Executor
export class SQLQueryBuilder {
  static select(table: string, columns: string[] = ['*'], conditions?: string): string {
    const cols = columns.join(', ');
    let query = `SELECT ${cols} FROM ${table}`;
    if (conditions) {
      query += ` WHERE ${conditions}`;
    }
    return query;
  }

  static insert(table: string, data: Record<string, any>): string {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(v => 
      typeof v === 'string' ? `'${v}'` : v
    ).join(', ');
    return `INSERT INTO ${table} (${columns}) VALUES (${values})`;
  }

  static update(table: string, data: Record<string, any>, conditions: string): string {
    const sets = Object.entries(data).map(([key, value]) => 
      `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
    ).join(', ');
    return `UPDATE ${table} SET ${sets} WHERE ${conditions}`;
  }

  static delete(table: string, conditions: string): string {
    return `DELETE FROM ${table} WHERE ${conditions}`;
  }
}

export const executeQuery = (query: string): any[] => {
  // Simulate query execution
  console.log('Executing SQL Query:', query);
  
  // Parse basic SELECT queries
  if (query.toUpperCase().startsWith('SELECT')) {
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const table = database[tableName as keyof typeof database];
      if (table) {
        return table.data;
      }
    }
  }
  
  return [];
};