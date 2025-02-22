document.addEventListener("DOMContentLoaded", function () {
    // Setup navigation links
    function handleNavigation(event) {
        event.preventDefault(); // Prevent default link behavior
        const targetPage = this.getAttribute("data-page");

        if (targetPage) {
            window.location.href = targetPage; // Redirect to the selected page
        }
    }

    function setupNavigation() {
        const navLinks = document.querySelectorAll(".nav-link");

        navLinks.forEach(link => {
            link.addEventListener("click", handleNavigation);
        });
    }

    // Sign-out functionality
    const logoutButton = document.getElementById("logoutBtn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior

            // Clear authentication data (localStorage/sessionStorage)
            //this does not seem to do anything.  I am not sure if the JS can even manipulate this storage, but if it can, the name is wrong - JC:20250220
            localStorage.removeItem("authToken"); // Clear token from localStorage
            sessionStorage.clear(); // Clear sessionStorage data

            // Show a thank-you message before redirecting
            alert("Thank you for using ECIMS!");

            // After 2 seconds, redirect to the login page
            setTimeout(function() {
                window.location.href = "logout"; // Redirect to the login page
            }, 2000); // 2-second delay
        });
    }

    // Call the setupNavigation function on page load
    setupNavigation();

    // Dashboard Data Fetching
    function fetchDashboardData() {
        // Fetching the data from the API endpoint
        fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => {
            // Update dashboard metrics with the fetched data
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
        });
    }

    // Update Dashboard UI with fetched data
    function updateDashboard(data) {
        // Set the values for Products, Alerts, and Pending Orders
        document.getElementById("total-products").textContent = data.totalProducts || 0;
        document.getElementById("total-alerts").textContent = data.totalAlerts || 0;
        document.getElementById("pending-orders").textContent = data.pendingOrders || 0;
    }

    // Call the function to fetch and update dashboard data on load
    fetchDashboardData();
});


// Suppliers
document.addEventListener("DOMContentLoaded", function () {
    const supplierForm = document.getElementById("supplierForm");
    const supplierTableBody = document.getElementById("supplierTableBody");
    const modalTitle = document.getElementById("addSupplierModalLabel");
    const submitButton = supplierForm.querySelector("button[type='submit']");
    let editMode = false;
    let editRow = null;
  
    // Initialize Bootstrap Modal
    const supplierModal = new bootstrap.Modal(document.getElementById("addSupplierModal"), { keyboard: false, backdrop: "static" });
  
    // Add or Edit Supplier
    supplierForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission behavior
  
        // Get form values
        const name = document.getElementById("supplierName").value.trim();
        const phone = document.getElementById("supplierPhone").value.trim();
        const email = document.getElementById("supplierEmail").value.trim();
        const status = document.getElementById("supplierStatus").value;
  
        if (name && phone && email) {
            if (editMode && editRow) {
                // Update existing row
                editRow.cells[0].innerText = name;
                editRow.cells[1].innerText = phone;
                editRow.cells[2].innerHTML = getStatusBadge(status);
                editRow.nextElementSibling.querySelector("span").innerText = email;
                
                // Reset edit mode
                editMode = false;
                editRow = null;
            } else {
                // Create a new row
                const newRow = document.createElement("tr");
                newRow.innerHTML = `
                    <td>${name}</td>
                    <td>${phone}</td>
                    <td class="status-badge">${getStatusBadge(status)}</td>
                    <td>
                        <button class="btn btn-info btn-sm toggleEmail">+</button>
                        <button class="btn btn-sm btn-outline-primary editBtn"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger deleteBtn"><i class="fas fa-trash"></i></button>
                    </td>
                `;
  
                // Hidden row for email
                const emailRow = document.createElement("tr");
                emailRow.classList.add("emailRow");
                emailRow.style.display = "none";
                emailRow.innerHTML = `
                    <td colspan="4">Email: <span>${email}</span></td>
                `;
  
                // Append rows to the table body
                supplierTableBody.appendChild(newRow);
                supplierTableBody.appendChild(emailRow);
            }
  
            // Reset form fields
            supplierForm.reset();
  
            // Close the modal programmatically
            supplierModal.hide();
        }
    });
  
    // Function to generate status badge
    function getStatusBadge(status) {
        return status === "Active" 
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-danger">Inactive</span>';
    }
  
    // Event delegation for delete button, toggle email, and edit functionality
    supplierTableBody.addEventListener("click", function (event) {
        const target = event.target.closest("button");
        if (!target) return;
        
        // ✅ Updated: Delete Button with Confirmation
        if (target.classList.contains("deleteBtn")) {
            let confirmation = confirm("Are you sure you want to delete this supplier?");
            if (confirmation) {
                let emailRow = target.closest("tr").nextElementSibling;
                if (emailRow && emailRow.classList.contains("emailRow")) {
                    emailRow.remove(); // Remove hidden email row
                }
                target.closest("tr").remove(); // Remove main row
            }
        }
  
        // Toggle email row visibility
        if (target.classList.contains("toggleEmail")) {
            let emailRow = target.closest("tr").nextElementSibling;
            emailRow.style.display = emailRow.style.display === "none" ? "table-row" : "none";
        }
  
        // Edit Supplier Functionality
        if (target.classList.contains("editBtn")) {
            let row = target.closest("tr");
            let emailRow = row.nextElementSibling;
  
            let name = row.cells[0].innerText;
            let phone = row.cells[1].innerText;
            let email = emailRow.querySelector("span").innerText;
            let status = row.cells[2].querySelector("span").innerText;
  
            document.getElementById("supplierName").value = name;
            document.getElementById("supplierPhone").value = phone;
            document.getElementById("supplierEmail").value = email;
            document.getElementById("supplierStatus").value = status;
  
            // Set edit mode
            editMode = true;
            editRow = row;
  
            // Change modal title and button text
            modalTitle.innerText = "Edit Supplier";
            submitButton.innerText = "Save Changes";
  
            // Open the modal for editing
            supplierModal.show();
        }
    });
  
    // Reset modal title and button text when opening to add a new supplier
    document.querySelector("button[data-bs-target='#addSupplierModal']").addEventListener("click", function () {
        editMode = false;
        editRow = null;
        modalTitle.innerText = "Add New Supplier";
        submitButton.innerText = "Save Supplier";
        supplierForm.reset();
    });
  });


