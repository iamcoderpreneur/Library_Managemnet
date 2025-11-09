// In-memory database for WebContainer compatibility
export const database = {
  items: [],
  
  customers: [
    {
      customer_id: 1,
      customer_code: 'CUS001',
      customer_name: 'ABC Manufacturing Ltd',
      contact_person: 'Sarah Johnson',
      email: 'sarah@abcmfg.com',
      phone: '+91-98765-43210',
      address: '456 Business Blvd, Commerce City, Mumbai 400001',
      gst_number: '27ABCDE1234F1Z5',
      credit_limit: 50000.00,
      payment_terms: 'Net 15',
      is_active: true,
      created_date: '2024-01-15'
    },
    {
      customer_id: 2,
      customer_code: 'CUS002',
      customer_name: 'XYZ Industries Pvt Ltd',
      contact_person: 'Michael Chen',
      email: 'michael@xyzind.com',
      phone: '+91-98765-43211',
      address: '789 Industrial Ave, Manufacturing Zone, Pune 411001',
      gst_number: '27XYZAB5678G2H9',
      credit_limit: 75000.00,
      payment_terms: 'Net 30',
      is_active: true,
      created_date: '2024-01-20'
    }
  ],
  
  quotes: [
    {
      quote_id: 1,
      quote_number: 'QT-2025-001',
      customer_name: 'ABC Manufacturing Ltd',
      contact_person: 'Sarah Johnson',
      email: 'sarah@abcmfg.com',
      phone: '+91-98765-43210',
      customer_address: '456 Business Blvd, Commerce City, Mumbai 400001',
      quote_date: '2024-01-25',
      valid_until: '2024-02-25',
      status: 'Draft',
      subtotal: 12750.00,
      tax_amount: 2295.00,
      total_amount: 15045.00,
      terms_conditions: 'Standard terms and conditions apply',
      notes: 'Initial quote for steel materials',
      created_by: '1',
      is_active: true,
      created_at: '2024-01-25'
    }
  ],
  
  locations: [
    {
      location_id: 1,
      location_code: 'WH001',
      location_name: 'Main Warehouse',
      location_type: 'Warehouse',
      address: '789 Storage St, Warehouse District, Mumbai 400001',
      capacity: 10000.00,
      current_utilization: 65.5,
      manager_id: '3',
      is_active: true,
      created_date: '2024-01-01'
    },
    {
      location_id: 2,
      location_code: 'FAC001',
      location_name: 'Production Facility A',
      location_type: 'Factory',
      address: '321 Manufacturing Ave, Industrial Zone, Pune 411001',
      capacity: 5000.00,
      current_utilization: 80.2,
      manager_id: '4',
      is_active: true,
      created_date: '2024-01-01'
    }
  ]
};