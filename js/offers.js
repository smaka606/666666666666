// Offers Page functionality
function initOffersPage() {
    loadOffers();
    startCountdown();
    loadDealOfTheDay();
}

function loadOffers() {
    loadFeaturedOffers();
}

async function loadFeaturedOffers() {
    try {
        // Load products from storage or generate them
        let products = app.getFromStorage('products');
        if (!products) {
            // If products don't exist, generate them
            const productsModule = await import('./products.js');
            products = productsModule.generateDemoProducts ? productsModule.generateDemoProducts() : [];
            app.setToStorage('products', products);
        }
        
        const offerProducts = products.filter(p => p.discount > 0).slice(0, 8);
        
        const container = document.getElementById('offers-grid');
        if (container) {
            container.innerHTML = offerProducts.map(product => createOfferCard(product)).join('');
        }
    } catch (error) {
        console.error('Error loading offers:', error);
        // Fallback: show message if no offers available
        const container = document.getElementById('offers-grid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-tags" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No offers available</h3>
                    <p>Check back soon for exciting deals!</p>
                    <a href="products.html" class="btn btn-primary">Browse All Products</a>
                </div>
            `;
        }
    }
}

function createOfferCard(product) {
    return `
        <div class="product-card offer-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}">
                <div class="offer-badge">${product.discount}% OFF</div>
                ${product.prescription ? '<div class="prescription-badge">Rx Required</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">
                    <span class="price-current">${formatPrice(product.price)}</span>
                    <span class="price-original">${formatPrice(product.originalPrice)}</span>
                    <span class="price-discount">Save ${formatPrice(product.originalPrice - product.price)}</span>
                </div>
                <div class="offer-validity">
                    <i class="fas fa-clock"></i>
                    Limited time offer
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline" onclick="viewProduct(${product.id})">
                        View Details
                    </button>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}

function startCountdown() {
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (!hoursElement || !minutesElement || !secondsElement) return;
    
    // Set countdown to end of day
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    function updateCountdown() {
        const now = new Date();
        const timeLeft = endOfDay - now;
        
        if (timeLeft <= 0) {
            // Reset to next day
            endOfDay.setDate(endOfDay.getDate() + 1);
            endOfDay.setHours(23, 59, 59, 999);
            return;
        }
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

async function loadDealOfTheDay() {
    try {
        let products = app.getFromStorage('products');
        if (!products) {
            products = [];
        }
        
        const dealProduct = products.find(p => p.discount >= 30) || products[0];
        
        const container = document.getElementById('deal-product');
        if (container && dealProduct) {
            container.innerHTML = `
                <div class="deal-product-card">
                    <div class="deal-image">
                        <img src="${dealProduct.image}" alt="${dealProduct.title}">
                        <div class="deal-badge">${dealProduct.discount}% OFF</div>
                    </div>
                    <div class="deal-info">
                        <div class="deal-brand">${dealProduct.brand}</div>
                        <h3 class="deal-title">${dealProduct.title}</h3>
                        <div class="deal-price">
                            <span class="price-current">${formatPrice(dealProduct.price)}</span>
                            ${dealProduct.originalPrice ? 
                                `<span class="price-original">${formatPrice(dealProduct.originalPrice)}</span>` : ''
                            }
                        </div>
                        <div class="deal-savings">
                            You save ${formatPrice((dealProduct.originalPrice || dealProduct.price * 1.5) - dealProduct.price)}!
                        </div>
                        <div class="deal-actions">
                            <button class="btn btn-success btn-lg" onclick="addToCart(${dealProduct.id})">
                                <i class="fas fa-cart-plus"></i> Grab This Deal
                            </button>
                            <button class="btn btn-outline" onclick="viewProduct(${dealProduct.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (container) {
            container.innerHTML = `
                <div class="deal-placeholder">
                    <h3>Deal of the Day Coming Soon!</h3>
                    <p>Check back tomorrow for an amazing deal.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading deal of the day:', error);
    }
}

// Add some CSS for offer-specific styling
const offerStyles = `
    .offer-card {
        position: relative;
        overflow: hidden;
    }
    
    .offer-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-orange), var(--warning-yellow));
        z-index: 1;
    }
    
    .offer-validity {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--accent-orange);
        margin-bottom: 1rem;
        font-weight: 500;
    }
    
    .deal-product-card {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: center;
        background: rgba(255, 255, 255, 0.1);
        padding: 2rem;
        border-radius: 1rem;
        backdrop-filter: blur(10px);
    }
    
    .deal-image {
        position: relative;
        text-align: center;
    }
    
    .deal-image img {
        width: 100%;
        max-width: 300px;
        height: 300px;
        object-fit: cover;
        border-radius: 1rem;
    }
    
    .deal-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--error-red);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        font-weight: 700;
        font-size: 1.25rem;
    }
    
    .deal-info {
        text-align: center;
    }
    
    .deal-brand {
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 0.5rem;
    }
    
    .deal-title {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: white;
    }
    
    .deal-price {
        margin-bottom: 1rem;
    }
    
    .deal-price .price-current {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
    }
    
    .deal-price .price-original {
        font-size: 1.5rem;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: line-through;
        margin-left: 1rem;
    }
    
    .deal-savings {
        font-size: 1.25rem;
        color: var(--warning-yellow);
        font-weight: 600;
        margin-bottom: 2rem;
    }
    
    .deal-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }
    
    .deal-actions .btn {
        min-width: 200px;
    }
    
    @media (max-width: 768px) {
        .deal-product-card {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1rem;
        }
        
        .deal-title {
            font-size: 1.5rem;
        }
        
        .deal-price .price-current {
            font-size: 2rem;
        }
        
        .deal-actions {
            flex-direction: column;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = offerStyles;
document.head.appendChild(styleSheet);