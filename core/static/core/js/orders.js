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
        // Assuming table columns: 0: product, 1: quantity, 2: order_number, 3: expected_delivery, 4: status
        const product = row.cells[0].innerText.toLowerCase();
        const orderId = row.cells[2].innerText.toLowerCase();
        const status = row.cells[4].innerText.trim().toLowerCase();
        const dateText = row.cells[3].innerText.trim();  // format "m/d/Y" or "N/A"

        // Check search match (by product or order id)
        const matchesSearch = product.includes(searchQuery) || orderId.includes(searchQuery);
        // Check status match (case-insensitive)
        const matchesStatus = (statusFilter === "" || status === statusFilter);
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
    const orderForm = document.getElementById("orderForm");
    if (!orderForm) return;
    
    orderForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const product = document.getElementById("product").value;
        const quantity = document.getElementById("quantity").value;
        const supplier = document.getElementById("supplier").value;
        const expectedDelivery = document.getElementById("expectedDelivery").value;
        const status = document.getElementById("status").value;

        const orderData = {
            product: product,
            quantity: quantity,
            supplier: supplier,
            expectedDelivery: expectedDelivery,
            status: status
        };

        fetch('/save_order/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response:", data);
            if (data.success) {
                alert("Order successfully added!");
                location.reload();
            } else {
                alert("Failed to add order: " + data.error);
            }
        })
        .catch(error => console.error("Error:", error));

        // Close the modal after submission
        const modalElement = document.getElementById("newOrderModal");
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
            modal = new bootstrap.Modal(modalElement);
        }
        modal.hide();
    });
});
