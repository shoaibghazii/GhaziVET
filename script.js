// Shared data
let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let billItems = [];

// Current date for expiry check (May 20, 2025, 11:35 AM PKT)
const CURRENT_DATE = new Date('2025-05-20T11:35:00+05:00');

// Login Functionality
function login() {
    if (window.location.pathname.includes('login.html')) {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const error = document.getElementById('error');

        if (username === 'Shamsher Ghazi' && password === 'Ghazi786') {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'index.html';
        } else {
            error.textContent = 'Invalid username or password';
            error.style.display = 'block';
        }
    }
}

// Logout Functionality
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Inventory Functionality
function addMedicine() {
    if (window.location.pathname.includes('inventory.html')) {
        const name = document.getElementById('name').value;
        const company = document.getElementById('company').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);
        const expiry = document.getElementById('expiry').value;

        if (name && company && quantity > 0 && price > 0 && expiry) {
            medicines.push({ id: Date.now(), name, company, quantity, price, expiry });
            localStorage.setItem('medicines', JSON.stringify(medicines));
            document.getElementById('name').value = '';
            document.getElementById('company').value = '';
            document.getElementById('quantity').value = '';
            document.getElementById('price').value = '';
            document.getElementById('expiry').value = '';
            loadMedicines();
        }
    }
}

function deleteMedicine(id) {
    if (window.location.pathname.includes('inventory.html')) {
        medicines = medicines.filter(medicine => medicine.id !== id);
        localStorage.setItem('medicines', JSON.stringify(medicines));
        loadMedicines();
    }
}

