// Checkout specific functionality (additional to cart.js)
function initCheckoutPage() {
    if (app.cart.items.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    renderCheckoutSummary();
    setupCheckoutForm();
    checkPrescriptionItems();
    setupStepNavigation();
}

function setupStepNavigation() {
    // Initialize first step
    showStep(1);
    
    // Setup form validation for each step
    setupStepValidation();
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.add('hidden');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.remove('hidden');
    }
    
    // Update step indicators
    updateStepIndicators(stepNumber);
}

function updateStepIndicators(currentStep) {
    const steps = document.querySelectorAll('.step');
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

function setupStepValidation() {
    // Step 1: Address validation
    const step1Fields = ['full-name', 'phone', 'address', 'city', 'state', 'zipcode'];
    
    // Step 2: Payment validation
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    
    // Real-time validation
    step1Fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => clearFieldError(field));
        }
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Specific field validations
    switch (field.id) {
        case 'phone':
            if (value && !app.validatePhone(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
            break;
        case 'email':
            if (value && !app.validateEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
        case 'zipcode':
            if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid ZIP code';
            }
            break;
    }
    
    // Show/hide error
    if (isValid) {
        clearFieldError(field);
    } else {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function validateCurrentStep(stepNumber) {
    let isValid = true;
    
    switch (stepNumber) {
        case 1:
            // Validate address fields
            const addressFields = ['full-name', 'phone', 'address', 'city', 'state', 'zipcode'];
            addressFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && !validateField(field)) {
                    isValid = false;
                }
            });
            break;
            
        case 2:
            // Validate payment method selection
            const selectedPayment = document.querySelector('input[name="payment"]:checked');
            if (!selectedPayment) {
                app.showToast('Please select a payment method', 'error');
                isValid = false;
            }
            break;
    }
    
    return isValid;
}

function nextStep() {
    const currentStepElement = document.querySelector('.checkout-step:not(.hidden)');
    const currentStepNumber = parseInt(currentStepElement.id.split('-')[1]);
    
    // Validate current step
    if (!validateCurrentStep(currentStepNumber)) {
        return;
    }
    
    // Move to next step
    const nextStepNumber = currentStepNumber + 1;
    if (nextStepNumber <= 3) {
        showStep(nextStepNumber);
        
        // Load step-specific content
        if (nextStepNumber === 3) {
            loadOrderReview();
        }
    }
}

function prevStep() {
    const currentStepElement = document.querySelector('.checkout-step:not(.hidden)');
    const currentStepNumber = parseInt(currentStepElement.id.split('-')[1]);
    
    // Move to previous step
    const prevStepNumber = currentStepNumber - 1;
    if (prevStepNumber >= 1) {
        showStep(prevStepNumber);
    }
}

