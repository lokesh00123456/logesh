// Orders Tab JavaScript

// Initialize the Order Status Chart
const orderStatusCanvas = document.getElementById('orderStatusChart');
if (orderStatusCanvas) {
    const orderStatusChart = new Chart(orderStatusCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Preparing', 'Ready', 'Delivered'],
            datasets: [{
                data: [12, 19, 8, 15],
                backgroundColor: [
                    '#FFC107', // Yellow for Pending
                    '#17A2B8', // Blue for Preparing
                    '#28A745', // Green for Ready
                    '#6C757D'  // Gray for Delivered
                ],
                borderColor: [
                    '#fff',
                    '#fff',
                    '#fff',
                    '#fff'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = Math.round((value / total) * 100) + '%';
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// Order Filtering Function
$(document).ready(function () {
    // Filter orders
    $('.dropdown-item[data-filter]').on('click', function (e) {
        e.preventDefault();
        const filter = $(this).data('filter');

        if (filter === 'all') {
            $('.order-card').show();
        } else {
            $('.order-card').hide();
            $(`.order-card.${filter}`).show();
        }

        $('#orderFilterDropdown').text($(this).text());
    });

    // Search orders
    $('#orderSearchBtn').on('click', function () {
        const searchTerm = $('#orderSearchInput').val().toLowerCase();

        if (searchTerm.length > 0) {
            $('.order-card').each(function () {
                const orderText = $(this).text().toLowerCase();
                $(this).toggle(orderText.includes(searchTerm));
            });
        } else {
            $('.order-card').show();
        }
    });

    // Order search on Enter key
    $('#orderSearchInput').on('keypress', function (e) {
        if (e.which === 13) {
            $('#orderSearchBtn').click();
        }
    });

    // View Order Details
    $('.order-list').on('click', '.btn-outline-primary', function () {
        const orderCard = $(this).closest('.order-card');
        const orderTitle = orderCard.find('.card-title').text();
        const orderSubtitle = orderCard.find('.card-subtitle').text();
        const orderItems = orderCard.find('p:contains("Items:")').text();
        const orderNotes = orderCard.find('p:contains("Notes:")').text();
        const orderTime = orderCard.find('p:contains("Time:")').text();
        const orderStatus = orderCard.find('.badge').text();
        const orderTotal = orderCard.find('h5:contains("₹")').text();

        // Populate modal with order details
        let modalContent = `
            <h5>${orderTitle}</h5>
            <p>${orderSubtitle}</p>
            <p><strong>Status:</strong> <span class="badge ${orderStatus.toLowerCase() === 'pending' ? 'bg-warning' :
                orderStatus.toLowerCase() === 'preparing' ? 'bg-info' :
                    orderStatus.toLowerCase() === 'ready' ? 'bg-success' :
                        'bg-secondary'}">${orderStatus}</span></p>
            <p>${orderItems}</p>
            <p>${orderNotes}</p>
            <p>${orderTime}</p>
            <hr>
            <h6>Total: ${orderTotal}</h6>`;

        $('#orderDetailsContent').html(modalContent);
        $('#orderDetailsModal').modal('show');
    });

    // Update Order Status
    $('.order-list').on('click', '.btn-success', function () {
        const orderCard = $(this).closest('.order-card');
        const currentStatus = orderCard.find('.badge').text().toLowerCase();
        let newStatus, newStatusBadgeClass;

        // Determine next status based on current status
        switch (currentStatus) {
            case 'pending':
                newStatus = 'Preparing';
                newStatusBadgeClass = 'bg-info';
                orderCard.removeClass('pending').addClass('preparing');
                break;
            case 'preparing':
                newStatus = 'Ready';
                newStatusBadgeClass = 'bg-success';
                orderCard.removeClass('preparing').addClass('ready');
                break;
            case 'ready':
                newStatus = 'Delivered';
                newStatusBadgeClass = 'bg-secondary';
                orderCard.removeClass('ready').addClass('delivered');
                break;
            default:
                newStatus = 'Pending';
                newStatusBadgeClass = 'bg-warning';
                orderCard.removeClass('delivered').addClass('pending');
        }

        // Update badge
        orderCard.find('.badge').text(newStatus).removeClass().addClass(`badge ${newStatusBadgeClass}`);

        // Show a toast notification
        showToast(`Order status updated to ${newStatus}`, 'success');
    });

    // Create New Order
    $('#createOrderBtn').on('click', function () {
        const tableNumber = $('#tableSelect').val();
        const guestCount = $('#guestCount').val();
        const orderNotes = $('#orderNotes').val();
        const total = $('#total').text();

        if (!tableNumber) {
            showToast('Please select a table', 'error');
            return;
        }

        const items = [];
        $('.order-item').each(function () {
            const itemName = $(this).find('.item-select option:selected').text();
            const quantity = $(this).find('.item-quantity').val();

            if (itemName !== 'Select item') {
                items.push(`${itemName} (${quantity})`);
            }
        });

        if (items.length === 0) {
            showToast('Please add at least one item', 'error');
            return;
        }

        // Create a new order card
        const orderNumber = 1000 + $('.order-card').length + 1;
        const orderCard = `
            <div class="card order-card pending mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-top">
                        <div>
                            <h5 class="card-title">Order #${orderNumber}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">Table ${tableNumber} • ${guestCount} guests</h6>
                            <p class="mb-1"><strong>Items:</strong> ${items.join(', ')}</p>
                            <p class="mb-1"><strong>Notes:</strong> ${orderNotes || 'None'}</p>
                            <p class="mb-0"><strong>Time:</strong> Ordered just now</p>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-warning">Pending</span>
                            <h5 class="mt-2">${total}</h5>
                        </div>
                    </div>
                    <div class="mt-3 d-flex justify-content-end">
                        <button class="btn btn-sm btn-outline-primary me-2">View Details</button>
                        <button class="btn btn-sm btn-success">Update Status</button>
                    </div>
                </div>
            </div>`;

        // Add the new order to the top of the list
        $('.order-list').prepend(orderCard);

        // Close the modal
        $('#newOrderModal').modal('hide');

        // Show success message
        showToast(`Order #${orderNumber} created successfully`, 'success');

        // Reset the form
        $('#newOrderForm')[0].reset();
        $('#orderItems').html(`
            <div class="row mb-3 order-item">
                <div class="col-md-5">
                    <select class="form-select item-select" required>
                        <option value="" selected disabled>Select item</option>
                        <option value="butter_chicken">Butter Chicken</option>
                        <option value="paneer_butter_masala">Paneer Butter Masala</option>
                        <option value="masala_dosa">Masala Dosa</option>
                        <option value="biryani">Biryani</option>
                        <option value="naan">Naan</option>
                        <option value="garlic_naan">Garlic Naan</option>
                        <option value="vada">Vada</option>
                        <option value="pulao">Pulao</option>
                        <option value="coffee">Coffee</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control item-quantity" min="1" value="1" required>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control item-price" value="₹250" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger remove-item">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>`);
        $('#subtotal').text('₹250');
        $('#tax').text('₹12.50');
        $('#total').text('₹262.50');
    });

    // Add New Item to Order Form
    $('#addItemBtn').on('click', function () {
        const newItem = `
            <div class="row mb-3 order-item">
                <div class="col-md-5">
                    <select class="form-select item-select" required>
                        <option value="" selected disabled>Select item</option>
                        <option value="butter_chicken">Butter Chicken</option>
                        <option value="paneer_butter_masala">Paneer Butter Masala</option>
                        <option value="masala_dosa">Masala Dosa</option>
                        <option value="biryani">Biryani</option>
                        <option value="naan">Naan</option>
                        <option value="garlic_naan">Garlic Naan</option>
                        <option value="vada">Vada</option>
                        <option value="pulao">Pulao</option>
                        <option value="coffee">Coffee</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control item-quantity" min="1" value="1" required>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control item-price" value="₹250" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger remove-item">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>`;

        $('#orderItems').append(newItem);
        updateTotalPrice();
    });

    // Remove Item from Order Form
    $('#orderItems').on('click', '.remove-item', function () {
        if ($('.order-item').length > 1) {
            $(this).closest('.order-item').remove();
            updateTotalPrice();
        } else {
            showToast('Order must have at least one item', 'error');
        }
    });

    // Update price when item or quantity changes
    $('#orderItems').on('change', '.item-select, .item-quantity', function () {
        const row = $(this).closest('.order-item');
        const itemSelect = row.find('.item-select');
        const quantity = parseInt(row.find('.item-quantity').val());

        // This would be replaced with real price data from the server
        const priceMap = {
            'butter_chicken': 350,
            'paneer_butter_masala': 300,
            'masala_dosa': 180,
            'biryani': 320,
            'naan': 50,
            'garlic_naan': 70,
            'vada': 120,
            'pulao': 220,
            'coffee': 80
        };

        const selectedItem = itemSelect.val();
        if (selectedItem && priceMap[selectedItem]) {
            const price = priceMap[selectedItem] * quantity;
            row.find('.item-price').val(`₹${price}`);
            updateTotalPrice();
        }
    });

    // AI Suggestions
    $('#suggestItemsBtn').on('click', function () {
        // In a real app, this would make an API request to get AI suggestions
        const tableNumber = $('#tableSelect').val();

        if (!tableNumber) {
            showToast('Please select a table first', 'error');
            return;
        }

        // Mock AI suggestions based on table
        let suggestion;
        switch (tableNumber) {
            case '3':
                suggestion = "Based on past orders from Table 3, we recommend adding: Gulab Jamun, Mango Lassi";
                break;
            case '8':
                suggestion = "Customers at Table 8 typically enjoy spicy food. Consider adding: Chicken Vindaloo, Extra Chutney";
                break;
            default:
                suggestion = "Recommended add-ons: Garlic Naan, Mango Lassi, Gulab Jamun";
        }

        showToast(suggestion, 'info', 8000);
    });

    // Update order modal status
    $('#updateOrderStatusBtn').on('click', function () {
        const statusBadge = $('#orderDetailsContent .badge');
        const currentStatus = statusBadge.text().toLowerCase();
        let newStatus, newStatusClass;

        switch (currentStatus) {
            case 'pending':
                newStatus = 'Preparing';
                newStatusClass = 'bg-info';
                break;
            case 'preparing':
                newStatus = 'Ready';
                newStatusClass = 'bg-success';
                break;
            case 'ready':
                newStatus = 'Delivered';
                newStatusClass = 'bg-secondary';
                break;
            default:
                newStatus = 'Pending';
                newStatusClass = 'bg-warning';
        }

        statusBadge.text(newStatus).removeClass().addClass(`badge ${newStatusClass}`);
        showToast(`Order status updated to ${newStatus}`, 'success');
    });
});

// Tables Tab JavaScript

$(document).ready(function () {
    // Make tables draggable
    $("#tableLayout .table").draggable({
        containment: "#tableLayout",
        grid: [10, 10],
        stop: function (event, ui) {
            // Save position after drag
            const tableId = $(this).text();
            console.log(`Table ${tableId} moved to position: ${ui.position.left}, ${ui.position.top}`);
            // In a real app, you would save this to the database
        }
    });

    // Table selection functionality
    $("#tableLayout .table").on("click", function () {
        const tableId = $(this).text();
        const isOccupied = $(this).hasClass("occupied");
        const hasActiveOrder = $(this).hasClass("active-order");

        // Update selected table display
        $("#selectedTable").text(tableId);

        // Show table information based on status
        let tableInfoHTML = "";
        if (isOccupied) {
            if (hasActiveOrder) {
                tableInfoHTML = `
                    <p><strong>Status:</strong> <span class="badge bg-info">Active Order</span></p>
                    <p><strong>Occupied Since:</strong> 7:45 PM</p>
                    <p><strong>Current Order:</strong> #1001</p>
                    <p><strong>Order Status:</strong> Preparing</p>
                    <p><strong>Guests:</strong> 4</p>
                `;
            } else {
                tableInfoHTML = `
                    <p><strong>Status:</strong> <span class="badge bg-danger">Occupied</span></p>
                    <p><strong>Occupied Since:</strong> 8:15 PM</p>
                    <p><strong>Guests:</strong> 2</p>
                    <p><strong>No active order</strong></p>
                `;
            }
        } else {
            tableInfoHTML = `
                <p><strong>Status:</strong> <span class="badge bg-success">Available</span></p>
                <p><strong>Last Occupied:</strong> 6:30 PM</p>
                <p><strong>Average Dining Time:</strong> 55 minutes</p>
            `;
        }

        $("#tableInfo").html(tableInfoHTML);

        // Show action buttons
        $("#tableActions").show();

        // Update button states based on table status
        if (isOccupied) {
            $("#newOrderBtn").prop("disabled", hasActiveOrder);
            $("#viewOrderBtn").prop("disabled", !hasActiveOrder);
            $("#clearTableBtn").prop("disabled", false);
        } else {
            $("#newOrderBtn").prop("disabled", false);
            $("#viewOrderBtn").prop("disabled", true);
            $("#clearTableBtn").prop("disabled", true);
        }
    });

    // Table action buttons functionality
    $("#newOrderBtn").on("click", function () {
        const tableId = $("#selectedTable").text();
        if (tableId !== "None") {
            // Pre-select the table in the new order modal
            $("#tableSelect").val(tableId.replace("T", ""));
            $("#newOrderModal").modal("show");
        }
    });

    $("#viewOrderBtn").on("click", function () {
        const tableId = $("#selectedTable").text();
        if (tableId !== "None") {
            // Find the order corresponding to this table and show it
            // This is a simplified version - in a real app, you would fetch the order from the server
            let orderDetails = "";

            if (tableId === "T3") {
                orderDetails = `
                    <h5>Order #1001</h5>
                    <p>Table 3 • 2 guests</p>
                    <p><strong>Status:</strong> <span class="badge bg-info">Preparing</span></p>
                    <p><strong>Items:</strong> Butter Chicken, Naan (2), Biryani</p>
                    <p><strong>Notes:</strong> No spice in Butter Chicken</p>
                    <p><strong>Time:</strong> Ordered 10 minutes ago</p>
                    <hr>
                    <h6>Total: ₹950</h6>
                `;
            } else if (tableId === "T8") {
                orderDetails = `
                    <h5>Order #1000</h5>
                    <p>Table 8 • 4 guests</p>
                    <p><strong>Status:</strong> <span class="badge bg-info">Preparing</span></p>
                    <p><strong>Items:</strong> Masala Dosa (2), Vada (4), Coffee (4)</p>
                    <p><strong>Notes:</strong> Extra chutney</p>
                    <p><strong>Time:</strong> Ordered 15 minutes ago</p>
                    <hr>
                    <h6>Total: ₹780</h6>
                `;
            }

            $('#orderDetailsContent').html(orderDetails);
            $('#orderDetailsModal').modal('show');
        }
    });

    $("#clearTableBtn").on("click", function () {
        const tableId = $("#selectedTable").text();
        if (tableId !== "None") {
            // Show confirmation dialog
            if (confirm(`Are you sure you want to clear table ${tableId}?`)) {
                // Remove occupied and active-order classes
                $(`#tableLayout .table:contains('${tableId}')`).removeClass("occupied active-order");

                // Update table info
                $("#tableInfo").html(`
                    <p><strong>Status:</strong> <span class="badge bg-success">Available</span></p>
                    <p><strong>Last Occupied:</strong> Just now</p>
                    <p><strong>Average Dining Time:</strong> 55 minutes</p>
                `);

                // Update button states
                $("#newOrderBtn").prop("disabled", false);
                $("#viewOrderBtn").prop("disabled", true);
                $("#clearTableBtn").prop("disabled", true);

                // Show success message
                showToast(`Table ${tableId} has been cleared`, "success");
            }
        }
    });

    // Add Table Modal Functionality
    let tableCounter = 10; // Starting from T10 since T1-T9 already exist

    // Add table button click handler in the modal
    $("#addTableModal").on("show.bs.modal", function () {
        // Reset the form whenever the modal is shown
        $("#addTableForm").trigger("reset");
    });

    // Create a new Add Table Modal if it doesn't exist
    if ($("#addTableModal").length === 0) {
        const modalHTML = `
        <div class="modal fade" id="addTableModal" tabindex="-1" aria-labelledby="addTableModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addTableModalLabel">Add New Table</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addTableForm">
                            <div class="mb-3">
                                <label for="tableCapacity" class="form-label">Table Capacity</label>
                                <select class="form-select" id="tableCapacity" required>
                                    <option value="2">2 People</option>
                                    <option value="4" selected>4 People</option>
                                    <option value="6">6 People</option>
                                    <option value="8">8 People</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="tableLocation" class="form-label">Location</label>
                                <select class="form-select" id="tableLocation">
                                    <option value="window">Window Side</option>
                                    <option value="center" selected>Center</option>
                                    <option value="corner">Corner</option>
                                    <option value="outdoor">Outdoor</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmAddTableBtn">Add Table</button>
                    </div>
                </div>
            </div>
        </div>`;

        $("body").append(modalHTML);
    }

    // Confirm add table button click handler
    $(document).on("click", "#confirmAddTableBtn", function () {
        const capacity = $("#tableCapacity").val();
        const location = $("#tableLocation").val();

        // Create a new table element
        const tableId = `T${tableCounter++}`;

        // Calculate random position (in a real app, you might want to place it more intelligently)
        const maxX = $("#tableLayout").width() - 100;
        const maxY = $("#tableLayout").height() - 100;
        const randomX = Math.floor(Math.random() * maxX);
        const randomY = Math.floor(Math.random() * maxY);

        // Create table with appropriate size based on capacity
        let tableSize = 80; // default size
        if (capacity > 4) {
            tableSize = 100; // larger tables
        }

        const newTable = $(`<div class="table" style="top: ${randomY}px; left: ${randomX}px; width: ${tableSize}px; height: ${tableSize}px;">${tableId}</div>`);

        // Add the table to the layout
        $("#tableLayout").append(newTable);

        // Make the new table draggable
        newTable.draggable({
            containment: "#tableLayout",
            grid: [10, 10],
            stop: function (event, ui) {
                console.log(`Table ${tableId} moved to position: ${ui.position.left}, ${ui.position.top}`);
            }
        });

        // Connect the Add Table button in the header to the modal
        $("#addTableBtn").on("click", function () {
            $("#addTableModal").modal("show");
        });

        // Add click handler to the new table
        newTable.on("click", function () {
            const tableId = $(this).text();
            const isOccupied = $(this).hasClass("occupied");
            const hasActiveOrder = $(this).hasClass("active-order");

            $("#selectedTable").text(tableId);

            let tableInfoHTML = "";
            if (isOccupied) {
                tableInfoHTML = `
                    <p><strong>Status:</strong> <span class="badge bg-danger">Occupied</span></p>
                    <p><strong>Capacity:</strong> ${capacity} people</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Occupied Since:</strong> Just now</p>
                `;
            } else {
                tableInfoHTML = `
                    <p><strong>Status:</strong> <span class="badge bg-success">Available</span></p>
                    <p><strong>Capacity:</strong> ${capacity} people</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Added:</strong> Just now</p>
                `;
            }

            $("#tableInfo").html(tableInfoHTML);
            $("#tableActions").show();

            // Update button states
            $("#newOrderBtn").prop("disabled", isOccupied && hasActiveOrder);
            $("#viewOrderBtn").prop("disabled", !hasActiveOrder);
            $("#clearTableBtn").prop("disabled", !isOccupied);
        });

        // Close the modal
        $("#addTableModal").modal("hide");

        // Show success message
        showToast(`Table ${tableId} added successfully`, "success");
    });
});

// Helper function to show toast notifications
function showToast(message, type = "info", duration = 3000) {
    // Remove any existing toasts
    $(".toast-container").remove();

    // Create toast container if it doesn't exist
    if ($(".toast-container").length === 0) {
        $("body").append('<div class="toast-container position-fixed bottom-0 end-0 p-3"></div>');
    }

    // Set the appropriate background color based on type
    let bgClass = "bg-info";
    if (type === "success") bgClass = "bg-success";
    if (type === "error") bgClass = "bg-danger";
    if (type === "warning") bgClass = "bg-warning";

    // Create the toast
    const toastId = `toast-${Date.now()}`;
    const toast = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    // Add toast to container and show it
    $(".toast-container").append(toast);
    const toastElement = new bootstrap.Toast(document.getElementById(toastId), {
        delay: duration
    });
    toastElement.show();
}

// Menu Tab JavaScript
$(document).ready(function () {
    // Menu item edit functionality
    $('.menu-item .btn-primary').on('click', function () {
        const menuItem = $(this).closest('.menu-item');
        const itemName = menuItem.find('.card-title').text();
        const itemPrice = menuItem.find('.card-subtitle').text();
        const itemDescription = menuItem.find('.card-text').text();
        const itemImage = menuItem.find('img').attr('src');

        // Populate the modal with menu item details
        $('#editMenuItemModal .modal-title').text(`Edit ${itemName}`);
        $('#editMenuItemModal #menuItemName').val(itemName);
        $('#editMenuItemModal #menuItemPrice').val(itemPrice);
        $('#editMenuItemModal #menuItemDescription').val(itemDescription);
        $('#editMenuItemModal #menuItemImage').val(itemImage);

        // Show the modal
        $('#editMenuItemModal').modal('show');
    });

    // Save edited menu item
    $('#saveMenuItemBtn').on('click', function () {
        const itemName = $('#editMenuItemModal #menuItemName').val();
        const itemPrice = $('#editMenuItemModal #menuItemPrice').val();
        const itemDescription = $('#editMenuItemModal #menuItemDescription').val();
        const itemImage = $('#editMenuItemModal #menuItemImage').val();

        // Update the menu item in the DOM
        const menuItem = $(`.menu-item .card-title:contains('${itemName}')`).closest('.menu-item');
        menuItem.find('.card-title').text(itemName);
        menuItem.find('.card-subtitle').text(itemPrice);
        menuItem.find('.card-text').text(itemDescription);
        menuItem.find('img').attr('src', itemImage);

        // Close the modal
        $('#editMenuItemModal').modal('hide');

        // Show success message
        showToast('Menu item updated successfully', 'success');
    });
});

// AI Tools Tab JavaScript
$(document).ready(function () {
    // AI Menu Generator
    $('#generateMenuBtn').on('click', function () {
        // In a real app, this would make an API request to generate a menu
        showToast('Menu generated successfully', 'success');
    });

    // AI Report Generator
    $('#generateReportBtn').on('click', function () {
        // In a real app, this would make an API request to generate a report
        showToast('Report generated successfully', 'success');
    });

    // AI Order Predictor
    $('#predictOrdersBtn').on('click', function () {
        // In a real app, this would make an API request to predict orders
        showToast('Orders predicted successfully', 'success');
    });

    // AI Customer Insights
    $('#getInsightsBtn').on('click', function () {
        // In a real app, this would make an API request to get customer insights
        showToast('Customer insights retrieved successfully', 'success');
    });
});

// Reports Tab JavaScript
$(document).ready(function () {
    // View Daily Sales Report
    $('#viewDailySalesReportBtn').on('click', function () {
        // In a real app, this would fetch and display the daily sales report
        showToast('Daily sales report viewed successfully', 'success');
    });

    // View Weekly Performance Report
    $('#viewWeeklyPerformanceReportBtn').on('click', function () {
        // In a real app, this would fetch and display the weekly performance report
        showToast('Weekly performance report viewed successfully', 'success');
    });

    // View Monthly Revenue Report
    $('#viewMonthlyRevenueReportBtn').on('click', function () {
        // In a real app, this would fetch and display the monthly revenue report
        showToast('Monthly revenue report viewed successfully', 'success');
    });

    // View Customer Feedback Report
    $('#viewCustomerFeedbackReportBtn').on('click', function () {
        // In a real app, this would fetch and display the customer feedback report
        showToast('Customer feedback report viewed successfully', 'success');
    });
});

// Settings Tab JavaScript
$(document).ready(function () {
    // Edit General Settings
    $('#editGeneralSettingsBtn').on('click', function () {
        // In a real app, this would open a form to edit general settings
        showToast('General settings edited successfully', 'success');
    });

    // Manage Users
    $('#manageUsersBtn').on('click', function () {
        // In a real app, this would open a form to manage users
        showToast('Users managed successfully', 'success');
    });

    // Edit Notifications
    $('#editNotificationsBtn').on('click', function () {
        // In a real app, this would open a form to edit notification settings
        showToast('Notification settings edited successfully', 'success');
    });

    // Manage Integrations
    $('#manageIntegrationsBtn').on('click', function () {
        // In a real app, this would open a form to manage integrations
        showToast('Integrations managed successfully', 'success');
    });
});

