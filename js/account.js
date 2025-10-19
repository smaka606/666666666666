// Account Page functionality
function initAccountPage() {
    checkAuthStatus();
    setupAccountNavigation();
    loadAccountData();
    setupAccountForms();
    
    // Check URL for specific tab
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        switchTab(tab);
    }
}

function checkAuthStatus() {
    if (!auth.isLoggedIn()) {
        showGuestModal();
        return;
    }
    
    // Update profile info
    const user = auth.getCurrentUser();
    updateProfileDisplay(user);
}

function showGuestModal() {
    const modal = document.getElementById('guest-modal');
    if (modal) {
        modal.classList.add('active');
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                window.location.href = 'index.html';
            });
        }
    }
}

function updateProfileDisplay(user) {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (userName) {
        userName.textContent = `${user.firstName} ${user.lastName}`.trim() || 'User';
    }
    
    if (userEmail) {
        userEmail.textContent = user.email;
    }
    
    // Pre-fill profile form
    prefillProfileForm(user);
}

function prefillProfileForm(user) {
    const fields = {
        'profile-first-name': user.firstName,
        'profile-last-name': user.lastName,
        'profile-email': user.email,
        'profile-phone': user.phone,
        'profile-birth': user.birthDate
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field && value) {
            field.value = value;
        }
    });
}

function setupAccountNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (item.classList.contains('logout')) {
                handleLogout();
                return;
            }
            
            const tab = item.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.account-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Load tab-specific data
        loadTabData(tabName);
    }
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'orders':
            loadOrders();
            break;
        case 'prescriptions':
            loadPrescriptions();
            break;
        case 'addresses':
            loadAddresses();
            break;
    }
}

function loadAccountData() {
    loadOrders();
    loadPrescriptions();
    loadAddresses();
}

function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    const orders = app.getFromStorage('orders', []);
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here.</p>
                <a href="products.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
    const statusClass = `status-${order.status}`;
    const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    
    return `
        <div class="order-item">
            <div class="order-header">
                <div>
                    <h4>Order #${order.id}</h4>
                    <p>Placed on ${app.formatDate(order.date)}</p>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            <div class="order-items">
                <div class="order-item-summary">
                    ${order.items.length} item(s) • ${order.items.map(item => item.title).join(', ')}
                </div>
            </div>
            <div class="order-footer">
                <div class="order-total">Total: ${formatPrice(order.payment.total)}</div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails(${order.id})">
                        View Details
                    </button>
                    ${order.status === 'delivered' ? 
                        `<button class="btn btn-primary btn-sm" onclick="reorderItems(${order.id})">
                            Reorder
                        </button>` : ''
                    }
                </div>
            </div>
        </div>
    `;
}

function loadPrescriptions() {
    const prescriptionsList = document.getElementById('prescriptions-list');
    if (!prescriptionsList) return;
    
    const prescriptions = app.getFromStorage('prescriptions', []);
    
    if (prescriptions.length === 0) {
        prescriptionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-prescription" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>No prescriptions uploaded</h3>
                <p>Upload your prescriptions to order medicines easily.</p>
                <a href="upload.html" class="btn btn-primary">Upload Prescription</a>
            </div>
        `;
        return;
    }
    
    prescriptionsList.innerHTML = prescriptions.map(prescription => createPrescriptionCard(prescription)).join('');
}

function createPrescriptionCard(prescription) {
    const statusClass = `status-${prescription.status}`;
    const statusText = prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1);
    
    return `
        <div class="prescription-item">
            <div class="prescription-header">
                <div>
                    <h4>Prescription #RX${prescription.id}</h4>
                    <p>Uploaded on ${app.formatDate(prescription.date)}</p>
                    <p>Patient: ${prescription.patient.name}</p>
                </div>
                <span class="prescription-status ${statusClass}">${statusText}</span>
            </div>
            <div class="prescription-files">
                <strong>Files:</strong> ${prescription.files.map(file => file.name).join(', ')}
            </div>
            <div class="prescription-actions">
                <button class="btn btn-outline btn-sm" onclick="viewPrescriptionDetails(${prescription.id})">
                    View Details
                </button>
                ${prescription.status === 'approved' ? 
                    `<button class="btn btn-primary btn-sm" onclick="orderFromPrescription(${prescription.id})">
                        Order Medicines
                    </button>` : ''
                }
            </div>
        </div>
    `;
}

function loadAddresses() {
    const addressesList = document.getElementById('addresses-list');
    if (!addressesList) return;
    
    const addresses = app.getFromStorage('addresses', []);
    
    if (addresses.length === 0) {
        addressesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>No saved addresses</h3>
                <p>Add addresses for faster checkout.</p>
                <button class="btn btn-primary" onclick="showAddAddressModal()">Add Address</button>
            </div>
        `;
        return;
    }
    
    addressesList.innerHTML = addresses.map(address => createAddressCard(address)).join('');
}

