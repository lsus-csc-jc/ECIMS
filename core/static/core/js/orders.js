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

function filterOrders() {
    console.log("filterOrders() triggered");

    // Get search/filter values from the UI
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value.toLowerCase().trim();
    const startDateValue = document.getElementById("startDate").value;
    const endDateValue = document.getElementById("endDate").value;
    const rows = document.querySelectorAll("tbody tr");

    // Log the date inputs
    console.log("Start Date Input:", startDateValue, "End Date Input:", endDateValue);

    // Parse the start and end dates.
    // <input type="date"> returns dates in "yyyy-mm-dd" format.
    const startDate = startDateValue ? new Date(startDateValue) : null;
    const endDate = endDateValue ? new Date(endDateValue) : null;
    console.log("Parsed Start Date:", startDate, "Parsed End Date:", endDate);

    rows.forEach((row, idx) => {
        // Get relevant fields from the row
        const orderNumber = row.cells[0].innerText.toLowerCase();
        const supplier = row.cells[1].innerText.toLowerCase();
        const statusSelect = row.cells[4].querySelector("select[name='status']");
        const statusText = statusSelect 
            ? statusSelect.options[statusSelect.selectedIndex].textContent.trim().toLowerCase() 
            : row.cells[4].innerText.trim().toLowerCase();

        // --- Date Parsing ---
        // Currently using cell index 3 (Delivery Date). Change to 2 if using Date Created.
        const dateText = row.cells[3].innerText.trim();  // e.g., "m/d/Y" or "N/A"
        let orderDate = null;
        if (dateText !== "N/A") {
            const parts = dateText.split("/");
            if (parts.length === 3) {
                // JavaScript months are 0-indexed.
                orderDate = new Date(parts[2], parts[0] - 1, parts[1]);
                console.log(`Row ${idx} parsed order date: ${orderDate} from ${dateText}`);
            } else {
                console.warn(`Row ${idx} unexpected date format: ${dateText}`);
            }
        } else {
            console.log(`Row ${idx} date is N/A`);
        }
        
        // --- Date Filtering ---
        let matchesDate = true;
        if (orderDate) {
            // Allow partial filtering if only one boundary is provided.
            if (startDate && endDate) {
                matchesDate = (orderDate >= startDate && orderDate <= endDate);
            } else if (startDate) {
                matchesDate = (orderDate >= startDate);
            } else if (endDate) {
                matchesDate = (orderDate <= endDate);
            }
            console.log(`Row ${idx} date filtering: orderDate = ${orderDate}, matchesDate = ${matchesDate}`);
        }
        
        // --- Other Filters ---
        const matchesSearch = orderNumber.includes(searchQuery) || supplier.includes(searchQuery);
        const matchesStatus = (statusFilter === "" || statusText === statusFilter);

        // Show or hide the row based on all conditions.
        const finalMatch = (matchesSearch && matchesStatus && matchesDate);
        console.log(`Row ${idx} final match: ${finalMatch}`);
        
        row.style.display = finalMatch ? "" : "none";
    });
}

// Attach event listeners once the DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    // Use JavaScript-based listeners and consider removing inline events from your HTML.
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
                    // Hide the modal after saving the order
                    const modalElement = document.getElementById("newOrderModal");
                    let modal = bootstrap.Modal.getInstance(modalElement);
                    if (!modal) {
                        modal = new bootstrap.Modal(modalElement);
                    }
                    modal.hide();
                    // Optionally, refresh/update the orders list here
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
