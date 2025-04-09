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
    // Only select rows that are order summaries using the "order-row" class.
    const rows = document.querySelectorAll("tbody tr.order-row");

    console.log("Start Date Input:", startDateValue, "End Date Input:", endDateValue);
    const startDate = startDateValue ? new Date(startDateValue) : null;
    const endDate = endDateValue ? new Date(endDateValue) : null;
    console.log("Parsed Start Date:", startDate, "Parsed End Date:", endDate);

    rows.forEach((row, idx) => {
        // Get values from cells
        const orderNumber = row.cells[0].innerText.toLowerCase();
        const supplierText = row.cells[1].innerText.toLowerCase();
        const statusSelect = row.cells[4].querySelector("select[name='status']");
        // Use select's current value for the status
        const statusText = statusSelect ? statusSelect.value.toLowerCase().trim() : "";

        console.log(`Row ${idx} status text: "${statusText}"`);

        // Date Parsing (Assuming Delivery Date is at cell index 3)
        const dateText = row.cells[3].innerText.trim();
        let orderDate = null;
        if (dateText !== "N/A") {
            const parts = dateText.split("/");
            if (parts.length === 3) {
                orderDate = new Date(parts[2], parts[0] - 1, parts[1]);
                console.log(`Row ${idx} parsed order date: ${orderDate} from ${dateText}`);
            } else {
                console.warn(`Row ${idx} unexpected date format: ${dateText}`);
            }
        } else {
            console.log(`Row ${idx} date is N/A`);
        }
        
        // Date Filtering
        let matchesDate = true;
        if (orderDate) {
            if (startDate && endDate) {
                matchesDate = (orderDate >= startDate && orderDate <= endDate);
            } else if (startDate) {
                matchesDate = (orderDate >= startDate);
            } else if (endDate) {
                matchesDate = (orderDate <= endDate);
            }
            console.log(`Row ${idx} date filtering: orderDate = ${orderDate}, matchesDate = ${matchesDate}`);
        }
        
        // Other Filters
        const matchesSearch = orderNumber.includes(searchQuery) || supplierText.includes(searchQuery);
        const matchesStatus = (statusFilter === "" || statusText === statusFilter);
        const finalMatch = (matchesSearch && matchesStatus && matchesDate);
        console.log(`Row ${idx} final match: ${finalMatch}`);
        
        // Set the row visibility
        row.style.display = finalMatch ? "" : "none";
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Populate the supplier dropdown on page load
    updateSupplierDropdown();
    
    // Attach filter listeners
    document.getElementById("searchInput").addEventListener("input", filterOrders);
    document.getElementById("statusFilter").addEventListener("change", filterOrders);
    document.getElementById("startDate").addEventListener("change", filterOrders);
    document.getElementById("endDate").addEventListener("change", filterOrders);

    // New Order: Submit Order Form
    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
        orderForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const orderData = {
                product: document.getElementById("product").value,
                quantity: document.getElementById("quantity").value,
                supplier: document.getElementById("supplier").value,
                expectedDelivery: document.getElementById("expectedDelivery").value,
                status: document.getElementById("status").value
            };

            console.log("Saving new order:", orderData);
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

                    // Update the supplier dropdown if the response includes an updated list.
                    if (data.suppliers) {
                        const supplierSelect = document.getElementById("supplier");
                        supplierSelect.innerHTML = "";
                        data.suppliers.forEach(supplier => {
                            const option = document.createElement("option");
                            option.value = supplier.id;
                            option.textContent = supplier.name;
                            supplierSelect.appendChild(option);
                        });
                    }
                    
                    // Hide the modal after saving the order.
                    const modalElement = document.getElementById("newOrderModal");
                    let modal = bootstrap.Modal.getInstance(modalElement);
                    if (!modal) {
                        modal = new bootstrap.Modal(modalElement);
                    }
                    modal.hide();
                    // Optionally, refresh/update the orders list here.
                } else {
                    alert("Error saving order: " + data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred while saving the order.");
            });
        });
    } else {
        console.error("Order form not found!");
    }

    // Test button for verifying JS functionality
    const testButton = document.getElementById("testUpdateButton");
    if (testButton) {
        testButton.addEventListener("click", function() {
            console.log("Test Update Order button clicked");
        });
    } else {
        console.log("Test button not found!");
    }
    
    // Update Order Status Buttons
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
                } else {
                    alert("Failed to update order: " + data.error);
                }
            })
            .catch(error => console.error("Error:", error));
        });
    });
});
