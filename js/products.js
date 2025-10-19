// Products functionality
let currentProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;

async function initProductsPage() {
    try {
        await loadProducts();
        setupFilters();
        setupSorting();
        setupPagination();
        applyURLFilters();
        renderProducts();
    } catch (error) {
        console.error('Error initializing products page:', error);
    }
}

async function loadProducts() {
    try {
        // Try to load from localStorage first
        let products = app.getFromStorage('products');
        
        if (!products) {
            // Generate demo products if not in storage
            products = generateDemoProducts();
            app.setToStorage('products', products);
        }
        
        currentProducts = products;
        filteredProducts = [...products];
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
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

function setupFilters() {
    // Category filters
    const categoryFilters = document.querySelectorAll('input[name="category"]');
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    // Price filter
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');
    
    if (priceSlider && priceValue) {
        // Set initial max value based on products
        const maxPrice = Math.max(...currentProducts.map(p => p.price));
        priceSlider.max = Math.ceil(maxPrice);
        priceSlider.value = Math.ceil(maxPrice);
        priceValue.textContent = Math.ceil(maxPrice);
        
        priceSlider.addEventListener('input', (e) => {
            priceValue.textContent = e.target.value;
            applyFilters();
        });
    }

    // Prescription filters
    const prescriptionFilters = document.querySelectorAll('input[name="prescription"]');
    prescriptionFilters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    // Brand filters
    setupBrandFilters();

    // Clear filters
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }
}

function setupBrandFilters() {
    const brands = [...new Set(currentProducts.map(p => p.brand))].sort();
    const brandFilters = document.getElementById('brand-filters');
    
    if (brandFilters) {
        brandFilters.innerHTML = brands.map(brand => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${brand}" name="brand">
                <span class="checkmark"></span>
                ${brand}
            </label>
        `).join('');

        // Add event listeners to new brand filters
        const newFilters = brandFilters.querySelectorAll('input[name="brand"]');
        newFilters.forEach(filter => {
            filter.addEventListener('change', applyFilters);
        });
    }
}

function setupSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProducts(e.target.value);
            renderProducts();
        });
    }
}

function setupPagination() {
    // Pagination is handled in renderProducts function
}

function applyURLFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Apply category filter from URL
    const category = urlParams.get('category');
    if (category) {
        const categoryFilter = document.querySelector(`input[value="${category}"][name="category"]`);
        if (categoryFilter) {
            categoryFilter.checked = true;
        }
    }

    // Apply search query from URL
    const search = urlParams.get('search');
    if (search) {
        const searchInput = document.getElementById('header-search');
        if (searchInput) {
            searchInput.value = search;
        }
    }

    applyFilters();
}

function applyFilters() {
    filteredProducts = [...currentProducts];

    // Apply category filters
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
        .map(cb => cb.value);
    
    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedCategories.includes(p.category));
    }

    // Apply brand filters
    const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked'))
        .map(cb => cb.value);
    
    if (selectedBrands.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedBrands.includes(p.brand));
    }

    // Apply price filter
    const priceSlider = document.getElementById('price-slider');
    if (priceSlider) {
        const maxPrice = parseFloat(priceSlider.value);
        filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
    }

    // Apply prescription filter
    const selectedPrescriptionTypes = Array.from(document.querySelectorAll('input[name="prescription"]:checked'))
        .map(cb => cb.value);
    
    if (selectedPrescriptionTypes.length > 0) {
        filteredProducts = filteredProducts.filter(p => {
            if (selectedPrescriptionTypes.includes('prescription') && p.prescription) return true;
            if (selectedPrescriptionTypes.includes('otc') && !p.prescription) return true;
            return false;
        });
    }

    // Apply search filter
    const searchQuery = getSearchQuery();
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    currentPage = 1; // Reset to first page
    renderProducts();
}

function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search');
    const headerSearch = document.getElementById('header-search')?.value.trim();
    
    return urlSearch || headerSearch || '';
}

function sortProducts(sortBy) {
    switch (sortBy) {
        case 'name':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'popularity':
            filteredProducts.sort((a, b) => b.reviews - a.reviews);
            break;
        default:
            // No sorting
            break;
    }
}

function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    // Update results count
    updateResultsCount();

    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    // Render products
    if (productsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button class="btn btn-primary" onclick="clearAllFilters()">Clear Filters</button>
            </div>
        `;
    } else {
        container.innerHTML = productsToShow.map(product => createProductCard(product)).join('');
    }

    // Render pagination
    renderPagination(totalPages);

    // Setup view toggle
    setupViewToggle();
}

function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        const total = filteredProducts.length;
        const showing = Math.min(productsPerPage, total);
        const start = (currentPage - 1) * productsPerPage + 1;
        const end = Math.min(currentPage * productsPerPage, total);
        
        if (total === 0) {
            resultsCount.textContent = 'No products found';
        } else {
            resultsCount.textContent = `Showing ${start}-${end} of ${total} products`;
        }
    }
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

function setupViewToggle() {
    const viewToggles = document.querySelectorAll('.view-toggle');
    const productsGrid = document.getElementById('products-grid');
    
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const view = toggle.dataset.view;
            
            // Update active toggle
            viewToggles.forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
            
            // Update grid layout
            if (productsGrid) {
                if (view === 'list') {
                    productsGrid.style.gridTemplateColumns = '1fr';
                    productsGrid.querySelectorAll('.product-card').forEach(card => {
                        card.classList.add('list-view');
                    });
                } else {
                    productsGrid.style.gridTemplateColumns = '';
                    productsGrid.querySelectorAll('.product-card').forEach(card => {
                        card.classList.remove('list-view');
                    });
                }
            }
        });
    });
}

