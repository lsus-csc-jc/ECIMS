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