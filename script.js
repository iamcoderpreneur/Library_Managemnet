// Application State
let currentUser = null;
let currentModule = 'home';
let items = [];
let customers = [];
let isAuthenticated = false;
let importData = [];
let importErrors = [];
let itemToDelete = null;

// Demo users data
const demoUsers = [
    {
        id: '1',
        username: 'superadmin',
        password: 'admin123',
        name: 'Super Administrator',
        email: 'superadmin@scm.com',
        role: 1,
        roleName: 'Super Admin',
        roleLevel: 1
    },
    {
        id: '2',
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        email: 'admin@scm.com',
        role: 2,
        roleName: 'Admin',
        roleLevel: 2
    },
    {
        id: '3',
        username: 'manager',
        password: 'manager123',
        name: 'Manager',
        email: 'manager@scm.com',
        role: 3,
        roleName: 'Manager',
        roleLevel: 3
    },
    {
        id: '4',
        username: 'supervisor',
        password: 'supervisor123',
        name: 'Supervisor',
        email: 'supervisor@scm.com',
        role: 4,
        roleName: 'Supervisor',
        roleLevel: 4
    },
    {
        id: '5',
        username: 'user',
        password: 'user123',
        name: 'User',
        email: 'user@scm.com',
        role: 5,
        roleName: 'User',
        roleLevel: 5
    }
];

// Module definitions
const moduleDefinitions = [
    {
        id: 'items',
        name: 'Inventory Management',
        description: 'Manage inventory items, stock levels, and item categories',
        icon: 'fas fa-box',
        color: 'from-red-600 to-red-800',
        requiredLevel: 5
    },
    {
        id: 'customers',
        name: 'Customers',
        description: 'Customer relationship and account management',
        icon: 'fas fa-users',
        color: 'from-red-800 to-black',
        requiredLevel: 4
    },
    {
        id: 'quotes',
        name: 'Quotes',
        description: 'Quote generation and management system',
        icon: 'fas fa-file-text',
        color: 'from-gray-700 to-red-800',
        requiredLevel: 4
    },
    {
        id: 'sql-queries',
        name: 'SQL Query Visualizer',
        description: 'Visual SQL query builder and data analysis',
        icon: 'fas fa-database',
        color: 'from-red-900 to-black',
        requiredLevel: 2
    },
    {
        id: 'settings',
        name: 'System Settings',
        description: 'Configure application preferences and system settings',
        icon: 'fas fa-cog',
        color: 'from-black to-red-700',
        requiredLevel: 2
    }
];

// UOM options
const uomOptions = [
    'kg', 'g', 'mg', 'lb', 'oz', 'ton',
    'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mile',
    'nos', 'ea', 'pcs', 'set', 'pair', 'dozen', 'gross'
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('scm_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isAuthenticated = true;
            showMainApp();
        } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('scm_user');
        }
    }
    
    // Load data from localStorage
    loadDataFromStorage();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Demo credential buttons
    document.querySelectorAll('.credential-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('username').value = this.dataset.username;
            document.getElementById('password').value = this.dataset.password;
        });
    });
    
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const module = this.dataset.module;
            switchModule(module);
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Module search
    document.getElementById('moduleSearch').addEventListener('input', filterModules);
    
    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Items module
    setupItemsModule();
    
    // Customers module
    setupCustomersModule();
    
    // Excel file input
    document.getElementById('excelFileInput').addEventListener('change', handleFileUpload);
}

function setupItemsModule() {
    // Add item button
    document.getElementById('addItemBtn').addEventListener('click', showAddItemModal);
    
    // Add item form
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);
    
    // Edit item form
    document.getElementById('editItemForm').addEventListener('submit', handleEditItem);
    
    // Search functionality
    document.getElementById('itemsSearch').addEventListener('input', filterItems);
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', filterItems);
    
    // Import Excel button
    document.getElementById('importExcelBtn').addEventListener('click', showImportModal);
}

