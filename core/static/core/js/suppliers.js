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

    // Function to get CSRF token from cookies
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

    // Fetch Supplier Data from API
    function fetchSuppliers() {
        fetch('/api/v1/suppliers/')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Suppliers:", data);
            updateSupplierTable(data);
        })
        .catch(error => console.error('Error fetching supplier data:', error));
    }

    // Update supplier table with fetched data
    function updateSupplierTable(data) {
        supplierTableBody.innerHTML = '';
        data.forEach(supplier => {
            const row = document.createElement("tr");
            row.dataset.id = supplier.id;
            row.innerHTML = `
                <td>${supplier.name}</td>
                <td>${supplier.phone || 'N/A'}</td>
                <td class="status-badge">${getStatusBadge(supplier.status)}</td>
                <td>
                    <button class="btn btn-info btn-sm toggleEmail">+</button>
                    <button class="btn btn-sm btn-outline-primary editBtn"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger deleteBtn"><i class="fas fa-trash"></i></button>
                </td>
            `;

            const emailRow = document.createElement("tr");
            emailRow.classList.add("emailRow");
            emailRow.style.display = "none";
            emailRow.innerHTML = `<td colspan="4">Email: <span>${supplier.contact_email || 'N/A'}</span></td>`;

            supplierTableBody.appendChild(row);
            supplierTableBody.appendChild(emailRow);
        });
    }

    // Function to generate status badge
    function getStatusBadge(status) {
        return status === "Active" 
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-danger">Inactive</span>';
    }

    // Fetch suppliers on page load
    fetchSuppliers();

    // Add or Edit Supplier
    supplierForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("supplierName").value.trim();
        const phone = document.getElementById("supplierPhone").value.trim();
        const email = document.getElementById("supplierEmail").value.trim();
        const status = document.getElementById("supplierStatus").value; // ✅ Get selected status

        if (name && email) {
            const supplierData = {
                name: name,
                phone: phone,
                contact_email: email,
                status: status  // ✅ Save the correct status value
            };

            let apiUrl = '/api/v1/suppliers/';
            let requestMethod = "POST";

            if (editMode && editRow) {
                const supplierId = editRow.dataset.id;
                apiUrl = `/api/v1/suppliers/${supplierId}/`;
                requestMethod = "PUT";
            }

            fetch(apiUrl, {
                method: requestMethod,
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()  // Include CSRF Token
                },
                body: JSON.stringify(supplierData)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Supplier saved:", data);
                fetchSuppliers();
            })
            .catch(error => console.error("Error saving supplier:", error));

            supplierForm.reset();
            supplierModal.hide();
            editMode = false;
            editRow = null;
        }
    });

    // Event delegation for delete button, toggle email, and edit functionality
    supplierTableBody.addEventListener("click", function (event) {
        const target = event.target.closest("button");
        if (!target) return;

        // Delete Supplier
        if (target.classList.contains("deleteBtn")) {
            let confirmation = confirm("Are you sure you want to delete this supplier?");
            if (confirmation) {
                let row = target.closest("tr");
                let supplierId = row.dataset.id;

                fetch(`/api/v1/suppliers/${supplierId}/`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRFToken": getCSRFToken()  // Include CSRF Token
                    }
                })
                .then(() => {
                    console.log("Supplier deleted:", supplierId);
                    fetchSuppliers();
                })
                .catch(error => console.error("Error deleting supplier:", error));
            }
        }

        // Toggle email row visibility
        if (target.classList.contains("toggleEmail")) {
            let emailRow = target.closest("tr").nextElementSibling;
            emailRow.style.display = emailRow.style.display === "none" ? "table-row" : "none";
        }

        // Edit Supplier
        if (target.classList.contains("editBtn")) {
            let row = target.closest("tr");
            let emailRow = row.nextElementSibling;

            document.getElementById("supplierName").value = row.cells[0].innerText;
            document.getElementById("supplierPhone").value = row.cells[1].innerText;
            document.getElementById("supplierEmail").value = emailRow.querySelector("span").innerText;

            // ✅ Fix: Correctly read status and update the dropdown
            let statusText = row.cells[2].innerText.trim();
            document.getElementById("supplierStatus").value = statusText === "Active" ? "Active" : "Inactive";

            editMode = true;
            editRow = row;

            modalTitle.innerText = "Edit Supplier";
            submitButton.innerText = "Save Changes";

            supplierModal.show();
        }
    });

    // Reset modal title and button text when adding a new supplier
    document.querySelector("button[data-bs-target='#addSupplierModal']").addEventListener("click", function () {
        editMode = false;
        editRow = null;
        modalTitle.innerText = "Add New Supplier";
        submitButton.innerText = "Save Supplier";
        supplierForm.reset();
    });
});
