$(document).ready(function () {
    console.log("✅ JavaScript Loaded and Running in invmanagement.js!");

    const apiUrl = "/api/v1/items/";
    const tableBody = $("#tableBody");
    let currentInventoryData = []; // Store current data for comparison if needed
    
    // --- Checkbox & Bulk Action Elements --- 
    const selectAllCheckbox = $('#selectAllInvItems');
    const bulkDeleteBtn = $('#bulkDeleteInvBtn');

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
        attachCheckboxListeners();
        console.log("✅ Table Updated Successfully!");
    }

    // Finds items that are low/out-of-stock and haven't been viewed
    function findUnviewedLowStockItems(data) {
        const viewed = getViewedLowStockIds();
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
        selectAllCheckbox.off('change');
        tableBody.off('change', '.inv-item-checkbox'); 

        if (selectAllCheckbox.length && tableBody.find('.inv-item-checkbox').length > 0) {
            selectAllCheckbox.on('change', function() {
                tableBody.find('.inv-item-checkbox').prop('checked', this.checked);
            });
        } else {
            console.warn("Select All checkbox or item checkboxes not found when attaching listeners.");
        }

        tableBody.on('change', '.inv-item-checkbox', function() {
            if (!this.checked) {
                selectAllCheckbox.prop('checked', false);
            }
             updateSelectAllCheckboxState();
        });
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

    $("#addEntry").click(async function () {
        let productName = $("#addProduct").val().trim();
        let productQuantity = parseInt($("#addQuantity").val());
        let productThreshold = parseInt($("#addThreshold").val());

        if (!productName || productQuantity < 0 || productThreshold < 0) {
            alert("⚠️ All fields are required!");
            return;
        }

        const newProduct = {
            name: productName,
            quantity: productQuantity,
            threshold: productThreshold
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(newProduct)
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            await fetchInventoryData(true);
            $("#addModal").modal("hide");
            $("#addForm")[0].reset();
            console.log("✅ Product Added Successfully!");
        } catch (error) {
            console.error("❌ Error adding product:", error);
            alert("Failed to add product. Please try again.");
        }
    });

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
            const response = await fetch(`${apiUrl}${productId}/`, {
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
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('csrftoken=')) {
                    cookieValue = cookie.substring('csrftoken='.length, cookie.length);
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Initial fetch on page load - pass true to check for alerts
    fetchInventoryData(true);

    // Set interval for background refresh - pass false to prevent alert popups
    setInterval(() => fetchInventoryData(false), 15000);
    attachCheckboxListeners();

    // --- Tour Logic Removed ---

}); // End of $(document).ready
