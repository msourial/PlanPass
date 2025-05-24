document.addEventListener('DOMContentLoaded', function() {
    // File upload elements
    const uploadForm = document.getElementById('uploadForm');
    const ifcDropzone = document.getElementById('ifcDropzone');
    const ifcFileInput = document.getElementById('ifcFileInput');
    const ifcFileNameDisplay = document.getElementById('ifcFileNameDisplay');
    const zipCodeInput = document.getElementById('zipCodeInput');
    const zipCodeStatus = document.getElementById('zipCodeStatus');
    const zipCodeInfo = document.getElementById('zipCodeInfo');
    const checkComplianceBtn = document.getElementById('checkComplianceBtn');
    
    // Viewer elements
    const viewerPlaceholder = document.getElementById('viewerPlaceholder');
    const viewer = document.getElementById('viewer');
    const viewerControls = document.getElementById('viewerControls');
    
    // Report elements
    const reportPanel = document.getElementById('reportPanel');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const viewInModelBtn = document.getElementById('viewInModelBtn');
    
    // Loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    
    // Initialize tooltips
    initTooltips();
    
    // Handle IFC file input
    ifcDropzone.addEventListener('click', () => {
        ifcFileInput.click();
    });
    
    ifcFileInput.addEventListener('change', (e) => {
        handleFileSelection(e, ifcFileNameDisplay, 'fas fa-building', 'ifc');
    });
    
    // Handle zip code input validation
    zipCodeInput.addEventListener('input', function(e) {
        const zipCode = e.target.value.trim();
        
        if (zipCode.length === 5 && /^\d{5}$/.test(zipCode)) {
            validateZipCode(zipCode);
        } else if (zipCode.length > 0) {
            showZipCodeStatus(false, 'Please enter a 5-digit zip code');
        } else {
            hideZipCodeStatus();
        }
        
        updateSubmitButtonState();
    });
    
    // Handle drag and drop for IFC
    setupDragAndDrop(ifcDropzone, ifcFileInput, ifcFileNameDisplay, 'fas fa-building', 'ifc');
    
    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        const zipCode = zipCodeInput.value.trim();
        if (!ifcFileInput.files.length) {
            showToast('Please upload an IFC file', 'error');
            return;
        }
        
        if (!zipCode || !/^\d{5}$/.test(zipCode)) {
            showToast('Please enter a valid 5-digit Texas zip code', 'error');
            return;
        }
        
        // Show loading skeleton instead of generic overlay
        showViewerLoadingSkeleton();
        
        // Prepare form data
        const formData = new FormData();
        formData.append('ifc_file', ifcFileInput.files[0]);
        formData.append('zip_code', zipCode);
        
        // Send request to server
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            hideViewerLoadingSkeleton();
            
            if (data.success) {
                // Hide placeholder and show viewer
                viewerPlaceholder.classList.add('hidden');
                viewer.classList.remove('hidden');
                viewerControls.classList.remove('hidden');
                
                // Initialize 3D viewer with IFC data
                initViewer(data.ifc_data);
                
                // Show and populate report
                reportPanel.classList.remove('hidden');
                populateReport(data.compliance_results, data.report_hash);
                
                // Scroll to report section
                reportPanel.scrollIntoView({ behavior: 'smooth' });
                
                showToast('Files processed successfully', 'success');
            } else {
                showToast(data.error || 'Error processing files', 'error');
            }
        })
        .catch(error => {
            hideViewerLoadingSkeleton();
            console.error('Error:', error);
            showToast('An error occurred while processing the files', 'error');
        });
    });
    
    // Handle download report button
    downloadReportBtn.addEventListener('click', function() {
        generatePdfReport();
    });
    
    // Handle view in model button
    viewInModelBtn.addEventListener('click', function() {
        // Scroll to viewer section
        document.getElementById('viewerContainer').scrollIntoView({ behavior: 'smooth' });
        
        // Highlight non-compliant doors in the viewer
        highlightNonCompliantDoors();
    });
    
    // Function to handle file selection
    function handleFileSelection(event, displayElement, iconClass, fileType) {
        const file = event.target.files[0];
        
        if (file) {
            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                showToast(`File exceeds the 50MB size limit`, 'error');
                event.target.value = '';
                return;
            }
            
            // Validate file extension
            const validExtensions = fileType === 'ifc' ? ['ifc'] : ['pdf'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (!validExtensions.includes(fileExtension)) {
                showToast(`Invalid file format. Please upload a ${fileType.toUpperCase()} file`, 'error');
                event.target.value = '';
                return;
            }
            
            // Update display with file name
            displayElement.innerHTML = `
                <span class="font-medium text-blue-600 dark:text-blue-400">${file.name}</span>
                <span class="text-slate-500 dark:text-slate-400 text-sm block mt-1">${formatFileSize(file.size)}</span>
            `;
            
            // Update parent container style
            const dropzone = displayElement.parentElement;
            dropzone.classList.add('border-blue-500');
            dropzone.classList.remove('border-slate-300', 'dark:border-slate-600');
            
            // Update icon
            const iconElement = dropzone.querySelector('div');
            iconElement.className = `${iconClass} text-blue-500 text-4xl mb-2`;
            
            // Enable submit button if both files are selected
            updateSubmitButtonState();
        }
    }
    
    // Function to set up drag and drop
    function setupDragAndDrop(dropzone, fileInput, displayElement, iconClass, fileType) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropzone.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-300', 'dark:border-blue-700');
            dropzone.classList.remove('border-slate-300', 'dark:border-slate-600');
        }
        
        function unhighlight() {
            dropzone.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-300', 'dark:border-blue-700');
            if (!fileInput.files.length) {
                dropzone.classList.add('border-slate-300', 'dark:border-slate-600');
            } else {
                dropzone.classList.add('border-blue-500');
            }
        }
        
        dropzone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            
            if (file) {
                // Only accept the correct file type
                const fileExtension = file.name.split('.').pop().toLowerCase();
                const validExtensions = fileType === 'ifc' ? ['ifc'] : ['pdf'];
                
                if (validExtensions.includes(fileExtension)) {
                    fileInput.files = dt.files;
                    const event = new Event('change');
                    fileInput.dispatchEvent(event);
                } else {
                    showToast(`Invalid file format. Please upload a ${fileType.toUpperCase()} file`, 'error');
                }
            }
        }, false);
    }
    
    // Update submit button state
    function updateSubmitButtonState() {
        const zipCode = zipCodeInput.value.trim();
        if (ifcFileInput.files.length && zipCode && /^\d{5}$/.test(zipCode)) {
            checkComplianceBtn.disabled = false;
        } else {
            checkComplianceBtn.disabled = true;
        }
    }
    
    // Validate zip code with server
    function validateZipCode(zipCode) {
        fetch('/validate-zip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ zip_code: zipCode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.zip_info) {
                if (data.zip_info.valid) {
                    showZipCodeStatus(true, data.zip_info.message);
                } else {
                    showZipCodeStatus(false, data.zip_info.message);
                }
            }
        })
        .catch(error => {
            console.error('Error validating zip code:', error);
            showZipCodeStatus(false, 'Error validating zip code');
        });
    }
    
    // Show zip code validation status
    function showZipCodeStatus(isValid, message) {
        zipCodeStatus.classList.remove('hidden');
        zipCodeInfo.textContent = message;
        zipCodeInfo.className = isValid ? 
            'text-green-600 dark:text-green-400' : 
            'text-red-600 dark:text-red-400';
    }
    
    // Hide zip code status
    function hideZipCodeStatus() {
        zipCodeStatus.classList.add('hidden');
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Show loading overlay
    function showLoading(message) {
        loadingMessage.textContent = message;
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
        
        // Start the helmet animation
        startHelmetAnimation();
    }
    
    // Hide loading overlay
    function hideLoading() {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
        
        // Stop the helmet animation
        stopHelmetAnimation();
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        const flashMessages = document.getElementById('flashMessages') || createFlashContainer();
        
        const toast = document.createElement('div');
        toast.className = `flash-message bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg shadow-lg px-4 py-3 mb-3 flex items-center transition-opacity duration-300 ${type === 'error' ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-500'}`;
        
        const iconClass = type === 'error' ? 'fa-exclamation-circle text-red-500' : 
                           type === 'success' ? 'fa-check-circle text-green-500' : 'fa-info-circle text-blue-500';
        
        toast.innerHTML = `
            <i class="fas ${iconClass} mr-3"></i>
            <span>${message}</span>
            <button class="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        flashMessages.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }
    
    // Create flash container if it doesn't exist
    function createFlashContainer() {
        const container = document.createElement('div');
        container.id = 'flashMessages';
        container.className = 'fixed top-4 right-4 z-50';
        document.body.appendChild(container);
        return container;
    }
    
    // Initialize tooltips
    function initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            const tooltipText = element.getAttribute('data-tooltip');
            
            element.addEventListener('mouseenter', function(e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'absolute z-50 p-2 bg-slate-800 text-white text-sm rounded shadow-lg max-w-xs';
                tooltip.innerHTML = tooltipText;
                tooltip.style.top = (e.pageY + 10) + 'px';
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.id = 'active-tooltip';
                document.body.appendChild(tooltip);
                
                // Adjust position if off-screen
                const rect = tooltip.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    tooltip.style.left = (e.pageX - rect.width - 10) + 'px';
                }
            });
            
            element.addEventListener('mouseleave', function() {
                const tooltip = document.getElementById('active-tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }
});

// Loading skeleton functions
function showViewerLoadingSkeleton() {
    const placeholder = document.getElementById('viewerPlaceholder');
    const skeleton = document.getElementById('viewerLoadingSkeleton');
    const viewer = document.getElementById('viewer');
    
    // Hide placeholder and viewer, show skeleton
    placeholder.classList.add('hidden');
    viewer.classList.add('hidden');
    skeleton.classList.remove('hidden');
    
    // Start the animated progress sequence
    setTimeout(() => updateLoadingStep(2), 1000);
    setTimeout(() => updateLoadingStep(3), 2500);
    setTimeout(() => updateLoadingStep(4), 4000);
}

function hideViewerLoadingSkeleton() {
    const skeleton = document.getElementById('viewerLoadingSkeleton');
    skeleton.classList.add('hidden');
}

function updateLoadingStep(stepNumber) {
    const stepElement = document.getElementById(`step${stepNumber}`);
    const progressElement = document.getElementById(`step${stepNumber}Progress`);
    const iconElement = stepElement.querySelector('.w-6.h-6');
    const textElement = stepElement.querySelector('.text-sm');
    
    // Mark step as active
    stepElement.classList.add('loading-step', 'active');
    
    // Update icon and text colors
    iconElement.classList.remove('bg-slate-300', 'dark:bg-slate-600');
    iconElement.classList.add('bg-blue-500');
    iconElement.querySelector('i').classList.remove('text-slate-500');
    iconElement.querySelector('i').classList.add('text-white');
    
    textElement.classList.remove('text-slate-400');
    textElement.classList.add('text-slate-600', 'dark:text-slate-400');
    
    // Animate progress bar
    progressElement.style.width = '100%';
    
    // Mark as completed after animation
    setTimeout(() => {
        stepElement.classList.remove('active');
        stepElement.classList.add('completed');
        
        iconElement.classList.remove('bg-blue-500');
        iconElement.classList.add('bg-green-500');
        
        textElement.classList.remove('text-slate-600', 'dark:text-slate-400');
        textElement.classList.add('text-green-600', 'dark:text-green-400');
        
        // Add checkmark
        const checkIcon = iconElement.querySelector('i');
        checkIcon.className = 'fas fa-check text-white text-xs';
    }, 1200);
}