function createAddressCard(address) {
    return `
        <div class="address-item">
            <div class="address-header">
                <h4>${address.label}</h4>
                ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
            </div>
            <div class="address-details">
                <p><strong>${address.name}</strong></p>
                <p>${address.street}</p>
                <p>${address.city}, ${address.state} ${address.zipcode}</p>
                <p>${address.phone}</p>
            </div>
            <div class="address-actions">
                <button class="btn btn-outline btn-sm" onclick="editAddress(${address.id})">
                    Edit
                </button>
                <button class="btn btn-outline btn-sm" onclick="deleteAddress(${address.id})">
                    Delete
                </button>
                ${!address.isDefault ? 
                    `<button class="btn btn-primary btn-sm" onclick="setDefaultAddress(${address.id})">
                        Set Default
                    </button>` : ''
                }
            </div>
        </div>
    `;
}

function setupAccountForms() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleProfileUpdate();
        });
    }
    
    // Add address button
    const addAddressBtn = document.getElementById('add-address-btn');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', showAddAddressModal);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Settings toggles
    setupSettingsToggles();
}

function handleProfileUpdate() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    
    const profileData = {
        firstName: document.getElementById('profile-first-name')?.value,
        lastName: document.getElementById('profile-last-name')?.value,
        email: document.getElementById('profile-email')?.value,
        phone: document.getElementById('profile-phone')?.value,
        birthDate: document.getElementById('profile-birth')?.value
    };
    
    // Validate email
    if (!app.validateEmail(profileData.email)) {
        app.showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate phone if provided
    if (profileData.phone && !app.validatePhone(profileData.phone)) {
        app.showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    // Update profile
    if (auth.updateProfile(profileData)) {
        updateProfileDisplay(auth.getCurrentUser());
    }
}

function setupSettingsToggles() {
    const toggles = document.querySelectorAll('.settings-toggle input');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const setting = e.target.id;
            const value = e.target.checked;
            
            // Save setting
            const settings = app.getFromStorage('userSettings', {});
            settings[setting] = value;
            app.setToStorage('userSettings', settings);
            
            app.showToast(`${setting.replace('-', ' ')} ${value ? 'enabled' : 'disabled'}`, 'success');
        });
    });
    
    // Load saved settings
    const settings = app.getFromStorage('userSettings', {});
    Object.entries(settings).forEach(([key, value]) => {
        const toggle = document.getElementById(key);
        if (toggle) {
            toggle.checked = value;
        }
    });
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
    }
}

// Global functions
window.viewOrderDetails = (orderId) => {
    const orders = app.getFromStorage('orders', []);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const itemsList = order.items.map(item => 
        `<li>${item.title} (${item.brand}) - Qty: ${item.quantity} - ${formatPrice(item.price * item.quantity)}</li>`
    ).join('');
    
    app.showModal(`Order #${order.id} Details`, `
        <div class="order-details">
            <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
            <p><strong>Date:</strong> ${app.formatDate(order.date)}</p>
            <p><strong>Customer:</strong> ${order.customer.name}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p><strong>Address:</strong> ${order.customer.address.street}, ${order.customer.address.city}</p>
            
            <h4>Items:</h4>
            <ul>${itemsList}</ul>
            
            <div class="order-summary">
                <p>Subtotal: ${formatPrice(order.payment.subtotal)}</p>
                <p>Shipping: ${formatPrice(order.payment.shipping)}</p>
                <p>Tax: ${formatPrice(order.payment.tax)}</p>
                <p><strong>Total: ${formatPrice(order.payment.total)}</strong></p>
            </div>
        </div>
    `, [
        {
            text: 'Close',
            class: 'btn-secondary',
            onclick: 'this.closest(".modal").remove();'
        }
    ]);
};

window.reorderItems = (orderId) => {
    const orders = app.getFromStorage('orders', []);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Add all items to cart
    order.items.forEach(item => {
        app.cart.add(item, item.quantity);
    });
    
    app.showToast('Items added to cart!', 'success');
    
    // Redirect to cart
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1000);
};

