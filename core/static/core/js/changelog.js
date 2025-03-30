// Change Log
document.addEventListener("DOMContentLoaded", function () {
    const changeLogTableBody = document.getElementById("changeLogTable");
    const searchInput = document.getElementById("changeLogSearch");
    let changelogData = []; // Store changelog entries for filtering

    // Fetch Change Log Entries from API
    function fetchChangeLogs() {
        fetch('/api/v1/changelog/')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Change Logs:", data);
            changelogData = data;
            updateChangeLogTable(data);
        })
        .catch(error => console.error('Error fetching changelog data:', error));
    }

    // Render Change Log Table
    function updateChangeLogTable(data) {
        changeLogTableBody.innerHTML = '';

        data.forEach(entry => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${entry.timestamp}</td>
                <td>${entry.employee_name}</td>
                <td>${entry.action_type}</td>
                <td>${entry.product_info}</td>
                <td>${entry.status}</td>
            `;
            changeLogTableBody.appendChild(row);
        });
    }

    // 🔍 Filter logs as user types
    searchInput.addEventListener("keyup", function () {
        const filter = searchInput.value.toLowerCase();
        const filteredLogs = changelogData.filter(entry => {
            const combined = `${entry.timestamp} ${entry.employee_name} ${entry.action_type} ${entry.product_info} ${entry.status}`.toLowerCase();
            return combined.includes(filter);
        });
        updateChangeLogTable(filteredLogs);
    });

    // Fetch logs on page load
    fetchChangeLogs();
});