function createProductCard(product) {
    const discountBadge = product.discount > 0 ? 
        `<div class="offer-badge">${product.discount}% OFF</div>` : '';
    
    const prescriptionBadge = product.prescription ? 
        `<div class="prescription-badge">Rx Required</div>` : '';
    
    const originalPriceHTML = product.originalPrice ? 
        `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : '';
    
    const discountHTML = product.discount > 0 ? 
        `<span class="price-discount">${product.discount}% off</span>` : '';

    return `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}" loading="lazy">
                ${discountBadge}
                ${prescriptionBadge}
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-price">
                    <span class="price-current">${formatPrice(product.price)}</span>
                    ${originalPriceHTML}
                    ${discountHTML}
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline" onclick="viewProduct(${product.id})">
                        View Details
                    </button>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})" 
                            ${!product.inStock ? 'disabled' : ''}>
                        ${product.inStock ? '<i class="fas fa-cart-plus"></i> Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return `<div class="rating-stars">${stars} ${rating}</div>`;
}

function clearAllFilters() {
    // Clear all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Reset price slider
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');
    if (priceSlider && priceValue) {
        priceSlider.value = priceSlider.max;
        priceValue.textContent = priceSlider.max;
    }

    // Clear search
    const searchInput = document.getElementById('header-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // Reset sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = 'name';
    }

    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);

    // Reapply filters
    applyFilters();
}

// Global functions
window.changePage = (page) => {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.viewProduct = (productId) => {
    window.location.href = `product.html?id=${productId}`;
};

// Product Detail Page functionality
async function initProductDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        await loadProductDetail(productId);
        loadRelatedProducts();
    } else {
        // Redirect to products page if no ID
        window.location.href = 'products.html';
    }
}

async function loadProductDetail(productId) {
    try {
        const products = await loadProducts();
        const product = products.find(p => p.id == productId);
        
        if (!product) {
            window.location.href = 'products.html';
            return;
        }

        renderProductDetail(product);
        updateBreadcrumb(product);
        
    } catch (error) {
        console.error('Error loading product detail:', error);
    }
}

