document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('importForm');
    const fileInput = document.getElementById('excel_file');
    const statusMessage = document.getElementById('status-message');
    
    // Validate file selection
    fileInput.addEventListener('change', function() {
        const file = fileInput.files[0];
        if (file) {
            // Check file type
            if (!file.name.toLowerCase().endsWith('.csv')) {
                statusMessage.innerHTML = 'Error: Please select a CSV file (.csv extension).';
                statusMessage.classList.remove('d-none', 'alert-success', 'alert-info');
                statusMessage.classList.add('alert-danger');
                fileInput.value = ''; // Clear the file input
                return;
            }
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                statusMessage.innerHTML = 'Error: File size exceeds 5MB limit.';
                statusMessage.classList.remove('d-none', 'alert-success', 'alert-info');
                statusMessage.classList.add('alert-danger');
                fileInput.value = ''; // Clear the file input
                return;
            }
            
            // File looks good
            statusMessage.classList.add('d-none');
        }
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate that a file is selected
        if (!fileInput.files || fileInput.files.length === 0) {
            statusMessage.innerHTML = 'Error: Please select a CSV file to import.';
            statusMessage.classList.remove('d-none', 'alert-success', 'alert-info');
            statusMessage.classList.add('alert-danger');
            return;
        }
        
        // Show loading indicator
        statusMessage.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Importing products, please wait...';
        statusMessage.classList.remove('d-none', 'alert-success', 'alert-danger');
        statusMessage.classList.add('alert-info');
        
        // Create form data object
        const formData = new FormData(form);
        
        // Log form data for debugging (comment out in production)
        console.log('Sending file:', fileInput.files[0].name, 'Size:', fileInput.files[0].size, 'bytes');
        
        // Get CSRF token
        const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // Make AJAX request
        fetch(form.getAttribute('action') || window.location.href, {
            method: 'POST',
            body: formData,
            // No need to specify Content-Type as FormData will set it automatically with boundary
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            statusMessage.classList.remove('alert-info');
            
            if (data.success) {
                // Success
                statusMessage.innerHTML = data.message;
                statusMessage.classList.add('alert-success');
                
                // Reset form
                form.reset();
                
                // Add a refresh button and auto-redirect after 2 seconds
                const refreshMsg = document.createElement('div');
                refreshMsg.className = 'mt-3';
                refreshMsg.innerHTML = `
                    <p>Products imported successfully. Refreshing inventory table...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <button class="btn btn-primary btn-sm" onclick="window.location.href='/invmanagement/'">
                            Go to Inventory Now
                        </button>
                    </div>
                `;
                statusMessage.appendChild(refreshMsg);
                
                // Auto redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = "/invmanagement/";
                }, 2000);
            } else {
                // Error
                statusMessage.innerHTML = data.error || 'An error occurred during import.';
                statusMessage.classList.add('alert-danger');
            }
        })
        .catch(error => {
            // Handle network errors
            statusMessage.classList.remove('alert-info');
            statusMessage.classList.add('alert-danger');
            statusMessage.innerHTML = 'Network error occurred: ' + error.message;
            console.error('Error:', error);
        });
    });
}); 