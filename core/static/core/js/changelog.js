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
            let statusBadge;
            switch (entry.status) {
                case 3:
                    statusBadge = `<span class="badge bg-success">In-Stock</span>`;
                    break;
                case 2:
                    statusBadge = `<span class="badge bg-warning text-dark">Low-Stock</span>`;
                    break;
                case 1:
                    statusBadge = `<span class="badge bg-danger">Out-of-Stock</span>`;
                    break;
                default:
                    statusBadge = `<span class="badge bg-warning text-dark">Unknown</span>`;
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${entry.date_executed}</td>
                <td>${entry.employee_name}</td>
                <td>Updated quantity</td>
                <td>${entry.item_name} ${entry.old_value} -> ${entry.new_value}</td>
                <td>${statusBadge}</td>
            `;
            changeLogTableBody.appendChild(row);
        });
    }

    // 🔍 Filter logs as user types
    searchInput.addEventListener("keyup", function () {
        const filter = searchInput.value.toLowerCase();
        const filteredLogs = changelogData.filter(entry => {
            const combined = `${entry.date_executed} ${entry.executing_user} ${entry.model_name} ${entry.field_name} ${entry.status}`.toLowerCase();
            return combined.includes(filter);
        });
        updateChangeLogTable(filteredLogs);
    });

    // Fetch logs on page load
    fetchChangeLogs();
});
