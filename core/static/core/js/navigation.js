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
    
        // Clear authentication/session data
        localStorage.removeItem("authToken");
        sessionStorage.clear();
        localStorage.removeItem("viewedLowStockIds");
    
        // Redirect to a friendly logout page
        window.location.href = "/logout.html";
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

    // Feedback link functionality
    const feedbackLink = document.getElementById('feedbackLink');
    if (feedbackLink) {
        feedbackLink.addEventListener('click', function (e) {
            e.preventDefault(); // prevents the default "#" behavior
            window.open(
                'https://docs.google.com/forms/d/e/1FAIpQLSf1BVWDcJlxRCJ79_XoL43ReEImc_w9frnOYIRh40CCVe9xOA/viewform',
                '_blank'
            );
        });
    }
});