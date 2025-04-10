document.addEventListener("DOMContentLoaded", function () {
    // Get references to key DOM elements
    const addUserForm = document.getElementById("addUserForm");
    const tableBody = document.getElementById("userTableBody");
  
    if (!tableBody) {
      console.error("userTableBody not found.");
      return;
    }
  
    // --- Attach Listeners for Django-rendered Table Rows ---
    // These rows should have a data-userid attribute (set in your Django template)
    document.querySelectorAll("#userTableBody tr").forEach(row => {
      const editBtn = row.querySelector(".edit-user");
      if (editBtn) {
        editBtn.addEventListener("click", function () {
          editUser(row);
        });
      }
    });
  
    // --- Add User Form Submission (AJAX) ---
    addUserForm.addEventListener("submit", function (event) {
      event.preventDefault();
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
          // Add the new user row to the table with a proper data-userid
          addUserToTable(data.user.username, data.user.email, data.user.role, data.user.id);
          addUserForm.reset();
          bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
        } else {
          alert("Error saving user: " + data.error);
        }
      })
      .catch(error => console.error("Error:", error));
    });
  
    // --- CSRF Helper Function ---
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie) {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          cookie = cookie.trim();
          if (cookie.startsWith(name + "=")) {
            cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
  
    // --- Function to Add a New User Row ---
    function addUserToTable(name, email, role, userId) {
      const newRow = document.createElement("tr");
      if (userId) {
        newRow.dataset.userid = userId;
      }
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
  
      // Attach event listeners to the newly added buttons
      newRow.querySelector(".edit-user").addEventListener("click", () => editUser(newRow));
      newRow.querySelector(".remove-user").addEventListener("click", () => removeUser(newRow));
    }
  
    // --- Edit User Functionality ---
    function editUser(row) {
      const nameCell = row.querySelector(".user-name");
      const emailCell = row.querySelector(".user-email");
      const roleCell = row.querySelector(".user-role");
  
      const currentName = nameCell.innerText;
      const currentEmail = emailCell.innerText;
      const currentRole = roleCell.innerText;
  
      // Replace cell content with input fields
      nameCell.innerHTML = `<input type="text" class="form-control name-input" value="${currentName}">`;
      emailCell.innerHTML = `<input type="email" class="form-control email-input" value="${currentEmail}">`;
      roleCell.innerHTML = `
        <select class="form-control role-input">
          <option value="Admin" ${currentRole === "Admin" ? "selected" : ""}>Admin</option>
          <option value="Manager" ${currentRole === "Manager" ? "selected" : ""}>Manager</option>
          <option value="Employee" ${currentRole === "Employee" ? "selected" : ""}>Employee</option>
        </select>
      `;
  
      // Replace Edit button with Save button
      const oldButton = row.querySelector(".edit-user");
      const newButton = oldButton.cloneNode(true);
      newButton.innerText = "Save";
      newButton.classList.remove("btn-warning");
      newButton.classList.add("btn-success");
      oldButton.parentNode.replaceChild(newButton, oldButton);
  
      newButton.addEventListener("click", () => saveUser(row));
    }
  
    // --- Save Updated User (AJAX) ---
    function saveUser(row) {
      const nameInput = row.querySelector(".name-input").value;
      const emailInput = row.querySelector(".email-input").value;
      const roleInput = row.querySelector(".role-input").value;
      const userId = row.dataset.userid;
  
      fetch(`/update-user/${userId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
          username: nameInput,
          email: emailInput,
          role: roleInput
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Update the cells with new values
          row.querySelector(".user-name").innerText = nameInput;
          row.querySelector(".user-email").innerText = emailInput;
          row.querySelector(".user-role").innerText = roleInput;
  
          // Replace Save button back to Edit button
          const saveButton = row.querySelector(".edit-user");
          const newButton = saveButton.cloneNode(true);
          newButton.innerText = "Edit";
          newButton.classList.remove("btn-success");
          newButton.classList.add("btn-warning");
          saveButton.parentNode.replaceChild(newButton, saveButton);
          newButton.addEventListener("click", () => editUser(row));
  
          alert("User updated successfully!");
        } else {
          alert("Error updating user: " + data.error);
        }
      })
      .catch(error => {
        console.error("Update failed:", error);
        alert("An error occurred while updating.");
      });
    }
  
    // --- Remove User Functionality (UI Only) ---
    function removeUser(row) {
      if (confirm("Are you sure you want to delete this user?")) {
        // Optionally, add an AJAX call to remove the user from the server.
        row.remove();
      }
    }
  });
  