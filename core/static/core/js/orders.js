console.log("orders.js is loaded");

// Helper function for CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function: Update Supplier Dropdown
function updateSupplierDropdown() {
    console.log("updateSupplierDropdown called");
    fetch("/get_suppliers/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response not ok");
            }
            return response.json();
        })
        .then(data => {
            console.log("Suppliers data:", data);
            const supplierSelect = document.getElementById("supplier");
            supplierSelect.innerHTML = ""; // Clear any existing options
            data.suppliers.forEach(supplier => {
                const option = document.createElement("option");
                option.value = supplier.id;         // Use supplier id as value
                option.textContent = supplier.name;   // Display supplier's name
                supplierSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching suppliers:", error));
}

// Function: Toggle the details row for an order
function toggleDetails(orderId) {
    const detailsRow = document.getElementById('details-' + orderId);
    if (detailsRow) {
        if (detailsRow.style.display === 'none' || detailsRow.style.display === '') {
            detailsRow.style.display = 'table-row';
        } else {
            detailsRow.style.display = 'none';
        }
    } else {
        console.error("No details row found for order ID:", orderId);
    }
}

// Function: Filter Orders
function filterOrders() {
    console.log("filterOrders() triggered");

    // Get filter values from the UI
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value.toLowerCase().trim();
    const startDateValue = document.getElementById("startDate").value;
    const endDateValue = document.getElementById("endDate").value;
    
    // Select only rows that are order summaries, not details rows
    const rows = document.querySelectorAll("tbody tr.order-row"); 

    // Parse date range inputs once
    let startDate = null;
    if (startDateValue) {
        try {
            startDate = new Date(startDateValue + 'T00:00:00'); // Ensure comparison starts at beginning of day
            if (isNaN(startDate)) startDate = null; // Handle invalid date input
        } catch (e) { startDate = null; }
    }
    let endDate = null;
    if (endDateValue) {
        try {
            endDate = new Date(endDateValue + 'T23:59:59'); // Ensure comparison ends at end of day
             if (isNaN(endDate)) endDate = null;
        } catch (e) { endDate = null; }
    }
    console.log("Parsed Date Range:", { startDate, endDate });

    rows.forEach((row, idx) => {
        // Get values from cells and data attributes
        const orderNumber = row.cells[1].innerText.toLowerCase(); // Index 1 for Order ID
        const supplierText = row.cells[2].innerText.toLowerCase(); // Index 2 for Supplier
        const statusSelect = row.querySelector("select[name='status']"); 
        const statusText = statusSelect ? statusSelect.value.toLowerCase().trim() : "";
        const productNames = row.dataset.products || ""; // Get product names from data attribute
        const dateCreatedText = row.cells[3].innerText.trim(); // Index 3 for Date Created
        
        // Date Parsing for Created Date
        let orderCreatedDate = null;
        if (dateCreatedText && dateCreatedText !== "N/A") {
            try {
                // Assuming format M/D/YYYY
                const parts = dateCreatedText.split('/');
                if (parts.length === 3) {
                    // Month is 0-indexed in JS Date constructor
                    orderCreatedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                     if (isNaN(orderCreatedDate)) orderCreatedDate = null; // Handle invalid date parts
                } else {
                     console.warn(`Row ${idx} unexpected date created format: ${dateCreatedText}`);
                }
            } catch(e) {
                 console.warn(`Row ${idx} error parsing date created: ${dateCreatedText}`, e);
            }
        } else {
            console.log(`Row ${idx} date created is N/A or empty`);
        }
        
        // --- Filtering Logic --- 
        
        // Date Filter (based on Created Date)
        let matchesDate = true;
        if (orderCreatedDate) {
            if (startDate && endDate) {
                matchesDate = (orderCreatedDate >= startDate && orderCreatedDate <= endDate);
            } else if (startDate) {
                matchesDate = (orderCreatedDate >= startDate);
            } else if (endDate) {
                matchesDate = (orderCreatedDate <= endDate);
            }
        } else if (startDate || endDate) {
             // If a date filter is set, but the row has no valid date, it doesn't match
             matchesDate = false; 
        }
        
        // Search Filter (Order ID, Supplier, Product Names)
        const matchesSearch = 
            orderNumber.includes(searchQuery) || 
            supplierText.includes(searchQuery) ||
            productNames.includes(searchQuery); // Search within product names
            
        // Status Filter
        const matchesStatus = (statusFilter === "" || statusText === statusFilter);
        
        // Combine filters
        const finalMatch = (matchesSearch && matchesStatus && matchesDate);
        console.log(`Row ${idx} - Search:'${searchQuery}', Status:'${statusFilter}', DateRange:[${startDateValue}-${endDateValue}] => Matches: Date=${matchesDate}, Search=${matchesSearch}, Status=${matchesStatus} => Final=${finalMatch}`);
        
        // Set the row visibility (including its corresponding details row if it exists)
        row.style.display = finalMatch ? "" : "none";
        const detailsRow = document.getElementById('details-' + row.querySelector('.order-checkbox').value); // Find details row by ID
        if (detailsRow) {
             detailsRow.style.display = finalMatch ? detailsRow.dataset.originalDisplay || 'none' : 'none'; // Hide details row too, respecting its original toggle state requires more work
        }
    });
}

// Function to manage enabling/disabling the first item row's remove button
function updateRemoveButtons() {
    const itemContainer = document.getElementById("orderItemsContainer");
    if (!itemContainer) return;
    const itemRows = itemContainer.querySelectorAll(".order-item-row");
    itemRows.forEach((row, index) => {
        const removeBtn = row.querySelector(".remove-item-btn");
        if (removeBtn) {
            // Disable remove button only if it's the first row AND the only row
            removeBtn.disabled = (index === 0 && itemRows.length === 1);
        }
    });
}

// Function to add a new item row to the modal
function addNewItemRow() {
    console.log("addNewItemRow function called.");
    const itemContainer = document.getElementById("orderItemsContainer");
    if (!itemContainer) return;

    const firstItemRow = itemContainer.querySelector(".order-item-row");
    if (!firstItemRow) {
        console.error("Initial item row template not found in modal.");
        return; 
    }
    
    const newItemRow = firstItemRow.cloneNode(true);
    
    // Clear input values in the new row
    newItemRow.querySelector(".product-name").value = "";
    newItemRow.querySelector(".quantity").value = "";
    
    // Ensure the remove button is enabled (it might be cloned from a disabled state)
    const removeBtn = newItemRow.querySelector(".remove-item-btn");
    if (removeBtn) removeBtn.disabled = false;

    itemContainer.appendChild(newItemRow);
    updateRemoveButtons(); // Re-evaluate which remove buttons should be enabled/disabled
}

// Function to reset the order form/modal to its initial state
function resetOrderModal() {
    console.log("resetOrderModal function called.");
    const orderForm = document.getElementById("orderForm");
    const itemContainer = document.getElementById("orderItemsContainer");
    if (!orderForm || !itemContainer) return;

    // Reset non-item fields
    orderForm.reset(); // This handles supplier and delivery date

    // Remove all but the first item row
    const itemRows = itemContainer.querySelectorAll(".order-item-row");
    itemRows.forEach((row, index) => {
        if (index > 0) { // Keep the first row (index 0)
            row.remove();
        }
    });

    // Clear the inputs in the remaining first row
    const firstRow = itemContainer.querySelector(".order-item-row");
    if (firstRow) {
        firstRow.querySelector(".product-name").value = "";
        firstRow.querySelector(".quantity").value = "";
    }

    updateRemoveButtons(); // Ensure the first row's remove button is disabled
    updateSupplierDropdown(); // Refresh supplier list in case it changed
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed.");
    
    // --- Variable Definitions --- 
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    const orderCheckboxes = document.querySelectorAll('.order-checkbox');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkUpdateStatusBtn = document.getElementById('bulkUpdateStatusBtn');
    const bulkStatusSelect = document.getElementById('bulkStatusUpdateSelect');
    const tableBody = document.querySelector('.table tbody'); // More specific selector if needed
    
    // Populate the supplier dropdown on page load
    updateSupplierDropdown();
    
    // Attach filter listeners
    document.getElementById("searchInput").addEventListener("input", filterOrders);
    document.getElementById("statusFilter").addEventListener("change", filterOrders);
    document.getElementById("startDate").addEventListener("change", filterOrders);
    document.getElementById("endDate").addEventListener("change", filterOrders);

    // --- New Order Modal Logic ---
    const orderForm = document.getElementById("orderForm");
    const addItemBtn = document.getElementById("addItemBtn");
    const orderItemsContainer = document.getElementById("orderItemsContainer");
    const newOrderModalElement = document.getElementById("newOrderModal");

    // Log whether the core elements for the modal were found
    console.log("Finding modal elements:");
    console.log({ orderForm, addItemBtn, orderItemsContainer, newOrderModalElement });

    // Add Item Button Listener
    if (addItemBtn) {
        console.log("Attaching listener to Add Item button.");
        addItemBtn.addEventListener("click", addNewItemRow);
    } else {
        console.error("Add Item button (#addItemBtn) not found!");
    }

    // Remove Item Button Listener (using event delegation)
    if (orderItemsContainer) {
        console.log("Attaching listener to Items Container for remove buttons.");
        orderItemsContainer.addEventListener("click", function(event) {
            if (event.target.classList.contains("remove-item-btn")) {
                console.log("Remove Item button clicked.");
                event.target.closest(".order-item-row").remove();
                updateRemoveButtons(); 
            }
        });
    } else {
        console.error("Order Items Container (#orderItemsContainer) not found!");
    }

    // Order Form Submission
    if (orderForm) {
        console.log("Attaching listener to Order Form submission.");
        orderForm.addEventListener("submit", function(event) {
            event.preventDefault();
            console.log("Order form submit event triggered.");

            const items = [];
            const itemRows = orderItemsContainer.querySelectorAll(".order-item-row");
            let formIsValid = true;

            itemRows.forEach((row, index) => {
                const productNameInput = row.querySelector(".product-name");
                const quantityInput = row.querySelector(".quantity");
                const productName = productNameInput.value.trim();
                const quantity = quantityInput.value.trim();

                if (!productName || !quantity) {
                    alert(`Please fill in both product name and quantity for item ${index + 1}.`);
                    formIsValid = false;
                    return; // Stop processing this row
                }
                
                const quantityNum = parseInt(quantity, 10);
                if (isNaN(quantityNum) || quantityNum <= 0) {
                     alert(`Please enter a valid positive quantity for item ${index + 1}.`);
                     formIsValid = false;
                     return; // Stop processing this row
                }

                items.push({ 
                    product_name: productName,
                    quantity: quantityNum
                 });
            });

            if (!formIsValid || items.length === 0) {
                 console.log("Form invalid or no items, stopping submission.");
                if (items.length === 0 && formIsValid) { 
                     alert("Please add at least one item to the order.");
                }
                return; 
            }

            // --- Get Supplier and Delivery Date (Revised) ---
            console.log("Attempting to find supplier and delivery date elements inside form...");
            const supplierSelect = orderForm.querySelector("#supplier"); 
            const deliveryInput = orderForm.querySelector("#expectedDelivery");
            console.log({ supplierSelect, deliveryInput });

            if (!supplierSelect) {
                 console.error("Could not find supplier select element with ID 'supplier' within the form!");
                 alert("An internal error occurred (cannot find supplier field). Please try again.");
                 return; // Stop submission
            }
             if (!deliveryInput) {
                 console.error("Could not find delivery date input with ID 'expectedDelivery' within the form!");
                 alert("An internal error occurred (cannot find delivery date field). Please try again.");
                 return; // Stop submission
            }
            // -----------------------------------------------

            // Collect other form data
            const orderData = {
                supplier: supplierSelect.value,
                expectedDelivery: deliveryInput.value, 
                items: items 
            };

            console.log("Saving new order with multiple items:", orderData);

            // --- Fetch Request --- 
             fetch("/save_order/", {
                 method: "POST",
                 headers: {
                     "Content-Type": "application/json",
                     "X-CSRFToken": getCookie("csrftoken")
                 },
                 body: JSON.stringify(orderData)
             })
             .then(response => response.json())
             .then(data => {
                 console.log("Save Order Response:", data);
                 if (data.success) {
                     alert("Order saved successfully!");
                     window.location.reload(); 
                     const modalInstance = bootstrap.Modal.getInstance(newOrderModalElement);
                     if (modalInstance) {
                         modalInstance.hide();
                     }
                 } else {
                     alert("Error saving order: " + data.error);
                 }
             })
             .catch(error => {
                 console.error("Fetch Error:", error);
                 alert("An error occurred while saving the order.");
             });
        });
    } else {
        console.error("Order form (#orderForm) not found!");
    }

    // Reset modal when it's hidden
    if (newOrderModalElement) {
        console.log("Attaching listener for modal hidden event.");
        newOrderModalElement.addEventListener('hidden.bs.modal', event => {
            resetOrderModal();
        });
    } else {
         console.error("New Order Modal element (#newOrderModal) not found for reset listener!");
    }

    // --- Bulk Action Logic --- 
    
    // Select All Checkbox
    if (selectAllCheckbox && orderCheckboxes.length > 0) {
        console.log("Attaching listener to Select All checkbox.");
        selectAllCheckbox.addEventListener('change', function() {
            orderCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    } else {
        console.warn("Select All checkbox or order checkboxes not found.");
    }

    // Individual checkboxes (to uncheck Select All if one is unchecked)
    orderCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (!checkbox.checked) {
                selectAllCheckbox.checked = false;
            }
            // Optional: Check if all are checked to tick Select All
            // else if ([...orderCheckboxes].every(cb => cb.checked)) {
            //    selectAllCheckbox.checked = true;
            // }
        });
    });

    // Get Selected Order IDs Function
    function getSelectedOrderIds() {
        const selectedIds = [];
        orderCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedIds.push(checkbox.value);
            }
        });
        return selectedIds;
    }

    // Bulk Delete Button
    if (bulkDeleteBtn) {
        console.log("Attaching listener to Bulk Delete button.");
        bulkDeleteBtn.addEventListener('click', function() {
            const selectedIds = getSelectedOrderIds();
            if (selectedIds.length === 0) {
                alert('Please select at least one order to delete.');
                return;
            }
            
            if (confirm(`Are you sure you want to delete ${selectedIds.length} selected order(s)?`)) {
                console.log("Performing bulk delete for IDs:", selectedIds);
                fetch('/orders/bulk_delete/', { // Use the correct URL defined in urls.py
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ order_ids: selectedIds })
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Bulk Delete Response:", data);
                    if (data.success) {
                        alert(data.message || 'Orders deleted successfully.');
                        window.location.reload(); // Refresh page
                    } else {
                        alert('Error deleting orders: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error("Bulk Delete Fetch Error:", error);
                    alert('An error occurred during bulk deletion.');
                });
            }
        });
    } else {
         console.error("Bulk Delete button (#bulkDeleteBtn) not found!");
    }

    // Bulk Update Status Button
    if (bulkUpdateStatusBtn && bulkStatusSelect) {
        console.log("Attaching listener to Bulk Update Status button.");
        bulkUpdateStatusBtn.addEventListener('click', function() {
            const selectedIds = getSelectedOrderIds();
            const newStatus = bulkStatusSelect.value;

            if (selectedIds.length === 0) {
                alert('Please select at least one order to update.');
                return;
            }
            if (!newStatus) {
                alert('Please select a target status.');
                return;
            }

            if (confirm(`Are you sure you want to change the status of ${selectedIds.length} selected order(s) to ${newStatus}?`)) {
                 console.log(`Performing bulk status update to ${newStatus} for IDs:`, selectedIds);
                 fetch('/orders/bulk_update_status/', { // Use the correct URL
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ order_ids: selectedIds, status: newStatus })
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Bulk Update Status Response:", data);
                     if (data.success) {
                        alert(data.message || 'Orders updated successfully.');
                        window.location.reload(); // Refresh page
                    } else {
                        alert('Error updating orders: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error("Bulk Update Status Fetch Error:", error);
                    alert('An error occurred during bulk status update.');
                });
            }
        });
    } else {
        console.error("Bulk Update Status button or select dropdown not found!");
    }

    // --- Update Order Status Logic REMOVED --- 
    /*
    const updateButtons = document.querySelectorAll(".update-order-btn");
    updateButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            console.log("Update Order button clicked");
            event.preventDefault();
            const orderId = this.dataset.orderId;
            const row = this.closest("tr");
            const statusSelect = row.querySelector("select[name='status']");
            const newStatus = statusSelect.value;
            const payload = { status: newStatus };

            fetch(`/update_order/${orderId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Update Response:", data);
                if (data.success) {
                    alert("Order status updated successfully!");
                     // Optionally refresh if inventory updates affect display
                     // window.location.reload(); 
                } else {
                    alert("Failed to update order: " + data.error);
                }
            })
            .catch(error => console.error("Error:", error));
        });
    });
    */
});
