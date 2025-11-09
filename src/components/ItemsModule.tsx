// ItemsModule.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  // Settings,
  // BarChart3,
  Import
} from 'lucide-react';
import { database } from '../data/database';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  name: string;
  email: string;
  role: number;
  roleName: string;
  roleLevel: number;
}

interface ItemsModuleProps {
  user: User;
}

interface Item {
  ItemID: number;
  ItemName: string;
  Alias: string;
  PartNumber: string;
  Description: string;
  Category: string;
  UOM: string;
  HSNCode: string;
  StockQuantity: number;
  UnitPrice: number; // stored in INR
  TotalValue: number; // stored in INR
  IsActive: boolean;
  CreatedDate: string;
  Currency?: string; // optional: original currency tag if provided
}

export function ItemsModule({ user }: ItemsModuleProps) {
  const { token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDescription, setSelectedDescription] = useState(null);

  // Exchange rates state (we will store rates as: 1 INR -> X currency)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  // Supported currencies for the selector/import
  const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP'];

  // Dispatch custom event when data is updated
  const dispatchDataUpdate = () => {
    window.dispatchEvent(new CustomEvent('dataUpdated'));
  };

  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  // New fields for currency handling in add form
  const [newItem, setNewItem] = useState({
    ItemName: '',
    Alias: '',
    PartNumber: '',
    description: '',
    category: 'General',
    uom: 'nos',
    hsnCode: '',
    stockQuantity: 0,
    unitPrice: 0,
    currency: 'INR' // default
  });

  // Units list
  const uomOptions = [
    'Bag', 'Bottle', 'Box', 'Ea', 'Ft', 'kg', 'grm',
    'Kms', 'Ltr.', 'Mtr.', 'Pairs', 'Pcs', 'Pkt', 'Roll', 'Set',
    'Nos', 'Tube', 'Unit'
  ];

  // categories derived from items
  const categories = ['All', ...new Set(items.map(item => item.Category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.ItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.PartNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Alias.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.Category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(item => item.StockQuantity <= 10); // Default reorder level

  // -----------------------
  // Exchange rate fetching
  // -----------------------
  // User gave API key: 0c9961d1750fbeccf7486634
  // We will attempt to use apilayer exchangerates_data (requires API key), fallback to exchangerate.host if failure.
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // apilayer endpoint example:
        // https://api.apilayer.com/exchangerates_data/latest?base=INR&symbols=USD,EUR,GBP
        const symbols = supportedCurrencies.filter(c => c !== 'INR').join(',');
        const apilayerKey = '0c9961d1750fbeccf7486634'; // provided by user
        const apilayerUrl = `https://api.apilayer.com/exchangerates_data/latest?base=INR&symbols=${symbols}`;

        const resp = await fetch(apilayerUrl, {
          headers: {
            apikey: apilayerKey
          }
        });

        if (resp.ok) {
          const data = await resp.json();
          // data.rates are relative to base INR: e.g. { USD: 0.012 }
          setExchangeRates({ ...data.rates, INR: 1 });
          return;
        } else {
          console.warn('apilayer fetch failed, status', resp.status);
        }
      } catch (err) {
        console.warn('apilayer fetch error', err);
      }

      // fallback to exchangerate.host
      try {
        const symbols = supportedCurrencies.filter(c => c !== 'INR').join(',');
        const fallback = await fetch(`https://api.exchangerate.host/latest?base=INR&symbols=${symbols}`);
        if (fallback.ok) {
          const data = await fallback.json();
          setExchangeRates({ ...data.rates, INR: 1 });
          return;
        }
      } catch (err) {
        console.error('Fallback exchange rate fetch failed', err);
      }
      // If both fail, keep empty rates. Conversion will fallback later.
    };

    fetchRates();
    // refresh rates every 30 minutes
    const id = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // helper: convert amount in given currency -> INR using exchangeRates (where rates are 1 INR -> X currency)
  // We stored state as rates[c] = (1 INR in currency c) e.g. rates['USD'] = 0.012 meaning 1 INR = 0.012 USD.
  // To convert price_in_currency -> INR: price_currency * (1 / rates[currency])
  const convertToINR = (amount: number, currency: string) => {
    if (!amount || isNaN(amount)) return 0;
    const c = (currency || 'INR').toUpperCase();
    if (c === 'INR') return amount;
    const rate = exchangeRates[c];
    if (!rate || rate === 0) {
      // fallback: if missing rate, we don't convert (store as-is) but log warning
      console.warn('Missing exchange rate for', c, '— storing unit price as provided (not converted)');
      return amount;
    }
    const inr = amount * (1 / rate);
    return inr;
  };

  // -----------------------
  // Load items from backend
  // -----------------------
  useEffect(() => {
    loadItemsFromDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadItemsFromDatabase = async () => {
    try {
      console.log('Loading items from database...');
      const response = await fetch('/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded items from API:', data.length, 'items');
        // ensure numbers are numbers
        const normalized = data.map((it: any) => ({
          ...it,
          UnitPrice: Number(it.UnitPrice) || 0,
          TotalValue: Number(it.TotalValue) || 0,
          StockQuantity: Number(it.StockQuantity) || 0
        }));
        setItems(normalized);
      } else {
        console.error('Failed to load items from API, status:', response.status);
        // fallback to empty local array
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    }
    dispatchDataUpdate();
  };

  // -----------------------
  // Excel upload & parse
  // -----------------------
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
              rowNumber: index + 2, // Excel row number (starting from 2)
              recordNumber: row[0],
              itemName: row[headers.indexOf('Item Name')] || '',
              alias: row[headers.indexOf('Alias')] || '',
              partNumber: row[headers.indexOf('Part Number')] || '',
              description: row[headers.indexOf('Description')] || '',
              category: row[headers.indexOf('Category')] || 'General',
              uom: row[headers.indexOf('UOM')] || 'nos',
              hsnCode: row[headers.indexOf('HSN Code')] || '',
              stockQuantity: row[headers.indexOf('Stock Quantity')] || 0,
              unitPrice: row[headers.indexOf('Unit Price')] || 0,
              currency: row[headers.indexOf('Currency')] || 'INR' // optional Currency column
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
    const partNumbers = new Set();

    data.forEach((row) => {
      const rowNum = row.rowNumber;

      // Item name
      if (!row.itemName || row.itemName.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Item name is mandatory`);
      }

      // Part number
      if (!row.partNumber || row.partNumber.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Part number is mandatory`);
      } else {
        const partNum = row.partNumber.toString().trim();
        if (partNumbers.has(partNum.toLowerCase())) {
          errors.push(`Row ${rowNum}: Duplicate part number "${partNum}" found in import data`);
        } else {
          partNumbers.add(partNum.toLowerCase());
        }
      }

      // stock quantity
      if (row.stockQuantity === '' || row.stockQuantity === null || row.stockQuantity === undefined) {
        errors.push(`Row ${rowNum}: Stock quantity is mandatory`);
      } else {
        const qty = parseFloat(row.stockQuantity);
        if (isNaN(qty) || qty < 0) {
          errors.push(`Row ${rowNum}: Stock quantity must be a valid positive number`);
        }
      }

      // uom
      if (row.uom && !uomOptions.includes(row.uom)) {
        errors.push(`Row ${rowNum}: Invalid UOM "${row.uom}". Valid options: ${uomOptions.join(', ')}`);
      }

      // currency
      if (row.currency && !supportedCurrencies.includes(String(row.currency).toUpperCase())) {
        errors.push(`Row ${rowNum}: Unsupported currency "${row.currency}". Supported: ${supportedCurrencies.join(', ')}`);
      }
    });

    setImportErrors(errors);
  };

  // -----------------------
  // Add single item handler (with duplicate check and currency conversion)
  // -----------------------
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addItemToDatabase(newItem);
  };

  const addItemToDatabase = async (itemData: any) => {
    try {
      console.log('Sending item data to API:', itemData);

      const incomingName = (itemData.ItemName || '').toString().trim();
      const incomingPart = (itemData.PartNumber || '').toString().trim();
      const incomingCurrency = (itemData.currency || 'INR').toString().toUpperCase();
      const incomingUnitPriceRaw = parseFloat(itemData.unitPrice) || 0;
      const convertedUnitPriceINR = convertToINR(incomingUnitPriceRaw, incomingCurrency);

      // Find existing item in local state (by ItemName + PartNumber)
      const existing = items.find(it =>
        (it.ItemName || '').toString().trim().toLowerCase() === incomingName.toLowerCase() &&
        (it.PartNumber || '').toString().trim().toLowerCase() === incomingPart.toLowerCase()
      );

      if (existing) {
        // Update existing item: increase StockQuantity and recompute TotalValue
        const newStock = (existing.StockQuantity || 0) + (parseInt(itemData.stockQuantity) || 0);
        const updatedItem = {
          ...existing,
          StockQuantity: newStock,
          // keep existing UnitPrice (INR) - or if it's zero, use converted unit price
          UnitPrice: existing.UnitPrice || convertedUnitPriceINR,
          TotalValue: newStock * (existing.UnitPrice || convertedUnitPriceINR || 0)
        };

        console.log('Existing item found — updating stock instead of creating new:', existing.ItemID);

        const response = await fetch(`/api/items/${existing.ItemID}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedItem),
        });

        if (response.ok) {
          await loadItemsFromDatabase();
          localStorage.setItem('scm_items', JSON.stringify(items));
          dispatchDataUpdate();
          setShowAddForm(false);
          setNewItem({
            ItemName: '',
            Alias: '',
            PartNumber: '',
            description: '',
            category: 'General',
            uom: 'nos',
            hsnCode: '',
            stockQuantity: 0,
            unitPrice: 0,
            currency: 'INR'
          });
          console.log('Existing item stock updated successfully');
        } else {
          const errorData = await response.json();
          console.error('API error while updating existing item:', errorData);
          throw new Error('Failed to update existing item');
        }
      } else {
        // Create new item. Store UnitPrice and TotalValue in INR, but save original Currency too.
        const newItemData = {
          ItemName: itemData.ItemName,
          Alias: itemData.Alias,
          PartNumber: itemData.PartNumber,
          Description: itemData.description,
          Category: itemData.category,
          UOM: itemData.uom,
          HSNCode: itemData.hsnCode,
          StockQuantity: itemData.stockQuantity,
          UnitPrice: convertedUnitPriceINR,
          TotalValue: (itemData.stockQuantity || 0) * convertedUnitPriceINR,
          IsActive: true,
          Currency: incomingCurrency
        };

        const response = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newItemData),
        });

        console.log('API response status:', response.status);

        if (response.ok) {
          const created = await response.json();
          console.log('Item created successfully:', created);
          // Reload items from database to get updated list
          await loadItemsFromDatabase();

          // Update localStorage and dispatch event
          localStorage.setItem('scm_items', JSON.stringify(items));
          dispatchDataUpdate();
          // Reset form and close modal
          setNewItem({
            ItemName: '',
            Alias: '',
            PartNumber: '',
            description: '',
            category: 'General',
            uom: 'nos',
            hsnCode: '',
            stockQuantity: 0,
            unitPrice: 0,
            currency: 'INR'
          });
          setShowAddForm(false);

          // Show success message
          console.log('Item added successfully to database');
        } else {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error('Failed to add item');
        }
      }
    } catch (error: any) {
      console.error('Error adding/updating item:', error);
      console.log('Error details:', error?.message || error);
    }
  };

  // -----------------------
  // Edit / Update / Delete
  // -----------------------
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setShowEditForm(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updatedItem = {
        ...editingItem,
        TotalValue: editingItem.StockQuantity * editingItem.UnitPrice
      };

      const response = await fetch(`/api/items/${editingItem.ItemID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedItem),
      });

      if (response.ok) {
        await loadItemsFromDatabase();
        localStorage.setItem('scm_items', JSON.stringify(items));
        dispatchDataUpdate();
        setShowEditForm(false);
        setEditingItem(null);
      } else {
        const err = await response.json();
        console.error('Error updating item (server):', err);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = (item: Item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/items/${itemToDelete.ItemID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        await loadItemsFromDatabase();
        localStorage.setItem('scm_items', JSON.stringify(items));
        dispatchDataUpdate();
        setShowDeleteConfirm(false);
        setItemToDelete(null);
      } else {
        console.error('Delete failed with status', response.status);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // -----------------------
  // Import processing
  // -----------------------
  const processImport = () => {
    if (importErrors.length === 0 && importData.length > 0) {
      importItemsToDatabase();
    }
  };

  const importItemsToDatabase = async () => {
    try {
      const itemsToCreate: any[] = [];
      const updates: { id: number; payload: any }[] = [];

      const existingLookup = new Map<string, Item>();
      items.forEach(it => {
        const key = `${(it.ItemName || '').toString().trim().toLowerCase()}||${(it.PartNumber || '').toString().trim().toLowerCase()}`;
        existingLookup.set(key, it);
      });

      importData.forEach((row) => {
        const key = `${(row.itemName || '').toString().trim().toLowerCase()}||${(row.partNumber || '').toString().trim().toLowerCase()}`;
        const existing = existingLookup.get(key);

        const rowCurrency = (row.currency || 'INR').toString().toUpperCase();
        const rowUnitPriceRaw = parseFloat(row.unitPrice) || 0;
        const convertedUnitPrice = convertToINR(rowUnitPriceRaw, rowCurrency);
        const rowQty = parseInt(row.stockQuantity) || 0;

        if (existing) {
          // update
          const newStock = (existing.StockQuantity || 0) + rowQty;
          const updatedPayload = {
            ...existing,
            StockQuantity: newStock,
            TotalValue: newStock * (existing.UnitPrice || convertedUnitPrice || 0)
          };
          updates.push({ id: existing.ItemID, payload: updatedPayload });
        } else {
          // create new
          itemsToCreate.push({
            ItemName: row.itemName,
            Alias: row.alias || '',
            PartNumber: row.partNumber,
            Description: row.description || '',
            Category: row.category || 'General',
            UOM: row.uom || 'nos',
            HSNCode: row.hsnCode || '',
            StockQuantity: rowQty,
            UnitPrice: convertedUnitPrice,
            TotalValue: rowQty * convertedUnitPrice,
            IsActive: true,
            Currency: rowCurrency
          });
        }
      });

      // Perform updates first
      for (const upd of updates) {
        try {
          const resp = await fetch(`/api/items/${upd.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(upd.payload)
          });
          if (!resp.ok) {
            console.warn(`Failed to update item ${upd.id} during import — status:`, resp.status);
          }
        } catch (e) {
          console.error(`Error updating item ${upd.id} during import:`, e);
        }
      }

      // Bulk create
      if (itemsToCreate.length > 0) {
        const response = await fetch('/api/items/bulk', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: itemsToCreate }),
        });

        if (!response.ok) {
          console.error('Bulk create failed, attempting individual creates. Status:', response.status);
          for (const ni of itemsToCreate) {
            try {
              const r = await fetch('/api/items', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(ni),
              });
              if (!r.ok) {
                console.warn('Failed to create item during import:', ni, 'status:', r.status);
              }
            } catch (err) {
              console.error('Error creating item during import:', err);
            }
          }
        }
      }

      // Reload
      await loadItemsFromDatabase();
      localStorage.setItem('scm_items', JSON.stringify(items));
      dispatchDataUpdate();
      setImportSuccess(true);
      setTimeout(() => {
        setShowImportModal(false);
        setImportFile(null);
        setImportData([]);
        setImportErrors([]);
        setImportSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error importing items:', error);
      alert('Error importing items. Please try again.');
    }
  };

  // -----------------------
  // JSX — UI (merged full UI)
  // -----------------------
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
                <p className="text-red-300">Inventory and stock management system</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Import className="w-5 h-5" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Items</p>
                <p className="text-white text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Low Stock Items</p>
                <p className="text-white text-2xl font-bold">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Value</p>
                <p className="text-white text-2xl font-bold">
                  ₹{items.reduce((sum, item) => sum + (item.UnitPrice * item.StockQuantity), 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Categories</p>
                <p className="text-white text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Filter className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 mb-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="text-yellow-300 font-semibold">Low Stock Alert</h3>
                <p className="text-yellow-200 text-sm">
                  {lowStockItems.length} items are running low on stock and need reordering.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Item Name</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Alias</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Part No.</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Description</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Category</th>
                  <th className="text-left p-4 text-gray-300 font-medium">UOM</th>
                  <th className="text-left p-4 text-gray-300 font-medium">HSN</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Quantity</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Price (INR)</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Value (INR)</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.ItemID} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4">
                      <span className="text-white font-medium">{item.ItemName}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{item.Alias}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-blue-300 font-mono">{item.PartNumber}</span>
                    </td>
                   

                    <td className="p-4">
                <span className="text-gray-400 text-sm">
                  {item.Description.length > 5
                    ? `${item.Description.slice(0, 5)}...`
                    : item.Description}

                  {item.Description.length > 5 && (
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="ml-1 text-blue-400 hover:underline text-xs"
                    >
                      More
                    </button>
                  )}
                </span>
              </td>

              {/* Modal */}
      {selectedDescription && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 relative">
            <button
              onClick={() => setSelectedDescription(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-700 text-sm">{selectedDescription}</p>
          </div>
        </div>
      )}



                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                        {item.Category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{item.UOM}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-yellow-300 font-mono">{item.HSNCode}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium text-white`}>
                          {item.StockQuantity}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-green-300 font-medium">₹{(item.UnitPrice || 0).toFixed(2)}</span>
                      {item.Currency && item.Currency !== 'INR' && (
                        <div className="text-xs text-gray-400">({item.Currency} converted)</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-blue-300 font-medium">₹{(item.TotalValue || 0).toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.IsActive
                          ? 'bg-green-600/20 text-green-300'
                          : 'bg-red-600/20 text-red-300'
                      }`}>
                        {item.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.roleLevel <= 3 && (
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-600/20 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {user.roleLevel <= 2 && (
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors"
                          >
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

        {/* Item Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Item Name</label>
                    <p className="text-white font-bold">{selectedItem.ItemName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Alias</label>
                    <p className="text-white">{selectedItem.Alias}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Part Number</label>
                    <p className="text-blue-300 font-mono">{selectedItem.PartNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <p className="text-gray-300">{selectedItem.Description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <p className="text-white">{selectedItem.Category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">UOM</label>
                    <p className="text-white">{selectedItem.UOM}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">HSN Code</label>
                    <p className="text-yellow-300 font-mono">{selectedItem.HSNCode}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Unit Price (INR)</label>
                    <p className="text-green-300 text-xl font-bold">₹{selectedItem.UnitPrice.toFixed(2)}</p>
                    {selectedItem.Currency && selectedItem.Currency !== 'INR' && (
                      <p className="text-gray-400 text-sm">Original currency: {selectedItem.Currency}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock Quantity</label>
                    <p className="text-xl font-bold text-white">
                      {selectedItem.StockQuantity}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Total Value (INR)</label>
                    <p className="text-blue-300 text-xl font-bold">
                      ₹{selectedItem.TotalValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add New Item</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={newItem.ItemName}
                      onChange={(e) => setNewItem({ ...newItem, ItemName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Alias</label>
                    <input
                      type="text"
                      value={newItem.Alias}
                      onChange={(e) => setNewItem({ ...newItem, Alias: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Part Number *</label>
                    <input
                      type="text"
                      value={newItem.PartNumber}
                      onChange={(e) => setNewItem({ ...newItem, PartNumber: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={newItem.hsnCode}
                      onChange={(e) => setNewItem({ ...newItem, hsnCode: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Amplifier">Amplifier</option>
                      <option value="Battery">Battery</option>
                      <option value="Cable">Cable</option>
                      <option value="Chamber">Chamber</option>
                      <option value="Connector">Connerctor</option>
                      <option value="Consumables">Consumables</option>
                      <option value="CPR">CPR</option>
                      <option value="Current Assets">Current Assets</option>
                      <option value="Customer Property">Customer Property</option>
                      <option value="Dataloggers & Readouts">Dataloggers & Readouts</option>
                      <option value="Hardware Accessories">Hardware Accessories</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Load Cell">Load Cell</option>
                      <option value="Machinery">Machinery</option>
                      <option value="Marketing & Promotion Items">Marketing & Promotion Items</option>
                      <option value="Microchip">Microchip</option>
                      <option value="Mobile Phone">Mobile Phone</option>
                      <option value="MPBX">MPBX</option>
                      <option value="Others">Others</option>
                      <option value="Packing Materials">Packing Materials</option>
                      <option value="production">Production</option>
                      <option value="Resistiors">Resistiors</option>
                      <option value="Roorkee Office Assets">Roorkee Office Assets</option>
                      <option value="Sensors">Sensors</option>
                      <option value="Services">Services</option>
                      <option value="stationary items">Stationary Items</option>
                      <option value="Stock">Stock</option>
                      <option value="strain gauge accessories">Strain Gauge Accessories</option>
                      <option value="Strain Gauge">Strain Gauge</option>
                      <option value="Transducers">Transducers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Unit of Measurement</label>
                    <select
                      value={newItem.uom}
                      onChange={(e) => setNewItem({ ...newItem, uom: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {uomOptions.map(uom => (
                        <option key={uom} value={uom}>{uom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={newItem.stockQuantity}
                      onChange={(e) => setNewItem({ ...newItem, stockQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Currency selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
                    <select
                      value={newItem.currency}
                      onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {supportedCurrencies.map(c => (
                        <option key={c} value={c}>{c}{c === 'INR' ? ' ₹' : c === 'USD' ? ' $' : c === 'EUR' ? ' €' : c === 'GBP' ? ' £' : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Price will be converted to INR using live rates.</p>
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
                    Add Item
                  </button>
                </div>
              </form>
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
                  Import Inventory from Excel
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
                      Row 1 should contain headers, data starts from Row 2. Optional header: "Currency" for per-row currency.
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
                      <li>• <strong>Item Name:</strong> Mandatory item name</li>
                      <li>• <strong>Alias:</strong> Optional item alias</li>
                      <li>• <strong>Part Number:</strong> Mandatory</li>
                      <li>• <strong>Description:</strong> Optional item description</li>
                      <li>• <strong>Category:</strong> Optional item category</li>
                      <li>• <strong>UOM:</strong> Unit of Measurement ({uomOptions.slice(0, 10).join(', ')}, etc.)</li>
                      <li>• <strong>HSN Code:</strong> Optional HSN code</li>
                      <li>• <strong>Stock Quantity:</strong> Mandatory, must be a number</li>
                      <li>• <strong>Unit Price:</strong> Optional price per unit</li>
                      <li>• <strong>Currency:</strong> Optional - one of {supportedCurrencies.join(', ')} (default INR)</li>
                    </ul>
                  </div>

                  {/* Validation Results & Preview */}
                  {importData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">
                          Import Preview ({importData.length} items)
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
                                <th className="text-left p-2 text-gray-300">Item Name</th>
                                <th className="text-left p-2 text-gray-300">Part Number</th>
                                <th className="text-left p-2 text-gray-300">Stock Qty</th>
                                <th className="text-left p-2 text-gray-300">UOM</th>
                                <th className="text-left p-2 text-gray-300">HSN Code</th>
                                <th className="text-left p-2 text-gray-300">Currency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.slice(0, 10).map((row, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                  <td className="p-2 text-gray-400">{row.rowNumber}</td>
                                  <td className="p-2 text-white">{row.itemName}</td>
                                  <td className="p-2 text-white">{row.partNumber}</td>
                                  <td className="p-2 text-white">{row.stockQuantity}</td>
                                  <td className="p-2 text-white">{row.uom}</td>
                                  <td className="p-2 text-yellow-300">{row.hsnCode}</td>
                                  <td className="p-2 text-gray-300">{(row.currency || 'INR').toUpperCase()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {importData.length > 10 && (
                          <div className="p-2 text-center text-gray-400 text-xs">
                            ... and {importData.length - 10} more items
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
                          Import {importData.length} Items
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
                    {importData.length} items have been imported successfully.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditForm && editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Item</h3>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={editingItem.ItemName}
                      onChange={(e) => setEditingItem({ ...editingItem, ItemName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Alias</label>
                    <input
                      type="text"
                      value={editingItem.Alias}
                      onChange={(e) => setEditingItem({ ...editingItem, Alias: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Part Number *</label>
                    <input
                      type="text"
                      value={editingItem.PartNumber}
                      onChange={(e) => setEditingItem({ ...editingItem, PartNumber: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={editingItem.HSNCode}
                      onChange={(e) => setEditingItem({ ...editingItem, HSNCode: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                      value={editingItem.Description}
                      onChange={(e) => setEditingItem({ ...editingItem, Description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select
                      value={editingItem.Category}
                      onChange={(e) => setEditingItem({ ...editingItem, Category: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="General">General</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Tools">Tools</option>
                      <option value="Consumables">Consumables</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Unit of Measurement</label>
                    <select
                      value={editingItem.UOM}
                      onChange={(e) => setEditingItem({ ...editingItem, UOM: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {uomOptions.map(uom => (
                        <option key={uom} value={uom}>{uom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={editingItem.StockQuantity}
                      onChange={(e) => setEditingItem({ ...editingItem, StockQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Unit Price (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.UnitPrice}
                      onChange={(e) => setEditingItem({ ...editingItem, UnitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Stored in INR. Original currency: {editingItem.Currency || 'INR'}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    Update Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && itemToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-white font-semibold">{itemToDelete.ItemName}</p>
                  <p className="text-blue-300 font-mono text-sm">{itemToDelete.PartNumber}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteItem}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ItemsModule;
