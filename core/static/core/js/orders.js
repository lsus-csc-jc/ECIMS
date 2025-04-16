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
    console.log(`toggleDetails called for order ID: ${orderId}`); // Log entry
    const detailsRow = document.getElementById('details-' + orderId);
    console.log('Found details row:', detailsRow); // Log the found element
    
    if (detailsRow) {
        const currentDisplay = detailsRow.style.display;
        console.log(`Current display style: '${currentDisplay}'`); // Log current style
        if (currentDisplay === 'none' || currentDisplay === '') {
            detailsRow.style.display = 'table-row';
            console.log('Set display to table-row');
        } else {
            detailsRow.style.display = 'none';
            console.log('Set display to none');
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
    
    console.log(`Filter inputs - Search: "${searchQuery}", Status: "${statusFilter}", Start: "${startDateValue}", End: "${endDateValue}"`);
    
    // Select only rows that are order summaries, not details rows
    const rows = document.querySelectorAll("tbody tr.order-row"); 

    // Parse date range inputs once
    let startDate = null;
    let endDate = null;
    
    if (startDateValue) {
        // Convert to UTC to avoid timezone issues
        const [year, month, day] = startDateValue.split('-').map(Number);
        startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        console.log(`Start date: ${startDateValue} -> ${startDate.toISOString()}`);
    }
    
    if (endDateValue) {
        // Convert to UTC to avoid timezone issues
        const [year, month, day] = endDateValue.split('-').map(Number);
        endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
        console.log(`End date: ${endDateValue} -> ${endDate.toISOString()}`);
    }

    rows.forEach((row, idx) => {
        // Get values from cells and data attributes
        const orderNumber = row.cells[1].innerText.toLowerCase();
        const supplierText = row.cells[2].innerText.toLowerCase();
        const statusText = row.cells[5].innerText.toLowerCase().trim();
        const productNames = row.dataset.products || "";
        
        // Extract date texts
        const createdDateText = row.cells[3].innerText.trim();
        const deliveryDateText = row.cells[4].innerText.trim();
        
        console.log(`Row ${idx} - Order: ${orderNumber}, Created: ${createdDateText}, Delivery: ${deliveryDateText}`);
        
        // Parse delivery date (primary date for filtering)
        let deliveryDate = null;
        if (deliveryDateText && deliveryDateText !== "N/A") {
            const [month, day, year] = deliveryDateText.split('/').map(Number);
            if (month && day && year) {
                // Use UTC to avoid timezone issues
                deliveryDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                console.log(`Row ${idx} - Parsed delivery date: ${deliveryDateText} -> ${deliveryDate.toISOString()}`);
            }
        }
        
        // Parse created date (fallback for filtering)
        let createdDate = null;
        if (createdDateText && createdDateText !== "N/A") {
            const [month, day, year] = createdDateText.split('/').map(Number);
            if (month && day && year) {
                // Use UTC to avoid timezone issues
                createdDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                console.log(`Row ${idx} - Parsed created date: ${createdDateText} -> ${createdDate.toISOString()}`);
            }
        }
        
        // --- Filtering Logic ---
        
        // DATE FILTER - prioritize delivery date, fall back to created date
        let matchesDate = true;
        
        if (startDate || endDate) {
            // Choose which date to filter against (prefer delivery date)
            const dateToCheck = deliveryDate || createdDate;
            
            if (!dateToCheck) {
                matchesDate = false;
                console.log(`Row ${idx} - No valid date to check against filters`);
            } else {
                if (startDate && endDate) {
                    matchesDate = dateToCheck >= startDate && dateToCheck <= endDate;
                    console.log(`Row ${idx} - Date range check: ${dateToCheck.toISOString()} is between ${startDate.toISOString()} and ${endDate.toISOString()} = ${matchesDate}`);
                } else if (startDate) {
                    matchesDate = dateToCheck >= startDate;
                    console.log(`Row ${idx} - Date after check: ${dateToCheck.toISOString()} >= ${startDate.toISOString()} = ${matchesDate}`);
                } else if (endDate) {
                    matchesDate = dateToCheck <= endDate;
                    console.log(`Row ${idx} - Date before check: ${dateToCheck.toISOString()} <= ${endDate.toISOString()} = ${matchesDate}`);
                }
            }
        }
        
        // SEARCH FILTER
        const matchesSearch = 
            orderNumber.includes(searchQuery) || 
            supplierText.includes(searchQuery) ||
            productNames.includes(searchQuery);
        
        // STATUS FILTER
        const matchesStatus = (statusFilter === "" || statusText === statusFilter);
        
        // COMBINE FILTERS
        const finalMatch = matchesSearch && matchesStatus && matchesDate;
        console.log(`Row ${idx} - Final match: search=${matchesSearch}, status=${matchesStatus}, date=${matchesDate} => ${finalMatch}`);
        
        // --- Set Row Visibility ---
        const detailsRow = document.getElementById('details-' + row.querySelector('.order-checkbox').value);
        
        if (finalMatch) {
            row.style.display = "";
        } else {
            row.style.display = "none";
            if (detailsRow) {
                detailsRow.style.display = "none";
            }
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

// Function to update the state of bulk action buttons based on selected orders
function updateBulkActionButtons() {
    const selectedCount = document.querySelectorAll('.order-checkbox:checked').length;
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkUpdateStatusBtn = document.getElementById('bulkUpdateStatusBtn');
    const bulkStatusSelect = document.getElementById('bulkStatusUpdateSelect');

    // Enable/disable buttons based on selection
    if (bulkDeleteBtn) {
        bulkDeleteBtn.disabled = selectedCount === 0;
    }
    if (bulkUpdateStatusBtn) {
        bulkUpdateStatusBtn.disabled = selectedCount === 0;
    }
    if (bulkStatusSelect) {
        bulkStatusSelect.disabled = selectedCount === 0;
    }
}

// Function to attach checkbox listeners
function attachCheckboxListeners() {
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    const orderCheckboxes = document.querySelectorAll('.order-checkbox');
    
    // Remove existing listeners
    if (selectAllCheckbox) {
        selectAllCheckbox.removeEventListener('change', handleSelectAll);
    }
    orderCheckboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', handleCheckboxChange);
    });

    // Add new listeners
    if (selectAllCheckbox && orderCheckboxes.length > 0) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
        orderCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });
    }

    // Update button states
    updateBulkActionButtons();
}

