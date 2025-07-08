class WarehouseApp {
    constructor() {
        this.currentSection = 'warehouse';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Form submissions
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        document.getElementById('planeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlane();
        });

        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket();
        });
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        // Show selected section
        document.getElementById(section).classList.add('active');
        event.target.classList.add('active');

        this.currentSection = section;
        this.loadData();
    }

    async loadData() {
        switch(this.currentSection) {
            case 'warehouse':
                await this.loadProducts();
                break;
            case 'planes':
                await this.loadPlanes();
                break;
            case 'tickets':
                await this.loadTickets();
                await this.loadPlanesForTickets();
                break;
        }
    }

    async addProduct() {
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const stock = document.getElementById('productStock').value;

        try {
            const response = await fetch('api/products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, stock })
            });

            if (response.ok) {
                document.getElementById('productForm').reset();
                this.loadProducts();
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('api/products.php');
            const products = await response.json();
            
            const tbody = document.querySelector('#productsTable tbody');
            tbody.innerHTML = '';

            products.forEach(product => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.description || ''}</td>
                    <td>${product.total_stock}</td>
                    <td>
                        <button class="btn-small btn-success" onclick="app.updateStock(${product.id})">Update Stock</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async addPlane() {
        const name = document.getElementById('planeName').value;
        const description = document.getElementById('planeDescription').value;

        try {
            const response = await fetch('api/planes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });

            if (response.ok) {
                document.getElementById('planeForm').reset();
                this.loadPlanes();
            }
        } catch (error) {
            console.error('Error adding plane:', error);
        }
    }

    async loadPlanes() {
        try {
            const response = await fetch('api/planes.php');
            const planes = await response.json();
            
            const tbody = document.querySelector('#planesTable tbody');
            tbody.innerHTML = '';

            planes.forEach(plane => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${plane.name}</td>
                    <td>${plane.description || ''}</td>
                    <td>
                        <button class="btn-small" onclick="app.managePlaneStock(${plane.id})">Manage Stock</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading planes:', error);
        }
    }

    async managePlaneStock(planeId) {
        try {
            const [stockResponse, productsResponse] = await Promise.all([
                fetch(`api/plane-stock.php?plane_id=${planeId}`),
                fetch('api/products.php')
            ]);

            const stock = await stockResponse.json();
            const products = await productsResponse.json();

            const container = document.getElementById('planeStockContainer');
            container.innerHTML = '';

            products.forEach(product => {
                const currentStock = stock.find(s => s.product_id == product.id);
                const stockLevel = currentStock ? currentStock.current_stock : 0;
                const minimum = currentStock ? currentStock.minimum_quantity : 0;
                const isLow = stockLevel < minimum;

                const div = document.createElement('div');
                div.className = `stock-item ${isLow ? 'stock-low' : ''}`;
                div.innerHTML = `
                    <span>${product.name} (${stockLevel}/${minimum})</span>
                    <div>
                        <input type="number" id="min_${product.id}" value="${minimum}" min="0" style="width: 80px;">
                        <button class="btn-small" onclick="app.setMinimum(${planeId}, ${product.id})">Set Min</button>
                        <button class="btn-small btn-success" onclick="app.transferToPlane(${planeId}, ${product.id})">Transfer</button>
                    </div>
                `;
                container.appendChild(div);
            });

            document.getElementById('planeDetails').style.display = 'block';
        } catch (error) {
            console.error('Error loading plane stock:', error);
        }
    }

    async createTicket() {
        const planeId = document.getElementById('ticketPlane').value;
        const ticketNumber = document.getElementById('ticketNumber').value;
        const description = document.getElementById('ticketDescription').value;

        try {
            const response = await fetch('api/tickets.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plane_id: planeId, ticket_number: ticketNumber, description })
            });

            if (response.ok) {
                document.getElementById('ticketForm').reset();
                this.loadTickets();
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    }

    async loadTickets() {
        try {
            const response = await fetch('api/tickets.php');
            const tickets = await response.json();
            
            const tbody = document.querySelector('#ticketsTable tbody');
            tbody.innerHTML = '';

            tickets.forEach(ticket => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${ticket.ticket_number}</td>
                    <td>${ticket.plane_name}</td>
                    <td>${ticket.description || ''}</td>
                    <td>${new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-small" onclick="app.manageTicketItems(${ticket.id})">Manage Items</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }

    async loadPlanesForTickets() {
        try {
            const response = await fetch('api/planes.php');
            const planes = await response.json();
            
            const select = document.getElementById('ticketPlane');
            select.innerHTML = '<option value="">Select Plane</option>';

            planes.forEach(plane => {
                const option = document.createElement('option');
                option.value = plane.id;
                option.textContent = plane.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading planes for tickets:', error);
        }
    }

    // Additional methods for stock management, transfers, etc.
    async updateStock(productId) {
        const newStock = prompt('Enter new stock quantity:');
        if (newStock !== null && !isNaN(newStock)) {
            try {
                await fetch('api/products.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: productId, stock: parseInt(newStock) })
                });
                this.loadProducts();
            } catch (error) {
                console.error('Error updating stock:', error);
            }
        }
    }

    async setMinimum(planeId, productId) {
        const minimum = document.getElementById(`min_${productId}`).value;
        try {
            await fetch('api/plane-stock.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plane_id: planeId, product_id: productId, minimum_quantity: parseInt(minimum) })
            });
            this.managePlaneStock(planeId);
        } catch (error) {
            console.error('Error setting minimum:', error);
        }
    }

    async transferToPlane(planeId, productId) {
        const quantity = prompt('Enter quantity to transfer:');
        if (quantity !== null && !isNaN(quantity)) {
            try {
                await fetch('api/transfer.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plane_id: planeId, product_id: productId, quantity: parseInt(quantity) })
                });
                this.managePlaneStock(planeId);
                this.loadProducts();
            } catch (error) {
                console.error('Error transferring to plane:', error);
            }
        }
    }
    // New changes for the commit 4

// Add this function to the WarehouseApp class
async manageTicketItems(ticketId) {
    try {
        const [ticketResponse, planeStockResponse] = await Promise.all([
            fetch(`api/ticket-items.php?ticket_id=${ticketId}`),
            fetch(`api/ticket-details.php?ticket_id=${ticketId}`)
        ]);

        const ticketItems = await ticketResponse.json();
        const ticketDetails = await planeStockResponse.json();

        if (ticketDetails.error) {
            alert('Error loading ticket details: ' + ticketDetails.error);
            return;
        }

        const container = document.getElementById('ticketItemsContainer');
        container.innerHTML = `
            <h4>Ticket: ${ticketDetails.ticket_number} - Plane: ${ticketDetails.plane_name}</h4>
            <div class="add-item-form">
                <h5>Add Item to Ticket</h5>
                <select id="itemProduct_${ticketId}">
                    <option value="">Select Product</option>
                </select>
                <input type="number" id="itemQuantity_${ticketId}" placeholder="Quantity" min="1">
                <button onclick="app.addTicketItem(${ticketId})">Add Item</button>
            </div>
            <div class="ticket-items-list">
                <h5>Items Used</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity Used</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="ticketItemsTable_${ticketId}">
                    </tbody>
                </table>
            </div>
        `;

        // Load available products for this plane
        const productsSelect = document.getElementById(`itemProduct_${ticketId}`);
        ticketDetails.available_products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.product_id;
            option.textContent = `${product.product_name} (Available: ${product.current_stock})`;
            option.disabled = product.current_stock <= 0;
            productsSelect.appendChild(option);
        });

        // Load existing ticket items
        const tbody = document.getElementById(`ticketItemsTable_${ticketId}`);
        tbody.innerHTML = '';
        ticketItems.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.product_name}</td>
                <td>${item.quantity_used}</td>
                <td>
                    <button class="btn-small btn-danger" onclick="app.removeTicketItem(${item.id}, ${ticketId})">Remove</button>
                </td>
            `;
        });

        document.getElementById('ticketDetails').style.display = 'block';
    } catch (error) {
        console.error('Error loading ticket items:', error);
        alert('Error loading ticket items');
    }
}

async addTicketItem(ticketId) {
    const productId = document.getElementById(`itemProduct_${ticketId}`).value;
    const quantity = document.getElementById(`itemQuantity_${ticketId}`).value;

    if (!productId || !quantity || quantity <= 0) {
        alert('Please select a product and enter a valid quantity');
        return;
    }

    try {
        const response = await fetch('api/ticket-items.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticket_id: ticketId,
                product_id: productId,
                quantity_used: parseInt(quantity)
            })
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById(`itemProduct_${ticketId}`).value = '';
            document.getElementById(`itemQuantity_${ticketId}`).value = '';
            this.manageTicketItems(ticketId); // Refresh the items list
        } else {
            alert('Error adding item: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding ticket item:', error);
        alert('Error adding ticket item');
    }
}

async removeTicketItem(itemId, ticketId) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return;
    }

    try {
        const response = await fetch('api/ticket-items.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId })
        });

        const result = await response.json();
        if (result.success) {
            this.manageTicketItems(ticketId); // Refresh the items list
        } else {
            alert('Error removing item: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error removing ticket item:', error);
        alert('Error removing ticket item');
    }
}
}

// Global functions for onclick events
function showSection(section) {
    app.showSection(section);
}

// Initialize app
const app = new WarehouseApp();