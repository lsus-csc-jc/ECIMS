document.addEventListener("DOMContentLoaded", function () {
    const addUserForm = document.getElementById("addUserForm");
    const tableBody = document.getElementById("userTableBody"); // Ensure your HTML <tbody> has id="userTableBody"
    
    if (!tableBody) {
        console.error("userTableBody not found. Please ensure your <tbody> in the user table has id='userTableBody'.");
    }
    
    // Helper function to get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    addUserForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission
        console.log("Add User form submitted");
        
        // Create FormData from the form fields
        const formData = new FormData(addUserForm);
        
        fetch(addUserForm.action, {
            method: "POST",
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": getCookie("csrftoken")
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("User saved:", data.user);
                // Add the new user to the table using data from the backend
                addUserToTable(data.user.username, data.user.email, data.user.role);
                addUserForm.reset();
                
                // Close the modal after saving
                const modalEl = document.getElementById("addUserModal");
                const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modalInstance.hide();
            } else {
                alert("Error saving user: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error submitting form:", error);
        });
    });

    // Function to add a user row to the table
    function addUserToTable(name, email, role) {
        if (!tableBody) return;
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
        tableBody.appendChild(newRow);
        
        // Attach event listeners for Edit and Remove buttons
        newRow.querySelector(".edit-user").addEventListener("click", function () {
            editUser(newRow);
        });
        newRow.querySelector(".remove-user").addEventListener("click", function () {
            removeUser(newRow);
        });
    }
    
    // Function to edit a user row
    function editUser(row) {
        const nameCell = row.querySelector(".user-name");
        const emailCell = row.querySelector(".user-email");
        const roleCell = row.querySelector(".user-role");
        
        // Get current values
        const currentName = nameCell.innerText;
        const currentEmail = emailCell.innerText;
        const currentRole = roleCell.innerText;
        
        // Replace cell contents with input fields
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
        
        // Remove old event listener and add new one for saving
        editButton.replaceWith(editButton.cloneNode(true));
        row.querySelector(".edit-user").addEventListener("click", function () {
            saveUser(row);
        });
    }
    
    // Function to save the edited user row
    function saveUser(row) {
        const nameInput = row.querySelector(".name-input").value;
        const emailInput = row.querySelector(".email-input").value;
        const roleInput = row.querySelector(".role-input").value;
        
        // Update the table cells with the new values
        row.querySelector(".user-name").innerText = nameInput;
        row.querySelector(".user-email").innerText = emailInput;
        row.querySelector(".user-role").innerText = roleInput;
        
        // Change the Save button back to Edit
        const saveButton = row.querySelector(".edit-user");
        saveButton.innerText = "Edit";
        saveButton.classList.remove("btn-success");
        saveButton.classList.add("btn-warning");
        
        // Reset event listener to allow editing again
        saveButton.replaceWith(saveButton.cloneNode(true));
        row.querySelector(".edit-user").addEventListener("click", function () {
            editUser(row);
        });
        
        alert("User updated successfully!");
    }
    
    // Function to remove a user row
    function removeUser(row) {
        if (confirm("Are you sure you want to delete this user?")) {
            row.remove();
        }
    }
    
    // Optional: Add a test user row (for demonstration purposes)
    // Uncomment the next line if you want to see a test user added on page load.
    // addUserToTable("Joana Villanova", "juju.villanova11@gmail.com", "Admin");
});

// Toggle password visibility
document.getElementById("togglePassword").addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.innerHTML = "🔒";
    } else {
        passwordInput.type = "password";
        this.innerHTML = "👁️";
    }
});
