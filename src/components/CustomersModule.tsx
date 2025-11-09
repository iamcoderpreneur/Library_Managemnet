import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface Customer {
  CustomerID: number;
  CustomerCode: string;
  CustomerName: string;
  ContactPerson: string;
  Email: string;
  Phone: string;
  Address: string;
  GSTNumber: string;
  CreditLimit: number;
  PaymentTerms: string;
  IsActive: boolean;
  CreatedDate: string;
}

interface CustomersModuleProps {
  user: User;
}

export function CustomersModule({ user }: CustomersModuleProps) {
  // Dispatch custom event when data is updated
  const dispatchDataUpdate = () => {
    window.dispatchEvent(new CustomEvent('dataUpdated'));
  };

  const [customers, setCustomers] = useState<Customer[]>([
    {
      CustomerID: 1,
      CustomerCode: 'CUS001',
      CustomerName: 'ABC Manufacturing Ltd',
      ContactPerson: 'Sarah Johnson',
      Email: 'sarah@abcmfg.com',
      Phone: '+1-555-0456',
      Address: '456 Business Blvd, Commerce City, CC 67890',
      GSTNumber: '29ABCDE1234F1Z5',
      CreditLimit: 50000.00,
      PaymentTerms: 'Net 15',
      IsActive: true,
      CreatedDate: '2024-01-15'
    },
  
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    CustomerName: '',
    ContactPerson: '',
    Email: '',
    Phone: '',
    Address: '',
    GSTNumber: '',
    CreditLimit: 0,
    PaymentTerms: 'Net 30'
  });

  const filteredCustomers = customers.filter(customer =>
    customer.CustomerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.CustomerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.ContactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 1) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];
            
            const processedData = rows.map((row, index) => ({
              rowNumber: index + 2,
              recordNumber: row[0],
              customerName: row[headers.indexOf('name of customer')] || row[headers.indexOf('Customer Name')] || '',
              address: row[headers.indexOf('Address')] || '',
              gstNumber: row[headers.indexOf('GST number')] || row[headers.indexOf('GST Number')] || '',
              contactPerson: row[headers.indexOf('Contact Person')] || '',
              email: row[headers.indexOf('Email')] || '',
              phone: row[headers.indexOf('Phone')] || '',
              creditLimit: row[headers.indexOf('Credit Limit')] || 0,
              paymentTerms: row[headers.indexOf('Payment Terms')] || 'Net 30'
            }));
            
            setImportData(processedData);
            validateImportData(processedData);
          }
        } catch (error) {
          setImportErrors(['Error reading Excel file. Please check the file format.']);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const validateImportData = (data: any[]) => {
    const errors: string[] = [];
    const customerNames = new Set();
    const existingCustomerNames = new Set(customers.map(customer => customer.CustomerName.toLowerCase()));

    data.forEach((row, index) => {
      const rowNum = row.rowNumber;
      
      // Check mandatory Customer Name
      if (!row.customerName || row.customerName.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Customer name is mandatory`);
      } else {
        const customerName = row.customerName.toString().trim().toLowerCase();
        
        // Check for duplicates in import data
        if (customerNames.has(customerName)) {
          errors.push(`Row ${rowNum}: Duplicate customer name "${row.customerName}" found in import data`);
        } else {
          customerNames.add(customerName);
        }
        
        // Check for existing customer names
        if (existingCustomerNames.has(customerName)) {
          errors.push(`Row ${rowNum}: Customer name "${row.customerName}" already exists`);
        }
      }
      
      // Check mandatory Address
      if (!row.address || row.address.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Address is mandatory`);
      }
      
      // Check mandatory GST Number
      if (!row.gstNumber || row.gstNumber.toString().trim() === '') {
        errors.push(`Row ${rowNum}: GST number is mandatory`);
      } else {
        // Basic GST number format validation (15 characters)
        const gstNum = row.gstNumber.toString().trim();
        if (gstNum.length !== 15) {
          errors.push(`Row ${rowNum}: GST number must be 15 characters long`);
        }
      }
    });

    setImportErrors(errors);
  };

  const processImport = () => {
    if (importErrors.length === 0 && importData.length > 0) {
      const newCustomers = importData.map((row, index) => ({
        CustomerID: customers.length + index + 1,
        CustomerCode: `CUS${String(customers.length + index + 1).padStart(3, '0')}`,
        CustomerName: row.customerName,
        ContactPerson: row.contactPerson || '',
        Email: row.email || '',
        Phone: row.phone || '',
        Address: row.address,
        GSTNumber: row.gstNumber,
        CreditLimit: parseFloat(row.creditLimit) || 0,
        PaymentTerms: row.paymentTerms || 'Net 30',
        IsActive: true,
        CreatedDate: new Date().toISOString().split('T')[0]
      }));
      
      setCustomers([...customers, ...newCustomers]);
      localStorage.setItem('scm_customers', JSON.stringify([...customers, ...newCustomers]));
      dispatchDataUpdate();
      setImportSuccess(true);
      setTimeout(() => {
        setShowImportModal(false);
        setImportFile(null);
        setImportData([]);
        setImportErrors([]);
        setImportSuccess(false);
      }, 2000);
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      CustomerID: customers.length + 1,
      CustomerCode: `CUS${String(customers.length + 1).padStart(3, '0')}`,
      CustomerName: newCustomer.CustomerName,
      ContactPerson: newCustomer.ContactPerson,
      Email: newCustomer.Email,
      Phone: newCustomer.Phone,
      Address: newCustomer.Address,
      GSTNumber: newCustomer.GSTNumber,
      CreditLimit: newCustomer.CreditLimit,
      PaymentTerms: newCustomer.PaymentTerms,
      IsActive: true,
      CreatedDate: new Date().toISOString().split('T')[0]
    };
    
    setCustomers([...customers, customer]);
    localStorage.setItem('scm_customers', JSON.stringify([...customers, customer]));
    dispatchDataUpdate();
    setNewCustomer({
      CustomerName: '',
      ContactPerson: '',
      Email: '',
      Phone: '',
      Address: '',
      GSTNumber: '',
      CreditLimit: 0,
      PaymentTerms: 'Net 30'
    });
    setShowAddForm(false);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Customer Management</h1>
                <p className="text-red-300">Customer relationship and account management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Customers</p>
                <p className="text-white text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Active Customers</p>
                <p className="text-white text-2xl font-bold">{customers.filter(c => c.IsActive).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Credit Limit</p>
                <p className="text-white text-2xl font-bold">
                  ${customers.reduce((sum, customer) => sum + customer.CreditLimit, 0).toLocaleString()}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Avg Credit Limit</p>
                <p className="text-white text-2xl font-bold">
                  ${Math.round(customers.reduce((sum, customer) => sum + customer.CreditLimit, 0) / customers.length).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, code, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Customer Code</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Customer Name</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Contact Person</th>
                  <th className="text-left p-4 text-gray-300 font-medium">GST Number</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Credit Limit</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Payment Terms</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.CustomerID} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4">
                      <span className="text-blue-300 font-mono">{customer.CustomerCode}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{customer.CustomerName}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {customer.Email}
                          </span>
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {customer.Phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{customer.ContactPerson}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-yellow-300 font-mono">{customer.GSTNumber}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-green-300 font-medium">${customer.CreditLimit.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                        {customer.PaymentTerms}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.IsActive 
                          ? 'bg-green-600/20 text-green-300' 
                          : 'bg-red-600/20 text-red-300'
                      }`}>
                        {customer.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.roleLevel <= 3 && (
                          <button className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-600/20 rounded transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {user.roleLevel <= 2 && (
                          <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Customer Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add New Customer</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={newCustomer.CustomerName}
                      onChange={(e) => setNewCustomer({...newCustomer, CustomerName: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={newCustomer.ContactPerson}
                      onChange={(e) => setNewCustomer({...newCustomer, ContactPerson: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={newCustomer.Email}
                      onChange={(e) => setNewCustomer({...newCustomer, Email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newCustomer.Phone}
                      onChange={(e) => setNewCustomer({...newCustomer, Phone: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Address *</label>
                    <textarea
                      value={newCustomer.Address}
                      onChange={(e) => setNewCustomer({...newCustomer, Address: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">GST Number *</label>
                    <input
                      type="text"
                      value={newCustomer.GSTNumber}
                      onChange={(e) => setNewCustomer({...newCustomer, GSTNumber: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      maxLength={15}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Credit Limit</label>
                    <input
                      type="number"
                      value={newCustomer.CreditLimit}
                      onChange={(e) => setNewCustomer({...newCustomer, CreditLimit: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Payment Terms</label>
                    <select
                      value={newCustomer.PaymentTerms}
                      onChange={(e) => setNewCustomer({...newCustomer, PaymentTerms: e.target.value})}
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
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Customer Details</h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Customer Code</label>
                    <p className="text-white font-mono">{selectedCustomer.CustomerCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name</label>
                    <p className="text-white font-semibold">{selectedCustomer.CustomerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Contact Person</label>
                    <p className="text-white">{selectedCustomer.ContactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-blue-300">{selectedCustomer.Email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                    <p className="text-white">{selectedCustomer.Phone}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">GST Number</label>
                    <p className="text-yellow-300 font-mono">{selectedCustomer.GSTNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Credit Limit</label>
                    <p className="text-green-300 text-xl font-bold">${selectedCustomer.CreditLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Payment Terms</label>
                    <p className="text-white">{selectedCustomer.PaymentTerms}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCustomer.IsActive ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
                    }`}>
                      {selectedCustomer.IsActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created Date</label>
                    <p className="text-white">{new Date(selectedCustomer.CreatedDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                  <p className="text-white bg-gray-800/50 p-3 rounded-lg">{selectedCustomer.Address}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Excel Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FileSpreadsheet className="w-6 h-6 mr-2 text-green-400" />
                  Import Customers from Excel
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!importSuccess ? (
                <div className="space-y-6">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-white mb-2">Upload Excel File</p>
                    <p className="text-gray-400 text-sm mb-4">
                      Row 1 should contain headers, data starts from Row 2
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Choose Excel File
                    </label>
                    {importFile && (
                      <p className="text-green-400 mt-2">Selected: {importFile.name}</p>
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Excel Format Requirements:</h4>
                    <ul className="text-blue-200 text-sm space-y-1">
                      <li>• <strong>Column 1:</strong> Record Number</li>
                      <li>• <strong>name of customer:</strong> Mandatory, must be unique</li>
                      <li>• <strong>Address:</strong> Mandatory customer address</li>
                      <li>• <strong>GST number:</strong> Mandatory, 15 characters</li>
                      <li>• <strong>Contact Person:</strong> Optional contact person name</li>
                      <li>• <strong>Email:</strong> Optional email address</li>
                      <li>• <strong>Phone:</strong> Optional phone number</li>
                      <li>• <strong>Credit Limit:</strong> Optional credit limit amount</li>
                      <li>• <strong>Payment Terms:</strong> Optional payment terms</li>
                    </ul>
                  </div>

                  {/* Validation Results */}
                  {importData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">
                          Import Preview ({importData.length} customers)
                        </h4>
                        {importErrors.length === 0 ? (
                          <div className="flex items-center text-green-400">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Ready to Import
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {importErrors.length} Errors Found
                          </div>
                        )}
                      </div>

                      {/* Errors */}
                      {importErrors.length > 0 && (
                        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                          <h5 className="text-red-300 font-semibold mb-2">Validation Errors:</h5>
                          <ul className="text-red-200 text-sm space-y-1">
                            {importErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Preview Table */}
                      <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-60">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-700">
                              <tr>
                                <th className="text-left p-2 text-gray-300">Row</th>
                                <th className="text-left p-2 text-gray-300">Customer Name</th>
                                <th className="text-left p-2 text-gray-300">Address</th>
                                <th className="text-left p-2 text-gray-300">GST Number</th>
                                <th className="text-left p-2 text-gray-300">Contact Person</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.slice(0, 10).map((row, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                  <td className="p-2 text-gray-400">{row.rowNumber}</td>
                                  <td className="p-2 text-white">{row.customerName}</td>
                                  <td className="p-2 text-white">{row.address}</td>
                                  <td className="p-2 text-yellow-300">{row.gstNumber}</td>
                                  <td className="p-2 text-gray-300">{row.contactPerson}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {importData.length > 10 && (
                          <div className="p-2 text-center text-gray-400 text-xs">
                            ... and {importData.length - 10} more customers
                          </div>
                        )}
                      </div>

                      {/* Import Button */}
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowImportModal(false)}
                          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={processImport}
                          disabled={importErrors.length > 0 || importData.length === 0}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                        >
                          Import {importData.length} Customers
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Import Successful!</h4>
                  <p className="text-gray-300">
                    {importData.length} customers have been imported successfully.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}