function loadOrderReview() {
    const orderReview = document.getElementById('order-review');
    if (!orderReview) return;
    
    const formData = new FormData(document.getElementById('checkout-form'));
    
    // Collect order data for review
    const reviewData = {
        customer: {
            name: formData.get('full-name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: {
                street: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zipcode: formData.get('zipcode')
            }
        },
        payment: {
            method: formData.get('payment')
        },
        items: app.cart.items,
        totals: {
            subtotal: app.cart.getSubtotal(),
            shipping: app.cart.getShipping(),
            tax: app.cart.getTax(),
            discount: app.cart.getDiscount(),
            total: app.cart.getTotal()
        }
    };
    
    orderReview.innerHTML = `
        <div class="review-section">
            <h3>Delivery Information</h3>
            <div class="review-card">
                <p><strong>${reviewData.customer.name}</strong></p>
                <p>${reviewData.customer.phone}</p>
                ${reviewData.customer.email ? `<p>${reviewData.customer.email}</p>` : ''}
                <p>${reviewData.customer.address.street}</p>
                <p>${reviewData.customer.address.city}, ${reviewData.customer.address.state} ${reviewData.customer.address.zipcode}</p>
            </div>
        </div>
        
        <div class="review-section">
            <h3>Payment Method</h3>
            <div class="review-card">
                <p><i class="fas ${reviewData.payment.method === 'cod' ? 'fa-money-bill-wave' : 'fa-credit-card'}"></i> 
                   ${reviewData.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            </div>
        </div>
        
        <div class="review-section">
            <h3>Order Items</h3>
            <div class="review-items">
                ${reviewData.items.map(item => `
                    <div class="review-item">
                        <img src="${item.image}" alt="${item.title}">
                        <div class="item-details">
                            <h4>${item.title}</h4>
                            <p>${item.brand}</p>
                            <p>Qty: ${item.quantity}</p>
                        </div>
                        <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="review-section">
            <h3>Order Summary</h3>
            <div class="review-totals">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>${formatPrice(reviewData.totals.subtotal)}</span>
                </div>
                <div class="total-row">
                    <span>Shipping</span>
                    <span>${reviewData.totals.shipping === 0 ? 'Free' : formatPrice(reviewData.totals.shipping)}</span>
                </div>
                <div class="total-row">
                    <span>Tax</span>
                    <span>${formatPrice(reviewData.totals.tax)}</span>
                </div>
                ${reviewData.totals.discount > 0 ? `
                    <div class="total-row discount">
                        <span>Discount</span>
                        <span>-${formatPrice(reviewData.totals.discount)}</span>
                    </div>
                ` : ''}
                <div class="total-row final">
                    <span><strong>Total</strong></span>
                    <span><strong>${formatPrice(reviewData.totals.total)}</strong></span>
                </div>
            </div>
        </div>
        
        ${app.cart.hasPrescriptionItems() ? `
            <div class="review-section prescription-notice">
                <div class="notice-card">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h4>Prescription Items Notice</h4>
                        <p>Your order contains prescription items. Please ensure you have uploaded a valid prescription. Our pharmacist will verify before processing.</p>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

// Enhanced place order function
function placeOrder() {
    const orderData = collectOrderData();
    
    if (!orderData) return;
    
    // Show loading state
    const btn = document.getElementById('place-order');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
    btn.disabled = true;
    
    // Simulate order processing with progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 20;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing... ${progress}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Save order
            saveOrder(orderData);
            
            // Clear cart
            app.cart.clear();
            
            // Show success
            showOrderSuccessModal(orderData);
        }
    }, 600);
}

function showOrderSuccessModal(orderData) {
    const modal = app.showModal('Order Placed Successfully!', `
        <div class="success-content" style="text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success-green); margin-bottom: 1.5rem;"></i>
            <h3>Thank you for your order!</h3>
            <div class="order-confirmation">
                <p><strong>Order ID:</strong> #${orderData.id}</p>
                <p><strong>Total:</strong> ${formatPrice(orderData.payment.total)}</p>
                <p><strong>Payment:</strong> ${orderData.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            </div>
            
            <div class="next-steps">
                <h4>What happens next?</h4>
                <div class="steps-list">
                    <div class="step-item">
                        <i class="fas fa-check"></i>
                        <span>Order confirmation sent to ${orderData.customer.email || orderData.customer.phone}</span>
                    </div>
                    <div class="step-item">
                        <i class="fas fa-user-md"></i>
                        <span>${orderData.hasPrescriptionItems ? 'Pharmacist will verify prescription' : 'Order being prepared'}</span>
                    </div>
                    <div class="step-item">
                        <i class="fas fa-shipping-fast"></i>
                        <span>Delivery within 2-4 hours</span>
                    </div>
                </div>
            </div>
            
            <div class="contact-support">
                <p>Questions about your order?</p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
                    <a href="tel:+15551234567" class="btn btn-outline">
                        <i class="fas fa-phone"></i> Call Us
                    </a>
                    <a href="https://wa.me/1234567890?text=Order%20${orderData.id}" class="btn btn-success" target="_blank">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Track Order',
            class: 'btn-primary',
            onclick: 'window.location.href="account.html?tab=orders"; this.closest(".modal").remove();'
        },
        {
            text: 'Continue Shopping',
            class: 'btn-secondary',
            onclick: 'window.location.href="products.html"; this.closest(".modal").remove();'
        }
    ]);
    
    // Auto-redirect after 10 seconds
    setTimeout(() => {
        if (document.body.contains(modal)) {
            window.location.href = 'account.html?tab=orders';
        }
    }, 10000);
}

// Add checkout-specific styles
const checkoutStyles = `
    .review-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--gray-200);
    }
    
    .review-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .review-card {
        background: var(--gray-50);
        padding: 1rem;
        border-radius: var(--radius-lg);
        margin-top: 0.5rem;
    }
    
    .review-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 0.5rem;
    }
    
    .review-item {
        display: grid;
        grid-template-columns: 60px 1fr auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        background: var(--gray-50);
        border-radius: var(--radius-lg);
    }
    
    .review-item img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: var(--radius-md);
    }
    
    .review-item .item-details h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
    }
    
    .review-item .item-details p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--gray-600);
    }
    
    .review-totals {
        background: var(--gray-50);
        padding: 1rem;
        border-radius: var(--radius-lg);
        margin-top: 0.5rem;
    }
    
    .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .total-row:last-child {
        margin-bottom: 0;
    }
    
    .total-row.final {
        padding-top: 0.5rem;
        border-top: 1px solid var(--gray-300);
        font-size: 1.125rem;
    }
    
    .total-row.discount {
        color: var(--success-green);
    }
    
    .prescription-notice .notice-card {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: var(--radius-lg);
        margin-top: 0.5rem;
    }
    
    .prescription-notice .notice-card i {
        color: #856404;
        font-size: 1.5rem;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }
    
    .prescription-notice .notice-card h4 {
        margin: 0 0 0.5rem 0;
        color: #856404;
    }
    
    .prescription-notice .notice-card p {
        margin: 0;
        color: #856404;
    }
    
    .steps-list {
        text-align: left;
        margin: 1rem 0;
    }
    
    .step-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        padding: 0.5rem;
        background: var(--gray-50);
        border-radius: var(--radius-md);
    }
    
    .step-item i {
        color: var(--success-green);
        width: 20px;
        text-align: center;
    }
    
    .contact-support {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--gray-200);
    }
    
    .error-message {
        color: var(--error-red);
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }
    
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: var(--error-red);
    }
    
    @media (max-width: 768px) {
        .review-item {
            grid-template-columns: 50px 1fr;
            gap: 0.75rem;
        }
        
        .review-item .item-price {
            grid-column: 2;
            text-align: right;
            margin-top: 0.5rem;
        }
    }
`;

// Inject checkout styles
const checkoutStyleSheet = document.createElement('style');
checkoutStyleSheet.textContent = checkoutStyles;
document.head.appendChild(checkoutStyleSheet);