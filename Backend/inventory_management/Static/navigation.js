document.addEventListener("DOMContentLoaded", function () {
    // Setup navigation links
    function setupNavigation() {
        const navLinks = document.querySelectorAll(".nav-link");

        navLinks.forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault(); // Prevent default link behavior
                const targetPage = this.getAttribute("data-page");

                if (targetPage) {
                    window.location.href = targetPage; // Redirect to the selected page
                }
            });
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
});



// Reports 
 