function renderProductDetail(product) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const discountBadge = product.discount > 0 ? 
        `<div class="offer-badge">${product.discount}% OFF</div>` : '';
    
    const prescriptionBadge = product.prescription ? 
        `<div class="prescription-badge">Prescription Required</div>` : '';
    
    const originalPriceHTML = product.originalPrice ? 
        `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : '';

    container.innerHTML = `
        <div class="product-gallery">
            <div class="gallery-thumbs">
                <div class="thumb active">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="thumb">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="thumb">
                    <img src="${product.image}" alt="${product.title}">
                </div>
            </div>
            <div class="gallery-main">
                <img src="${product.image}" alt="${product.title}">
                ${discountBadge}
                ${prescriptionBadge}
            </div>
        </div>
        
        <div class="product-details">
            <div class="product-meta">
                <div class="product-brand">${product.brand}</div>
                <h1 class="product-title">${product.title}</h1>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span>(${product.reviews} reviews)</span>
                </div>
                <div class="product-price">
                    <span class="price-current">${formatPrice(product.price)}</span>
                    ${originalPriceHTML}
                </div>
            </div>
            
            <div class="product-description">
                <h3>Description</h3>
                <p>${product.description}</p>
                <h4>Key Benefits:</h4>
                <ul>
                    <li>High quality ingredients</li>
                    <li>Fast acting formula</li>
                    <li>Clinically tested</li>
                    <li>Safe for daily use</li>
                </ul>
            </div>
            
            <div class="product-options">
                ${product.prescription ? 
                    `<div class="prescription-notice">
                        <i class="fas fa-exclamation-triangle"></i>
                        This is a prescription medication. Please upload your prescription before ordering.
                        <a href="upload.html" class="btn btn-secondary">Upload Prescription</a>
                    </div>` : ''
                }
                
                <div class="quantity-selector">
                    <label>Quantity:</label>
                    <div class="quantity-controls">
                        <button type="button" onclick="adjustQuantity(-1)">-</button>
                        <input type="number" id="product-quantity" value="1" min="1" max="10">
                        <button type="button" onclick="adjustQuantity(1)">+</button>
                    </div>
                </div>
                
                <div class="add-to-cart-section">
                    <button class="btn btn-primary btn-lg" onclick="addProductToCart(${product.id})" 
                            ${!product.inStock ? 'disabled' : ''}>
                        ${product.inStock ? 
                            '<i class="fas fa-cart-plus"></i> Add to Cart' : 
                            'Out of Stock'
                        }
                    </button>
                    <button class="btn btn-outline" onclick="addToWishlist(${product.id})">
                        <i class="fas fa-heart"></i> Wishlist
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup gallery functionality
    setupProductGallery();
}

function setupProductGallery() {
    const thumbs = document.querySelectorAll('.thumb');
    const mainImage = document.querySelector('.gallery-main img');
    
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            const img = thumb.querySelector('img');
            if (mainImage && img) {
                mainImage.src = img.src;
            }
        });
    });
}

function updateBreadcrumb(product) {
    const breadcrumbProduct = document.getElementById('breadcrumb-product');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = product.title;
    }
}

async function loadRelatedProducts() {
    try {
        const products = await loadProducts();
        const urlParams = new URLSearchParams(window.location.search);
        const currentProductId = parseInt(urlParams.get('id'));
        const currentProduct = products.find(p => p.id === currentProductId);
        
        if (!currentProduct) return;
        
        // Find related products by category
        const related = products
            .filter(p => p.id !== currentProductId && p.category === currentProduct.category)
            .slice(0, 4);
        
        const container = document.getElementById('related-products');
        if (container && related.length > 0) {
            container.innerHTML = related.map(product => createProductCard(product)).join('');
        }
        
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

// Global functions for product detail page
window.adjustQuantity = (change) => {
    const quantityInput = document.getElementById('product-quantity');
    if (quantityInput) {
        const currentValue = parseInt(quantityInput.value);
        const newValue = currentValue + change;
        
        if (newValue >= 1 && newValue <= 10) {
            quantityInput.value = newValue;
        }
    }
};

window.addProductToCart = (productId) => {
    const quantityInput = document.getElementById('product-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    addToCart(productId, quantity);
};

window.addToWishlist = (productId) => {
    // Demo wishlist functionality
    app.showToast('Added to wishlist!', 'success');
};