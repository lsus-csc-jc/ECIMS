//Add Order Form Submission Script
document.getElementById("orderForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let product = document.getElementById("product").value;
    let quantity = document.getElementById("quantity").value;
    let supplier = document.getElementById("supplier").value;
    let expectedDelivery = document.getElementById("expectedDelivery").value;
    let status = document.getElementById("status").value;

    let orderData = {
        product: product,
        quantity: quantity,
        supplier: supplier,
        expectedDelivery: expectedDelivery,
        status: status
    };

    fetch("save_order.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Order successfully added!");
            location.reload();
        } else {
            alert("Failed to add order. Please try again.");
        }
    })
    .catch(error => console.error("Error:", error));

    // Close the modal
    let modal = new bootstrap.Modal(document.getElementById("newOrderModal"));
    modal.hide();
});

//Confirm Close Modal
function confirmCloseModal() {
    let confirmClose = confirm("Are you sure you want to close without saving?");
    if (confirmClose) {
        // Close the modal
        let modal = bootstrap.Modal.getInstance(document.getElementById("newOrderModal"));
        modal.hide();
        // Redirect back to Orders page
        window.location.href = "orders.html";
    }
}

//Filter Orders Script
function filterOrders() {
    let searchQuery = document.getElementById("searchInput").value.toLowerCase();
    let statusFilter = document.getElementById("statusFilter").value;
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;

    let rows = document.querySelectorAll("tbody tr");

    rows.forEach(row => {
        let product = row.cells[0].innerText.toLowerCase();
        let supplier = row.cells[1]?.innerText.toLowerCase() || "";
        let orderId = row.cells[2].innerText.toLowerCase();
        let deliveryDate = row.cells[3].innerText;
        let status = row.cells[4].innerText.trim();

        let matchesSearch = product.includes(searchQuery) || supplier.includes(searchQuery) || orderId.includes(searchQuery);
        let matchesStatus = (statusFilter === "") || (status === statusFilter);
        let matchesDateRange = true;

        if (startDate && endDate) {
            let orderDate = new Date(deliveryDate.split("/").reverse().join("-")); // Convert to YYYY-MM-DD
            let start = new Date(startDate);
            let end = new Date(endDate);
            matchesDateRange = orderDate >= start && orderDate <= end;
        }

        row.style.display = (matchesSearch && matchesStatus && matchesDateRange) ? "" : "none";
    });
}