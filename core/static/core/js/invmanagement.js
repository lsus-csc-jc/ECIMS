// Inventory Management
$(document).ready(function() {
    // Edit button functionality
    $(document).on('click', '.edit-btn', function() {
        let row = $(this).closest("tr");
        let product = row.find("td:eq(0)").text();
        let quantity = row.find("td:eq(1)").text();
        let threshold = row.find("td:eq(2)").text();

        $('#editRowIndex').val(row.index());
        $('#editProduct').val(product);
        $('#editQuantity').val(quantity);
        $('#editThreshold').val(threshold);

        $('#editModal').modal('show');
    });

    // Search functionality
    $("#searchInput").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#tableBody tr").each(function() {
            let rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.includes(value));
        });
    });

    // Save changes after editing
    $('#saveChanges').click(function() {
        let rowIndex = $('#editRowIndex').val();
        let newProduct = $('#editProduct').val();
        let newQuantity = parseInt($('#editQuantity').val());
        let newThreshold = parseInt($('#editThreshold').val());

        // ✅ Corrected Status Logic
        let statusBadge = (newQuantity === 0) ? 
            `<span class="badge bg-danger">Out-of-Stock</span>` : 
            (newQuantity < newThreshold) ? 
                `<span class="badge bg-primary">Low-Stock</span>` : 
                `<span class="badge bg-success">In-Stock</span>`;

        let row = $("tbody tr").eq(rowIndex);
        row.find("td:eq(0)").text(newProduct);
        row.find("td:eq(1)").text(newQuantity);
        row.find("td:eq(2)").text(newThreshold);
        row.find("td:eq(3)").html(statusBadge);

        $('#editModal').modal('hide');
    });

    // Delete button functionality
    $(document).on("click", ".delete-btn", function () {
        let confirmation = confirm("Are you sure you want to delete this item?");
        if (confirmation) {
            $(this).closest("tr").remove();
        }
    });

    // Add new product
    $('#addEntry').click(function() {
        let product = $('#addProduct').val();
        let quantity = parseInt($('#addQuantity').val());
        let threshold = parseInt($('#addThreshold').val());

        // ✅ Corrected Status Logic
        let statusBadge = (quantity === 0) ? 
            `<span class="badge bg-danger">Out-of-Stock</span>` : 
            (quantity < threshold) ? 
                `<span class="badge bg-warning text-dark">Low-Stock</span>` : 
                `<span class="badge bg-success">In-Stock</span>`;

        if (product && quantity >= 0 && threshold >= 0) {
            let newRow = `
                <tr>
                    <td>${product}</td>
                    <td>${quantity}</td>
                    <td>${threshold}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-btn"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;

            $("#tableBody").append(newRow);
            $('#addModal').modal('hide');
            $('#addForm')[0].reset();
        } else {
            alert("All fields are required!");
        }
    });
});