window.viewPrescriptionDetails = (prescriptionId) => {
    const prescriptions = app.getFromStorage('prescriptions', []);
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    
    if (!prescription) return;
    
    const filesList = prescription.files.map(file => 
        `<li>${file.name} (${file.size})</li>`
    ).join('');
    
    app.showModal(`Prescription #RX${prescription.id} Details`, `
        <div class="prescription-details">
            <p><strong>Status:</strong> ${prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}</p>
            <p><strong>Date:</strong> ${app.formatDate(prescription.date)}</p>
            <p><strong>Patient:</strong> ${prescription.patient.name}, Age: ${prescription.patient.age}</p>
            <p><strong>Phone:</strong> ${prescription.patient.phone}</p>
            <p><strong>Delivery Address:</strong> ${prescription.delivery.address}</p>
            
            <h4>Uploaded Files:</h4>
            <ul>${filesList}</ul>
            
            ${prescription.delivery.instructions ? 
                `<p><strong>Instructions:</strong> ${prescription.delivery.instructions}</p>` : ''
            }
        </div>
    `, [
        {
            text: 'Close',
            class: 'btn-secondary',
            onclick: 'this.closest(".modal").remove();'
        }
    ]);
};

window.orderFromPrescription = (prescriptionId) => {
    app.showToast('Redirecting to prescription medicines...', 'success');
    setTimeout(() => {
        window.location.href = 'products.html?category=medicines&prescription=true';
    }, 1000);
};

window.showAddAddressModal = () => {
    app.showModal('Add New Address', `
        <form id="add-address-form">
            <div class="form-group">
                <label for="address-label">Address Label</label>
                <input type="text" id="address-label" name="label" placeholder="Home, Office, etc." required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="address-name">Full Name</label>
                    <input type="text" id="address-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="address-phone">Phone</label>
                    <input type="tel" id="address-phone" name="phone" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="address-street">Street Address</label>
                <textarea id="address-street" name="street" rows="2" required></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="address-city">City</label>
                    <input type="text" id="address-city" name="city" required>
                </div>
                <div class="form-group">
                    <label for="address-state">State</label>
                    <input type="text" id="address-state" name="state" required>
                </div>
                <div class="form-group">
                    <label for="address-zipcode">ZIP Code</label>
                    <input type="text" id="address-zipcode" name="zipcode" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="address-default" name="isDefault">
                    <span class="checkmark"></span>
                    Set as default address
                </label>
            </div>
        </form>
    `, [
        {
            text: 'Save Address',
            class: 'btn-primary',
            onclick: 'saveNewAddress(); this.closest(".modal").remove();'
        },
        {
            text: 'Cancel',
            class: 'btn-secondary',
            onclick: 'this.closest(".modal").remove();'
        }
    ]);
};

window.saveNewAddress = () => {
    const form = document.getElementById('add-address-form');
    const formData = new FormData(form);
    
    const address = {
        id: Date.now(),
        label: formData.get('label'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipcode: formData.get('zipcode'),
        isDefault: formData.get('isDefault') === 'on'
    };
    
    // Validate required fields
    const requiredFields = ['label', 'name', 'phone', 'street', 'city', 'state', 'zipcode'];
    for (const field of requiredFields) {
        if (!address[field]) {
            app.showToast(`Please fill in the ${field} field`, 'error');
            return;
        }
    }
    
    // Save address
    const addresses = app.getFromStorage('addresses', []);
    
    // If this is set as default, remove default from others
    if (address.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
    }
    
    addresses.push(address);
    app.setToStorage('addresses', addresses);
    
    app.showToast('Address saved successfully!', 'success');
    loadAddresses();
};

window.editAddress = (addressId) => {
    // Similar to add address but pre-filled
    app.showToast('Edit address functionality would be implemented here', 'info');
};

window.deleteAddress = (addressId) => {
    if (confirm('Are you sure you want to delete this address?')) {
        const addresses = app.getFromStorage('addresses', []);
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        app.setToStorage('addresses', updatedAddresses);
        
        app.showToast('Address deleted successfully!', 'success');
        loadAddresses();
    }
};

window.setDefaultAddress = (addressId) => {
    const addresses = app.getFromStorage('addresses', []);
    
    addresses.forEach(addr => {
        addr.isDefault = addr.id === addressId;
    });
    
    app.setToStorage('addresses', addresses);
    app.showToast('Default address updated!', 'success');
    loadAddresses();
};