function loadMedicines() {
    if (window.location.pathname.includes('inventory.html')) {
        const tbody = document.getElementById('medicine-body');
        tbody.innerHTML = '';
        medicines.forEach(medicine => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${medicine.name}</td>
                <td>${medicine.company}</td>
                <td>${medicine.quantity}</td>
                <td>${medicine.price.toFixed(2)}</td>
                <td>${medicine.expiry}</td>
                <td><button class="delete-btn" onclick="deleteMedicine(${medicine.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Billing Functionality
function loadMedicinesForBilling() {
    if (window.location.pathname.includes('billing.html')) {
        const select = document.getElementById('medicine');
        select.innerHTML = '<option value="">Select a medicine</option>';
        medicines.forEach(medicine => {
            const expiryDate = new Date(medicine.expiry);
            if (expiryDate >= CURRENT_DATE) {
                const option = document.createElement('option');
                option.value = medicine.id;
                option.textContent = `${medicine.name} (${medicine.quantity} available, Exp: ${medicine.expiry})`;
                select.appendChild(option);
            }
        });
    }
}

function addToBill() {
    if (window.location.pathname.includes('billing.html')) {
        const medicineId = parseInt(document.getElementById('medicine').value);
        const quantity = parseInt(document.getElementById('quantity').value);
        const error = document.getElementById('bill-error');
        const medicine = medicines.find(m => m.id === medicineId);

        error.style.display = 'none';

        if (!medicineId) {
            error.textContent = 'Please select a medicine.';
            error.style.display = 'block';
            return;
        }

        if (medicine) {
            const expiryDate = new Date(medicine.expiry);
            if (expiryDate < CURRENT_DATE) {
                error.textContent = 'Cannot add expired medicine to bill';
                error.style.display = 'block';
                return;
            }
            if (quantity > 0 && quantity <= medicine.quantity) {
                const total = quantity * medicine.price;
                billItems.push({ id: medicine.id, name: medicine.name, quantity, price: medicine.price, total });
                document.getElementById('quantity').value = '';
                document.getElementById('medicine').value = '';
                loadBill();
            } else {
                error.textContent = 'Invalid quantity';
                error.style.display = 'block';
            }
        }
    }
}

function removeFromBill(index) {
    if (window.location.pathname.includes('billing.html')) {
        billItems.splice(index, 1);
        loadBill();
    }
}

function loadBill() {
    if (window.location.pathname.includes('billing.html')) {
        const tbody = document.getElementById('bill-body');
        tbody.innerHTML = '';
        let total = 0;
        billItems.forEach((item, index) => {
            total += item.total;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
                <td><button class="delete-btn" onclick="removeFromBill(${index})">Remove</button></td>
            `;
            tbody.appendChild(row);
        });
        document.getElementById('total').textContent = total.toFixed(2);
    }
}

function completeBill() {
    if (window.location.pathname.includes('billing.html')) {
        if (billItems.length === 0) {
            document.getElementById('bill-error').textContent = 'No items to bill.';
            document.getElementById('bill-error').style.display = 'block';
            return;
        }
        billItems.forEach(item => {
            const medicine = medicines.find(m => m.id === item.id);
            medicine.quantity -= item.quantity;
        });
        const billDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        sales.push({ id: Date.now(), date: billDate, items: [...billItems], total: parseFloat(document.getElementById('total').textContent) });
        localStorage.setItem('medicines', JSON.stringify(medicines));
        localStorage.setItem('sales', JSON.stringify(sales));
        billItems = [];
        loadMedicinesForBilling();
        loadBill();
        loadBillingHistory();
    }
}

function loadBillingHistory() {
    if (window.location.pathname.includes('billing.html')) {
        const historyDiv = document.getElementById('billing-history');
        if (!historyDiv) {
            console.error('Billing history div not found.');
            return;
        }

        historyDiv.innerHTML = '';

        if (!sales || sales.length === 0) {
            historyDiv.innerHTML = '<p>No billing history available.</p>';
            return;
        }

        try {
            // Group sales by date
            const salesByDate = {};
            sales.forEach(sale => {
                if (!sale || !sale.date) {
                    console.warn('Invalid sale entry:', sale);
                    return;
                }
                const date = sale.date; // Already formatted as date only
                if (!salesByDate[date]) {
                    salesByDate[date] = [];
                }
                salesByDate[date].push(sale);
            });

            // Sort dates in descending order
            const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(b) - new Date(a));

            if (sortedDates.length === 0) {
                historyDiv.innerHTML = '<p>No valid billing history available.</p>';
                return;
            }

            sortedDates.forEach(date => {
                const dateHeader = document.createElement('h3');
                dateHeader.className = 'history-date';
                dateHeader.textContent = date;
                historyDiv.appendChild(dateHeader);

                const table = document.createElement('table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Bill ID</th>
                            <th>Items</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salesByDate[date].map(sale => `
                            <tr>
                                <td>${sale.id || 'N/A'}</td>
                                <td>${(sale.items || []).map(item => `${item.name || 'Unknown'} (Qty: ${item.quantity || 0})`).join(', ')}</td>
                                <td>${(sale.total || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                historyDiv.appendChild(table);
            });
        } catch (e) {
            console.error('Error loading billing history:', e);
            historyDiv.innerHTML = '<p>Error loading billing history. Please try again.</p>';
        }
    }
}

// Customer Functionality
function addCustomer() {
    if (window.location.pathname.includes('customer.html')) {
        const name = document.getElementById('name').value;
        const contact = document.getElementById('contact').value;
        const notes = document.getElementById('notes').value;

        if (name && contact) {
            customers.push({ id: Date.now(), name, contact, notes });
            localStorage.setItem('customers', JSON.stringify(customers));
            document.getElementById('name').value = '';
            document.getElementById('contact').value = '';
            document.getElementById('notes').value = '';
            loadCustomers();
        }
    }
}

function deleteCustomer(id) {
    if (window.location.pathname.includes('customer.html')) {
        customers = customers.filter(customer => customer.id !== id);
        localStorage.setItem('customers', JSON.stringify(customers));
        loadCustomers();
    }
}

function loadCustomers() {
    if (window.location.pathname.includes('customer.html')) {
        const tbody = document.getElementById('customer-body');
        tbody.innerHTML = '';
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.contact}</td>
                <td>${customer.notes}</td>
                <td><button class="delete-btn" onclick="deleteCustomer(${customer.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Dashboard Stats
function loadDashboardStats() {
    if (window.location.pathname.includes('index.html')) {
        const totalMedicines = medicines.length || 0;
        const totalCustomers = customers.length || 0;
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;

        const medicinesElement = document.getElementById('dash-total-medicines');
        const customersElement = document.getElementById('dash-total-customers');
        const salesElement = document.getElementById('dash-total-sales');

        if (medicinesElement) medicinesElement.textContent = totalMedicines;
        if (customersElement) customersElement.textContent = totalCustomers;
        if (salesElement) salesElement.textContent = totalSales.toFixed(2);
    }
}

// Reports Functionality
function loadReports() {
    if (window.location.pathname.includes('reports.html')) {
        const totalMedicines = medicines.length || 0;
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
        const totalCustomers = customers.length || 0;
        const totalStock = medicines.reduce((sum, medicine) => sum + (medicine.quantity || 0), 0) || 0;

        const medicinesElement = document.getElementById('total-medicines');
        const salesElement = document.getElementById('total-sales');
        const customersElement = document.getElementById('total-customers');
        const stockElement = document.getElementById('total-stock');

        if (medicinesElement) medicinesElement.textContent = totalMedicines;
        if (salesElement) salesElement.textContent = totalSales.toFixed(2);
        if (customersElement) customersElement.textContent = totalCustomers;
        if (stockElement) stockElement.textContent = totalStock;
    }
}

// Authentication Check
if (!localStorage.getItem('isLoggedIn') && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
}

// Page-Specific Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html')) {
        loadDashboardStats();
    } else if (window.location.pathname.includes('inventory.html')) {
        loadMedicines();
    } else if (window.location.pathname.includes('billing.html')) {
        loadMedicinesForBilling();
        loadBill();
        loadBillingHistory();
    } else if (window.location.pathname.includes('customer.html')) {
        loadCustomers();
    } else if (window.location.pathname.includes('reports.html')) {
        loadReports();
    }
});