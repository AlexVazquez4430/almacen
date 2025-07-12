class WarehouseApp {
    constructor() {
        this.currentSection = 'warehouse';
        this.editingProduct = null;
        this.editingPlane = null;
        this.editingTicket = null;
        this.editingPilot = null;
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
            this.saveProduct();
        });

        document.getElementById('planeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePlane();
        });

        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTicket();
        });

        document.getElementById('pilotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePilot();
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
                await this.loadPilotsForTickets();
                break;
            case 'pilots':
                await this.loadPilots();
                break;
        }
    }

    // PRODUCTS CRUD
    async saveProduct() {
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;
        const id = document.getElementById('productId').value;

        const data = { name, description, price, total_stock: stock };
        
        try {
            let response;
            if (id) {
                // Update existing product
                data.id = id;
                response = await fetch('api/products.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new product
                data.stock = stock; // For new products, use 'stock' instead of 'total_stock'
                response = await fetch('api/products.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                this.cancelProductEdit();
                this.loadProducts();
            }
        } catch (error) {
            console.error('Error saving product:', error);
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
                    <td>$${parseFloat(product.price).toFixed(2)}</td>
                    <td>${product.total_stock}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editProduct(${product.id})">Editar</button>
                        <button class="btn-small btn-success" onclick="app.updateStock(${product.id})">Update Stock</button>
                        <button class="btn-small btn-danger" onclick="app.deleteProduct(${product.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    editProduct(id) {
        fetch('api/products.php')
            .then(response => response.json())
            .then(products => {
                const product = products.find(p => p.id == id);
                if (product) {
                    document.getElementById('productId').value = product.id;
                    document.getElementById('productName').value = product.name;
                    document.getElementById('productDescription').value = product.description || '';
                    document.getElementById('productPrice').value = product.price;
                    document.getElementById('productStock').value = product.total_stock;
                    
                    document.getElementById('productFormTitle').textContent = 'Editar Producto';
                    document.getElementById('productSubmitBtn').textContent = 'Actualizar Producto';
                    document.getElementById('productCancelBtn').style.display = 'inline-block';
                    
                    this.editingProduct = id;
                }
            });
    }

    cancelProductEdit() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productFormTitle').textContent = 'Añadir producto';
        document.getElementById('productSubmitBtn').textContent = 'Añadir producto';
        document.getElementById('productCancelBtn').style.display = 'none';
        this.editingProduct = null;
    }

    async deleteProduct(id) {
        if (confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                const response = await fetch('api/products.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (response.ok) {
                    this.loadProducts();
                }
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    }

    async updateStock(productId) {
        const newStock = prompt('Enter new stock quantity:');
        if (newStock !== null && !isNaN(newStock)) {
            try {
                const response = await fetch('api/products.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: productId, stock: parseInt(newStock) })
                });

                if (response.ok) {
                    this.loadProducts();
                }
            } catch (error) {
                console.error('Error updating stock:', error);
            }
        }
    }

    // PLANES CRUD
    async savePlane() {
        const name = document.getElementById('planeName').value;
        const description = document.getElementById('planeDescription').value;
        const id = document.getElementById('planeId').value;

        const data = { name, description };
        
        try {
            let response;
            if (id) {
                // Update existing plane
                data.id = id;
                response = await fetch('api/planes.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new plane
                response = await fetch('api/planes.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                this.cancelPlaneEdit();
                this.loadPlanes();
            }
        } catch (error) {
            console.error('Error saving plane:', error);
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
                        <button class="btn-small btn-primary" onclick="app.editPlane(${plane.id})">Editar</button>
                        <button class="btn-small btn-info" onclick="app.managePlaneStock(${plane.id})">Manage Stock</button>
                        <button class="btn-small btn-danger" onclick="app.deletePlane(${plane.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading planes:', error);
        }
    }

    editPlane(id) {
        fetch('api/planes.php')
            .then(response => response.json())
            .then(planes => {
                const plane = planes.find(p => p.id == id);
                if (plane) {
                    document.getElementById('planeId').value = plane.id;
                    document.getElementById('planeName').value = plane.name;
                    document.getElementById('planeDescription').value = plane.description || '';
                    
                    document.getElementById('planeFormTitle').textContent = 'Editar Avión';
                    document.getElementById('planeSubmitBtn').textContent = 'Actualizar Avión';
                    document.getElementById('planeCancelBtn').style.display = 'inline-block';
                    
                    this.editingPlane = id;
                }
            });
    }

    cancelPlaneEdit() {
        document.getElementById('planeForm').reset();
        document.getElementById('planeId').value = '';
        document.getElementById('planeFormTitle').textContent = 'Añadir Avión';
        document.getElementById('planeSubmitBtn').textContent = 'Añadir Avión';
        document.getElementById('planeCancelBtn').style.display = 'none';
        this.editingPlane = null;
    }

    async deletePlane(id) {
        if (confirm('¿Está seguro de que desea eliminar este avión?')) {
            try {
                const response = await fetch('api/planes.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (response.ok) {
                    this.loadPlanes();
                }
            } catch (error) {
                console.error('Error deleting plane:', error);
            }
        }
    }

    // TICKETS CRUD
    async saveTicket() {
        const plane_id = document.getElementById('ticketPlane').value;
        const pilot_id = document.getElementById('ticketPilot').value;
        const ticket_number = document.getElementById('ticketNumber').value;
        const description = document.getElementById('ticketDescription').value;
        const id = document.getElementById('ticketId').value;

        const data = { plane_id, pilot_id, ticket_number, description };
        
        try {
            let response;
            if (id) {
                // Update existing ticket
                data.id = id;
                response = await fetch('api/tickets.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new ticket
                response = await fetch('api/tickets.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                this.cancelTicketEdit();
                this.loadTickets();
            }
        } catch (error) {
            console.error('Error saving ticket:', error);
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
                const date = new Date(ticket.created_at).toLocaleDateString();
                row.innerHTML = `
                    <td>${ticket.ticket_number}</td>
                    <td>${ticket.plane_name || 'N/A'}</td>
                    <td>${ticket.pilot_name || 'N/A'}</td>
                    <td>${ticket.description || ''}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editTicket(${ticket.id})">Editar</button>
                        <button class="btn-small btn-info" onclick="app.manageTicketItems(${ticket.id})">Manage Items</button>
                        <button class="btn-small btn-danger" onclick="app.deleteTicket(${ticket.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }

    editTicket(id) {
        fetch('api/tickets.php')
            .then(response => response.json())
            .then(tickets => {
                const ticket = tickets.find(t => t.id == id);
                if (ticket) {
                    document.getElementById('ticketId').value = ticket.id;
                    document.getElementById('ticketPlane').value = ticket.plane_id;
                    document.getElementById('ticketPilot').value = ticket.pilot_id;
                    document.getElementById('ticketNumber').value = ticket.ticket_number;
                    document.getElementById('ticketDescription').value = ticket.description || '';
                    
                    document.getElementById('ticketFormTitle').textContent = 'Editar Ticket';
                    document.getElementById('ticketSubmitBtn').textContent = 'Actualizar Ticket';
                    document.getElementById('ticketCancelBtn').style.display = 'inline-block';
                    
                    this.editingTicket = id;
                }
            });
    }

    cancelTicketEdit() {
        document.getElementById('ticketForm').reset();
        document.getElementById('ticketId').value = '';
        document.getElementById('ticketFormTitle').textContent = 'Crear Ticket';
        document.getElementById('ticketSubmitBtn').textContent = 'Crear Ticket';
        document.getElementById('ticketCancelBtn').style.display = 'none';
        this.editingTicket = null;
    }

    async deleteTicket(id) {
        if (confirm('¿Está seguro de que desea eliminar este ticket?')) {
            try {
                const response = await fetch('api/tickets.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (response.ok) {
                    this.loadTickets();
                }
            } catch (error) {
                console.error('Error deleting ticket:', error);
            }
        }
    }

    async loadPlanesForTickets() {
        try {
            const response = await fetch('api/planes.php');
            const planes = await response.json();
            
            const select = document.getElementById('ticketPlane');
            select.innerHTML = '<option value="">Seleccionar Avión</option>';

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

    async loadPilotsForTickets() {
        try {
            const response = await fetch('api/pilots.php');
            const pilots = await response.json();
            
            const select = document.getElementById('ticketPilot');
            select.innerHTML = '<option value="">Seleccionar Piloto</option>';

            pilots.forEach(pilot => {
                const option = document.createElement('option');
                option.value = pilot.id;
                option.textContent = pilot.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading pilots for tickets:', error);
        }
    }

    // PILOTS CRUD
    async savePilot() {
        const name = document.getElementById('pilotName').value.trim();
        const id = document.getElementById('pilotId').value;

        if (!name) {
            alert('Pilot name is required');
            return;
        }

        const data = { name };

        try {
            let response;
            if (id) {
                // Update existing pilot
                data.id = id;
                response = await fetch('api/pilots.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new pilot
                response = await fetch('api/pilots.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            const result = await response.json();
            if (result.success) {
                this.cancelPilotEdit();
                this.loadPilots();
            } else {
                alert('Error: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving pilot:', error);
            alert('Error saving pilot: ' + error.message);
        }
    }

    async loadPilots() {
        try {
            const response = await fetch('api/pilots.php');
            const pilots = await response.json();

            if (pilots.error) {
                console.error('Error loading pilots:', pilots.error);
                return;
            }

            const tbody = document.querySelector('#pilotsTable tbody');
            tbody.innerHTML = '';

            pilots.forEach(pilot => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${pilot.name}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editPilot(${pilot.id})">Editar</button>
                        <button class="btn-small btn-danger" onclick="app.deletePilot(${pilot.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading pilots:', error);
        }
    }

    editPilot(id) {
        fetch('api/pilots.php')
            .then(response => response.json())
            .then(pilots => {
                const pilot = pilots.find(p => p.id == id);
                if (pilot) {
                    document.getElementById('pilotId').value = pilot.id;
                    document.getElementById('pilotName').value = pilot.name;

                    document.getElementById('pilotFormTitle').textContent = 'Editar Piloto';
                    document.getElementById('pilotSubmitBtn').textContent = 'Actualizar Piloto';
                    document.getElementById('pilotCancelBtn').style.display = 'inline-block';

                    this.editingPilot = id;
                }
            })
            .catch(error => {
                console.error('Error loading pilot for edit:', error);
            });
    }

    cancelPilotEdit() {
        document.getElementById('pilotForm').reset();
        document.getElementById('pilotId').value = '';
        document.getElementById('pilotFormTitle').textContent = 'Añadir Piloto';
        document.getElementById('pilotSubmitBtn').textContent = 'Añadir Piloto';
        document.getElementById('pilotCancelBtn').style.display = 'none';
        this.editingPilot = null;
    }

    async deletePilot(id) {
        if (confirm('¿Está seguro de que desea eliminar este piloto?')) {
            try {
                const response = await fetch('api/pilots.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                const result = await response.json();
                if (result.success) {
                    this.loadPilots();
                } else {
                    alert('Error: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error deleting pilot:', error);
                alert('Error deleting pilot: ' + error.message);
            }
        }
    }

    // EXISTING METHODS (keeping the original functionality)
    async managePlaneStock(planeId) {
        try {
            const response = await fetch('api/products.php');
            const products = await response.json();
            
            const stockResponse = await fetch(`api/plane-stock.php?plane_id=${planeId}`);
            const stockData = await stockResponse.json();
            
            const planeDetails = document.getElementById('planeDetails');
            const container = document.getElementById('planeStockContainer');
            
            container.innerHTML = '<h4>Product Stock Management</h4>';
            
            products.forEach(product => {
                const stock = stockData.find(s => s.product_id == product.id);
                const currentStock = stock ? stock.current_stock : 0;
                const minimumStock = stock ? stock.minimum_quantity : 0;
                
                const productDiv = document.createElement('div');
                productDiv.className = 'stock-item';
                productDiv.innerHTML = `
                    <div class="stock-info">
                        <strong>${product.name}</strong><br>
                        Current Stock: ${currentStock}<br>
                        Minimum: ${minimumStock}<br>
                        Warehouse Stock: ${product.total_stock}
                    </div>
                    <div class="stock-actions">
                        <button onclick="app.setMinimum(${planeId}, ${product.id})">Set Minimum</button>
                        <button onclick="app.transferToPlane(${planeId}, ${product.id})">Transfer</button>
                    </div>
                `;
                container.appendChild(productDiv);
            });
            
            planeDetails.style.display = 'block';
        } catch (error) {
            console.error('Error managing plane stock:', error);
        }
    }

    async setMinimum(planeId, productId) {
        const minimum = prompt('Set minimum stock level:');
        if (minimum !== null && !isNaN(minimum)) {
            try {
                const response = await fetch('api/plane-stock.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plane_id: planeId, product_id: productId, minimum_quantity: parseInt(minimum) })
                });

                if (response.ok) {
                    this.managePlaneStock(planeId);
                }
            } catch (error) {
                console.error('Error setting minimum:', error);
            }
        }
    }

    async transferToPlane(planeId, productId) {
        const quantity = prompt('Enter quantity to transfer:');
        if (quantity !== null && !isNaN(quantity)) {
            try {
                const response = await fetch('api/transfer.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plane_id: planeId, product_id: productId, quantity: parseInt(quantity) })
                });

                if (response.ok) {
                    this.managePlaneStock(planeId);
                    this.loadProducts();
                }
            } catch (error) {
                console.error('Error transferring to plane:', error);
            }
        }
    }

    async manageTicketItems(ticketId) {
        try {
            console.log('Loading ticket items for ticket ID:', ticketId);

            const response = await fetch(`api/ticket-details.php?ticket_id=${ticketId}`);
            const ticketDetails = await response.json();

            console.log('Ticket details response:', ticketDetails);

            if (ticketDetails.error) {
                alert('Error loading ticket details: ' + ticketDetails.error);
                return;
            }

            const itemsResponse = await fetch(`api/ticket-items.php?ticket_id=${ticketId}`);
            const ticketItems = await itemsResponse.json();

            console.log('Ticket items response:', ticketItems);

            if (ticketItems.error) {
                console.error('Error loading ticket items:', ticketItems.error);
                // Continue anyway, might just be no items yet
            }

            const ticketDetailsDiv = document.getElementById('ticketDetails');
            const container = document.getElementById('ticketItemsContainer');

            container.innerHTML = `
                <h4>Ticket Items Management</h4>
                <p><strong>Ticket:</strong> ${ticketDetails.ticket_number} - <strong>Plane:</strong> ${ticketDetails.plane_name}</p>
                <div class="add-item-form">
                    <h5>Add Item</h5>
                    <select id="itemProduct">
                        <option value="">Select Product</option>
                    </select>
                    <input type="number" id="itemQuantity" placeholder="Quantity" min="1">
                    <button onclick="app.addTicketItem(${ticketId})">Add Item</button>
                </div>
                <div class="ticket-items-list">
                    <h5>Current Items</h5>
                    <div id="currentItemsList"></div>
                </div>
            `;

            // Populate available products
            const productSelect = document.getElementById('itemProduct');
            if (ticketDetails.available_products && ticketDetails.available_products.length > 0) {
                console.log('Available products:', ticketDetails.available_products);
                ticketDetails.available_products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.product_id; // Use product_id from plane_stocks
                    option.textContent = `${product.product_name} (Available: ${product.current_stock})`;
                    productSelect.appendChild(option);
                });
            } else {
                console.log('No products available in this plane');
                productSelect.innerHTML = '<option value="">No products available in this plane</option>';
            }

            // Show current items
            const currentItemsList = document.getElementById('currentItemsList');
            if (ticketItems && Array.isArray(ticketItems) && ticketItems.length > 0) {
                console.log('Displaying ticket items:', ticketItems);
                ticketItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'ticket-item';
                    itemDiv.innerHTML = `
                        <span>${item.product_name} - Quantity: ${item.quantity_used}</span>
                        <button class="btn-small btn-danger" onclick="app.removeTicketItem(${item.id}, ${ticketId})">Remove</button>
                    `;
                    currentItemsList.appendChild(itemDiv);
                });
            } else {
                console.log('No items found for this ticket');
                currentItemsList.innerHTML = '<p>No items added to this ticket yet.</p>';
            }

            ticketDetailsDiv.style.display = 'block';
        } catch (error) {
            console.error('Error managing ticket items:', error);
            alert('Error loading ticket items: ' + error.message);
        }
    }

    async addTicketItem(ticketId) {
        const productId = document.getElementById('itemProduct').value;
        const quantity = document.getElementById('itemQuantity').value;

        if (!productId || !quantity) {
            alert('Please select a product and enter quantity');
            return;
        }

        if (parseInt(quantity) <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        try {
            const response = await fetch('api/ticket-items.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: ticketId,
                    product_id: productId,
                    quantity_used: parseInt(quantity) // Use quantity_used to match API
                })
            });

            const result = await response.json();

            if (result.success) {
                // Clear the form
                document.getElementById('itemProduct').value = '';
                document.getElementById('itemQuantity').value = '';
                // Reload the ticket items
                this.manageTicketItems(ticketId);
            } else {
                alert('Error adding item: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding ticket item:', error);
            alert('Error adding item: ' + error.message);
        }
    }

    async removeTicketItem(itemId, ticketId) {
        if (confirm('Remove this item from the ticket?')) {
            try {
                const response = await fetch('api/ticket-items.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: itemId })
                });

                const result = await response.json();

                if (result.success) {
                    this.manageTicketItems(ticketId);
                } else {
                    alert('Error removing item: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error removing ticket item:', error);
                alert('Error removing item: ' + error.message);
            }
        }
    }
}

// Global function for navigation
function showSection(section) {
    app.showSection(section);
}

// Initialize the app
const app = new WarehouseApp();