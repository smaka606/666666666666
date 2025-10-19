// Global App Functionality
class App {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.initializeComponents();
        this.setupEventListeners();
        this.updateCartBadge();
        this.setupMobileMenu();
        this.setupSearch();
        this.setupScrollEffects();
    }

    async loadProducts() {
        try {
            // Try to load from localStorage first
            let products = this.getFromStorage('products');

            if (!products) {
                // Generate demo products if not in storage
                products = generateDemoProducts();
                this.setToStorage('products', products);
            }

            this.products = products;
            return products;
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    }

    setupEventListeners() {
        // Update cart badge when cart changes
        document.addEventListener('cartUpdated', () => {
            this.updateCartBadge();
        });

        // Setup global click handlers
        document.addEventListener('click', (e) => {
            // Close mobile menu when clicking outside
            if (!e.target.closest('.navbar') && !e.target.closest('.menu-toggle')) {
                this.closeMobileMenu();
            }

            // Handle category filter clicks
            if (e.target.hasAttribute('onclick') && e.target.getAttribute('onclick').includes('filterByCategory')) {
                const category = e.target.getAttribute('onclick').match(/filterByCategory\('([^']+)'\)/)[1];
                window.location.href = `products.html?category=${category}`;
            }
        });

        // Setup form submissions
        this.setupForms();
    }

    setupForms() {
        // Generic form handler
        document.addEventListener('submit', (e) => {
            const form = e.target;
            
            // Prevent default submission for demo forms
            if (form.id === 'contact-form' || form.id === 'prescription-form' || 
                form.id === 'profile-form' || form.classList.contains('demo-form')) {
                e.preventDefault();
                this.handleFormSubmit(form);
            }
        });
    }

    handleFormSubmit(form) {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            // Show success message
            this.showToast('Form submitted successfully!', 'success');

            // Reset form for demo
            if (form.id === 'contact-form') {
                form.reset();
            }
        }, 2000);
    }

    updateCartBadge() {
        const cartBadges = document.querySelectorAll('.cart-badge');
        const itemCount = this.cart.getTotalItems();
        
        cartBadges.forEach(badge => {
            badge.textContent = itemCount;
            badge.style.display = itemCount > 0 ? 'flex' : 'none';
        });
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                menuToggle.innerHTML = navLinks.classList.contains('active') 
                    ? '<i class="fas fa-times"></i>' 
                    : '<i class="fas fa-bars"></i>';
            });
        }
    }

    closeMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if (menuToggle) {
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('header-search');
        const searchButton = searchInput?.nextElementSibling;
        
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length >= 2) {
                    searchTimeout = setTimeout(() => {
                        this.showSearchSuggestions(query);
                    }, 500);
                } else {
                    this.hideSearchSuggestions();
                }
            });

            // Handle search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                }
            });
            
            // Handle search button click
            if (searchButton) {
                searchButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                });
            }
        }
    }

    showSearchSuggestions(query) {
        // Only show suggestions on products page
        if (!window.location.pathname.includes('products.html')) return;
        
        const products = this.getFromStorage('products', []);
        const suggestions = products
            .filter(p => 
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.brand.toLowerCase().includes(query.toLowerCase()) ||
                p.category.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5);
            
        if (suggestions.length > 0) {
            this.renderSearchSuggestions(suggestions, query);
        }
    }
    
    renderSearchSuggestions(suggestions, query) {
        let suggestionsContainer = document.getElementById('search-suggestions');
        
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'search-suggestions';
            suggestionsContainer.className = 'search-suggestions';
            
            const searchInput = document.getElementById('header-search');
            if (searchInput) {
                searchInput.parentNode.appendChild(suggestionsContainer);
            }
        }
        
        suggestionsContainer.innerHTML = suggestions.map(product => `
            <div class="suggestion-item" onclick="selectSearchSuggestion('${product.title}')">
                <img src="${product.image}" alt="${product.title}">
                <div>
                    <div class="suggestion-title">${this.highlightText(product.title, query)}</div>
                    <div class="suggestion-brand">${product.brand}</div>
                    <div class="suggestion-price">${this.formatPrice(product.price)}</div>
                </div>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
    }
    
    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }
    
    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    performSearch(query) {
        // Redirect to products page with search query
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        this.hideSearchSuggestions();
    }

    setupScrollEffects() {
        // Add scroll class to header
        let lastScrollTop = 0;
        const header = document.querySelector('.header');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Hide/show header on scroll
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // Utility Methods
    showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon} toast-icon"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    showModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        const actionsHtml = actions.map(action => 
            `<button class="btn ${action.class || 'btn-primary'}" onclick="${action.onclick}">${action.text}</button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        &times;
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                    ${actions.length > 0 ? `<div class="modal-actions">${actionsHtml}</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        return modal;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(price);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePhone(phone) {
        return /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
    }

    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Local Storage helpers
    getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    setToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    }

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    initializeComponents() {
        this.cart = new Cart(this);
        this.auth = new Auth(this);
    }
}

// Cart Class
class Cart {
    constructor(app) {
        this.app = app;
        this.items = this.app.getFromStorage('cart', []);
        this.discountCode = null;
        this.discountAmount = 0;
    }

    add(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                brand: product.brand,
                prescription: product.prescription || false,
                quantity: quantity
            });
        }
        
        this.save();
        this.triggerUpdate();
        
        // Show success message
        this.app.showToast(`${product.title} added to cart`, 'success');
    }

    remove(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.save();
        this.triggerUpdate();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.remove(productId);
            } else {
                item.quantity = quantity;
                this.save();
                this.triggerUpdate();
            }
        }
    }

    clear() {
        this.items = [];
        this.save();
        this.triggerUpdate();
    }

    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getShipping() {
        const subtotal = this.getSubtotal();
        return subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    }

    getTax() {
        return this.getSubtotal() * 0.08; // 8% tax
    }

    getDiscount() {
        return this.discountAmount;
    }

    getTotal() {
        return this.getSubtotal() + this.getShipping() + this.getTax() - this.getDiscount();
    }

    applyDiscount(code) {
        const discountCodes = {
            'HEALTH50': 0.5, // 50% off
            'SAVE20': 0.2,   // 20% off
            'FIRST10': 0.1   // 10% off
        };

        if (discountCodes[code]) {
            this.discountCode = code;
            this.discountAmount = this.getSubtotal() * discountCodes[code];
            this.save();
            return true;
        }
        return false;
    }

    removeDiscount() {
        this.discountCode = null;
        this.discountAmount = 0;
        this.save();
    }

    hasPrescriptionItems() {
        return this.items.some(item => item.prescription);
    }

    save() {
        this.app.setToStorage('cart', this.items);
        this.app.setToStorage('cartDiscount', {
            code: this.discountCode,
            amount: this.discountAmount
        });
    }

    triggerUpdate() {
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    }
}

// User Authentication Class
class Auth {
    constructor(app) {
        this.app = app;
        this.currentUser = this.app.getFromStorage('currentUser', null);
    }

    login(email, password) {
        // Demo login - in real app, this would call an API
        if (email && password) {
            const user = {
                id: Date.now(),
                email: email,
                firstName: email.split('@')[0],
                lastName: '',
                phone: '',
                avatar: null,
                createdAt: new Date().toISOString()
            };
            
            this.currentUser = user;
            this.app.setToStorage('currentUser', user);
            
            this.app.showToast('Login successful!', 'success');
            return user;
        }
        return null;
    }

    register(userData) {
        // Demo registration
        const user = {
            id: Date.now(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            avatar: null,
            createdAt: new Date().toISOString()
        };
        
        this.currentUser = user;
        this.app.setToStorage('currentUser', user);
        
        this.app.showToast('Registration successful!', 'success');
        return user;
    }

    logout() {
        this.currentUser = null;
        this.app.removeFromStorage('currentUser');
        this.app.showToast('Logged out successfully', 'success');
        
        // Redirect to home if on account page
        if (window.location.pathname.includes('account.html')) {
            window.location.href = 'index.html';
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateProfile(profileData) {
        if (this.currentUser) {
            Object.assign(this.currentUser, profileData);
            this.app.setToStorage('currentUser', this.currentUser);
            this.app.showToast('Profile updated successfully!', 'success');
            return true;
        }
        return false;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new App();
    
    window.auth = window.app.auth;
    
    // Initialize page-specific functionality
    const path = window.location.pathname;
    
    if (path.includes('products.html')) {
        initProductsPage();
    } else if (path.includes('product.html')) {
        initProductDetailPage();
    } else if (path.includes('cart.html')) {
        initCartPage();
    } else if (path.includes('checkout.html')) {
        initCheckoutPage();
    } else if (path.includes('account.html')) {
        initAccountPage();
    } else if (path.includes('login.html') || path.includes('register.html')) {
        initAuthPages();
    } else if (path.includes('upload.html')) {
        initUploadPage();
    } else if (path.includes('offers.html')) {
        initOffersPage();
    } else if (path.includes('branches.html')) {
        initBranchesPage();
    } else if (path.includes('contact.html')) {
        initContactPage();
    } else if (path === '/' || path.includes('index.html')) {
        initHomePage();
    }
});

// Home page initialization
function initHomePage() {
    loadFeaturedProducts();
}

async function loadFeaturedProducts() {
    try {
        const products = await app.loadProducts();
        const featured = products.filter(p => p.featured).slice(0, 8);
        const container = document.getElementById('featured-products');
        
        if (container) {
            container.innerHTML = featured.map(product => createProductCard(product)).join('');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

function generateDemoProducts() {
    const categories = ['medicines', 'wellness', 'personal-care', 'devices'];
    const brands = ['PharmaCorp', 'HealthPlus', 'MediMax', 'WellCare', 'VitaLife', 'CarePlus', 'MediCore', 'LifeScience'];

    const productNames = {
        medicines: [
            'أسبرين 100 مجم', 'إيبوبروفين 200 مجم', 'باراسيتامول 500 مجم', 'أموكسيسيلين 250 مجم',
            'ميتفورمين 500 مجم', 'ليسينوبريل 10 مجم', 'أتورفاستاتين 20 مجم', 'أوميبرازول 20 مجم',
            'أملوديبين 5 مجم', 'ليفوثيروكسين 50 مكجم', 'ميتوبرولول 25 مجم', 'هيدروكلوروثيازيد 25 مجم',
            'جابابنتين 300 مجم', 'بريدنيزون 10 مجم', 'بخاخ ألبوتيرول', 'إنسولين جلارجين'
        ],
        wellness: [
            'فيتامين د 3 1000 وحدة دولية', 'زيت السمك أوميغا 3', 'كربونات الكالسيوم', 'فيتامينات متعددة بلس',
            'مسحوق بروتين الفانيليا', 'بروتين مصل اللبن المعزول بالشوكولاتة', 'مشروب طاقة BCAA',
            'مستخلص الشاي الأخضر', 'الكركمين', 'بروبيوتيك يومي', 'ببتيدات الكولاجين',
            'مركب المغنيسيوم', 'فيتامين ب 12', 'مكمل حديد', 'أقراص زنك',
            'CoQ10 100 مجم', 'بيوتين 5000 مكجم', 'فيتامين سي 1000 مجم', 'ميلاتونين 3 مجم'
        ],
        'personal-care': [
            'لوشن مرطب', 'واقي شمسي SPF 50', 'سيروم مضاد للشيخوخة', 'كريم فيتامين سي',
            'غسول وجه لطيف', 'شامبو لنمو الشعر', 'غسول جسم للبشرة الحساسة', 'معقم لليدين',
            'مرطب شفاه SPF 15', 'كريم العين', 'جل علاج حب الشباب', 'تونر مرطب',
            'لوشن للجسم', 'مزيل عرق', 'معجون أسنان مبيض', 'غسول فم مطهر'
        ],
        devices: [
            'ترمومتر رقمي', 'جهاز قياس ضغط الدم', 'طقم قياس السكر',
            'مقياس التأكسج النبضي', 'جهاز استنشاق', 'وسادة تدفئة كهربائية', 'طقم إسعافات أولية',
            'ميزان رقمي', 'سماعة طبية', 'شرائط اختبار سكر الدم', 'جوارب ضاغطة',
            'منظم حبوب الدواء', 'كمادة ثلج', 'ضمادة مرنة', 'سوار قياس ضغط الدم الرقمي'
        ]
    };

    const realProducts = {
        'أسبرين 100 مجم': { price: 78.00, image: 'https://www.bloompharmacy.com/cdn/shop/products/aspirin-protect-100-mg-30-tablets-880111.jpg?v=1691500242' },
        'إيبوبروفين 200 مجم': { price: 29.00, image: 'http://egyptiandrugstore.com/image/cache/data/manar13/brufen%20200-500x500.png' },
        'باراسيتامول 500 مجم': { price: 22.00, image: 'http://egyptiandrugstore.com/image/cache/data/MANAR23/PARACETAMOL-500x500.png' },
        'أموكسيسيلين 250 مجم': { price: 28.00, image: 'http://egyptiandrugstore.com/image/cache/data/MANAR%2020/IBIAMOX%20500-400x400.png' },
        'ميتفورمين 500 مجم': { price: 8.00, image: 'http://egyptiandrugstore.com/image/cache/data/manar9/cidophage%20500-400x400.png' },
        'ليسينوبريل 10 مجم': { price: 51.00, image: 'http://egyptiandrugstore.com/image/cache/data/MANAR23/LISINOPRIL-400x400.png' },
        'فيتامين د 3 1000 وحدة دولية': { price: 200.00, image: 'https://shop.pharmaemarket.com/pharma/medias/0000100137-00-2023-08-28-14-11-23-0-515Wx515H?context=bWFzdGVyfGltYWdlc3w0MDIxOXxpbWFnZS9qcGVnfGFETXpMMmd6T0M4NE5qTXdOVEF3TWpVM056azBMM2h3YjJzdVkyOXRMMk55WldGMFpYTXZNVFk1TnpRNU1ETXlOekF6WHpFeU1EQXdNQzVwY21sZmFXUWdPRFE0T0RBMU16TXhNREp3V1M1M1pXeHpaWElnYzNSaGJpQjdZWGc' },
        'زيت السمك أوميغا 3': { price: 135.00, image: 'https://www.bloompharmacy.com/cdn/shop/products/omega-3-plus-30-capsules-800425.jpg?v=1687731304' },
        'لوشن مرطب': { price: 534.75, image: 'https://www.bloompharmacy.com/cdn/shop/products/cerave-moisturizing-lotion-236ml-702103.jpg?v=1687732229' },
        'واقي شمسي SPF 50': { price: 275.00, image: 'https://cairomegastore.com/wp-content/uploads/2023/06/Sunscreen-Gel-Extra-Lightening-SPF-50-Anti-dark-spots-50gm.webp' },
        'ترمومتر رقمي': { price: 80.00, image: 'https://qasrelteb.com/wp-content/uploads/2021/04/1-30.jpg' },
        'جهاز قياس ضغط الدم': { price: 2999.00, image: 'https://www.bloompharmacy.com/cdn/shop/products/beurer-bm-28-upper-arm-blood-pressure-227973.jpg?v=1687635069' }
    };

    const products = [];
    let id = 1;

    categories.forEach(category => {
        productNames[category].forEach(name => {
            const realProduct = realProducts[name];
            const basePrice = realProduct ? realProduct.price : Math.random() * 500 + 10;
            const hasDiscount = Math.random() > 0.8;
            const discount = hasDiscount ? Math.random() * 0.3 + 0.1 : 0;

            products.push({
                id: id++,
                title: name,
                brand: brands[Math.floor(Math.random() * brands.length)],
                category: category,
                price: parseFloat((basePrice * (1 - discount)).toFixed(2)),
                originalPrice: hasDiscount ? parseFloat(basePrice.toFixed(2)) : null,
                discount: hasDiscount ? Math.round(discount * 100) : 0,
                image: realProduct ? realProduct.image : getProductImage(category),
                description: `منتج عالي الجودة ${name.toLowerCase()} من ${brands[Math.floor(Math.random() * brands.length)]}. موثوق به من قبل متخصصي الرعاية الصحية في جميع أنحاء العالم.`,
                inStock: Math.random() > 0.1,
                prescription: category === 'medicines' && Math.random() > 0.6,
                featured: Math.random() > 0.8,
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                reviews: Math.floor(Math.random() * 1000) + 5,
                tags: generateTags(category, name)
            });
        });
    });

    return products;
}

function generateTags(category, name) {
    const commonTags = {
        medicines: ['pain relief', 'health', 'medicine', 'prescription'],
        wellness: ['supplement', 'nutrition', 'vitamin', 'health'],
        'personal-care': ['skincare', 'beauty', 'personal', 'care'],
        devices: ['medical', 'device', 'health', 'monitoring']
    };

    return commonTags[category] || ['health'];
}

function getProductImage(category) {
    const images = {
        medicines: 'https://images.pexels.com/photos/3683051/pexels-photo-3683051.jpeg',
        wellness: 'https://images.pexels.com/photos/4173624/pexels-photo-4173624.jpeg',
        'personal-care': 'https://images.pexels.com/photos/4465829/pexels-photo-4465829.jpeg',
        devices: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg'
    };

    return images[category] || images.medicines;
}

// Global helper functions
window.filterByCategory = (category) => {
    window.location.href = `products.html?category=${category}`;
};

window.selectSearchSuggestion = (productTitle) => {
    const searchInput = document.getElementById('header-search');
    if (searchInput) {
        searchInput.value = productTitle;
        window.app.performSearch(productTitle);
    }
};

window.addToCart = (productId, quantity = 1) => {
    const products = window.app.getFromStorage('products', []);
    const product = products.find(p => p.id == productId);
    
    if (product) {
        window.app.cart.add(product, quantity);
    }
};

window.removeFromCart = (productId) => {
    window.app.cart.remove(productId);
};

window.updateCartQuantity = (productId, quantity) => {
    window.app.cart.updateQuantity(productId, parseInt(quantity));
};

// Format currency
window.formatPrice = (price) => {
    return window.app.formatPrice(price);
};