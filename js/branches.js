// Branches Page functionality
function initBranchesPage() {
    setupLocationFinder();
    setupDirections();
}

function setupLocationFinder() {
    const locationInput = document.getElementById('location-input');
    const findButton = document.querySelector('button[onclick="findNearestStore()"]');
    
    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                findNearestStore();
            }
        });
    }
}

function setupDirections() {
    // Direction buttons are handled by onclick attributes in HTML
}

// Global functions
window.findNearestStore = () => {
    const locationInput = document.getElementById('location-input');
    const location = locationInput?.value.trim();
    
    if (!location) {
        app.showToast('Please enter your location', 'error');
        return;
    }
    
    // Show loading state
    const button = document.querySelector('button[onclick="findNearestStore()"]');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    button.disabled = true;
    
    // Simulate search
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show results
        app.showToast('Found 3 stores near your location', 'success');
        
        // Highlight nearest store
        const storeCards = document.querySelectorAll('.store-card');
        storeCards.forEach((card, index) => {
            if (index === 0) {
                card.style.border = '2px solid var(--primary-blue)';
                card.style.background = '#f0f8ff';
            } else {
                card.style.border = '';
                card.style.background = '';
            }
        });
        
        // Scroll to stores
        document.querySelector('.stores-list').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
    }, 2000);
};

window.getDirections = (address) => {
    // Open Google Maps with directions
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
};