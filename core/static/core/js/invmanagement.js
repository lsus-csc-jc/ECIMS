$(document).ready(function () {
    console.log("✅ JavaScript Loaded and Running in invmanagement.js!");

    const apiUrl = "/api/v1/items/";
    const tableBody = $("#tableBody");

    async function fetchInventoryData() {
        console.log("🔄 Fetching inventory data...");

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            console.log("✅ API Data Received:", data);

            updateTable(data); 
        } catch (error) {
            console.error("❌ Error fetching inventory data:", error);
        }
    }

    function updateTable(data) {
        console.log("🔄 Updating table with fetched data...");
        tableBody.empty(); 

        if (data.length === 0) {
            console.warn("⚠️ No inventory items found!");
            tableBody.html(`<tr><td colspan="5" class="text-center text-warning">No inventory items found.</td></tr>`);
            return;
        }

        data.forEach(item => {
            let statusBadge = (item.quantity === 0) ? 
                `<span class="badge bg-danger">Out-of-Stock</span>` : 
                (item.quantity < item.threshold) ? 
                    `<span class="badge bg-warning text-dark">Low-Stock</span>` : 
                    `<span class="badge bg-success">In-Stock</span>`;

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
        });

        console.log("✅ Table Updated Successfully!");
    }

    // ✅ Search Functionality
    $("#searchInput").on("keyup", function () {
        let value = $(this).val().toLowerCase();
        $("#tableBody tr").each(function () {
            let rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.includes(value));
        });
    });

    // ✅ Handle Add New Product
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

            fetchInventoryData();
            $("#addModal").modal("hide");
            $("#addForm")[0].reset();
            console.log("✅ Product Added Successfully!");
        } catch (error) {
            console.error("❌ Error adding product:", error);
            alert("Failed to add product. Please try again.");
        }
    });

    // ✅ Handle Edit Product (Event Delegation)
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

    // ✅ Handle Save Changes after Editing
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

            fetchInventoryData();
            $("#editModal").modal("hide");
            console.log("✅ Product Updated Successfully!");
        } catch (error) {
            console.error("❌ Error updating product:", error);
            alert("Failed to update product. Please try again.");
        }
    });

    // ✅ Handle Delete Product (Event Delegation)
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

            fetchInventoryData();
            console.log("✅ Product Deleted Successfully!");
        } catch (error) {
            console.error("❌ Error deleting product:", error);
            alert("Failed to delete product. Please try again.");
        }
    });

    // ✅ Function to Get CSRF Token (Required for Django)
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

    // ✅ Load inventory data on page load
    fetchInventoryData();
});
