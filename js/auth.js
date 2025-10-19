// Authentication Pages functionality
function initAuthPages() {
    const path = window.location.pathname;
    
    if (path.includes('login.html')) {
        setupLoginForm();
    } else if (path.includes('register.html')) {
        setupRegisterForm();
    }
    
    setupSocialLogin();
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister();
        });
    }
    
    // Password confirmation validation
    const password = document.getElementById('register-password');
    const confirmPassword = document.getElementById('confirm-password');
    
    if (password && confirmPassword) {
        confirmPassword.addEventListener('input', () => {
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity('Passwords do not match');
            } else {
                confirmPassword.setCustomValidity('');
            }
        });
    }
}

function handleLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const rememberMe = document.getElementById('remember-me')?.checked;
    
    // Validate inputs
    if (!email || !password) {
        app.showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!app.validateEmail(email)) {
        app.showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    // Simulate login process
    setTimeout(() => {
        const user = auth.login(email, password);
        
        if (user) {
            // Handle remember me
            if (rememberMe) {
                app.setToStorage('rememberLogin', true);
            }
            
            // Redirect to account page or previous page
            const returnUrl = new URLSearchParams(window.location.search).get('return') || 'account.html';
            window.location.href = returnUrl;
        } else {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            app.showToast('Invalid email or password', 'error');
        }
    }, 2000);
}

function handleRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;
    
    const userData = {
        firstName: document.getElementById('register-first-name')?.value,
        lastName: document.getElementById('register-last-name')?.value,
        email: document.getElementById('register-email')?.value,
        phone: document.getElementById('register-phone')?.value,
        password: document.getElementById('register-password')?.value,
        confirmPassword: document.getElementById('confirm-password')?.value,
        agreeTerms: document.getElementById('terms-agreement')?.checked,
        newsletter: document.getElementById('newsletter-signup')?.checked
    };
    
    // Validate inputs
    if (!validateRegistrationData(userData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    // Simulate registration process
    setTimeout(() => {
        const user = auth.register(userData);
        
        if (user) {
            // Show welcome modal
            showWelcomeModal(user);
            
            // Redirect after modal
            setTimeout(() => {
                window.location.href = 'account.html';
            }, 3000);
        } else {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            app.showToast('Registration failed. Please try again.', 'error');
        }
    }, 2000);
}

function validateRegistrationData(userData) {
    // Check required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password'];
    for (const field of requiredFields) {
        if (!userData[field]) {
            app.showToast(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`, 'error');
            return false;
        }
    }
    
    // Validate email
    if (!app.validateEmail(userData.email)) {
        app.showToast('Please enter a valid email address', 'error');
        return false;
    }
    
    // Validate phone
    if (!app.validatePhone(userData.phone)) {
        app.showToast('Please enter a valid phone number', 'error');
        return false;
    }
    
    // Validate password strength
    if (!validatePasswordStrength(userData.password)) {
        app.showToast('Password must be at least 8 characters with uppercase, lowercase, and number', 'error');
        return false;
    }
    
    // Check password confirmation
    if (userData.password !== userData.confirmPassword) {
        app.showToast('Passwords do not match', 'error');
        return false;
    }
    
    // Check terms agreement
    if (!userData.agreeTerms) {
        app.showToast('Please agree to the terms and conditions', 'error');
        return false;
    }
    
    return true;
}

function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
}

function showWelcomeModal(user) {
    app.showModal('Welcome to MediCare!', `
        <div class="welcome-content" style="text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success-green); margin-bottom: 1rem;"></i>
            <h4>Account Created Successfully!</h4>
            <p>Welcome to MediCare, ${user.firstName}!</p>
            <div class="welcome-benefits">
                <h5>Your benefits include:</h5>
                <ul style="text-align: left; margin: 1rem 0;">
                    <li><i class="fas fa-check"></i> Fast and easy prescription uploads</li>
                    <li><i class="fas fa-check"></i> Order tracking and history</li>
                    <li><i class="fas fa-check"></i> Exclusive member discounts</li>
                    <li><i class="fas fa-check"></i> Priority customer support</li>
                    <li><i class="fas fa-check"></i> Personalized health recommendations</li>
                </ul>
            </div>
            <p>You will be redirected to your account dashboard shortly.</p>
        </div>
    `);
}

function setupSocialLogin() {
    // Google login
    const googleBtns = document.querySelectorAll('.btn-social.google');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            app.showToast('Google login would be implemented with Google OAuth', 'info');
        });
    });
    
    // Facebook login
    const facebookBtns = document.querySelectorAll('.btn-social.facebook');
    facebookBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            app.showToast('Facebook login would be implemented with Facebook SDK', 'info');
        });
    });
}

// Global functions
window.togglePassword = (inputId) => {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};