function setupCustomersModule() {
    // Add customer button
    document.getElementById('addCustomerBtn').addEventListener('click', showAddCustomerModal);
    
    // Add customer form
    document.getElementById('addCustomerForm').addEventListener('submit', handleAddCustomer);
    
    // Search functionality
    document.getElementById('customersSearch').addEventListener('input', filterCustomers);
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Find user in demo data
    const user = demoUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        isAuthenticated = true;
        
        // Save to localStorage
        localStorage.setItem('scm_user', JSON.stringify(user));
        
        showMainApp();
        hideLoginError();
    } else {
        showLoginError('Invalid username or password');
    }
}

function handleLogout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem('scm_user');
    
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // Reset form
    document.getElementById('loginForm').reset();
    hideLoginError();
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideLoginError() {
    document.getElementById('loginError').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.roleName;
    document.getElementById('welcomeUserName').textContent = currentUser.name;
    
    // Update navigation based on role
    updateNavigationAccess();
    
    // Render modules
    renderModules();
    
    // Switch to home module
    switchModule('home');
    
    // Update stats
    updateStats();
}

function updateNavigationAccess() {
    const roleAccess = {
        'home': 5,
        'items': 5,
        'customers': 4,
        'quotes': 4,
        'sql-queries': 2,
        'settings': 2
    };
    
    document.querySelectorAll('.nav-item').forEach(item => {
        const module = item.dataset.module;
        const requiredLevel = roleAccess[module] || 5;
        
        if (currentUser.roleLevel <= requiredLevel) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderModules() {
    const modulesGrid = document.getElementById('modulesGrid');
    modulesGrid.innerHTML = '';
    
    const accessibleModules = moduleDefinitions.filter(module => 
        currentUser.roleLevel <= module.requiredLevel
    );
    
    accessibleModules.forEach(module => {
        const moduleCard = document.createElement('div');
        moduleCard.className = 'module-card';
        moduleCard.dataset.module = module.id;
        moduleCard.style.background = `linear-gradient(135deg, var(--tw-gradient-stops))`;
        moduleCard.style.setProperty('--tw-gradient-from', '#dc2626');
        moduleCard.style.setProperty('--tw-gradient-to', '#7f1d1d');
        
        moduleCard.innerHTML = `
            <div class="module-icon">
                <i class="${module.icon}"></i>
            </div>
            <h4>${module.name}</h4>
            <p>${module.description}</p>
            <div class="module-footer">
                <span>Level ${module.requiredLevel}+</span>
                <div class="module-arrow">→</div>
            </div>
        `;
        
        moduleCard.addEventListener('click', () => switchModule(module.id));
        modulesGrid.appendChild(moduleCard);
    });
}

// Navigation Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebarToggle').querySelector('i');
    
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        icon.className = 'fas fa-chevron-right';
    } else {
        icon.className = 'fas fa-chevron-left';
    }
}

function switchModule(moduleName) {
    currentModule = moduleName;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update modules
    document.querySelectorAll('.module').forEach(module => {
        if (module.id === moduleName + 'Module') {
            module.classList.add('active');
        } else {
            module.classList.remove('active');
        }
    });
    
    // Module-specific initialization
    if (moduleName === 'items') {
        initializeItemsModule();
    } else if (moduleName === 'customers') {
        initializeCustomersModule();
    }
}

function filterModules() {
    const searchTerm = document.getElementById('moduleSearch').value.toLowerCase();
    const moduleCards = document.querySelectorAll('.module-card');
    
    moduleCards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function handleQuickAction(action) {
    switch (action) {
        case 'add-item':
            switchModule('items');
            setTimeout(() => showAddItemModal(), 100);
            break;
        case 'new-quote':
            switchModule('quotes');
            break;
        case 'new-customer':
            switchModule('customers');
            setTimeout(() => showAddCustomerModal(), 100);
            break;
        case 'view-reports':
            alert('Reports functionality coming soon!');
            break;
    }
}

// Items Module Functions
function initializeItemsModule() {
    renderItemsTable();
    updateItemsStats();
    updateCategoryFilter();
    updateLowStockAlert();
}

function showAddItemModal() {
    document.getElementById('addItemModal').classList.add('active');
}

function closeAddItemModal() {
    document.getElementById('addItemModal').classList.remove('active');
    document.getElementById('addItemForm').reset();
}

function showEditItemModal(item) {
    document.getElementById('editItemId').value = item.ItemID;
    document.getElementById('editItemCode').value = item.ItemCode;
    document.getElementById('editItemName').value = item.ItemName;
    document.getElementById('editItemDescription').value = item.Description;
    document.getElementById('editItemCategory').value = item.Category;
    document.getElementById('editItemUOM').value = item.UOM;
    document.getElementById('editItemPrice').value = item.UnitPrice;
    document.getElementById('editItemQuantity').value = item.StockQuantity;
    document.getElementById('editItemReorderLevel').value = item.ReorderLevel;
    
    document.getElementById('editItemModal').classList.add('active');
}

function closeEditItemModal() {
    document.getElementById('editItemModal').classList.remove('active');
    document.getElementById('editItemForm').reset();
}

function showItemDetailsModal(item) {
    const content = document.getElementById('itemDetailsContent');
    
    content.innerHTML = `
        <div class="item-details-grid">
            <div>
                <div class="detail-group">
                    <label>Item Code</label>
                    <p class="font-mono">${item.ItemCode}</p>
                </div>
                <div class="detail-group">
                    <label>Item Name</label>
                    <p class="font-bold">${item.ItemName}</p>
                </div>
                <div class="detail-group">
                    <label>Description</label>
                    <p>${item.Description}</p>
                </div>
                <div class="detail-group">
                    <label>Category</label>
                    <p>${item.Category}</p>
                </div>
            </div>
            <div>
                <div class="detail-group">
                    <label>Unit Price</label>
                    <p style="color: #22c55e; font-size: 1.25rem; font-weight: bold;">$${item.UnitPrice.toFixed(2)}</p>
                </div>
                <div class="detail-group">
                    <label>Stock Quantity</label>
                    <p style="color: ${item.StockQuantity <= item.ReorderLevel ? '#f59e0b' : 'white'}; font-size: 1.25rem; font-weight: bold;">
                        ${item.StockQuantity} ${item.UOM}
                    </p>
                </div>
                <div class="detail-group">
                    <label>Reorder Level</label>
                    <p>${item.ReorderLevel}</p>
                </div>
                <div class="detail-group">
                    <label>Total Value</label>
                    <p style="color: #60a5fa; font-size: 1.25rem; font-weight: bold;">
                        $${(item.UnitPrice * item.StockQuantity).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
        <div style="margin-top: 1.5rem;">
            <div class="detail-group">
                <label>Status</label>
                <span class="status-badge ${item.IsActive ? 'status-active' : 'status-inactive'}">
                    ${item.IsActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>
    `;
    
    document.getElementById('itemDetailsModal').classList.add('active');
}

function closeItemDetailsModal() {
    document.getElementById('itemDetailsModal').classList.remove('active');
}

function showDeleteConfirmModal(item) {
    itemToDelete = item;
    document.getElementById('deleteItemName').textContent = item.ItemName;
    document.getElementById('deleteItemCode').textContent = item.ItemCode;
    document.getElementById('deleteConfirmModal').classList.add('active');
}

function closeDeleteConfirmModal() {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    itemToDelete = null;
}

function confirmDeleteItem() {
    if (itemToDelete) {
        items = items.filter(item => item.ItemID !== itemToDelete.ItemID);
        saveDataToStorage();
        renderItemsTable();
        updateItemsStats();
        updateCategoryFilter();
        updateStats();
        updateLowStockAlert();
        closeDeleteConfirmModal();
    }
}

function handleAddItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemData = {
        ItemID: items.length + 1,
        ItemCode: formData.get('item_code'),
        ItemName: formData.get('item_name'),
        Description: formData.get('description') || '',
        Category: formData.get('category'),
        UnitPrice: parseFloat(formData.get('unit_price')) || 0,
        StockQuantity: parseInt(formData.get('stock_quantity')) || 0,
        ReorderLevel: parseInt(formData.get('reorder_level')) || 10,
        UOM: formData.get('uom'),
        LocationID: 1,
        IsActive: true,
        CreatedDate: new Date().toISOString().split('T')[0]
    };
    
    // Add to items array
    items.push(itemData);
    
    // Save to localStorage
    saveDataToStorage();
    
    // Update UI
    renderItemsTable();
    updateItemsStats();
    updateCategoryFilter();
    updateStats();
    updateLowStockAlert();
    
    // Close modal
    closeAddItemModal();
}

function handleEditItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemId = parseInt(formData.get('item_id'));
    
    const itemIndex = items.findIndex(item => item.ItemID === itemId);
    if (itemIndex !== -1) {
        items[itemIndex] = {
            ...items[itemIndex],
            ItemCode: formData.get('item_code'),
            ItemName: formData.get('item_name'),
            Description: formData.get('description') || '',
            Category: formData.get('category'),
            UnitPrice: parseFloat(formData.get('unit_price')) || 0,
            StockQuantity: parseInt(formData.get('stock_quantity')) || 0,
            ReorderLevel: parseInt(formData.get('reorder_level')) || 10,
            UOM: formData.get('uom')
        };
        
        // Save to localStorage
        saveDataToStorage();
        
        // Update UI
        renderItemsTable();
        updateItemsStats();
        updateCategoryFilter();
        updateStats();
        updateLowStockAlert();
        
        // Close modal
        closeEditItemModal();
    }
}

