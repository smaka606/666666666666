// Cart Page functionality
function initCartPage() {
    renderCart();
    setupCartEventListeners();
    
    // Listen for cart updates
    document.addEventListener('cartUpdated', renderCart);
}

function setupCartEventListeners() {
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your cart?')) {
                app.cart.clear();
            }
        });
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartItems || !cartSummary) return;

    const items = app.cart.items;
    
    if (items.length === 0) {
        renderEmptyCart(cartItems, cartSummary);
    } else {
        renderCartItems(cartItems);
        renderCartSummary(cartSummary);
    }
}

function renderEmptyCart(cartItems, cartSummary) {
    cartItems.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h3>Your cart is empty</h3>
            <p>Add some products to your cart to get started.</p>
            <a href="products.html" class="btn btn-primary">
                <i class="fas fa-plus"></i> Start Shopping
            </a>
        </div>
    `;
    
    cartSummary.innerHTML = `
        <h3>Order Summary</h3>
        <p>Your cart is empty</p>
    `;
}

function renderCartItems(container) {
    const items = app.cart.items;
    
    container.innerHTML = items.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="cart-item-info">
                <h4>${item.title}</h4>
                <p class="brand">${item.brand}</p>
                ${item.prescription ? '<span class="prescription-badge">Prescription Required</span>' : ''}
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-price">
                ${formatPrice(item.price * item.quantity)}
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function renderCartSummary(container) {
    const subtotal = app.cart.getSubtotal();
    const shipping = app.cart.getShipping();
    const tax = app.cart.getTax();
    const discount = app.cart.getDiscount();
    const total = app.cart.getTotal();
    
    container.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        <div class="summary-row">
            <span>Tax</span>
            <span>${formatPrice(tax)}</span>
        </div>
        ${discount > 0 ? `
            <div class="summary-row discount">
                <span>Discount (${app.cart.discountCode})</span>
                <span>-${formatPrice(discount)}</span>
            </div>
        ` : ''}
        <div class="summary-row total">
            <span>Total</span>
            <span>${formatPrice(total)}</span>
        </div>
        
        <div class="discount-code">
            <h4>Discount Code</h4>
            <div class="discount-input">
                <input type="text" id="discount-code" placeholder="Enter discount code">
                <button onclick="applyDiscount()" class="btn btn-outline">Apply</button>
            </div>
        </div>
        
        <div class="checkout-actions">
            <a href="checkout.html" class="btn btn-success btn-lg">
                <i class="fas fa-lock"></i> Proceed to Checkout
            </a>
            <button class="btn btn-success btn-lg" onclick="orderOnWhatsApp()">
                <i class="fab fa-whatsapp"></i> Order on WhatsApp
            </button>
        </div>
        
        <div class="security-badges">
            <i class="fas fa-shield-alt"></i>
            <small>Secure checkout guaranteed</small>
        </div>
    `;
}

// Checkout Page functionality
function initCheckoutPage() {
    if (app.cart.items.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    renderCheckoutSummary();
    setupCheckoutForm();
    checkPrescriptionItems();
}

function renderCheckoutSummary() {
    const checkoutCartItems = document.getElementById('checkout-cart-items');
    const orderTotals = document.getElementById('order-totals');
    
    if (checkoutCartItems) {
        const items = app.cart.items;
        checkoutCartItems.innerHTML = items.map(item => `
            <div class="checkout-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="item-details">
                    <h5>${item.title}</h5>
                    <p>Qty: ${item.quantity}</p>
                </div>
                <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('');
    }
    
    if (orderTotals) {
        const subtotal = app.cart.getSubtotal();
        const shipping = app.cart.getShipping();
        const tax = app.cart.getTax();
        const discount = app.cart.getDiscount();
        const total = app.cart.getTotal();
        
        orderTotals.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div class="summary-row">
                <span>Tax</span>
                <span>${formatPrice(tax)}</span>
            </div>
            ${discount > 0 ? `
                <div class="summary-row">
                    <span>Discount</span>
                    <span>-${formatPrice(discount)}</span>
                </div>
            ` : ''}
            <div class="summary-row total">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
            </div>
        `;
    }
}

function setupCheckoutForm() {
    const placeOrderBtn = document.getElementById('place-order');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }
    
    // Pre-fill form with user data if logged in
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        prefillCheckoutForm(user);
    }
}

function prefillCheckoutForm(user) {
    const fields = {
        'full-name': `${user.firstName} ${user.lastName}`.trim(),
        'email': user.email,
        'phone': user.phone
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field && value) {
            field.value = value;
        }
    });
}

