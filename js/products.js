// Products functionality
let currentProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;

async function initProductsPage() {
    try {
        currentProducts = app.products;
        filteredProducts = [...app.products];
        setupFilters();
        setupSorting();
        setupPagination();
        applyURLFilters();
        renderProducts();
    } catch (error) {
        console.error('Error initializing products page:', error);
    }
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
        const products = app.products;
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
        const products = app.products;
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