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