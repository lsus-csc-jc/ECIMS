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
    if (document.body.dataset.page === 'dashboard') {
        fetchDashboardData();
    }
});