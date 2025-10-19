// Contact Page functionality
function initContactPage() {
    setupContactForm();
}

function setupContactForm() {
    const form = document.getElementById('contact-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleContactSubmission();
        });
    }
}

function handleContactSubmission() {
    const form = document.getElementById('contact-form');
    
    // Validate form
    if (!validateContactForm(form)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Collect form data
    const contactData = {
        id: Date.now(),
        date: new Date().toISOString(),
        firstName: document.getElementById('first-name')?.value,
        lastName: document.getElementById('last-name')?.value,
        email: document.getElementById('contact-email')?.value,
        phone: document.getElementById('contact-phone')?.value,
        subject: document.getElementById('subject')?.value,
        message: document.getElementById('message')?.value,
        newsletter: document.getElementById('newsletter')?.checked
    };
    
    // Simulate submission
    setTimeout(() => {
        // Save contact message
        saveContactMessage(contactData);
        
        // Reset form
        form.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        app.showToast('Message sent successfully! We will get back to you within 24 hours.', 'success');
        
        // Show success modal
        showContactSuccessModal(contactData);
        
    }, 2000);
}

function validateContactForm(form) {
    const requiredFields = [
        { id: 'first-name', name: 'first name' },
        { id: 'last-name', name: 'last name' },
        { id: 'contact-email', name: 'email' },
        { id: 'subject', name: 'subject' },
        { id: 'message', name: 'message' }
    ];
    
    for (const fieldInfo of requiredFields) {
        const field = document.getElementById(fieldInfo.id);
        if (!field || !field.value.trim()) {
            app.showToast(`Please fill in the ${fieldInfo.name} field`, 'error');
            field?.focus();
            return false;
        }
    }
    
    // Validate email
    const email = document.getElementById('contact-email').value;
    if (!app.validateEmail(email)) {
        app.showToast('Please enter a valid email address', 'error');
        return false;
    }
    
    // Validate phone if provided
    const phone = document.getElementById('contact-phone')?.value;
    if (phone && !app.validatePhone(phone)) {
        app.showToast('Please enter a valid phone number', 'error');
        return false;
    }
    
    return true;
}

function saveContactMessage(contactData) {
    const messages = app.getFromStorage('contactMessages', []);
    messages.unshift(contactData);
    app.setToStorage('contactMessages', messages);
}

function showContactSuccessModal(contactData) {
    const modal = app.showModal('Message Sent Successfully', `
        <div class="success-content">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success-green); margin-bottom: 1rem;"></i>
            <h4>Thank you, ${contactData.firstName}!</h4>
            <p>Your message has been sent successfully.</p>
            <div class="contact-details">
                <p><strong>Reference ID:</strong> MSG${contactData.id}</p>
                <p><strong>Subject:</strong> ${contactData.subject}</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
            </div>
            <p>We will get back to you at ${contactData.email} as soon as possible.</p>
            <div class="quick-contact">
                <p>Need immediate assistance?</p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
                    <a href="tel:+201278954279" class="btn btn-primary">
                        <i class="fas fa-phone"></i> Call Us
                    </a>
                    <a href="https://wa.me/1234567890" class="btn btn-success" target="_blank">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Continue Shopping',
            class: 'btn-primary',
            onclick: 'window.location.href="products.html"; this.closest(".modal").remove();'
        },
        {
            text: 'Close',
            class: 'btn-secondary',
            onclick: 'this.closest(".modal").remove();'
        }
    ]);
}