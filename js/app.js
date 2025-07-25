class WarehouseApp {
    constructor() {
        this.currentSection = 'warehouse';
        this.editingProduct = null;
        this.editingPlane = null;
        this.editingTicket = null;
        this.editingDoctor = null;
    }

    async init() {
        console.log('🚀 Initializing WarehouseApp...');
        
        // Check authentication first
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            console.log('❌ User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('✅ User authenticated, proceeding with app initialization');

        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadData();
        
        // Show default section
        this.showSection('warehouse');
        
        console.log('✅ WarehouseApp initialized successfully');
    }

    setupEventListeners() {
        // Product form
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Plane form
        document.getElementById('planeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePlane();
        });

        // Ticket form
        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket();
        });

        // Doctor form
        document.getElementById('doctorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDoctor();
        });
    }

    async checkAuthentication() {
        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'check_session'
                })
            });

            const result = await response.json();
            return result.authenticated === true;
        } catch (error) {
            console.error('Authentication check failed:', error);
            return false;
        }
    }

    showSection(section) {
        // Hide all sections
        const sections = ['warehouse', 'planes', 'tickets', 'doctors'];
        sections.forEach(s => {
            const element = document.getElementById(s);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show selected section
        const selectedSection = document.getElementById(section);
        if (selectedSection) {
            selectedSection.style.display = 'block';
            this.currentSection = section;
            
            // Update navigation
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeBtn = document.querySelector(`[onclick="showSection('${section}')"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            
            // Load section-specific data
            this.loadData();
        }
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
                await this.loadDoctorsForTickets();
                await this.loadProductsForTickets();
                // Set today's date as default for new tickets
                this.setDefaultTicketDate();
                break;
            case 'doctors':
                await this.loadDoctors();
                break;
        }
    }

    setDefaultTicketDate() {
        const ticketDateEl = document.getElementById('ticketDate');
        if (ticketDateEl && !ticketDateEl.value) {
            ticketDateEl.value = new Date().toISOString().split('T')[0];
        }
    }

    // PRODUCTS CRUD
    async saveProduct() {
        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;

        if (!name || !price) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            const response = await fetch('api/products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id || null,
                    name: name,
                    description: description,
                    price: parseFloat(price),
                    stock: parseInt(stock) || 0
                })
            });

            const result = await response.json();

            if (result.success) {
                const action = id ? 'actualizado' : 'añadido';
                alert(`Producto ${action} exitosamente`);
                
                document.getElementById('productForm').reset();
                document.getElementById('productId').value = '';
                this.cancelProductEdit();
                await this.loadProducts();
                
                // Also refresh products in tickets section if it's currently active
                if (this.currentSection === 'tickets') {
                    await this.loadProductsForTickets();
                }
            } else {
                alert('Error: ' + (result.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error guardando producto: ' + error.message);
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
                        <button class="btn-small btn-info" onclick="app.updateStock(${product.id})">Stock</button>
                        <button class="btn-small btn-danger" onclick="app.deleteProduct(${product.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    editProduct(id) {
        fetch(`api/products.php?id=${id}`)
            .then(response => response.json())
            .then(products => {
                if (products.length > 0) {
                    const product = products[0];
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
            })
            .catch(error => {
                console.error('Error loading product:', error);
                alert('Error cargando producto');
            });
    }

    cancelProductEdit() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productFormTitle').textContent = 'Añadir Producto';
        document.getElementById('productSubmitBtn').textContent = 'Añadir Producto';
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

                const result = await response.json();
                if (result.success) {
                    alert('Producto eliminado exitosamente');
                    await this.loadProducts();
                    
                    // Also refresh products in tickets section if it's currently active
                    if (this.currentSection === 'tickets') {
                        await this.loadProductsForTickets();
                    }
                } else {
                    alert('Error: ' + (result.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error eliminando producto: ' + error.message);
            }
        }
    }

    async updateStock(productId) {
        const newStock = prompt('Ingrese la nueva cantidad de stock:');
        if (newStock !== null && !isNaN(newStock)) {
            try {
                const response = await fetch('api/products.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: productId,
                        action: 'update_stock',
                        stock: parseInt(newStock)
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Stock actualizado exitosamente');
                    await this.loadProducts();
                    
                    // Also refresh products in tickets section if it's currently active
                    if (this.currentSection === 'tickets') {
                        await this.loadProductsForTickets();
                    }
                } else {
                    alert('Error: ' + (result.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error updating stock:', error);
                alert('Error actualizando stock: ' + error.message);
            }
        }
    }

    // PLANES CRUD
    async savePlane() {
        const id = document.getElementById('planeId').value;
        const name = document.getElementById('planeName').value;
        const model = document.getElementById('planeModel').value;

        if (!name || !model) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            const response = await fetch('api/planes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id || null,
                    name: name,
                    model: model
                })
            });

            const result = await response.json();

            if (result.success) {
                const action = id ? 'actualizado' : 'añadido';
                alert(`Avión ${action} exitosamente`);
                
                document.getElementById('planeForm').reset();
                document.getElementById('planeId').value = '';
                this.cancelPlaneEdit();
                await this.loadPlanes();
                
                // Also refresh planes in tickets section if it's currently active
                if (this.currentSection === 'tickets') {
                    await this.loadPlanesForTickets();
                }
            } else {
                alert('Error: ' + (result.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error saving plane:', error);
            alert('Error guardando avión: ' + error.message);
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
                    <td>${plane.model}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editPlane(${plane.id})">Editar</button>
                        <button class="btn-small btn-info" onclick="app.managePlaneStock(${plane.id})">Stock</button>
                        <button class="btn-small btn-danger" onclick="app.deletePlane(${plane.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading planes:', error);
        }
    }

    editPlane(id) {
        fetch(`api/planes.php?id=${id}`)
            .then(response => response.json())
            .then(planes => {
                if (planes.length > 0) {
                    const plane = planes[0];
                    document.getElementById('planeId').value = plane.id;
                    document.getElementById('planeName').value = plane.name;
                    document.getElementById('planeModel').value = plane.model;
                    
                    document.getElementById('planeFormTitle').textContent = 'Editar Avión';
                    document.getElementById('planeSubmitBtn').textContent = 'Actualizar Avión';
                    document.getElementById('planeCancelBtn').style.display = 'inline-block';
                    
                    this.editingPlane = id;
                }
            })
            .catch(error => {
                console.error('Error loading plane:', error);
                alert('Error cargando avión');
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
                    const result = await response.json();
                    if (result.success) {
                        alert('Avión eliminado exitosamente');
                        await this.loadPlanes();
                    } else {
                        alert('Error al eliminar el avión: ' + (result.message || 'Error desconocido'));
                    }
                } else {
                    const errorText = await response.text();
                    alert('Error al eliminar el avión: ' + errorText);
                }
            } catch (error) {
                console.error('Error deleting plane:', error);
                alert('Error eliminando avión: ' + error.message);
            }
        }
    }

    // TICKETS CRUD (SIMPLIFIED - NO PILOTS)
    // Load planes for ticket form
    async loadPlanesForTickets() {
        try {
            const response = await fetch('api/planes.php');
            const planes = await response.json();

            const select = document.getElementById('ticketPlane');
            select.innerHTML = '<option value="">Seleccionar Avión</option>';

            planes.forEach(plane => {
                const option = document.createElement('option');
                option.value = plane.id;
                option.textContent = `${plane.name} (${plane.model})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading planes for tickets:', error);
        }
    }

    // Load tickets with filtering support (simplified - no pilots or doctors)
    async loadTickets(dateFilter = '', descriptionFilter = '') {
        console.log('🎫 loadTickets called with filters:', { dateFilter, descriptionFilter });
        try {
            let url = 'api/tickets.php';
            const params = new URLSearchParams();

            // Only date and description filters now
            if (dateFilter) params.append('date', dateFilter);
            if (descriptionFilter) params.append('description', descriptionFilter);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            console.log('📡 Fetching tickets from:', url);
            const response = await fetch(url);

            if (!response.ok) {
                console.error('❌ API Error:', response.status, response.statusText);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const tickets = await response.json();
            console.log('📡 Received tickets:', tickets);

            const tbody = document.querySelector('#ticketsTable tbody');
            if (!tbody) {
                console.error('❌ Tickets table tbody not found!');
                return;
            }

            tbody.innerHTML = '';
            console.log(`🎫 Processing ${tickets.length} tickets...`);

            tickets.forEach((ticket, index) => {
                console.log(`🎫 Processing ticket ${index + 1}:`, ticket);
                const row = tbody.insertRow();

                // Use ticket_date if available, otherwise fall back to created_at
                const displayDate = ticket.ticket_date
                    ? new Date(ticket.ticket_date).toLocaleDateString()
                    : new Date(ticket.created_at).toLocaleDateString();
                const totalCost = parseFloat(ticket.total_cost || 0);

                // No pilots or doctors needed anymore - simplified structure

                console.log(`🎫 Creating row for ticket ${ticket.id} with edit button`);

                row.innerHTML = `
                    <td>${ticket.ticket_number}</td>
                    <td>${ticket.plane_name || 'N/A'}</td>
                    <td>${ticket.description || ''}</td>
                    <td>${displayDate}</td>
                    <td class="cost-cell">$${totalCost.toFixed(2)}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="console.log('Button clicked for ticket ${ticket.id}'); app.editTicket(${ticket.id})">Editar</button>
                        <button class="btn-small btn-info" onclick="app.manageTicketItems(${ticket.id})">Manage Items</button>
                        <button class="btn-small btn-danger" onclick="app.deleteTicket(${ticket.id})">Eliminar</button>
                    </td>
                `;

                console.log(`🎫 Row created for ticket ${ticket.id}`);
            });
            console.log('✅ loadTickets completed successfully');
        } catch (error) {
            console.error('❌ Error loading tickets:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            alert('Error cargando tickets: ' + error.message);
        }
    }

    async createTicket() {
        const ticketId = document.getElementById('ticketId').value;
        const planeId = document.getElementById('ticketPlane').value;
        const ticketNumber = document.getElementById('ticketNumber').value;
        const description = document.getElementById('ticketDescription').value;
        const ticketDate = document.getElementById('ticketDate').value;

        // Simplified validation - no pilots needed
        if (!planeId || !ticketNumber || !ticketDate) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            const isEditing = ticketId && ticketId.trim() !== '';
            const method = isEditing ? 'PUT' : 'POST';
            const requestBody = {
                plane_id: planeId,
                ticket_number: ticketNumber,
                description: description,
                ticket_date: ticketDate
            };

            if (isEditing) {
                requestBody.id = parseInt(ticketId);
            }

            console.log('🎫 Sending ticket request:', { method, requestBody });

            const response = await fetch('api/tickets.php', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            console.log('🎫 Ticket response:', result);

            if (result.success) {
                const action = isEditing ? 'actualizado' : 'creado';
                alert(`Ticket ${action} exitosamente`);
                
                this.cancelTicketEdit();
                await this.loadTickets();
            } else {
                console.error('❌ Ticket creation failed:', result);
                alert('Error saving ticket: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error in createTicket:', error);
            alert('Error saving ticket: ' + error.message);
        }
    }

    async deleteTicket(id) {
        if (confirm('¿Está seguro de que desea eliminar este ticket?')) {
            try {
                const response = await fetch('api/tickets.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Ticket eliminado exitosamente');
                    await this.loadTickets();
                } else {
                    alert('Error: ' + (result.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error deleting ticket:', error);
                alert('Error eliminando ticket: ' + error.message);
            }
        }
    }

    async editTicket(id) {
        console.log('🎫 editTicket called with ID:', id);
        try {
            console.log('📡 Fetching ticket data...');
            const response = await fetch(`api/tickets.php?id=${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const tickets = await response.json();
            console.log('📡 Received ticket data:', tickets);
            
            if (tickets && tickets.length > 0) {
                const ticket = tickets[0];
                console.log('🎫 Processing ticket for edit:', ticket);

                // Get form elements
                const titleElement = document.getElementById('ticketFormTitle');
                const submitBtn = document.getElementById('ticketSubmitBtn');
                const cancelBtn = document.getElementById('ticketCancelBtn');

                console.log('🎫 Form elements found:', { titleElement, submitBtn, cancelBtn });

                // Populate form fields
                try {
                    const ticketIdEl = document.getElementById('ticketId');
                    if (ticketIdEl) {
                        ticketIdEl.value = ticket.id;
                        console.log('✅ Set ticketId');
                    } else {
                        console.log('❌ ticketId element not found');
                    }
                } catch (error) {
                    console.error('❌ Error setting ticketId:', error);
                }

                try {
                    const ticketPlaneEl = document.getElementById('ticketPlane');
                    if (ticketPlaneEl) {
                        ticketPlaneEl.value = ticket.plane_id;
                        console.log('✅ Set ticketPlane');
                    } else {
                        console.log('❌ ticketPlane element not found');
                    }
                } catch (error) {
                    console.error('❌ Error setting ticketPlane:', error);
                }

                try {
                    const ticketNumberEl = document.getElementById('ticketNumber');
                    if (ticketNumberEl) {
                        ticketNumberEl.value = ticket.ticket_number;
                        console.log('✅ Set ticketNumber');
                    } else {
                        console.log('❌ ticketNumber element not found');
                    }
                } catch (error) {
                    console.error('❌ Error setting ticketNumber:', error);
                }

                try {
                    const ticketDescEl = document.getElementById('ticketDescription');
                    if (ticketDescEl) {
                        ticketDescEl.value = ticket.description || '';
                        console.log('✅ Set ticketDescription');
                    } else {
                        console.log('❌ ticketDescription element not found');
                    }
                } catch (error) {
                    console.error('❌ Error setting ticketDescription:', error);
                }

                try {
                    const ticketDateEl = document.getElementById('ticketDate');
                    if (ticketDateEl) {
                        ticketDateEl.value = ticket.ticket_date || '';
                        console.log('✅ Set ticketDate');
                    } else {
                        console.log('❌ ticketDate element not found');
                    }
                } catch (error) {
                    console.error('❌ Error setting ticketDate:', error);
                }

                // No pilot or doctor handling needed anymore - simplified structure

                console.log('✅ Ticket edit form populated successfully');
            } else {
                console.log('❌ No ticket data received');
                alert('Error: No se pudo cargar la información del ticket');
            }
        } catch (error) {
            console.error('❌ Error in editTicket:', error);
            alert('Error cargando el ticket: ' + error.message);
        }
    }

    cancelTicketEdit() {
        document.getElementById('ticketForm').reset();
        document.getElementById('ticketId').value = '';
        document.getElementById('ticketFormTitle').textContent = 'Crear Ticket';
        document.getElementById('ticketSubmitBtn').textContent = 'Crear Ticket';
        document.getElementById('ticketCancelBtn').style.display = 'none';

        // Set today's date as default
        document.getElementById('ticketDate').value = new Date().toISOString().split('T')[0];
        
        this.editingTicket = null;
    }

    // DOCTORS CRUD METHODS
    async loadDoctors() {
        try {
            const response = await fetch('api/doctors.php');
            const doctors = await response.json();

            const tbody = document.querySelector('#doctorsTable tbody');
            tbody.innerHTML = '';

            doctors.forEach(doctor => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${doctor.name}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editDoctor(${doctor.id})">Editar</button>
                        <button class="btn-small btn-danger" onclick="app.deleteDoctor(${doctor.id})">Eliminar</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    async saveDoctor() {
        const id = document.getElementById('doctorId').value;
        const name = document.getElementById('doctorName').value;

        if (!name.trim()) {
            alert('Por favor ingrese el nombre del médico');
            return;
        }

        try {
            const response = await fetch('api/doctors.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id || null, name: name })
            });

            const result = await response.json();

            if (result.success) {
                const action = id ? 'actualizado' : 'añadido';
                alert(`Médico ${action} exitosamente`);

                document.getElementById('doctorForm').reset();
                document.getElementById('doctorId').value = '';
                this.cancelDoctorEdit();
                await this.loadDoctors();
                
                // Also refresh doctors in tickets section if it's currently active
                if (this.currentSection === 'tickets') {
                    await this.loadDoctorsForTickets();
                }
            } else {
                alert('Error: ' + (result.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error saving doctor:', error);
            alert('Error guardando médico: ' + error.message);
        }
    }

    editDoctor(id) {
        fetch(`api/doctors.php?id=${id}`)
            .then(response => response.json())
            .then(doctors => {
                if (doctors.length > 0) {
                    const doctor = doctors[0];
                    document.getElementById('doctorId').value = doctor.id;
                    document.getElementById('doctorName').value = doctor.name;
                    
                    document.getElementById('doctorFormTitle').textContent = 'Editar Médico';
                    document.getElementById('doctorSubmitBtn').textContent = 'Actualizar Médico';
                    document.getElementById('doctorCancelBtn').style.display = 'inline-block';
                    
                    this.editingDoctor = id;
                }
            })
            .catch(error => {
                console.error('Error loading doctor:', error);
                alert('Error cargando médico');
            });
    }

    cancelDoctorEdit() {
        document.getElementById('doctorForm').reset();
        document.getElementById('doctorId').value = '';
        document.getElementById('doctorFormTitle').textContent = 'Añadir Médico';
        document.getElementById('doctorSubmitBtn').textContent = 'Añadir Médico';
        document.getElementById('doctorCancelBtn').style.display = 'none';
        this.editingDoctor = null;
    }

    async deleteDoctor(id) {
        if (confirm('¿Está seguro de que desea eliminar este médico?')) {
            try {
                const response = await fetch('api/doctors.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Médico eliminado exitosamente');
                    await this.loadDoctors();
                    
                    // Also refresh doctors in tickets section if it's currently active
                    if (this.currentSection === 'tickets') {
                        await this.loadDoctorsForTickets();
                    }
                } else {
                    alert('Error: ' + (result.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error deleting doctor:', error);
                alert('Error eliminando médico: ' + error.message);
            }
        }
    }

    // Load doctors for ticket form (multi-select)
    async loadDoctorsForTickets() {
        try {
            const response = await fetch('api/doctors.php');
            const doctors = await response.json();

            const container = document.getElementById('ticketDoctors');
            if (container) {
                container.innerHTML = '';

                doctors.forEach(doctor => {
                    const div = document.createElement('div');
                    div.className = 'multi-select-item';
                    div.innerHTML = `
                        <input type="checkbox" id="doctor_${doctor.id}" value="${doctor.id}">
                        <label for="doctor_${doctor.id}">${doctor.name}</label>
                    `;
                    container.appendChild(div);
                });
            }
        } catch (error) {
            console.error('Error loading doctors for tickets:', error);
        }
    }

    // Load products for ticket form display
    async loadProductsForTickets() {
        try {
            const response = await fetch('api/products.php');
            const products = await response.json();

            const productContainer = document.getElementById('ticketProducts');
            if (productContainer) {
                productContainer.innerHTML = '';

                products.forEach(product => {
                    const div = document.createElement('div');
                    div.className = 'product-item';
                    div.innerHTML = `
                        <span>${product.name} - $${parseFloat(product.price).toFixed(2)} (Stock: ${product.total_stock})</span>
                    `;
                    productContainer.appendChild(div);
                });
            }
        } catch (error) {
            console.error('Error loading products for tickets:', error);
        }
    }

    // Filter methods (simplified - no pilots or doctors)
    applyFilters() {
        const date = document.getElementById('filterDate').value;
        const description = document.getElementById('filterDescription').value;

        this.loadTickets(date, description);
    }

    clearFilters() {
        document.getElementById('filterDate').value = '';
        document.getElementById('filterDescription').value = '';
        this.loadTickets();
    }

    // PLANE STOCK MANAGEMENT
    async managePlaneStock(planeId) {
        try {
            const response = await fetch(`api/plane-stock.php?plane_id=${planeId}`);
            const stockData = await response.json();

            let stockHtml = `
                <div class="stock-management">
                    <h3>Gestión de Stock - Avión ID: ${planeId}</h3>
                    <table class="stock-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>Mínimo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            stockData.forEach(item => {
                const isLow = item.current_stock <= item.minimum_stock;
                const rowClass = isLow ? 'low-stock' : '';
                
                stockHtml += `
                    <tr class="${rowClass}">
                        <td>${item.product_name}</td>
                        <td>${item.current_stock}</td>
                        <td>${item.minimum_stock}</td>
                        <td>
                            <button onclick="app.setMinimum(${planeId}, ${item.product_id})" class="btn-small">Set Min</button>
                            <button onclick="app.transferToPlane(${planeId}, ${item.product_id})" class="btn-small">Transfer</button>
                        </td>
                    </tr>
                `;
            });

            stockHtml += `
                        </tbody>
                    </table>
                </div>
            `;

            // Show in a modal or dedicated area
            const container = document.getElementById('planeStockContainer') || document.body;
            container.innerHTML = stockHtml;

        } catch (error) {
            console.error('Error loading plane stock:', error);
            alert('Error cargando stock del avión');
        }
    }

    async setMinimum(planeId, productId) {
        const minimum = prompt('Ingrese el stock mínimo:');
        if (minimum !== null && !isNaN(minimum)) {
            try {
                const response = await fetch('api/plane-stock.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'set_minimum',
                        plane_id: planeId,
                        product_id: productId,
                        minimum_stock: parseInt(minimum)
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Mínimo actualizado');
                    this.managePlaneStock(planeId);
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error setting minimum:', error);
            }
        }
    }

    async transferToPlane(planeId, productId) {
        const quantity = prompt('Cantidad a transferir:');
        if (quantity !== null && !isNaN(quantity)) {
            try {
                const response = await fetch('api/transfer.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plane_id: planeId,
                        product_id: productId,
                        quantity: parseInt(quantity)
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Transferencia exitosa');
                    this.managePlaneStock(planeId);
                    this.loadProducts(); // Refresh warehouse stock
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error transferring:', error);
            }
        }
    }

    // TICKET ITEMS MANAGEMENT
    async manageTicketItems(ticketId) {
        try {
            const response = await fetch(`api/ticket-items.php?ticket_id=${ticketId}`);
            const items = await response.json();

            let itemsHtml = `
                <div class="ticket-items-management">
                    <h3>Gestión de Items - Ticket ID: ${ticketId}</h3>
                    
                    <div class="add-item-form">
                        <h4>Añadir Item</h4>
                        <select id="itemProduct_${ticketId}">
                            <option value="">Seleccionar Producto</option>
                        </select>
                        <input type="number" id="itemQuantity_${ticketId}" placeholder="Cantidad" min="1">
                        <button onclick="app.addTicketItem(${ticketId})" class="btn-small btn-primary">Añadir</button>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            let totalCost = 0;
            items.forEach(item => {
                const itemTotal = item.quantity_used * item.price;
                totalCost += itemTotal;
                
                itemsHtml += `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity_used}</td>
                        <td>$${parseFloat(item.price).toFixed(2)}</td>
                        <td>$${itemTotal.toFixed(2)}</td>
                        <td>
                            <button onclick="app.removeTicketItem(${item.id}, ${ticketId})" class="btn-small btn-danger">Eliminar</button>
                        </td>
                    </tr>
                `;
            });

            itemsHtml += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3"><strong>Total:</strong></td>
                                <td><strong>$${totalCost.toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;

            // Show in container
            const container = document.getElementById('ticketItemsContainer');
            if (container) {
                container.innerHTML = itemsHtml;
                
                // Load products for the select
                const productsResponse = await fetch('api/products.php');
                const products = await productsResponse.json();
                
                const select = document.getElementById(`itemProduct_${ticketId}`);
                if (select) {
                    products.forEach(product => {
                        const option = document.createElement('option');
                        option.value = product.id;
                        option.textContent = `${product.name} - $${parseFloat(product.price).toFixed(2)}`;
                        select.appendChild(option);
                    });
                }
            }

        } catch (error) {
            console.error('Error loading ticket items:', error);
            alert('Error cargando items del ticket');
        }
    }

    async addTicketItem(ticketId) {
        const productId = document.getElementById(`itemProduct_${ticketId}`).value;
        const quantity = document.getElementById(`itemQuantity_${ticketId}`).value;

        if (!productId || !quantity) {
            alert('Por favor seleccione un producto y cantidad');
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
                alert('Item añadido exitosamente');
                this.manageTicketItems(ticketId);
                this.loadTickets(); // Refresh to update total cost
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error adding ticket item:', error);
            alert('Error añadiendo item: ' + error.message);
        }
    }

    async removeTicketItem(itemId, ticketId) {
        if (confirm('¿Está seguro de que desea eliminar este item?')) {
            try {
                const response = await fetch('api/ticket-items.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: itemId })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Item eliminado exitosamente');
                    this.manageTicketItems(ticketId);
                    this.loadTickets(); // Refresh to update total cost
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error removing item:', error);
                alert('Error removing item: ' + error.message);
            }
        }
    }
}

// Global function for navigation
function showSection(section) {
    app.showSection(section);
}

// Global logout function
async function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = 'login.html';
            } else {
                alert('Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error de conexión al cerrar sesión');
        }
    }
}

// Cache clearing function for troubleshooting
function clearCacheAndReload() {
    if (confirm('Esto limpiará la cache del navegador y recargará la página. ¿Continuar?')) {
        // Clear various cache storages
        if ('caches' in window) {
            caches.keys().then(function(names) {
                names.forEach(function(name) {
                    caches.delete(name);
                });
            });
        }

        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // Force reload with cache bypass
        window.location.reload(true);
    }
}

// Initialize the app
const app = new WarehouseApp();

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            }, function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        });
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed');
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.remove();
    }
});

// Global functions for HTML onclick handlers
function showSection(section) {
    app.showSection(section);
}