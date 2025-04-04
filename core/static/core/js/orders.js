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

// Function to filter orders based on search, status, and date range
function filterOrders() {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value.toLowerCase();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const rows = document.querySelectorAll("tbody tr");

    rows.forEach(row => {
        // Assuming table columns: 0: Order Number, 1: Supplier, 2: Date Ordered, 3: Expected Delivery, 4: Status (and button container)
        const orderNumber = row.cells[0].innerText.toLowerCase();
        const supplier = row.cells[1].innerText.toLowerCase();
        const statusText = row.cells[4].innerText.trim().toLowerCase();
        const dateText = row.cells[3].innerText.trim();  // format "m/d/Y" or "N/A"

        // Check search match (by order number or supplier)
        const matchesSearch = orderNumber.includes(searchQuery) || supplier.includes(searchQuery);
        // Check status match (case-insensitive)
        const matchesStatus = (statusFilter === "" || statusText.includes(statusFilter));
        // Check date range match if dates provided and date is valid (not "N/A")
        let matchesDate = true;
        if (startDate && endDate && dateText !== "N/A") {
            const parts = dateText.split("/");
            // Convert m/d/Y to a Date object (note month is 0-indexed)
            const orderDate = new Date(parts[2], parts[0] - 1, parts[1]);
            const start = new Date(startDate);
            const end = new Date(endDate);
            matchesDate = (orderDate >= start && orderDate <= end);
        }
        // Show row if all conditions match
        row.style.display = (matchesSearch && matchesStatus && matchesDate) ? "" : "none";
    });
}

// Function to confirm closing the modal
function confirmCloseModal() {
    console.log("confirmCloseModal called");
    if (confirm("Are you sure you want to close without saving?")) {
        const modalElement = document.getElementById("newOrderModal");
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
            console.log("No existing modal instance found; creating a new one.");
            modal = new bootstrap.Modal(modalElement);
        }
        modal.hide();
        // Uncomment the following line if you want to redirect after closing:
        // window.location.href = "orders.html";
    }
}

// Attach event listeners once the DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    // Test button for verifying JS functionality
    const testButton = document.getElementById("testUpdateButton");
    if (testButton) {
        testButton.addEventListener("click", function() {
            console.log("Test Update Order button clicked");
        });
    } else {
        console.log("Test button not found!");
    }


    button.addEventListener("click", function(event) {
        console.log("Update Order button clicked"); // Check if this appears
        event.preventDefault();
        const orderId = this.dataset.orderId;
        console.log("Order ID:", orderId);
        const row = this.closest("tr");
        const statusSelect = row.querySelector("select[name='status']");
        const newStatus = statusSelect.value;
        console.log("New status:", newStatus);
        // ... rest of the fetch call ...
    });
    
    // Update Order Status Buttons
    const updateButtons = document.querySelectorAll(".update-order-btn");
    updateButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            console.log("Update Order button clicked"); // Debug log
            event.preventDefault();
            const orderId = this.dataset.orderId;
            // Find the select element in the same row
            const row = this.closest("tr");
            const statusSelect = row.querySelector("select[name='status']");
            const newStatus = statusSelect.value;

            // Prepare the payload for update
            const payload = {
                status: newStatus
            };

            // Make the AJAX call to update order status
            fetch(`/update-order/${orderId}/`, {
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