// Select All handler
function handleSelectAll(event) {
    const orderCheckboxes = document.querySelectorAll('.order-checkbox');
    orderCheckboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
    });
    updateBulkActionButtons();
}

// Individual checkbox handler
function handleCheckboxChange(event) {
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    if (!event.target.checked) {
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
    } else {
        // Check if all checkboxes are now checked
        const allChecked = document.querySelectorAll('.order-checkbox').length === 
                         document.querySelectorAll('.order-checkbox:checked').length;
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = allChecked;
        }
    }
    updateBulkActionButtons();
}

// Get Selected Order IDs Function
function getSelectedOrderIds() {
    const selectedIds = [];
    document.querySelectorAll('.order-checkbox:checked').forEach(checkbox => {
        selectedIds.push(checkbox.value);
    });
    return selectedIds;
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
        bulkDeleteBtn.addEventListener('click', async function() {
            const selectedIds = getSelectedOrderIds();
            if (selectedIds.length === 0) {
                alert('Please select at least one order to delete.');
                return;
            }
            
            if (confirm(`Are you sure you want to delete ${selectedIds.length} selected order(s)?`)) {
                try {
                    const response = await fetch('/orders/bulk_delete/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: JSON.stringify({ order_ids: selectedIds })
                    });
                    
                    const data = await response.json();
                    console.log("Bulk Delete Response:", data);
                    
                    if (data.success) {
                        alert(data.message || 'Orders deleted successfully.');
                        window.location.reload();
                    } else {
                        alert('Error deleting orders: ' + data.error);
                    }
                } catch (error) {
                    console.error("Bulk Delete Fetch Error:", error);
                    alert('An error occurred during bulk deletion.');
                }
            }
        });
    } else {
         console.error("Bulk Delete button (#bulkDeleteBtn) not found!");
    }

    // Bulk Update Status Button
    if (bulkUpdateStatusBtn && bulkStatusSelect) {
        console.log("Attaching listener to Bulk Update Status button.");
        bulkUpdateStatusBtn.addEventListener('click', async function() {
            const selectedIds = getSelectedOrderIds();
            const newStatus = bulkStatusSelect.value;
            
            if (selectedIds.length === 0) {
                alert('Please select at least one order to update.');
                return;
            }
            
            if (!newStatus) {
                alert('Please select a new status.');
                return;
            }
            
            if (confirm(`Are you sure you want to update ${selectedIds.length} selected order(s) to ${newStatus}?`)) {
                try {
                    const response = await fetch('/orders/bulk_update_status/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: JSON.stringify({ 
                            order_ids: selectedIds,
                            status: newStatus
                        })
                    });
                    
                    const data = await response.json();
                    console.log("Bulk Update Status Response:", data);
                    
                    if (data.success) {
                        alert(data.message || 'Orders updated successfully.');
                        window.location.reload();
                    } else {
                        alert('Error updating orders: ' + data.error);
                    }
                } catch (error) {
                    console.error("Bulk Update Status Fetch Error:", error);
                    alert('An error occurred during bulk status update.');
                }
            }
        });
    } else {
        console.warn("Bulk Status Update button not found.");
    }

    // Initial setup
    attachCheckboxListeners();

    // --- END: Bulk Actions Logic ---
    
    // Add event listeners for details toggle buttons (replacing inline onclick handlers)
    document.querySelectorAll('.details-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            toggleDetails(orderId);
        });
    });
    
    // Add event listeners for filter inputs (replacing inline event handlers)
    document.getElementById('searchInput').addEventListener('input', filterOrders);
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    document.getElementById('startDate').addEventListener('change', filterOrders);
    document.getElementById('endDate').addEventListener('change', filterOrders);
    
    // --- Tour Logic Removed ---

}); // End of DOMContentLoaded