// Inventory Management

$(document).ready(function() {
    // Edit button functionality
    $(document).on('click', '.edit-btn', function() {
        let row = $(this).closest("tr");
        let product = row.find("td:eq(0)").text();
        let quantity = row.find("td:eq(1)").text();
        let threshold = row.find("td:eq(2)").text();

        $('#editRowIndex').val(row.index());
        $('#editProduct').val(product);
        $('#editQuantity').val(quantity);
        $('#editThreshold').val(threshold);

        $('#editModal').modal('show');
    });

    // Search functionality
    $("#searchInput").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#tableBody tr").each(function() {
            let rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.includes(value));
        });
    });

    // Save changes after editing
    $('#saveChanges').click(function() {
        let rowIndex = $('#editRowIndex').val();
        let newProduct = $('#editProduct').val();
        let newQuantity = parseInt($('#editQuantity').val());
        let newThreshold = parseInt($('#editThreshold').val());

        // ✅ Corrected Status Logic
        let statusBadge = (newQuantity === 0) ? 
            `<span class="badge bg-danger">Out-of-Stock</span>` : 
            (newQuantity < newThreshold) ? 
                `<span class="badge bg-primary">Low-Stock</span>` : 
                `<span class="badge bg-success">In-Stock</span>`;

        let row = $("tbody tr").eq(rowIndex);
        row.find("td:eq(0)").text(newProduct);
        row.find("td:eq(1)").text(newQuantity);
        row.find("td:eq(2)").text(newThreshold);
        row.find("td:eq(3)").html(statusBadge);

        $('#editModal').modal('hide');
    });

    // Delete button functionality
    $(document).on("click", ".delete-btn", function () {
        let confirmation = confirm("Are you sure you want to delete this item?");
        if (confirmation) {
            $(this).closest("tr").remove();
        }
    });

    // Add new product
    $('#addEntry').click(function() {
        let product = $('#addProduct').val();
        let quantity = parseInt($('#addQuantity').val());
        let threshold = parseInt($('#addThreshold').val());

        // ✅ Corrected Status Logic
        let statusBadge = (quantity === 0) ? 
            `<span class="badge bg-danger">Out-of-Stock</span>` : 
            (quantity < threshold) ? 
                `<span class="badge bg-warning text-dark">Low-Stock</span>` : 
                `<span class="badge bg-success">In-Stock</span>`;

        if (product && quantity >= 0 && threshold >= 0) {
            let newRow = `
                <tr>
                    <td>${product}</td>
                    <td>${quantity}</td>
                    <td>${threshold}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-btn"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;

            $("#tableBody").append(newRow);
            $('#addModal').modal('hide');
            $('#addForm')[0].reset();
        } else {
            alert("All fields are required!");
        }
    });
});
