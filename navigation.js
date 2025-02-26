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
            localStorage.removeItem("authToken"); // Clear token from localStorage
            sessionStorage.clear(); // Clear sessionStorage data

            // Show a thank-you message before redirecting
            alert("Thank you for using ECIMS!");

            // After 2 seconds, redirect to the login page
            setTimeout(function() {
                window.location.href = "login.html"; // Redirect to the login page
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


//Settings

document.addEventListener("DOMContentLoaded", function () {
    const addUserForm = document.getElementById("addUserForm");
    const tableBody = document.getElementById("userTableBody"); // Ensure this ID matches your table body

    addUserForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form from refreshing the page

        // Get values from form fields
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const role = document.getElementById("role").value;

        // Call function to add user
        addUserToTable(name, email, role);

        // Reset form fields
        addUserForm.reset();

        // Close the modal after saving
        const modal = bootstrap.Modal.getInstance(document.getElementById("addUserModal"));
        modal.hide();
    });

    // Function to Add a User Row (For Testing Purposes)
    function addUserToTable(name, email, role) {
        const newRow = document.createElement("tr");

        newRow.innerHTML = `
            <td class="user-name">${name}</td>
            <td class="user-email">${email}</td>
            <td class="user-role">${role}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-user">Edit</button>
                <button class="btn btn-danger btn-sm remove-user">Remove</button>
            </td>
        `;

        // Add to the table
        tableBody.appendChild(newRow);

        // Attach event listeners
        newRow.querySelector(".edit-user").addEventListener("click", function () {
            editUser(newRow);
        });

        newRow.querySelector(".remove-user").addEventListener("click", function () {
            removeUser(newRow);
        });
    }

    // Function to Edit a User
    function editUser(row) {
        const nameCell = row.querySelector(".user-name");
        const emailCell = row.querySelector(".user-email");
        const roleCell = row.querySelector(".user-role");

        // Get current values
        const currentName = nameCell.innerText;
        const currentEmail = emailCell.innerText;
        const currentRole = roleCell.innerText;

        // Replace text with input fields
        nameCell.innerHTML = `<input type="text" class="form-control name-input" value="${currentName}">`;
        emailCell.innerHTML = `<input type="email" class="form-control email-input" value="${currentEmail}">`;
        roleCell.innerHTML = `
            <select class="form-control role-input">
                <option value="Admin" ${currentRole === "Admin" ? "selected" : ""}>Admin</option>
                <option value="Manager" ${currentRole === "Manager" ? "selected" : ""}>Manager</option>
                <option value="Employee" ${currentRole === "Employee" ? "selected" : ""}>Employee</option>
            </select>
        `;

        // Change Edit button to Save
        const editButton = row.querySelector(".edit-user");
        editButton.innerText = "Save";
        editButton.classList.remove("btn-warning");
        editButton.classList.add("btn-success");

        // Remove old event listener and add a new one
        editButton.replaceWith(editButton.cloneNode(true));
        row.querySelector(".edit-user").addEventListener("click", function () {
            saveUser(row);
        });
    }

    // Function to Save Edited User
    function saveUser(row) {
        const nameInput = row.querySelector(".name-input").value;
        const emailInput = row.querySelector(".email-input").value;
        const roleInput = row.querySelector(".role-input").value;

        // Update table cells with the new values
        row.querySelector(".user-name").innerText = nameInput;
        row.querySelector(".user-email").innerText = emailInput;
        row.querySelector(".user-role").innerText = roleInput;

        // Change Save button back to Edit
        const saveButton = row.querySelector(".edit-user");
        saveButton.innerText = "Edit";
        saveButton.classList.remove("btn-success");
        saveButton.classList.add("btn-warming");

        // Remove old event listener and add a new one
        saveButton.replaceWith(saveButton.cloneNode(true));
        row.querySelector(".edit-user").addEventListener("click", function () {
            editUser(row);
        });

        alert("User updated successfully!");
    }

    // Function to Remove a User
    function removeUser(row) {
        if (confirm("Are you sure you want to delete this user?")) {
            row.remove();
        }
    }

    // Test Data (Add a test user row)
    addUserToTable("Joana Villanova", "juju.villanova11@gmail.com", "Admin");
});

function editProfile() {
    // Hide the profile display, show the edit form
    document.getElementById("profileDisplay").style.display = "none";
    document.getElementById("profileEdit").style.display = "block";

    // Populate input fields with current profile values
    document.getElementById("nameInput").value = document.getElementById("nameText").innerText;
    document.getElementById("emailInput").value = document.getElementById("emailText").innerText;
    document.getElementById("phoneInput").value = document.getElementById("phoneText").innerText;
    document.getElementById("faxInput").value = document.getElementById("faxText").innerText;
    document.getElementById("addressInput").value = document.getElementById("addressText").innerText;
    document.getElementById("timezoneInput").value = document.getElementById("timezoneText").innerText;
}

function saveProfile() {
    // Update displayed profile values
    document.getElementById("nameText").innerText = document.getElementById("nameInput").value;
    document.getElementById("emailText").innerText = document.getElementById("emailInput").value;
    document.getElementById("phoneText").innerText = document.getElementById("phoneInput").value;
    document.getElementById("faxText").innerText = document.getElementById("faxInput").value;
    document.getElementById("addressText").innerText = document.getElementById("addressInput").value;
    document.getElementById("timezoneText").innerText = document.getElementById("timezoneInput").value;

    // Hide edit form, show profile display
    document.getElementById("profileEdit").style.display = "none";
    document.getElementById("profileDisplay").style.display = "block";

    alert("Profile updated successfully!");
}

function cancelEdit() {
    // Hide edit form, show profile display without saving
    document.getElementById("profileEdit").style.display = "none";
    document.getElementById("profileDisplay").style.display = "block";
}

//Update Table Alert
function updateProfile() {
    alert("Profile Updated!");
}

function resetProfile() {
    document.getElementById("profileForm").reset();
}

document.getElementById("togglePassword").addEventListener("click", function () {
    const passwordInput = document.getElementById("password");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.innerHTML = "🔒"
    } else {
        passwordInput.type = "password";
        this.innerHTML = "👁️"; // Change icon to show
    }
});
