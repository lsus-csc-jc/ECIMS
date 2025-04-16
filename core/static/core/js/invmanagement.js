$(document).ready(function () {
    console.log("✅ JavaScript Loaded and Running in invmanagement.js!");

    // Constants and Variables
    const apiUrl = "/api/v1/items/";
    const tableBody = $("#tableBody");
    let currentInventoryData = []; // Store current data for comparison if needed
    
    // --- Checkbox & Bulk Action Elements --- 
    const selectAllCheckbox = $('#selectAllInvItems');
    const bulkDeleteBtn = $('#bulkDeleteInvBtn');

    // --- Add Product Modal Elements ---
    const addProductItems = $('#addProductItems');
    const addAnotherItemBtn = $('#addAnotherItem');

    // --- Import Products Modal Elements ---
    const importForm = $('#importForm');
    const importSuccess = $('#importSuccess');
    const importError = $('#importError');

    // Function to add a new product item row
    function addProductItemRow() {
        // Create a new product item row
        const newRow = `
            <div class="product-item mb-3">
                <div class="row align-items-center">
                    <div class="col">
                        <label class="form-label">Product Name</label>
                        <input type="text" class="form-control product-name" required>
                    </div>
                    <div class="col">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-control product-quantity" value="0" min="0" required>
                    </div>
                    <div class="col">
                        <label class="form-label">Threshold</label>
                        <input type="number" class="form-control product-threshold" value="0" min="0" required>
                    </div>
                    <div class="col-auto">
                        <button type="button" class="btn btn-outline-danger remove-item mt-4">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Append the new row to the container
        addProductItems.append(newRow);
        
        // Enable/disable remove buttons based on number of items
        updateRemoveButtons();
    }

    // Function to update remove buttons state
    function updateRemoveButtons() {
        const removeButtons = $('.remove-item');
        
        // If there's only one item, disable the remove button
        if (removeButtons.length <= 1) {
            removeButtons.prop('disabled', true);
        } else {
            removeButtons.prop('disabled', false);
        }
    }

    // Handle click on "Add Another Item" button
    addAnotherItemBtn.on('click', function() {
        addProductItemRow();
    });

    // Handle click on remove item button (using event delegation)
    $(document).on('click', '.remove-item', function() {
        $(this).closest('.product-item').remove();
        updateRemoveButtons();
    });

    function getViewedLowStockIds() {
        return new Set(JSON.parse(localStorage.getItem("viewedLowStockIds") || "[]"));
    }

    function markAsViewed(productId) {
        const viewed = getViewedLowStockIds();
        viewed.add(productId.toString());
        localStorage.setItem("viewedLowStockIds", JSON.stringify(Array.from(viewed)));
    }

    async function fetchInventoryData(showModalOnLoad = false) {
        console.log("🔄 Fetching inventory data...");

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            console.log("✅ API Data Received:", data);

            // Store fetched data
            currentInventoryData = data; 
            
            // Update the table UI
            updateTable(data);
            updateSelectAllCheckboxState();
            
            // Only check for alerts and show modal on the initial load
            if (showModalOnLoad) {
                const itemsToAlert = findUnviewedLowStockItems(data);
                if (itemsToAlert.length > 0) {
                    console.log("🚨 Found unviewed low stock items on load:", itemsToAlert);
                    showLowStockAlert(itemsToAlert); 
                } else {
                    console.log("👍 No unviewed low stock items on load.");
                }
            }
        } catch (error) {
            console.error("❌ Error fetching inventory data:", error);
        }
    }

    // Update the Table with Fetched Data
    function updateTable(data) {
        console.log("🔄 Updating table with fetched data...");
        tableBody.empty();

        if (data.length === 0) {
            console.warn("⚠️ No inventory items found!");
            tableBody.html(`<tr><td colspan="6" class="text-center text-warning">No inventory items found.</td></tr>`);
            return;
        }

        data.forEach(item => {
            let statusBadge;
            switch (item.status) {
                case 3:
                    statusBadge = `<span class="badge bg-success">In-Stock</span>`;
                    break;
                case 2:
                    statusBadge = `<span class="badge bg-warning text-dark">Low-Stock</span>`;
                    break;
                case 1:
                    statusBadge = `<span class="badge bg-danger">Out-of-Stock</span>`;
                    break;
                default:
                    statusBadge = `<span class="badge bg-secondary">Unknown</span>`;
            }

            let row = `
                <tr data-id="${item.id}">
                    <td><input type="checkbox" class="form-check-input inv-item-checkbox" value="${item.id}"></td>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.threshold}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn"><i class="fas fa-edit"></i></button>
                        <!-- <button class="btn btn-sm btn-outline-danger delete-btn"><i class="fas fa-trash"></i></button> -->
                    </td>
                </tr>`;
            tableBody.append(row);
        });

        // Reset select all checkbox
        selectAllCheckbox.prop('checked', false);
        
        // Attach checkbox listeners after table is populated
        attachCheckboxListeners();
        
        console.log("✅ Table Updated Successfully!");
    }

    // Finds items that are low/out-of-stock and haven't been viewed
    function findUnviewedLowStockItems(data) {
        console.log("🔍 Checking for low-stock items...");
        const lowStockItems = [];

        data.forEach(product => {
            const isNowLowStock = product.status === 2 || product.status === 1;

            if (isNowLowStock && !viewed.has(product.id.toString())) {
                lowStockItems.push(product);
            }
        });
        return lowStockItems;
    }

    // Shows a single modal listing all items passed to it
    function showLowStockAlert(itemsToShow) {
        if (!itemsToShow || itemsToShow.length === 0) {
            return;
        }

        // Build the list of items for the modal body
        let contentHtml = '<ul class="list-unstyled mb-0">';
        itemsToShow.forEach(product => {
            const statusText = product.status === 1 ? "Out of Stock" : "Low Stock";
            contentHtml += `
                <li class="mb-2 pb-2 border-bottom">
                    <strong>${product.name}</strong><br>
                    <small>Qty: ${product.quantity} | Threshold: ${product.threshold} | Status: ${statusText}</small>
                </li>`;
        });
        contentHtml += '</ul>';
        
        $("#notificationContent").html(contentHtml);

        const modal = new bootstrap.Modal(document.getElementById("notificationModal"));
        modal.show();

        // Update the "Mark as Viewed" button to handle all shown items
        $("#markViewedBtn").off("click").on("click", function () {
            itemsToShow.forEach(product => {
                markAsViewed(product.id);
            });
            modal.hide();
        });
    }

    // --- Checkbox & Bulk Action Logic --- 

    function attachCheckboxListeners() {
        // Remove existing listeners first
        selectAllCheckbox.off('change');
        tableBody.off('change', '.inv-item-checkbox'); 

        // Get current checkboxes
        const itemCheckboxes = tableBody.find('.inv-item-checkbox');
        
        // Only attach listeners if we have both the select all checkbox and at least one item checkbox
        if (selectAllCheckbox.length && itemCheckboxes.length > 0) {
            // Select All checkbox handler
            selectAllCheckbox.on('change', function() {
                itemCheckboxes.prop('checked', this.checked);
                updateBulkDeleteButton();
            });

            // Individual checkbox handlers
            tableBody.on('change', '.inv-item-checkbox', function() {
                // Uncheck select all if any checkbox is unchecked
                if (!this.checked) {
                    selectAllCheckbox.prop('checked', false);
                }
                // Check if all checkboxes are checked
                const allChecked = itemCheckboxes.length === tableBody.find('.inv-item-checkbox:checked').length;
                selectAllCheckbox.prop('checked', allChecked);
                updateBulkDeleteButton();
            });

            // Update initial state
            updateBulkDeleteButton();
        }
    }

    function updateBulkDeleteButton() {
        const selectedCount = tableBody.find('.inv-item-checkbox:checked').length;
        bulkDeleteBtn.prop('disabled', selectedCount === 0);
    }

    function updateSelectAllCheckboxState() {
         const allCheckboxes = tableBody.find('.inv-item-checkbox');
         const allChecked = allCheckboxes.length > 0 && allCheckboxes.length === tableBody.find('.inv-item-checkbox:checked').length;
         selectAllCheckbox.prop('checked', allChecked);
    }

    function getSelectedItemIds() {
        const selectedIds = [];
        tableBody.find('.inv-item-checkbox:checked').each(function() {
             selectedIds.push($(this).val());
        });
        return selectedIds;
    }

    if (bulkDeleteBtn.length) {
        bulkDeleteBtn.on('click', async function() {
            const selectedIds = getSelectedItemIds();
            if (selectedIds.length === 0) {
                alert('Please select at least one item to delete.');
                return;
            }
            
            if (confirm(`Are you sure you want to delete ${selectedIds.length} selected item(s)?`)) {
                console.log("Performing bulk delete for IDs:", selectedIds);
                try {
                    const response = await fetch('/inventory/bulk_delete/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCSRFToken()
                        },
                        body: JSON.stringify({ item_ids: selectedIds })
                    });
                    
                    const data = await response.json();
                    console.log("Bulk Delete Response:", data);

                    if (!response.ok) {
                        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
                    }
                    
                    if (data.success) {
                        alert(data.message || 'Items deleted successfully.');
                        await fetchInventoryData(true);
                    } else {
                        alert('Error deleting items: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error("Bulk Delete Fetch Error:", error);
                    alert('An error occurred during bulk deletion: ' + error.message);
                }
            }
        });
    } else {
         console.error("Bulk Delete button (#bulkDeleteInvBtn) not found!");
    }

    $("#searchInput").on("keyup", function () {
        let value = $(this).val().toLowerCase();
        $("#tableBody tr").each(function () {
            let rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.includes(value));
        });
    });

    // Updated Add Entry click handler
    $("#addEntry").click(async function () {
        const productItems = $('.product-item');
        const productsToAdd = [];
        
        // Validate and collect data from each product item row
        let isValid = true;
        
        productItems.each(function() {
            const productName = $(this).find('.product-name').val().trim();
            const productQuantity = parseInt($(this).find('.product-quantity').val());
            const productThreshold = parseInt($(this).find('.product-threshold').val());

            if (!productName) {
                $(this).find('.product-name').addClass('is-invalid');
                isValid = false;
            } else {
                $(this).find('.product-name').removeClass('is-invalid');
            }
            
            if (isNaN(productQuantity) || productQuantity < 0) {
                $(this).find('.product-quantity').addClass('is-invalid');
                isValid = false;
            } else {
                $(this).find('.product-quantity').removeClass('is-invalid');
            }
            
            if (isNaN(productThreshold) || productThreshold < 0) {
                $(this).find('.product-threshold').addClass('is-invalid');
                isValid = false;
            } else {
                $(this).find('.product-threshold').removeClass('is-invalid');
            }
            
            if (productName && !isNaN(productQuantity) && !isNaN(productThreshold)) {
                productsToAdd.push({
                    name: productName,
                    quantity: productQuantity,
                    threshold: productThreshold
                });
            }
        });
        
        if (!isValid) {
            showNotification('Please fill in all required fields correctly.', false);
            return;
        }
        
        if (productsToAdd.length === 0) {
            showNotification('No valid products to add!', false);
            return;
        }

        try {
            const response = await fetch("/inventory/add/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(productsToAdd)
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                await fetchInventoryData(true);
                $("#addModal").modal("hide");
                
                // Reset the form
                addProductItems.html('');
                addProductItemRow(); // Add a single empty row
                
                showNotification(`Successfully added ${productsToAdd.length} product(s)!`, true);
                console.log("✅ Products Added Successfully!");
            } else {
                showNotification(result.error || 'Failed to add products', false);
            }
        } catch (error) {
            console.error("❌ Error adding products:", error);
            showNotification('Failed to add products. Please try again.', false);
        }
    });

    // Initialize the first product item row when page loads
    $(document).on('show.bs.modal', '#addModal', function() {
        // Clear previous items and add one fresh row when modal opens
        addProductItems.empty();
        addProductItemRow();
    });

    // Handle click events on edit buttons
    $(document).on("click", ".edit-btn", function () {
        let row = $(this).closest("tr");
        let productId = row.data("id");
        let productName = row.find("td:eq(1)").text();
        let productQuantity = row.find("td:eq(2)").text();
        let productThreshold = row.find("td:eq(3)").text();

        $("#editRowIndex").val(productId);
        $("#editProduct").val(productName);
        $("#editQuantity").val(productQuantity);
        $("#editThreshold").val(productThreshold);

        $("#editModal").modal("show");
    });

    // Save changes button click handler
    $("#saveChanges").click(async function () {
        let productId = $("#editRowIndex").val();
        let updatedName = $("#editProduct").val().trim();
        let updatedQuantity = parseInt($("#editQuantity").val());
        let updatedThreshold = parseInt($("#editThreshold").val());

        if (!updatedName || updatedQuantity < 0 || updatedThreshold < 0) {
            alert("⚠️ All fields are required!");
            return;
        }

        const updatedProduct = {
            name: updatedName,
            quantity: updatedQuantity,
            threshold: updatedThreshold
        };

        try {
            const response = await fetch(`${apiUrl}${productId}/update_item`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(updatedProduct)
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            await fetchInventoryData(true);
            $("#editModal").modal("hide");
            console.log("✅ Product Updated Successfully!");
        } catch (error) {
            console.error("❌ Error updating product:", error);
            alert("Failed to update product. Please try again.");
        }
    });

    function getCSRFToken() {
        // Try to get from cookie first
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 'csrftoken='.length) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
                    break;
                }
            }
        }
        
        // If not in cookie, try to get from meta tag
        if (!cookieValue) {
            const csrfElement = document.querySelector('meta[name="csrf-token"]');
            if (csrfElement) {
                cookieValue = csrfElement.getAttribute('content');
            }
        }
        
        // If still not found, try hidden input field
        if (!cookieValue) {
            const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (csrfInput) {
                cookieValue = csrfInput.value;
            }
        }
        
        return cookieValue;
    }

    // Initial fetch on page load - pass true to check for alerts
    fetchInventoryData(true);

    // Set interval for background refresh - pass false to prevent alert popups
    setInterval(() => fetchInventoryData(false), 15000);

    // --- Tour Logic Removed ---

    // Handle import form submission
    if (importForm.length) {
        importForm.on('submit', function(e) {
            e.preventDefault();
            
            const fileInput = $('#excel_file')[0];
            if (!fileInput.files || fileInput.files.length === 0) {
                importError.removeClass('d-none').text('Please select a CSV file to import');
                importSuccess.addClass('d-none');
                return;
            }
            
            // Make sure it's a CSV file
            const file = fileInput.files[0];
            if (!file.name.toLowerCase().endsWith('.csv')) {
                importError.removeClass('d-none').text('Please select a valid CSV file (.csv)');
                importSuccess.addClass('d-none');
                return;
            }
            
            // Prepare form data
            const formData = new FormData(importForm[0]);
            
            // Show loading state
            $('#uploadBtn').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...');
            importError.addClass('d-none');
            importSuccess.addClass('d-none');
            
            // Send AJAX request
            $.ajax({
                url: '/import-products/',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    $('#uploadBtn').prop('disabled', false).text('Upload and Import');
                    
                    if (response.success) {
                        importSuccess.removeClass('d-none').text(response.message);
                        importError.addClass('d-none');
                        importForm[0].reset();
                        
                        // Refresh inventory data
                        fetchInventoryData(false);
                        
                        // Close modal after 2 seconds
                        setTimeout(function() {
                            $('#importModal').modal('hide');
                        }, 2000);
                    } else {
                        importError.removeClass('d-none').text(response.error || 'Unknown error occurred');
                        importSuccess.addClass('d-none');
                    }
                },
                error: function(xhr, status, error) {
                    $('#uploadBtn').prop('disabled', false).text('Upload and Import');
                    
                    let errorMessage = 'An error occurred during the import';
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.error) {
                            errorMessage = response.error;
                        }
                    } catch (e) {
                        console.error('Error parsing error response:', e);
                    }
                    
                    importError.removeClass('d-none').text(errorMessage);
                    importSuccess.addClass('d-none');
                }
            });
        });
    }

}); // End of $(document).ready