function renderItemsTable() {
    const tableBody = document.getElementById('itemsTableBody');
    const table = document.getElementById('itemsTable');
    const emptyState = document.getElementById('itemsEmptyState');
    
    if (items.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tableBody.innerHTML = '';
    
    items.forEach(item => {
        const row = document.createElement('tr');
        
        const isLowStock = item.StockQuantity <= item.ReorderLevel;
        const statusClass = item.IsActive ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td>
                <span style="color: #60a5fa; font-family: monospace;">${item.ItemCode}</span>
            </td>
            <td>
                <div>
                    <p style="color: white; font-weight: 500;">${item.ItemName}</p>
                    <p style="color: #9ca3af; font-size: 0.875rem;">${item.Description}</p>
                </div>
            </td>
            <td>
                <span class="status-badge" style="background: rgba(55, 65, 81, 0.5); color: #d1d5db;">
                    ${item.Category}
                </span>
            </td>
            <td>
                <span style="color: #34d399; font-weight: 500;">$${item.UnitPrice.toFixed(2)}</span>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; color: ${isLowStock ? '#f59e0b' : 'white'};">
                        ${item.StockQuantity} ${item.UOM}
                    </span>
                    ${isLowStock ? '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>' : ''}
                </div>
            </td>
            <td>
                <span style="color: #d1d5db;">${item.ReorderLevel}</span>
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${item.IsActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="viewItem(${item.ItemID})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser.roleLevel <= 3 ? `
                        <button class="action-btn action-btn-edit" onclick="editItem(${item.ItemID})" title="Edit Item">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${currentUser.roleLevel <= 2 ? `
                        <button class="action-btn action-btn-delete" onclick="deleteItem(${item.ItemID})" title="Delete Item">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function filterItems() {
    const searchTerm = document.getElementById('itemsSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const filteredItems = items.filter(item => {
        const matchesSearch = item.ItemName.toLowerCase().includes(searchTerm) ||
                             item.ItemCode.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'All' || item.Category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderFilteredItemsTable(filteredItems);
}

function renderFilteredItemsTable(filteredItems) {
    const tableBody = document.getElementById('itemsTableBody');
    const table = document.getElementById('itemsTable');
    const emptyState = document.getElementById('itemsEmptyState');
    
    if (filteredItems.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tableBody.innerHTML = '';
    
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        
        const isLowStock = item.StockQuantity <= item.ReorderLevel;
        const statusClass = item.IsActive ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td>
                <span style="color: #60a5fa; font-family: monospace;">${item.ItemCode}</span>
            </td>
            <td>
                <div>
                    <p style="color: white; font-weight: 500;">${item.ItemName}</p>
                    <p style="color: #9ca3af; font-size: 0.875rem;">${item.Description}</p>
                </div>
            </td>
            <td>
                <span class="status-badge" style="background: rgba(55, 65, 81, 0.5); color: #d1d5db;">
                    ${item.Category}
                </span>
            </td>
            <td>
                <span style="color: #34d399; font-weight: 500;">$${item.UnitPrice.toFixed(2)}</span>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; color: ${isLowStock ? '#f59e0b' : 'white'};">
                        ${item.StockQuantity} ${item.UOM}
                    </span>
                    ${isLowStock ? '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>' : ''}
                </div>
            </td>
            <td>
                <span style="color: #d1d5db;">${item.ReorderLevel}</span>
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${item.IsActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="viewItem(${item.ItemID})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser.roleLevel <= 3 ? `
                        <button class="action-btn action-btn-edit" onclick="editItem(${item.ItemID})" title="Edit Item">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${currentUser.roleLevel <= 2 ? `
                        <button class="action-btn action-btn-delete" onclick="deleteItem(${item.ItemID})" title="Delete Item">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateItemsStats() {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.StockQuantity <= item.ReorderLevel).length;
    const totalValue = items.reduce((sum, item) => sum + (item.UnitPrice * item.StockQuantity), 0);
    const categories = [...new Set(items.map(item => item.Category))].length;
    
    document.getElementById('itemsStatsTotal').textContent = totalItems;
    document.getElementById('itemsStatsLowStock').textContent = lowStockItems;
    document.getElementById('itemsStatsValue').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('itemsStatsCategories').textContent = categories;
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(items.map(item => item.Category))];
    
    // Clear existing options except "All"
    categoryFilter.innerHTML = '<option value="All">All Categories</option>';
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function updateLowStockAlert() {
    const lowStockItems = items.filter(item => item.StockQuantity <= item.ReorderLevel);
    const alertElement = document.getElementById('lowStockAlert');
    const countElement = document.getElementById('lowStockCount');
    
    if (lowStockItems.length > 0) {
        countElement.textContent = lowStockItems.length;
        alertElement.style.display = 'block';
    } else {
        alertElement.style.display = 'none';
    }
}

// Customers Module Functions
function initializeCustomersModule() {
    renderCustomersTable();
    updateCustomersStats();
}

function showAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.add('active');
}

function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.remove('active');
    document.getElementById('addCustomerForm').reset();
}

function handleAddCustomer(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customerData = {
        CustomerID: customers.length + 1,
        CustomerCode: `CUS${String(customers.length + 1).padStart(3, '0')}`,
        CustomerName: formData.get('customer_name'),
        ContactPerson: formData.get('contact_person') || '',
        Email: formData.get('email') || '',
        Phone: formData.get('phone') || '',
        Address: formData.get('address'),
        GSTNumber: formData.get('gst_number'),
        CreditLimit: parseFloat(formData.get('credit_limit')) || 0,
        PaymentTerms: formData.get('payment_terms'),
        IsActive: true,
        CreatedDate: new Date().toISOString().split('T')[0]
    };
    
    // Add to customers array
    customers.push(customerData);
    
    // Save to localStorage
    saveDataToStorage();
    
    // Update UI
    renderCustomersTable();
    updateCustomersStats();
    
    // Close modal
    closeAddCustomerModal();
}

function renderCustomersTable() {
    const tableBody = document.getElementById('customersTableBody');
    const table = document.getElementById('customersTable');
    const emptyState = document.getElementById('customersEmptyState');
    
    if (customers.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tableBody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        
        const statusClass = customer.IsActive ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td>
                <span style="color: #60a5fa; font-family: monospace;">${customer.CustomerCode}</span>
            </td>
            <td>
                <div>
                    <p style="color: white; font-weight: 500;">${customer.CustomerName}</p>
                    <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #9ca3af; margin-top: 0.25rem;">
                        <span style="display: flex; align-items: center;">
                            <i class="fas fa-envelope" style="width: 0.75rem; margin-right: 0.25rem;"></i>
                            ${customer.Email}
                        </span>
                        <span style="display: flex; align-items: center;">
                            <i class="fas fa-phone" style="width: 0.75rem; margin-right: 0.25rem;"></i>
                            ${customer.Phone}
                        </span>
                    </div>
                </div>
            </td>
            <td>
                <span style="color: white;">${customer.ContactPerson}</span>
            </td>
            <td>
                <span style="color: #fbbf24; font-family: monospace;">${customer.GSTNumber}</span>
            </td>
            <td>
                <span style="color: #34d399; font-weight: 500;">$${customer.CreditLimit.toLocaleString()}</span>
            </td>
            <td>
                <span class="status-badge" style="background: rgba(55, 65, 81, 0.5); color: #d1d5db;">
                    ${customer.PaymentTerms}
                </span>
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${customer.IsActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="viewCustomer(${customer.CustomerID})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser.roleLevel <= 3 ? `
                        <button class="action-btn action-btn-edit" onclick="editCustomer(${customer.CustomerID})" title="Edit Customer">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${currentUser.roleLevel <= 2 ? `
                        <button class="action-btn action-btn-delete" onclick="deleteCustomer(${customer.CustomerID})" title="Delete Customer">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function filterCustomers() {
    const searchTerm = document.getElementById('customersSearch').value.toLowerCase();
    
    const filteredCustomers = customers.filter(customer => {
        return customer.CustomerName.toLowerCase().includes(searchTerm) ||
               customer.CustomerCode.toLowerCase().includes(searchTerm) ||
               customer.ContactPerson.toLowerCase().includes(searchTerm);
    });
    
    renderFilteredCustomersTable(filteredCustomers);
}

function renderFilteredCustomersTable(filteredCustomers) {
    const tableBody = document.getElementById('customersTableBody');
    const table = document.getElementById('customersTable');
    const emptyState = document.getElementById('customersEmptyState');
    
    if (filteredCustomers.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tableBody.innerHTML = '';
    
    filteredCustomers.forEach(customer => {
        const row = document.createElement('tr');
        
        const statusClass = customer.IsActive ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td>
                <span style="color: #60a5fa; font-family: monospace;">${customer.CustomerCode}</span>
            </td>
            <td>
                <div>
                    <p style="color: white; font-weight: 500;">${customer.CustomerName}</p>
                    <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #9ca3af; margin-top: 0.25rem;">
                        <span style="display: flex; align-items: center;">
                            <i class="fas fa-envelope" style="width: 0.75rem; margin-right: 0.25rem;"></i>
                            ${customer.Email}
                        </span>
                        <span style="display: flex; align-items: center;">
                            <i class="fas fa-phone" style="width: 0.75rem; margin-right: 0.25rem;"></i>
                            ${customer.Phone}
                        </span>
                    </div>
                </div>
            </td>
            <td>
                <span style="color: white;">${customer.ContactPerson}</span>
            </td>
            <td>
                <span style="color: #fbbf24; font-family: monospace;">${customer.GSTNumber}</span>
            </td>
            <td>
                <span style="color: #34d399; font-weight: 500;">$${customer.CreditLimit.toLocaleString()}</span>
            </td>
            <td>
                <span class="status-badge" style="background: rgba(55, 65, 81, 0.5); color: #d1d5db;">
                    ${customer.PaymentTerms}
                </span>
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${customer.IsActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="viewCustomer(${customer.CustomerID})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser.roleLevel <= 3 ? `
                        <button class="action-btn action-btn-edit" onclick="editCustomer(${customer.CustomerID})" title="Edit Customer">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${currentUser.roleLevel <= 2 ? `
                        <button class="action-btn action-btn-delete" onclick="deleteCustomer(${customer.CustomerID})" title="Delete Customer">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateCustomersStats() {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.IsActive).length;
    const totalCreditLimit = customers.reduce((sum, customer) => sum + customer.CreditLimit, 0);
    const avgCreditLimit = totalCustomers > 0 ? totalCreditLimit / totalCustomers : 0;
    
    document.getElementById('customersStatsTotal').textContent = totalCustomers;
    document.getElementById('customersStatsActive').textContent = activeCustomers;
    document.getElementById('customersStatsCreditLimit').textContent = `$${totalCreditLimit.toLocaleString()}`;
    document.getElementById('customersStatsAvgCredit').textContent = `$${Math.round(avgCreditLimit).toLocaleString()}`;
}

// Excel Import Functions
function showImportModal() {
    document.getElementById('importModal').classList.add('active');
    resetImportModal();
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
    resetImportModal();
}

function resetImportModal() {
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importStep3').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
    document.getElementById('selectedFileName').style.display = 'none';
    document.getElementById('excelFileInput').value = '';
    importData = [];
    importErrors = [];
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('selectedFileName').textContent = `Selected: ${file.name}`;
        document.getElementById('selectedFileName').style.display = 'block';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length > 1) {
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1);
                    
                    const processedData = rows.map((row, index) => ({
                        rowNumber: index + 2,
                        recordNumber: row[0],
                        partNumber: row[headers.indexOf('Part number')] || row[headers.indexOf('Part Number')] || '',
                        quantity: row[headers.indexOf('Quantity')] || '',
                        uom: row[headers.indexOf('UOM')] || row[headers.indexOf('Unit of Measurement')] || '',
                        description: row[headers.indexOf('Description')] || '',
                        category: row[headers.indexOf('Category')] || 'General',
                        unitPrice: row[headers.indexOf('Unit Price')] || row[headers.indexOf('Price')] || 0,
                        reorderLevel: row[headers.indexOf('Reorder Level')] || 10
                    }));
                    
                    importData = processedData;
                    validateImportData();
                    showImportPreview();
                }
            } catch (error) {
                alert('Error reading Excel file. Please check the file format.');
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

function validateImportData() {
    importErrors = [];
    const partNumbers = new Set();
    const existingPartNumbers = new Set(items.map(item => item.ItemCode));

    importData.forEach((row, index) => {
        const rowNum = row.rowNumber;
        
        // Check mandatory Part Number
        if (!row.partNumber || row.partNumber.toString().trim() === '') {
            importErrors.push(`Row ${rowNum}: Part number is mandatory`);
        } else {
            const partNum = row.partNumber.toString().trim();
            
            // Check for duplicates in import data
            if (partNumbers.has(partNum)) {
                importErrors.push(`Row ${rowNum}: Duplicate part number "${partNum}" found in import data`);
            } else {
                partNumbers.add(partNum);
            }
            
            // Check for existing part numbers
            if (existingPartNumbers.has(partNum)) {
                importErrors.push(`Row ${rowNum}: Part number "${partNum}" already exists in inventory`);
            }
        }
        
        // Check mandatory Quantity
        if (!row.quantity || row.quantity === '') {
            importErrors.push(`Row ${rowNum}: Quantity is mandatory`);
        } else {
            const qty = parseFloat(row.quantity);
            if (isNaN(qty) || qty < 0) {
                importErrors.push(`Row ${rowNum}: Quantity must be a valid positive number`);
            }
        }
        
        // Check UOM
        if (row.uom && !uomOptions.includes(row.uom)) {
            importErrors.push(`Row ${rowNum}: Invalid UOM "${row.uom}". Valid options: ${uomOptions.join(', ')}`);
        }
    });
}

function showImportPreview() {
    document.getElementById('importStep1').style.display = 'none';
    document.getElementById('importStep2').style.display = 'block';
    
    document.getElementById('previewCount').textContent = importData.length;
    
    // Show validation status
    const validationStatus = document.getElementById('validationStatus');
    const validationErrors = document.getElementById('validationErrors');
    const errorsList = document.getElementById('errorsList');
    const importBtn = document.getElementById('importBtn');
    
    if (importErrors.length === 0) {
        validationStatus.innerHTML = '<i class="fas fa-check-circle" style="color: #22c55e;"></i> Ready to Import';
        validationErrors.style.display = 'none';
        importBtn.style.display = 'inline-flex';
    } else {
        validationStatus.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> ${importErrors.length} Errors Found`;
        validationErrors.style.display = 'block';
        errorsList.innerHTML = importErrors.map(error => `<li>${error}</li>`).join('');
        importBtn.style.display = 'none';
    }
    
    // Show preview table
    const previewTableBody = document.getElementById('previewTableBody');
    previewTableBody.innerHTML = '';
    
    importData.slice(0, 10).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.rowNumber}</td>
            <td>${row.partNumber}</td>
            <td>${row.quantity}</td>
            <td>${row.uom}</td>
            <td>${row.description}</td>
        `;
        previewTableBody.appendChild(tr);
    });
    
    if (importData.length > 10) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align: center; color: #9ca3af; font-size: 0.75rem;">... and ${importData.length - 10} more items</td>`;
        previewTableBody.appendChild(tr);
    }
}

function processImport() {
    if (importErrors.length === 0 && importData.length > 0) {
        const newItems = importData.map((row, index) => ({
            ItemID: items.length + index + 1,
            ItemCode: row.partNumber,
            ItemName: row.description || row.partNumber,
            Description: row.description || '',
            Category: row.category || 'General',
            UnitPrice: parseFloat(row.unitPrice) || 0,
            StockQuantity: parseInt(row.quantity) || 0,
            ReorderLevel: parseInt(row.reorderLevel) || 10,
            UOM: row.uom || 'nos',
            LocationID: 1,
            IsActive: true,
            CreatedDate: new Date().toISOString().split('T')[0]
        }));
        
        items.push(...newItems);
        saveDataToStorage();
        
        // Show success step
        document.getElementById('importStep2').style.display = 'none';
        document.getElementById('importStep3').style.display = 'block';
        document.getElementById('importedCount').textContent = importData.length;
        document.getElementById('importBtn').style.display = 'none';
        
        // Update UI if on items module
        if (currentModule === 'items') {
            renderItemsTable();
            updateItemsStats();
            updateCategoryFilter();
            updateStats();
            updateLowStockAlert();
        }
        
        // Auto close after 2 seconds
        setTimeout(() => {
            closeImportModal();
        }, 2000);
    }
}

// Action Functions
function viewItem(itemId) {
    const item = items.find(i => i.ItemID === itemId);
    if (item) {
        showItemDetailsModal(item);
    }
}

function editItem(itemId) {
    const item = items.find(i => i.ItemID === itemId);
    if (item) {
        showEditItemModal(item);
    }
}

function deleteItem(itemId) {
    const item = items.find(i => i.ItemID === itemId);
    if (item) {
        showDeleteConfirmModal(item);
    }
}

function viewCustomer(customerId) {
    const customer = customers.find(c => c.CustomerID === customerId);
    if (customer) {
        alert(`View customer details for: ${customer.CustomerName}\nThis functionality would show detailed customer information.`);
    }
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.CustomerID === customerId);
    if (customer) {
        alert(`Edit customer: ${customer.CustomerName}\nThis functionality would open an edit modal.`);
    }
}

function deleteCustomer(customerId) {
    const customer = customers.find(c => c.CustomerID === customerId);
    if (customer && confirm(`Are you sure you want to delete customer: ${customer.CustomerName}?`)) {
        customers = customers.filter(c => c.CustomerID !== customerId);
        saveDataToStorage();
        renderCustomersTable();
        updateCustomersStats();
    }
}

// Utility Functions
function updateStats() {
    // Update home page stats
    const totalItemsCount = document.getElementById('totalItemsCount');
    if (totalItemsCount) {
        totalItemsCount.textContent = items.length;
    }
}

function saveDataToStorage() {
    localStorage.setItem('scm_items', JSON.stringify(items));
    localStorage.setItem('scm_customers', JSON.stringify(customers));
}

function loadDataFromStorage() {
    // Load items
    const savedItems = localStorage.getItem('scm_items');
    if (savedItems) {
        try {
            items = JSON.parse(savedItems);
        } catch (error) {
            console.error('Error parsing saved items:', error);
            items = [];
        }
    }
    
    // Load customers
    const savedCustomers = localStorage.getItem('scm_customers');
    if (savedCustomers) {
        try {
            customers = JSON.parse(savedCustomers);
        } catch (error) {
            console.error('Error parsing saved customers:', error);
            customers = [];
        }
    }
}

// Global functions for onclick handlers
window.showAddItemModal = showAddItemModal;
window.closeAddItemModal = closeAddItemModal;
window.closeEditItemModal = closeEditItemModal;
window.closeItemDetailsModal = closeItemDetailsModal;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.confirmDeleteItem = confirmDeleteItem;
window.showAddCustomerModal = showAddCustomerModal;
window.closeAddCustomerModal = closeAddCustomerModal;
window.showImportModal = showImportModal;
window.closeImportModal = closeImportModal;
window.processImport = processImport;
window.viewItem = viewItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.viewCustomer = viewCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;