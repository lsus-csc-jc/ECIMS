$(document).ready(function () {
    console.log("✅ JavaScript Loaded and Running in invmanagement.js!");

    // Constants and Variables
    const apiUrl = "/api/v1/items/";
    const tableBody = $("#tableBody");
    const productStatusMap = new Map();
    let modalActive = false;
    let lowStockQueue = [];

    // Fetch Inventory Data
    async function fetchInventoryData(showAlert = false) {
        console.log("🔄 Fetching inventory data...");

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            console.log("✅ API Data Received:", data);

            const oldStatuses = new Map(productStatusMap);
            updateTable(data);

            if (showAlert) checkAndQueueLowStock(data, oldStatuses);
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
            tableBody.html(`<tr><td colspan="5" class="text-center text-warning">No inventory items found.</td></tr>`);
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
                    statusBadge = `<span class="badge bg-warning text-dark">Unknown</span>`;
            }

            let row = `
                <tr data-id="${item.id}">
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.threshold}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-btn"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            tableBody.append(row);

            productStatusMap.set(item.id, item.status);
        });

        console.log("✅ Table Updated Successfully!");
    }

    // Check and Queue Low Stock Items
    function checkAndQueueLowStock(data, oldStatuses) {
        console.log("🔍 Checking for low-stock items...");

        data.forEach(product => {
            const prevStatus = oldStatuses.get(product.id);
            const isNowLowStock = product.status === 2 || product.status === 1;
            const alertAlreadyTriggered = product.alert_triggered === true;

            console.log(`➡️ ${product.name} | Status: ${product.status} | Triggered: ${product.alert_triggered}`);

            // Skip products that are already triggered or not in low stock
            if (!isNowLowStock || alertAlreadyTriggered) return;

            const wentFromHighToLow = (prevStatus === 3 || prevStatus === undefined) && isNowLowStock;

            if (!lowStockQueue.some(p => p.id === product.id) && (prevStatus !== product.status || wentFromHighToLow)) {
                lowStockQueue.push(product);
                console.log("🚨 Queued Low Stock:", product.name);
            }

            productStatusMap.set(product.id, product.status);
        });

        console.log("📋 Queue:", lowStockQueue.map(p => p.name));
        if (!modalActive && lowStockQueue.length > 0) {
            showNextAlert();
        }
    }

    // Show Next Low Stock Alert
    function showNextAlert() {
        console.log("📣 Running showNextAlert() — Queue length:", lowStockQueue.length);

        if (lowStockQueue.length === 0) {
            modalActive = false;
            return;
        }

        modalActive = true;
        const product = lowStockQueue.shift();

        const content = `
            <strong>${product.name}</strong><br>
            Quantity: ${product.quantity}<br>
            Threshold: ${product.threshold}<br>
            <small>Status: ${product.status === 1 ? "Out of Stock" : "Low Stock"}</small>
        `;
        $("#notificationContent").html(content);

        const modal = new bootstrap.Modal(document.getElementById("notificationModal"));
        modal.show();

        console.log("🟡 Modal shown for:", product.name, "| ID:", product.id);

        $("#markViewedBtn").off("click").on("click", function () {
            console.log("🟢 Mark Viewed clicked for:", product.id);
            markAsViewed(product.id);
            modal.hide();
            setTimeout(() => {
                modalActive = false;
                showNextAlert();
            }, 500);
        });
    }

    // Mark Product as Viewed
    function markAsViewed(productId) {
        console.log("📤 Attempting to mark product as viewed:", productId);

        fetch(`/api/v1/items/${productId}/mark_alert_viewed/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to mark product ${productId}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("✅ Marked as viewed:", data);
        })
        .catch(error => {
            console.error("❌ Error marking as viewed:", error);
        });
    }

    // CSRF Token Retrieval
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

    // Event Listeners
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
        let productName = row.find("td:eq(0)").text();
        let productQuantity = row.find("td:eq(1)").text();
        let productThreshold = row.find("td:eq(2)").text();

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

    $(document).on("click", ".delete-btn", async function () {
        let row = $(this).closest("tr");
        let productId = row.data("id");

        if (!confirm("⚠️ Are you sure you want to delete this product?")) return;

        try {
            const response = await fetch(`${apiUrl}${productId}/`, {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": getCSRFToken()
                }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            await fetchInventoryData(true);
            console.log("✅ Product Deleted Successfully!");
        } catch (error) {
            console.error("❌ Error deleting product:", error);
            alert("Failed to delete product. Please try again.");
        }
    });

    // Initial Data Fetch
    fetchInventoryData(true);
    setInterval(() => fetchInventoryData(true), 15000);

    // Filter by Status
    $("#statusFilter").on("change", function () {
        const selectedStatus = $(this).val();
        $("#tableBody tr").each(function () {
            const statusText = $(this).find("td:eq(3)").text().trim();
            const showRow = selectedStatus === "" || statusText === selectedStatus;
            $(this).toggle(showRow);
        });
    });
});
