import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  Eye,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Download,
  Send,
  Copy,
  Package
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

interface QuoteItem {
  ItemID: number;
  PartNumber: string;
  Description: string;
  Quantity: number;
  UOM: string;
  UnitPrice: number;
  TotalPrice: number;
}

interface Quote {
  QuoteID: number;
  QuoteNumber: string;
  CustomerName: string;
  CustomerAddress: string;
  ContactPerson: string;
  Email: string;
  Phone: string;
  GSTNumber?: string;
  MSMENumber?: string;
  ShipToName?: string;
  ShipToAddress?: string;
  ShipToPhone?: string;
  SalesManagerName?: string;
  SalesManagerPhone?: string;
  SalesManagerEmail?: string;
  QuoteDate: string;
  ValidUntil: string;
  Status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  TotalAmount: number;
  Currency: string;
  Items: QuoteItem[];
  TermsAndConditions: string;
  CreatedBy: string;
  CreatedDate: string;
  ConvertedToOrder: boolean;
}

interface QuoteModuleProps {
  user: User;
}

export function QuoteModule({ user }: QuoteModuleProps) {
  const [quotes, setQuotes] = useState<Quote[]>([
    {
      QuoteID: 1,
      QuoteNumber: 'QT-2025-001',
      CustomerName: 'ABC Manufacturing Ltd',
      CustomerAddress: '456 Business Blvd, Commerce City, CC 67890',
      ContactPerson: 'Sarah Johnson',
      Email: 'sarah@abcmfg.com',
      Phone: '+1-555-0456',
      GSTNumber: '29AAAPL1234C1ZV',
      MSMENumber: 'MSME12345',
      ShipToName: 'ABC Manufacturing - Plant 1',
      ShipToAddress: 'Plant 1, 456 Business Blvd, Commerce City',
      ShipToPhone: '+1-555-0456',
      SalesManagerName: 'Ravi Kumar',
      SalesManagerPhone: '+91-9000000000',
      SalesManagerEmail: 'ravi@recordtek.com',
      QuoteDate: '2025-01-15',
      ValidUntil: '2025-02-15',
      Status: 'Sent',
      TotalAmount: 125000,
      Currency: 'INR',
      Items: [
        {
          ItemID: 1,
          PartNumber: 'ITM001',
          Description: 'Steel Rod 10mm',
          Quantity: 100,
          UOM: 'nos',
          UnitPrice: 1250,
          TotalPrice: 125000
        }
      ],
      TermsAndConditions:
        'Payment: 30 days from invoice date\nDelivery: 15-20 working days\nPrices are subject to change without notice',
      CreatedBy: 'Admin',
      CreatedDate: '2025-01-15',
      ConvertedToOrder: false
    },
    {
      QuoteID: 2,
      QuoteNumber: 'QT-2025-002',
      CustomerName: 'XYZ Industries Pvt Ltd',
      CustomerAddress: '789 Industrial Ave, Manufacturing Zone, MZ 12345',
      ContactPerson: 'Michael Chen',
      Email: 'michael@xyzind.com',
      Phone: '+1-555-0789',
      GSTNumber: '',
      MSMENumber: '',
      ShipToName: '',
      ShipToAddress: '',
      ShipToPhone: '',
      SalesManagerName: '',
      SalesManagerPhone: '',
      SalesManagerEmail: '',
      QuoteDate: '2025-01-20',
      ValidUntil: '2025-02-20',
      Status: 'Draft',
      TotalAmount: 75000,
      Currency: 'INR',
      Items: [
        {
          ItemID: 2,
          PartNumber: 'ITM002',
          Description: 'Aluminum Sheet 2mm',
          Quantity: 50,
          UOM: 'pcs',
          UnitPrice: 1500,
          TotalPrice: 75000
        }
      ],
      TermsAndConditions:
        'Payment: 30 days from invoice date\nDelivery: 15-20 working days\nPrices are subject to change without notice',
      CreatedBy: 'Manager',
      CreatedDate: '2025-01-20',
      ConvertedToOrder: false
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const [newQuote, setNewQuote] = useState({
    customerName: '',
    customerAddress: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstNumber: '',
    msmeNumber: '',
    shipToName: '',
    shipToAddress: '',
    shipToPhone: '',
    salesManagerName: '',
    salesManagerPhone: '',
    salesManagerEmail: '',
    validityDays: 30,
    items: [] as QuoteItem[],
    termsAndConditions:
      'Payment: 30 days from invoice date\nDelivery: 15-20 working days\nPrices are subject to change without notice\nGoods once sold will not be taken back\nDispute if any subject to Bangalore jurisdiction only'
  });

  const [showItemSelector, setShowItemSelector] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Fetch customers from the API
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch items from the API
  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const items = await response.json();
        setAvailableItems(
          items.map((item: any) => ({
            ItemID: item.ItemID,
            ItemCode: item.PartNumber,
            ItemName: item.ItemName,
            UnitPrice: item.UnitPriceINR || item.UnitPrice,
            UOM: item.UOM
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Load items when item selector is opened
  useEffect(() => {
    if (showItemSelector && availableItems.length === 0) {
      fetchItems();
    }
  }, [showItemSelector]);

  // Filter items based on search query
  const filteredAvailableItems = availableItems.filter((item) => {
    if (!itemSearchQuery) return true;
    const query = itemSearchQuery.toLowerCase();
    return (
      item.ItemName?.toLowerCase().includes(query) ||
      item.ItemCode?.toLowerCase().includes(query) ||
      (item.PartNumber && item.PartNumber?.toLowerCase().includes(query))
    );
  });

  // Close customer suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-autocomplete')) {
        setShowCustomerSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle customer name input change
  const handleCustomerNameChange = (value: string) => {
    setNewQuote({ ...newQuote, customerName: value });

    if (value.length > 0) {
      const filtered = customers.filter(
        (customer) =>
          (customer.customer_name && customer.customer_name.toLowerCase().includes(value.toLowerCase())) ||
          (customer.CustomerName && customer.CustomerName.toLowerCase().includes(value.toLowerCase()))
      );
      setCustomerSuggestions(filtered);
      setShowCustomerSuggestions(filtered.length > 0);
    } else {
      setShowCustomerSuggestions(false);
    }
  };

  // Select a customer from suggestions
  const selectCustomer = (customer: any) => {
    setNewQuote({
      ...newQuote,
      customerName: customer.customer_name || customer.CustomerName || '',
      customerAddress: customer.address || customer.Address || '',
      contactPerson: customer.contact_person || customer.ContactPerson || '',
      email: customer.email || customer.Email || '',
      phone: customer.phone || customer.Phone || '',
      gstNumber: customer.gst_number || customer.GSTNumber || '',
      msmeNumber: customer.msme_number || customer.MSMENumber || '',
      shipToName: customer.ship_to_name || customer.ShipToName || '',
      shipToAddress: customer.ship_to_address || customer.ShipToAddress || '',
      shipToPhone: customer.ship_to_phone || customer.ShipToPhone || '',
      salesManagerName: customer.sales_manager_name || customer.SalesManagerName || '',
      salesManagerPhone: customer.sales_manager_phone || customer.SalesManagerPhone || '',
      salesManagerEmail: customer.sales_manager_email || customer.SalesManagerEmail || ''
    });
    setShowCustomerSuggestions(false);
  };

  // Filter quotes - exclude converted ones
  const activeQuotes = quotes.filter((quote) => !quote.ConvertedToOrder);

  const filteredQuotes = activeQuotes.filter((quote) => {
    const matchesSearch =
      quote.QuoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.CustomerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.ContactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || quote.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get last 20 quotes
  const recentQuotes = filteredQuotes.slice(0, 20);

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
            const headers = (jsonData[0] as string[]).map((h) => (h || '').toString().trim());
            const rows = jsonData.slice(1) as any[][];

            const processedData = rows.map((row, index) => {
              const get = (colName: string) => {
                const idx = headers.indexOf(colName);
                return idx >= 0 ? row[idx] : '';
              };
              return {
                rowNumber: index + 2,
                recordNumber: row[0],
                customerName: get('Customer Name') || get('Customer') || '',
                contactPerson: get('Contact Person') || '',
                email: get('Email') || '',
                phone: get('Phone') || '',
                partNumber: get('Part Number') || get('Part No') || '',
                description: get('Description') || '',
                quantity: get('Quantity') || get('Qty') || '',
                uom: get('UOM') || '',
                unitPrice: get('Unit Price') || get('Price') || 0,
                validityDays: get('Validity Days') || 30,
                gstNumber: get('GST No') || get('GSTNumber') || '',
                msmeNumber: get('MSME') || get('MSME No') || '',
                shipToName: get('Ship To Name') || '',
                shipToAddress: get('Ship To Address') || '',
                shipToPhone: get('Ship To Phone') || '',
                salesManagerName: get('Sales Manager Name') || '',
                salesManagerPhone: get('Sales Manager Phone') || '',
                salesManagerEmail: get('Sales Manager Email') || ''
              };
            });

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

    data.forEach((row) => {
      const rowNum = row.rowNumber;

      // Check mandatory Customer Name
      if (!row.customerName || row.customerName.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Customer name is mandatory`);
      }

      // Check mandatory Part Number
      if (!row.partNumber || row.partNumber.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Part number is mandatory`);
      }

      // Check mandatory Quantity
      if (!row.quantity || row.quantity === '') {
        errors.push(`Row ${rowNum}: Quantity is mandatory`);
      } else {
        const qty = parseFloat(row.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push(`Row ${rowNum}: Quantity must be a valid positive number`);
        }
      }

      // Check Unit Price
      if (row.unitPrice && isNaN(parseFloat(row.unitPrice))) {
        errors.push(`Row ${rowNum}: Unit price must be a valid number`);
      }
    });

    setImportErrors(errors);
  };

  const processImport = () => {
    if (importErrors.length === 0 && importData.length > 0) {
      const newQuotes = importData.map((row, index) => {
        const quoteNumber = `QT-2025-${String(quotes.length + index + 1).padStart(3, '0')}`;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (parseInt(row.validityDays) || 30));

        const unitPrice = parseFloat(row.unitPrice) || 0;
        const quantity = parseFloat(row.quantity) || 0;
        const totalAmount = unitPrice * quantity;

        return {
          QuoteID: quotes.length + index + 1,
          QuoteNumber: quoteNumber,
          CustomerName: row.customerName,
          CustomerAddress: '',
          ContactPerson: row.contactPerson || '',
          Email: row.email || '',
          Phone: row.phone || '',
          GSTNumber: row.gstNumber || '',
          MSMENumber: row.msmeNumber || '',
          ShipToName: row.shipToName || '',
          ShipToAddress: row.shipToAddress || '',
          ShipToPhone: row.shipToPhone || '',
          SalesManagerName: row.salesManagerName || '',
          SalesManagerPhone: row.salesManagerPhone || '',
          SalesManagerEmail: row.salesManagerEmail || '',
          QuoteDate: new Date().toISOString().split('T')[0],
          ValidUntil: validUntil.toISOString().split('T')[0],
          Status: 'Draft' as const,
          TotalAmount: totalAmount,
          Currency: 'INR',
          Items: [
            {
              ItemID: 1,
              PartNumber: row.partNumber,
              Description: row.description || row.partNumber,
              Quantity: quantity,
              UOM: row.uom || 'nos',
              UnitPrice: unitPrice,
              TotalPrice: totalAmount
            }
          ],
          TermsAndConditions:
            'Payment: 30 days from invoice date\nDelivery: 15-20 working days\nPrices are subject to change without notice',
          CreatedBy: user.name,
          CreatedDate: new Date().toISOString().split('T')[0],
          ConvertedToOrder: false
        } as Quote;
      });

      setQuotes([...quotes, ...newQuotes]);
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

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();

    if (newQuote.items.length === 0) {
      alert('Please add at least one item to the quote');
      return;
    }

    const totalAmount = newQuote.items.reduce((sum, item) => sum + item.TotalPrice, 0);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + newQuote.validityDays);

    const quote: Quote = {
      QuoteID: quotes.length + 1,
      QuoteNumber: `QT-2025-${String(quotes.length + 1).padStart(3, '0')}`,
      CustomerName: newQuote.customerName,
      CustomerAddress: newQuote.customerAddress,
      ContactPerson: newQuote.contactPerson,
      Email: newQuote.email,
      Phone: newQuote.phone,
      GSTNumber: newQuote.gstNumber || '',
      MSMENumber: newQuote.msmeNumber || '',
      ShipToName: newQuote.shipToName || '',
      ShipToAddress: newQuote.shipToAddress || '',
      ShipToPhone: newQuote.shipToPhone || '',
      SalesManagerName: newQuote.salesManagerName || '',
      SalesManagerPhone: newQuote.salesManagerPhone || '',
      SalesManagerEmail: newQuote.salesManagerEmail || '',
      QuoteDate: new Date().toISOString().split('T')[0],
      ValidUntil: validUntil.toISOString().split('T')[0],
      Status: 'Draft',
      TotalAmount: totalAmount,
      Currency: 'INR',
      Items: newQuote.items,
      TermsAndConditions: newQuote.termsAndConditions,
      CreatedBy: user.name,
      CreatedDate: new Date().toISOString().split('T')[0],
      ConvertedToOrder: false
    };

    setQuotes([...quotes, quote]);
    setNewQuote({
      customerName: '',
      customerAddress: '',
      contactPerson: '',
      email: '',
      phone: '',
      gstNumber: '',
      msmeNumber: '',
      shipToName: '',
      shipToAddress: '',
      shipToPhone: '',
      salesManagerName: '',
      salesManagerPhone: '',
      salesManagerEmail: '',
      validityDays: 30,
      items: [],
      termsAndConditions:
        'Payment: 30 days from invoice date\nDelivery: 15-20 working days\nPrices are subject to change without notice\nGoods once sold will not be taken back\nDispute if any subject to Bangalore jurisdiction only'
    });
    setShowAddForm(false);
  };

  const addItemToQuote = (item: any, quantity: number) => {
    const totalPrice = item.UnitPrice * quantity;
    const quoteItem: QuoteItem = {
      ItemID: item.ItemID,
      PartNumber: item.ItemCode,
      Description: item.ItemName,
      Quantity: quantity,
      UOM: item.UOM,
      UnitPrice: item.UnitPrice,
      TotalPrice: totalPrice
    };

    setNewQuote((prev) => ({
      ...prev,
      items: [...prev.items, quoteItem]
    }));
    setShowItemSelector(false);
  };

  const removeItemFromQuote = (index: number) => {
    setNewQuote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setNewQuote((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, Quantity: quantity, TotalPrice: item.UnitPrice * quantity } : item
      )
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-600/20 text-gray-300';
      case 'Sent':
        return 'bg-blue-600/20 text-blue-300';
      case 'Accepted':
        return 'bg-green-600/20 text-green-300';
      case 'Rejected':
        return 'bg-red-600/20 text-red-300';
      case 'Expired':
        return 'bg-orange-600/20 text-orange-300';
      case 'Converted':
        return 'bg-purple-600/20 text-purple-300';
      default:
        return 'bg-gray-600/20 text-gray-300';
    }
  };

  const convertToOrder = (quoteId: number) => {
    setQuotes(
      quotes.map((quote) =>
        quote.QuoteID === quoteId ? { ...quote, Status: 'Converted' as const, ConvertedToOrder: true } : quote
      )
    );
  };

  const handleDeleteQuote = (quote: Quote) => {
    if (window.confirm(`Are you sure you want to delete quote ${quote.QuoteNumber}?`)) {
      setQuotes(quotes.filter((q) => q.QuoteID !== quote.QuoteID));
    }
  };

  const handleDownloadPDF = (quote: Quote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = generateQuoteHTML(quote);
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrintQuote = (quote: Quote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = generateQuoteHTML(quote);
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generateQuoteHTML = (quote: Quote) => {
    // Clean formatting helpers
    const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '-');
    const fmt = (v?: string) => (v && v !== '' ? v : '-');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Quote ${quote.QuoteNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
          .company { display:flex; align-items:center; gap:16px; }
          .company img { width:120px; height:auto; }
          .company-tag { color:#666; font-size:14px; }
          .quote-title { text-align:right; }
          .quote-title h1 { margin:0; font-size:28px; color:#111; }
          .quote-meta { text-align:right; margin-top:6px; color:#333; }
          .divider { height:4px; background:#dc2626; margin:18px 0; border-radius:2px; opacity:0.9; }
          .grid { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-bottom:18px; }
          .section-title { color:#c01616; font-weight:700; margin-bottom:8px; }
          .box { padding:8px 12px; }
          .small { color:#555; line-height:1.6; }
          .highlight { background:#fff5f5; border-left:6px solid #dc2626; padding:12px; border-radius:4px; margin-bottom:18px; }
          table { width:100%; border-collapse:collapse; margin-top:12px; }
          th { background:#dc2626; color:#fff; padding:10px; text-align:left; }
          td { padding:10px; border-bottom:1px solid #eee; vertical-align:top; }
          .total { font-weight:700; background:#f7f7f7; }
          .terms { white-space:pre-wrap; background:#fafafa; padding:12px; border-radius:4px; border-left:4px solid #eee; }
          .footer { text-align:center; color:#777; margin-top:30px; font-size:13px; }
          .status { display:inline-block; padding:6px 10px; border-radius:4px; font-weight:700; font-size:12px; }
          @media print {
            body { margin:16px; }
            .no-print { display:none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
           
            <div>
              <img src="https://www.recordtek.com/wp-content/uploads/2023/08/Logo-2.png" alt="Recordtek Logo" / style="width:30%;">
              <div class="company-tag">Supply Chain Management Solutions</div>
            </div>
          </div>
          <div class="quote-title">
            <h1>QUOTATION</h1>
            <div class="quote-meta">
              <div>Quote #: ${quote.QuoteNumber}</div>
              <div>Date: ${fmtDate(quote.QuoteDate)}</div>
              <div style="margin-top:6px;"><span class="status">${quote.Status}</span></div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="grid">
          <div>
            <div class="section-title">Bill To:</div>
            <div class="box small">
              <div style="font-weight:700;">${fmt(quote.CustomerName)}</div>
              <div>${fmt(quote.CustomerAddress)}</div>
              <div>Contact: ${fmt(quote.ContactPerson)}</div>
              <div>Email: ${fmt(quote.Email)}</div>
              <div>Phone: ${fmt(quote.Phone)}</div>
            </div>

            <div style="margin-top:12px;">
              <div class="section-title">Ship To:</div>
              <div class="box small">
                <div style="font-weight:700;">${fmt(quote.ShipToName)}</div>
                <div>${fmt(quote.ShipToAddress)}</div>
                <div>Phone: ${fmt(quote.ShipToPhone)}</div>
              </div>
            </div>
          </div>

          <div>
            <div class="section-title">Quote Details:</div>
            <div class="box small">
              <div><strong>Quote Date:</strong> ${fmtDate(quote.QuoteDate)}</div>
              <div><strong>Valid Until:</strong> ${fmtDate(quote.ValidUntil)}</div>
              <div><strong>Created By:</strong> ${fmt(quote.CreatedBy)}</div>
              <div><strong>Currency:</strong> ${fmt(quote.Currency)}</div>
            </div>

            <div style="margin-top:12px;">
              <div class="section-title">Sales Manager:</div>
              <div class="box small">
                <div><strong>Name:</strong> ${fmt(quote.SalesManagerName)}</div>
                <div><strong>Phone:</strong> ${fmt(quote.SalesManagerPhone)}</div>
                <div><strong>Email:</strong> ${fmt(quote.SalesManagerEmail)}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="highlight">
          <div style="font-weight:700; color:#b91c1c; margin-bottom:8px;">Tax & Compliance Details</div>
          <div class="small">
            <div><strong>GST Number:</strong> ${fmt(quote.GSTNumber)}</div>
            <div><strong>MSME Number:</strong> ${fmt(quote.MSMENumber)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:6%;">S.No</th>
              <th style="width:18%;">Part Number</th>
              <th style="width:40%;">Description</th>
              <th style="width:8%;">Qty</th>
              <th style="width:8%;">UOM</th>
              <th style="width:10%;">Unit Price</th>
              <th style="width:10%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quote.Items
              .map(
                (item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.PartNumber}</td>
                <td>${item.Description}</td>
                <td>${item.Quantity}</td>
                <td>${item.UOM}</td>
                <td>₹${item.UnitPrice.toLocaleString()}</td>
                <td>₹${item.TotalPrice.toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="6" style="text-align:right; padding-right:12px;">Total Amount:</td>
              <td>₹${quote.TotalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:18px;" class="terms">
          <div style="font-weight:700; margin-bottom:6px;">Terms and Conditions:</div>
          <div>${quote.TermsAndConditions.replace(/\n/g, '<br/>')}</div>
        </div>

        <div class="footer">
          <div><strong>RECORDTEK.COM</strong></div>
          <div>Supply Chain Management Solutions</div>
          <div>Email: info@recordtek.com | Phone: +91-80-12345678</div>
          <div style="margin-top:8px;">This is a computer generated quotation and does not require signature.</div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Quote Management</h1>
                <p className="text-red-300">Create and manage customer quotations</p>
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
                <span>New Quote</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Quotes</p>
                <p className="text-white text-2xl font-bold">{activeQuotes.length}</p>
              </div>
              <FileText className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Draft</p>
                <p className="text-white text-2xl font-bold">
                  {activeQuotes.filter((q) => q.Status === 'Draft').length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Sent</p>
                <p className="text-white text-2xl font-bold">
                  {activeQuotes.filter((q) => q.Status === 'Sent').length}
                </p>
              </div>
              <Send className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Accepted</p>
                <p className="text-white text-2xl font-bold">
                  {activeQuotes.filter((q) => q.Status === 'Accepted').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Total Value</p>
                <p className="text-white text-2xl font-bold">
                  ₹{activeQuotes.reduce((sum, quote) => sum + quote.TotalAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
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
                placeholder="Search quotes by number, customer, or contact person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-red-800/20 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Quote Number</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Customer</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Contact Person</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Quote Date</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Valid Until</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.map((quote) => (
                  <tr key={quote.QuoteID} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4">
                      <span className="text-blue-300 font-mono">{quote.QuoteNumber}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{quote.CustomerName}</p>
                        <p className="text-gray-400 text-sm">{quote.Email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{quote.ContactPerson}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{new Date(quote.QuoteDate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{new Date(quote.ValidUntil).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-green-300 font-medium">₹{quote.TotalAmount.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quote.Status)}`}>
                        {quote.Status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded transition-colors"
                          title="View Quote"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.roleLevel <= 3 && (
                          <button
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-600/20 rounded transition-colors"
                            title="Edit Quote"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {quote.Status === 'Accepted' && !quote.ConvertedToOrder && user.roleLevel <= 3 && (
                          <button
                            onClick={() => convertToOrder(quote.QuoteID)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded transition-colors"
                            title="Convert to Order"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPDF(quote)}
                          className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {user.roleLevel <= 2 && (
                          <button
                            onClick={() => handleDeleteQuote(quote)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors"
                            title="Delete Quote"
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

        {/* Quote Details Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Quote Details - {selectedQuote.QuoteNumber}</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownloadPDF(selectedQuote)}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handlePrintQuote(selectedQuote)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    title="Print Quote"
                  >
                    <Send className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Creative two-column layout + highlighted GST/MSME */}
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
                      alt="Recordtek Logo"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">RECORDTEK.COM</h2>
                      <p className="text-gray-600">Supply Chain Management Solutions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-gray-900">QUOTATION</h3>
                    <p className="text-gray-600">Quote #: {selectedQuote.QuoteNumber}</p>
                    <p className="text-gray-600">Date: {new Date(selectedQuote.QuoteDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Two-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Left: Bill To + Ship To */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h4>
                    <div className="space-y-1 text-gray-700 mb-4">
                      <p className="font-medium">{selectedQuote.CustomerName}</p>
                      <p>{selectedQuote.CustomerAddress}</p>
                      <p>Contact: {selectedQuote.ContactPerson}</p>
                      <p>Email: {selectedQuote.Email}</p>
                      <p>Phone: {selectedQuote.Phone}</p>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Ship To:</h4>
                    <div className="space-y-1 text-gray-700">
                      <p className="font-medium">{selectedQuote.ShipToName || 'N/A'}</p>
                      <p>{selectedQuote.ShipToAddress || 'N/A'}</p>
                      <p>Phone: {selectedQuote.ShipToPhone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Right: Quote Details + Sales Manager */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Quote Details:</h4>
                    <div className="space-y-1 text-gray-700 mb-4">
                      <p>
                        <span className="font-medium">Quote Date:</span> {new Date(selectedQuote.QuoteDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Valid Until:</span> {new Date(selectedQuote.ValidUntil).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Created By:</span> {selectedQuote.CreatedBy}
                      </p>
                      <p>
                        <span className="font-medium">Currency:</span> {selectedQuote.Currency}
                      </p>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Sales Manager:</h4>
                    <div className="space-y-1 text-gray-700">
                      <p><strong>Name:</strong> {selectedQuote.SalesManagerName || 'N/A'}</p>
                      <p><strong>Phone:</strong> {selectedQuote.SalesManagerPhone || 'N/A'}</p>
                      <p><strong>Email:</strong> {selectedQuote.SalesManagerEmail || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Highlighted GST / MSME */}
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded mb-6">
                  <div className="text-red-700 font-semibold mb-2">Tax & Compliance Details</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-800">
                    <div><strong>GST Number:</strong> {selectedQuote.GSTNumber || 'N/A'}</div>
                    <div><strong>MSME Number:</strong> {selectedQuote.MSMENumber || 'N/A'}</div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Items:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">S.No</th>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">Part Number</th>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">Description</th>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">Qty</th>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">UOM</th>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">Unit Price</th>
                          <th className="text-left p-3 border-b border-gray-300 text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.Items.map((item, index) => (
                          <tr key={item.ItemID} className="border-b border-gray-200">
                            <td className="p-3 text-gray-700">{index + 1}</td>
                            <td className="p-3 text-gray-700 font-mono">{item.PartNumber}</td>
                            <td className="p-3 text-gray-700">{item.Description}</td>
                            <td className="p-3 text-gray-700">{item.Quantity}</td>
                            <td className="p-3 text-gray-700">{item.UOM}</td>
                            <td className="p-3 text-gray-700">₹{item.UnitPrice.toLocaleString()}</td>
                            <td className="p-3 text-gray-700 font-medium">₹{item.TotalPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td colSpan={6} className="p-3 text-right font-bold text-gray-900">Total Amount:</td>
                          <td className="p-3 font-bold text-gray-900">₹{selectedQuote.TotalAmount.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Terms and Conditions:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-gray-700 text-sm whitespace-pre-wrap">{selectedQuote.TermsAndConditions}</pre>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="text-center text-gray-600 text-sm">
                    <p className="font-medium">RECORDTEK.COM</p>
                    <p>Supply Chain Management Solutions</p>
                    <p>Email: info@recordtek.com | Phone: +91-80-12345678</p>
                    <p className="mt-2 text-xs">This is a computer generated quotation and does not require signature.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Quote Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create New Quote</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateQuote} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative customer-autocomplete">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={newQuote.customerName}
                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                        onFocus={() => {
                          if (newQuote.customerName && customerSuggestions.length > 0) {
                            setShowCustomerSuggestions(true);
                          }
                        }}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Start typing customer name..."
                        required
                      />
                      {showCustomerSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.customer_id || customer.CustomerID}
                              onClick={() => selectCustomer(customer)}
                              className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">{customer.customer_name || customer.CustomerName}</p>
                                  <p className="text-gray-400 text-sm">{customer.contact_person || customer.ContactPerson}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-blue-300 text-sm">{customer.email || customer.Email}</p>
                                  <p className="text-gray-400 text-sm">{customer.phone || customer.Phone}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={newQuote.contactPerson}
                        onChange={(e) => setNewQuote({ ...newQuote, contactPerson: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={newQuote.email}
                        onChange={(e) => setNewQuote({ ...newQuote, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={newQuote.phone}
                        onChange={(e) => setNewQuote({ ...newQuote, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Customer Address *</label>
                      <textarea
                        value={newQuote.customerAddress}
                        onChange={(e) => setNewQuote({ ...newQuote, customerAddress: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        required
                      />
                    </div>

                    {/* GST & MSME */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">GST Number</label>
                      <input
                        type="text"
                        value={newQuote.gstNumber}
                        onChange={(e) => setNewQuote({ ...newQuote, gstNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter GST Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">MSME Number</label>
                      <input
                        type="text"
                        value={newQuote.msmeNumber}
                        onChange={(e) => setNewQuote({ ...newQuote, msmeNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter MSME Number"
                      />
                    </div>

                    {/* Ship To */}
                    <div className="md:col-span-2 border-t border-gray-700 pt-4">
                      <h5 className="text-white font-semibold mb-3">Ship To Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Ship To Name</label>
                          <input
                            type="text"
                            value={newQuote.shipToName}
                            onChange={(e) => setNewQuote({ ...newQuote, shipToName: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Ship To Phone</label>
                          <input
                            type="text"
                            value={newQuote.shipToPhone}
                            onChange={(e) => setNewQuote({ ...newQuote, shipToPhone: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-400 mb-1">Ship To Address</label>
                          <textarea
                            value={newQuote.shipToAddress}
                            onChange={(e) => setNewQuote({ ...newQuote, shipToAddress: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sales Manager */}
                    <div className="md:col-span-2 border-t border-gray-700 pt-4">
                      <h5 className="text-white font-semibold mb-3">Sales Manager Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={newQuote.salesManagerName}
                            onChange={(e) => setNewQuote({ ...newQuote, salesManagerName: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                          <input
                            type="text"
                            value={newQuote.salesManagerPhone}
                            onChange={(e) => setNewQuote({ ...newQuote, salesManagerPhone: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                          <input
                            type="email"
                            value={newQuote.salesManagerEmail}
                            onChange={(e) => setNewQuote({ ...newQuote, salesManagerEmail: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Validity (Days)</label>
                      <input
                        type="number"
                        value={newQuote.validityDays}
                        onChange={(e) => setNewQuote({ ...newQuote, validityDays: parseInt(e.target.value) || 30 })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Quote Items</h4>
                    <button
                      type="button"
                      onClick={() => setShowItemSelector(true)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {newQuote.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="text-left p-3 text-gray-300">S.No</th>
                            <th className="text-left p-3 text-gray-300">Part Number</th>
                            <th className="text-left p-3 text-gray-300">Description</th>
                            <th className="text-left p-3 text-gray-300">Qty</th>
                            <th className="text-left p-3 text-gray-300">UOM</th>
                            <th className="text-left p-3 text-gray-300">Unit Price</th>
                            <th className="text-left p-3 text-gray-300">Total</th>
                            <th className="text-left p-3 text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newQuote.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-700">
                              <td className="p-3 text-white">{index + 1}</td>
                              <td className="p-3 text-blue-300 font-mono">{item.PartNumber}</td>
                              <td className="p-3 text-white">{item.Description}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.Quantity}
                                  onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-center"
                                  min="1"
                                />
                              </td>
                              <td className="p-3 text-white">{item.UOM}</td>
                              <td className="p-3 text-green-300">₹{item.UnitPrice.toLocaleString()}</td>
                              <td className="p-3 text-green-300 font-medium">₹{item.TotalPrice.toLocaleString()}</td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => removeItemFromQuote(index)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-700">
                          <tr>
                            <td colSpan={6} className="p-3 text-right font-bold text-white">Total Amount:</td>
                            <td className="p-3 font-bold text-green-300">
                              ₹{newQuote.items.reduce((sum, item) => sum + item.TotalPrice, 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                      <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No items added yet</p>
                      <p className="text-gray-500 text-sm">Click "Add Item" to start building your quote</p>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Terms and Conditions</h4>
                  <textarea
                    value={newQuote.termsAndConditions}
                    onChange={(e) => setNewQuote({ ...newQuote, termsAndConditions: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={6}
                  />
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
                    Create Quote
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Selector Modal */}
        {showItemSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl border border-red-800/20 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Select Item from Inventory</h3>
                <button
                  onClick={() => {
                    setShowItemSelector(false);
                    setItemSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingItems ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  <p className="text-gray-400 mt-4">Loading items...</p>
                </div>
              ) : availableItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No items available in inventory</p>
                  <p className="text-gray-500 text-sm">Add items to inventory first</p>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search items by name, code, or part number..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        autoFocus
                      />
                      {itemSearchQuery && (
                        <button
                          onClick={() => setItemSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Showing {filteredAvailableItems.length} of {availableItems.length} items
                    </p>
                  </div>

                  {filteredAvailableItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No items match your search</p>
                      <p className="text-gray-500 text-sm">Try different keywords</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {filteredAvailableItems.map((item) => (
                        <div key={item.ItemID} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="text-white font-medium">{item.ItemName}</p>
                                  <p className="text-blue-300 text-sm font-mono">{item.ItemCode}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-green-300 font-medium">₹{item.UnitPrice.toLocaleString()}</p>
                                  <p className="text-gray-400 text-sm">per {item.UOM}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 ml-4">
                              <input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                defaultValue="1"
                                className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-center"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const quantity = parseInt((e.target as HTMLInputElement).value);
                                    if (quantity > 0) {
                                      addItemToQuote(item, quantity);
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                                  const quantity = parseInt(input?.value || '1');
                                  if (quantity > 0) {
                                    addItemToQuote(item, quantity);
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
                  Import Quotes from Excel
                </h3>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white">
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
                      <li>• <strong>Customer Name:</strong> Mandatory, customer name</li>
                      <li>• <strong>Contact Person:</strong> Optional contact person name</li>
                      <li>• <strong>Email:</strong> Optional email address</li>
                      <li>• <strong>Phone:</strong> Optional phone number</li>
                      <li>• <strong>Part Number:</strong> Mandatory, item part number</li>
                      <li>• <strong>Description:</strong> Optional item description</li>
                      <li>• <strong>Quantity:</strong> Mandatory, must be a positive number</li>
                      <li>• <strong>UOM:</strong> Unit of measurement</li>
                      <li>• <strong>Unit Price:</strong> Optional price per unit</li>
                      <li>• <strong>Validity Days:</strong> Optional, defaults to 30 days</li>
                      <li>• <strong>GST No / MSME / Ship To / Sales Manager:</strong> Optional additional columns (if present they will be imported)</li>
                    </ul>
                  </div>

                  {/* Validation Results */}
                  {importData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">
                          Import Preview ({importData.length} quotes)
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
                                <th className="text-left p-2 text-gray-300">Customer</th>
                                <th className="text-left p-2 text-gray-300">Part Number</th>
                                <th className="text-left p-2 text-gray-300">Quantity</th>
                                <th className="text-left p-2 text-gray-300">Unit Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.slice(0, 10).map((row, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                  <td className="p-2 text-gray-400">{row.rowNumber}</td>
                                  <td className="p-2 text-white">{row.customerName}</td>
                                  <td className="p-2 text-white">{row.partNumber}</td>
                                  <td className="p-2 text-white">{row.quantity}</td>
                                  <td className="p-2 text-green-300">₹{row.unitPrice}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {importData.length > 10 && (
                          <div className="p-2 text-center text-gray-400 text-xs">
                            ... and {importData.length - 10} more quotes
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
                          Import {importData.length} Quotes
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
                    {importData.length} quotes have been imported successfully.
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
