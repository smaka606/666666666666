// Prescription Upload functionality
function initUploadPage() {
    setupFileUpload();
    setupCameraCapture();
    setupFormSubmission();
}

function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadedFiles = document.getElementById('uploaded-files');
    
    if (!uploadArea || !fileInput) return;
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
}

function setupCameraCapture() {
    const cameraBtn = document.getElementById('camera-btn');
    
    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            // Check if device supports camera
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                openCameraModal();
            } else {
                app.showToast('Camera not supported on this device', 'error');
            }
        });
    }
}

function openCameraModal() {
    const modal = app.showModal('Take Photo', `
        <div class="camera-container">
            <video id="camera-video" autoplay playsinline style="width: 100%; max-width: 400px; border-radius: 8px;"></video>
            <canvas id="camera-canvas" style="display: none;"></canvas>
            <div class="camera-controls" style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-primary" onclick="capturePhoto()">
                    <i class="fas fa-camera"></i> Capture
                </button>
                <button class="btn btn-secondary" onclick="closeCameraModal()">
                    Cancel
                </button>
            </div>
        </div>
    `);
    
    // Start camera
    startCamera();
    
    // Store modal reference
    window.cameraModal = modal;
}

async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // Use back camera if available
            } 
        });
        
        video.srcObject = stream;
        window.cameraStream = stream;
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        app.showToast('Unable to access camera', 'error');
        closeCameraModal();
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (!video || !canvas) return;
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob((blob) => {
        const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFiles([file]);
        closeCameraModal();
    }, 'image/jpeg', 0.8);
}

function closeCameraModal() {
    // Stop camera stream
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    
    // Close modal
    if (window.cameraModal) {
        window.cameraModal.remove();
        window.cameraModal = null;
    }
}

function handleFiles(files) {
    const uploadedFiles = document.getElementById('uploaded-files');
    if (!uploadedFiles) return;
    
    const validFiles = files.filter(file => validateFile(file));
    
    if (validFiles.length === 0) return;
    
    // Show uploaded files section
    uploadedFiles.style.display = 'block';
    
    validFiles.forEach(file => {
        const fileElement = createFileElement(file);
        uploadedFiles.appendChild(fileElement);
    });
    
    app.showToast(`${validFiles.length} file(s) uploaded successfully`, 'success');
}

function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
        app.showToast(`${file.name}: Invalid file type. Please upload JPG, PNG, or PDF files.`, 'error');
        return false;
    }
    
    if (file.size > maxSize) {
        app.showToast(`${file.name}: File too large. Maximum size is 5MB.`, 'error');
        return false;
    }
    
    return true;
}

function createFileElement(file) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file';
    
    const fileIcon = file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-image';
    const fileSize = formatFileSize(file.size);
    
    fileDiv.innerHTML = `
        <div class="file-info">
            <i class="fas ${fileIcon}"></i>
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
        </div>
        <button class="file-remove" onclick="removeFile(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    return fileDiv;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function setupFormSubmission() {
    const form = document.getElementById('prescription-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePrescriptionSubmission();
        });
    }
}

function handlePrescriptionSubmission() {
    const form = document.getElementById('prescription-form');
    const uploadedFiles = document.querySelectorAll('.uploaded-file');
    
    // Validate form
    if (!validatePrescriptionForm(form, uploadedFiles)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Collect form data
    const prescriptionData = {
        id: Date.now(),
        date: new Date().toISOString(),
        status: 'pending',
        patient: {
            name: document.getElementById('patient-name')?.value,
            age: document.getElementById('patient-age')?.value,
            phone: document.getElementById('patient-phone')?.value,
            email: document.getElementById('patient-email')?.value
        },
        delivery: {
            address: document.getElementById('delivery-address')?.value,
            preferredTime: document.getElementById('delivery-time')?.value,
            instructions: document.getElementById('special-instructions')?.value
        },
        files: Array.from(uploadedFiles).map(file => ({
            name: file.querySelector('.file-name').textContent,
            size: file.querySelector('.file-size').textContent,
            type: file.querySelector('.fas').classList.contains('fa-file-pdf') ? 'pdf' : 'image'
        }))
    };
    
    // Simulate submission
    setTimeout(() => {
        // Save prescription
        savePrescription(prescriptionData);
        
        // Reset form
        form.reset();
        document.getElementById('uploaded-files').innerHTML = '';
        document.getElementById('uploaded-files').style.display = 'none';
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        app.showToast('Prescription submitted successfully! We will call you within 2 hours.', 'success');
        
        // Show success modal
        showPrescriptionSuccessModal(prescriptionData);
        
    }, 3000);
}

function validatePrescriptionForm(form, uploadedFiles) {
    // Check if files are uploaded
    if (uploadedFiles.length === 0) {
        app.showToast('Please upload at least one prescription file', 'error');
        return false;
    }
    
    // Check required fields
    const requiredFields = [
        { id: 'patient-name', name: 'patient name' },
        { id: 'patient-age', name: 'patient age' },
        { id: 'patient-phone', name: 'phone number' },
        { id: 'delivery-address', name: 'delivery address' }
    ];
    
    for (const fieldInfo of requiredFields) {
        const field = document.getElementById(fieldInfo.id);
        if (!field || !field.value.trim()) {
            app.showToast(`Please fill in the ${fieldInfo.name} field`, 'error');
            field?.focus();
            return false;
        }
    }
    
    // Validate phone number
    const phone = document.getElementById('patient-phone').value;
    if (!app.validatePhone(phone)) {
        app.showToast('Please enter a valid phone number', 'error');
        return false;
    }
    
    // Validate email if provided
    const email = document.getElementById('patient-email')?.value;
    if (email && !app.validateEmail(email)) {
        app.showToast('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

function savePrescription(prescriptionData) {
    const prescriptions = app.getFromStorage('prescriptions', []);
    prescriptions.unshift(prescriptionData);
    app.setToStorage('prescriptions', prescriptions);
}

function showPrescriptionSuccessModal(prescriptionData) {
    const modal = app.showModal('Prescription Submitted Successfully', `
        <div class="success-content">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success-green); margin-bottom: 1rem;"></i>
            <h4>Thank you, ${prescriptionData.patient.name}!</h4>
            <p>Your prescription has been submitted successfully.</p>
            <div class="prescription-details">
                <p><strong>Reference ID:</strong> RX${prescriptionData.id}</p>
                <p><strong>Status:</strong> Under Review</p>
                <p><strong>Expected Call:</strong> Within 2 hours</p>
            </div>
            <p>Our licensed pharmacist will review your prescription and call you at ${prescriptionData.patient.phone} to confirm the order and delivery details.</p>
        </div>
    `, [
        {
            text: 'Track Status',
            class: 'btn-primary',
            onclick: 'window.location.href="account.html?tab=prescriptions"; this.closest(".modal").remove();'
        },
        {
            text: 'Continue Shopping',
            class: 'btn-secondary',
            onclick: 'window.location.href="products.html"; this.closest(".modal").remove();'
        }
    ]);
}

// Global functions
window.removeFile = (button) => {
    const fileElement = button.closest('.uploaded-file');
    if (fileElement) {
        fileElement.remove();
        
        // Hide uploaded files section if no files left
        const uploadedFiles = document.getElementById('uploaded-files');
        if (uploadedFiles && uploadedFiles.children.length === 0) {
            uploadedFiles.style.display = 'none';
        }
    }
};

window.capturePhoto = capturePhoto;
window.closeCameraModal = closeCameraModal;