function checkPrescriptionItems() {
    const prescriptionCheck = document.getElementById('prescription-check');
    
    if (prescriptionCheck && app.cart.hasPrescriptionItems()) {
        prescriptionCheck.innerHTML = `
            <div class="prescription-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Prescription Items in Cart</h4>
                <p>Your cart contains prescription items. Please ensure you have uploaded a valid prescription.</p>
                <a href="upload.html" class="btn btn-secondary">Upload Prescription</a>
            </div>
        `;
    }
}

function nextStep() {
    const currentStep = document.querySelector('.checkout-step:not(.hidden)');
    const nextStepElement = currentStep.nextElementSibling;
    
    if (nextStepElement && nextStepElement.classList.contains('checkout-step')) {
        // Validate current step
        if (!validateCurrentStep(currentStep)) return;
        
        // Hide current step
        currentStep.classList.add('hidden');
        
        // Show next step
        nextStepElement.classList.remove('hidden');
        
        // Update step indicator
        updateStepIndicator();
    }
}

function prevStep() {
    const currentStep = document.querySelector('.checkout-step:not(.hidden)');
    const prevStepElement = currentStep.previousElementSibling;
    
    if (prevStepElement && prevStepElement.classList.contains('checkout-step')) {
        // Hide current step
        currentStep.classList.add('hidden');
        
        // Show previous step
        prevStepElement.classList.remove('hidden');
        
        // Update step indicator
        updateStepIndicator();
    }
}

function validateCurrentStep(stepElement) {
    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        app.showToast('Please fill in all required fields', 'error');
    }
    
    return isValid;
}

function updateStepIndicator() {
    const steps = document.querySelectorAll('.step');
    const currentStepIndex = Array.from(document.querySelectorAll('.checkout-step'))
        .findIndex(step => !step.classList.contains('hidden'));
    
    steps.forEach((step, index) => {
        if (index <= currentStepIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function placeOrder() {
    const orderData = collectOrderData();
    
    if (!orderData) return;
    
    // Show loading state
    const btn = document.getElementById('place-order');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
    btn.disabled = true;
    
    // Simulate order processing
    setTimeout(() => {
        // Save order to localStorage
        saveOrder(orderData);
        
        // Clear cart
        app.cart.clear();
        
        // Show success and redirect
        app.showToast('Order placed successfully!', 'success');
        
        // Redirect to success page or account
        setTimeout(() => {
            window.location.href = 'account.html?tab=orders';
        }, 2000);
        
    }, 3000);
}

function collectOrderData() {
    const form = document.getElementById('checkout-form');
    if (!form) return null;
    
    // Validate required fields
    const requiredFields = [
        { id: 'full-name', name: 'full name' },
        { id: 'phone', name: 'phone number' },
        { id: 'address', name: 'address' },
        { id: 'city', name: 'city' },
        { id: 'state', name: 'state' },
        { id: 'zipcode', name: 'ZIP code' }
    ];
    
    for (const fieldInfo of requiredFields) {
        const field = document.getElementById(fieldInfo.id);
        if (!field || !field.value.trim()) {
            app.showToast(`Please fill in the ${fieldInfo.name} field`, 'error');
            return null;
        }
    }
    
    const orderData = {
        id: Date.now(),
        date: new Date().toISOString(),
        status: 'pending',
        customer: {
            name: document.getElementById('full-name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email')?.value || '',
            address: {
                street: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipcode: document.getElementById('zipcode').value
            }
        },
        items: [...app.cart.items],
        payment: {
            method: document.querySelector('input[name="payment"]:checked')?.value || 'cod',
            subtotal: app.cart.getSubtotal(),
            shipping: app.cart.getShipping(),
            tax: app.cart.getTax(),
            discount: app.cart.getDiscount(),
            total: app.cart.getTotal()
        },
        hasPrescriptionItems: app.cart.hasPrescriptionItems()
    };
    
    return orderData;
}

function saveOrder(orderData) {
    const orders = app.getFromStorage('orders', []);
    orders.unshift(orderData);
    app.setToStorage('orders', orders);
}

// Global functions
window.applyDiscount = () => {
    const discountInput = document.getElementById('discount-code');
    const code = discountInput.value.trim().toUpperCase();
    
    if (!code) {
        app.showToast('Please enter a discount code', 'error');
        return;
    }
    
    if (app.cart.applyDiscount(code)) {
        app.showToast('Discount applied successfully!', 'success');
        renderCart();
        discountInput.value = '';
    } else {
        app.showToast('Invalid discount code', 'error');
    }
};

window.orderOnWhatsApp = () => {
    const items = app.cart.items;
    const total = app.cart.getTotal();
    
    let message = "Hi! I'd like to place an order:\n\n";
    
    items.forEach(item => {
        message += `• ${item.title} (${item.brand}) - Qty: ${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += `\nTotal: ${formatPrice(total)}\n\n`;
    message += "Please confirm availability and delivery details.";
    
    const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
};

window.nextStep = nextStep;
window.prevStep = prevStep;