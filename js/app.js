// Global functions - deben estar disponibles inmediatamente
function toggleDarkMode() {
  // Agregar feedback visual inmediato
  const button = document.getElementById("darkModeToggle");
  if (button) {
    button.style.transform = "scale(0.9)";
    setTimeout(() => {
      button.style.transform = "";
    }, 150);
  }

  // Cambiar el modo oscuro directamente
  const html = document.documentElement;
  const isDark = html.hasAttribute("data-theme");

  if (isDark) {
    html.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    if (button) {
      button.innerHTML = "🌙";
      button.title = "Cambiar a modo oscuro";
    }
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    if (button) {
      button.innerHTML = "☀️";
      button.title = "Cambiar a modo claro";
    }
  }

  // Si la app está disponible, sincronizar el estado
  if (
    typeof app !== "undefined" &&
    app &&
    typeof app.toggleDarkMode === "function"
  ) {
    // Solo actualizar el estado interno, no cambiar el tema nuevamente
    app.darkMode = !isDark;
  }
}

function showSection(section) {
  if (
    typeof app !== "undefined" &&
    app &&
    typeof app.showSection === "function"
  ) {
    app.showSection(section);
  }
}

function cancelPlaneStockManagement() {
  if (
    typeof app !== "undefined" &&
    app &&
    typeof app.cancelPlaneStockManagement === "function"
  ) {
    app.cancelPlaneStockManagement();
  }
}

async function logout() {
  if (confirm("¿Está seguro de que desea cerrar sesión?")) {
    try {
      const response = await fetch("api/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          action: "logout",
        }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "login.html";
      } else {
        alert("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error de conexión al cerrar sesión");
    }
  }
}

class WarehouseApp {
  constructor() {
    this.currentSection = "warehouse";
    this.editingProduct = null;
    this.editingPlane = null;
    this.editingTicket = null;
    this.editingPilot = null;
    this.darkMode = false;
    this.init();
  }

  // Función helper para hacer peticiones sin cache
  async fetchWithoutCache(url, options = {}) {
    const defaultHeaders = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    };

    const finalOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // Agregar timestamp para evitar cache
    const separator = url.includes("?") ? "&" : "?";
    const urlWithTimestamp = `${url}${separator}_t=${Date.now()}`;

    return fetch(urlWithTimestamp, finalOptions);
  }

  // Función helper para limpiar cache y forzar actualización
  async clearCacheAndReload() {
    // Limpiar cache del service worker
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
        console.log("🗑️ Cache limpiado exitosamente");
      } catch (error) {
        console.error("Error limpiando cache:", error);
      }
    }

    // Forzar actualización del service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.controller.postMessage({
          type: "CLEAR_CACHE",
        });
        console.log("🔄 Service Worker notificado para limpiar cache");
      } catch (error) {
        console.error("Error notificando service worker:", error);
      }
    }
  }

  // Funciones para manejar el modo oscuro
  initDarkMode() {
    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }

    // Escuchar cambios en las preferencias del sistema
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          if (e.matches) {
            this.enableDarkMode();
          } else {
            this.disableDarkMode();
          }
        }
      });
  }

  enableDarkMode() {
    document.documentElement.setAttribute("data-theme", "dark");
    this.darkMode = true;
    localStorage.setItem("theme", "dark");
    this.updateDarkModeButton();
    console.log("🌙 Modo oscuro activado");
  }

  disableDarkMode() {
    document.documentElement.removeAttribute("data-theme");
    this.darkMode = false;
    localStorage.setItem("theme", "light");
    this.updateDarkModeButton();
    console.log("☀️ Modo claro activado");
  }

  toggleDarkMode() {
    // Prevenir múltiples clics rápidos
    if (this.isToggling) return;
    this.isToggling = true;

    setTimeout(() => {
      this.isToggling = false;
    }, 300);

    if (this.darkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  updateDarkModeButton() {
    const button = document.getElementById("darkModeToggle");
    if (button) {
      button.innerHTML = this.darkMode ? "☀️" : "🌙";
      button.title = this.darkMode
        ? "Cambiar a modo claro"
        : "Cambiar a modo oscuro";
    }
  }

  async init() {
    // Check authentication first
    const isAuthenticated = await this.checkAuthentication();
    if (!isAuthenticated) {
      window.location.href = "login.html";
      return;
    }

    this.initDarkMode();
    this.bindEvents();
    this.loadData();
    this.initMobileOptimizations();
  }

  initMobileOptimizations() {
    // Add touch-friendly interactions
    this.addTouchSupport();

    // Handle orientation changes
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Prevent zoom on double tap for buttons
    this.preventDoubleTabZoom();

    // Add swipe support for navigation
    this.addSwipeNavigation();
  }

  addTouchSupport() {
    // Add touch feedback to buttons
    document.addEventListener("touchstart", (e) => {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.classList.contains("nav-btn")
      ) {
        e.target.style.transform = "scale(0.95)";
      }
    });

    document.addEventListener("touchend", (e) => {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.classList.contains("nav-btn")
      ) {
        setTimeout(() => {
          e.target.style.transform = "";
        }, 150);
      }
    });
  }

  preventDoubleTabZoom() {
    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );
  }

  addSwipeNavigation() {
    let startX = 0;
    let startY = 0;

    document.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener("touchmove", (e) => {
      if (!startX || !startY) return;

      const diffX = startX - e.touches[0].clientX;
      const diffY = startY - e.touches[0].clientY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        const sections = ["warehouse", "planes", "tickets", "doctors"];
        const currentIndex = sections.indexOf(this.currentSection);

        if (diffX > 0 && currentIndex < sections.length - 1) {
          // Swipe left - next section
          this.showSection(sections[currentIndex + 1]);
        } else if (diffX < 0 && currentIndex > 0) {
          // Swipe right - previous section
          this.showSection(sections[currentIndex - 1]);
        }
      }

      startX = 0;
      startY = 0;
    });
  }

  handleOrientationChange() {
    // Refresh table layouts after orientation change
    const tables = document.querySelectorAll("table");
    tables.forEach((table) => {
      table.style.display = "none";
      table.offsetHeight; // Force reflow
      table.style.display = "";
    });
  }

  async checkAuthentication() {
    try {
      const response = await this.fetchWithoutCache("api/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check",
        }),
      });

      const result = await response.json();

      if (result.logged_in) {
        // Update user info in header
        const currentUserElement = document.getElementById("currentUser");
        if (currentUserElement) {
          currentUserElement.textContent = result.username;
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Authentication check error:", error);
      return false;
    }
  }

  bindEvents() {
    // Form submissions
    document.getElementById("productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveProduct();
    });

    document.getElementById("planeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.savePlane();
    });

    document.getElementById("ticketForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.createTicket();
    });

    document.getElementById("doctorForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveDoctor();
    });

    // Mejorar respuesta del botón de modo oscuro en móviles
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      // Remover el onclick del HTML para evitar conflictos
      darkModeToggle.removeAttribute("onclick");

      // Agregar evento click que funciona en todos los dispositivos
      darkModeToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDarkMode();
      });

      // Agregar evento táctil para móviles
      darkModeToggle.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleDarkMode();
        },
        { passive: false }
      );

      // Agregar soporte para teclado
      darkModeToggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggleDarkMode();
        }
      });
    }
  }

  showSection(section) {
    // Hide all sections
    document
      .querySelectorAll(".section")
      .forEach((s) => s.classList.remove("active"));
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));

    // Show selected section
    const sectionElement = document.getElementById(section);
    if (!sectionElement) {
      console.error(`Section not found: ${section}`);
      return;
    }

    sectionElement.classList.add("active");
    if (event && event.target) {
      event.target.classList.add("active");
    }

    this.currentSection = section;
    this.loadData();
  }

  async loadData() {
    try {
      switch (this.currentSection) {
        case "warehouse":
          await this.loadProducts();
          break;
        case "planes":
          await this.loadPlanes();
          break;
        case "tickets":
          await this.loadTickets();
          await this.loadPlanesForTickets();
          await this.loadDoctorsForTickets();
          // Set today's date as default for new tickets
          this.setDefaultTicketDate();
          break;
        case "doctors":
          await this.loadDoctors();
          break;
      }
    } catch (error) {
      console.error(
        `Error loading data for section ${this.currentSection}:`,
        error
      );
    }
  }

  // Función para actualizar alertas de stock bajo en aviones
  async updatePlaneStockAlerts() {
    // Si estamos en la sección de aviones, recargar para actualizar alertas
    if (this.currentSection === "planes") {
      await this.loadPlanes();
    }
  }

  setDefaultTicketDate() {
    const ticketDateEl = document.getElementById("ticketDate");
    if (ticketDateEl && !ticketDateEl.value) {
      ticketDateEl.value = new Date().toISOString().split("T")[0];
    }
  }

  // PRODUCTS CRUD
  async saveProduct() {
    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = document.getElementById("productPrice").value;
    const stock = document.getElementById("productStock").value;
    const id = document.getElementById("productId").value;
    const productminstock = document.getElementById("productminstock").value;

    const data = {
      name,
      description,
      price,
      total_stock: stock,
      productminstock,
    };

    try {
      let response;
      if (id) {
        // Update existing product
        data.id = id;
        response = await this.fetchWithoutCache("api/products.php", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Create new product
        data.stock = stock; // For new products, use 'stock' instead of 'total_stock'
        response = await this.fetchWithoutCache("api/products.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        this.cancelProductEdit();
        // Forzar recarga inmediata de datos
        await this.loadProducts();
        // Limpiar cache y forzar actualización
        await this.clearCacheAndReload();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  }

  async loadProducts() {
    try {
      const response = await this.fetchWithoutCache("api/products.php");
      const products = await response.json();

      const tbody = document.querySelector("#productsTable tbody");
      tbody.innerHTML = "";

      // Count low stock products
      let lowStockCount = 0;

      products.forEach((product) => {
        const row = tbody.insertRow();

        // Check if stock is below minimum
        const isLowStock =
          parseInt(product.total_stock) < parseInt(product.minimun_stock);
        if (isLowStock) {
          row.classList.add("low-stock");
          lowStockCount++;
        }

        row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.description || ""}</td>
                    <td>$${parseFloat(product.price).toFixed(2)}</td>
                    <td>
                        ${product.total_stock}
                        ${
                          isLowStock
                            ? '<span style="margin-left: 8px; font-size: 1.2em;" title="Stock bajo">⚠️</span>'
                            : ""
                        }
                    </td>
                    <td>${product.minimun_stock}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editProduct(${
                          product.id
                        })">Editar</button>
                        <button class="btn-small btn-success" onclick="app.updateStock(${
                          product.id
                        })">Actualizar Stock</button>
                        <button class="btn-small btn-danger" onclick="app.deleteProduct(${
                          product.id
                        })">Eliminar</button>
                    </td>
                `;
      });

      // Update low stock alert
      const lowStockAlert = document.getElementById("lowStockAlert");
      const lowStockCountElement = document.getElementById("lowStockCount");

      if (lowStockCount > 0) {
        lowStockAlert.style.display = "block";
        lowStockCountElement.textContent = lowStockCount;
      } else {
        lowStockAlert.style.display = "none";
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  editProduct(id) {
    this.fetchWithoutCache("api/products.php")
      .then((response) => response.json())
      .then((products) => {
        const product = products.find((p) => p.id == id);
        if (product) {
          document.getElementById("productId").value = product.id;
          document.getElementById("productName").value = product.name;
          document.getElementById("productDescription").value =
            product.description || "";
          document.getElementById("productPrice").value = product.price;
          document.getElementById("productStock").value = product.total_stock;
          document.getElementById("productminstock").value =
            product.minimun_stock;

          document.getElementById("productFormTitle").textContent =
            "Editar Producto";
          document.getElementById("productSubmitBtn").textContent =
            "Actualizar Producto";
          document.getElementById("productCancelBtn").style.display =
            "inline-block";

          this.editingProduct = id;
        }
      });
  }

  cancelProductEdit() {
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    document.getElementById("productFormTitle").textContent = "Añadir producto";
    document.getElementById("productSubmitBtn").textContent = "Añadir producto";
    document.getElementById("productCancelBtn").style.display = "none";
    this.editingProduct = null;
  }

  async deleteProduct(id) {
    if (confirm("¿Está seguro de que desea eliminar este producto?")) {
      try {
        const response = await this.fetchWithoutCache("api/products.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          this.loadProducts();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  }

  async updateStock(productId) {
    const newStock = prompt("Enter new stock quantity:");
    if (newStock !== null && !isNaN(newStock)) {
      try {
        const response = await this.fetchWithoutCache("api/products.php", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productId, stock: parseInt(newStock) }),
        });

        if (response.ok) {
          this.loadProducts();
        }
      } catch (error) {
        console.error("Error updating stock:", error);
      }
    }
  }

  // PLANES CRUD
  async savePlane() {
    const name = document.getElementById("planeName").value;
    const description = document.getElementById("planeDescription").value;
    const id = document.getElementById("planeId").value;

    const data = { name, description };

    try {
      let response;
      if (id) {
        // Update existing plane
        data.id = id;
        response = await this.fetchWithoutCache("api/planes.php", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Create new plane
        response = await this.fetchWithoutCache("api/planes.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        this.cancelPlaneEdit();
        this.loadPlanes();
      }
    } catch (error) {
      console.error("Error saving plane:", error);
    }
  }

  async loadPlanes() {
    try {
      const response = await this.fetchWithoutCache("api/planes.php");

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const planes = await response.json();

      // Obtener datos de stock para verificar alertas
      const stockResponse = await this.fetchWithoutCache("api/plane-stock.php");

      let stockData = [];
      if (stockResponse.ok) {
        stockData = await stockResponse.json();
      }

      const tbody = document.querySelector("#planesTable tbody");
      if (!tbody) {
        throw new Error("Planes table not found");
      }

      tbody.innerHTML = "";

      // Contar alertas totales de stock bajo
      let totalLowStockAlerts = 0;

      planes.forEach((plane) => {
        // Verificar si este avión tiene productos con stock bajo
        const planeStock = stockData.filter((s) => s.plane_id == plane.id);
        let planeLowStockCount = 0;

        planeStock.forEach((stock) => {
          if (
            stock.minimum_quantity > 0 &&
            stock.current_stock < stock.minimum_quantity
          ) {
            planeLowStockCount++;
          }
        });

        if (planeLowStockCount > 0) {
          totalLowStockAlerts++;
        }

        const row = tbody.insertRow();
        row.innerHTML = `
                    <td>
                        ${plane.name}
                        ${
                          planeLowStockCount > 0
                            ? `<span style="margin-left: 8px; font-size: 1.2em;" title="Stock bajo en ${planeLowStockCount} productos">⚠️</span>`
                            : ""
                        }
                    </td>
                    <td>${plane.description || ""}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="app.editPlane(${
                          plane.id
                        })">Editar</button>
                        <button class="btn-small btn-info" onclick="app.managePlaneStock(${
                          plane.id
                        })">Manage Stock</button>
                        <button class="btn-small btn-danger" onclick="app.deletePlane(${
                          plane.id
                        })">Eliminar</button>
                    </td>
                `;
      });

      // Mostrar alerta general si hay aviones con stock bajo
      const planesSection = document.getElementById("planes");
      if (!planesSection) {
        throw new Error("Planes section not found");
      }

      let existingAlert = planesSection.querySelector(
        ".planes-low-stock-alert"
      );

      if (totalLowStockAlerts > 0) {
        if (!existingAlert) {
          const alertDiv = document.createElement("div");
          alertDiv.className = "planes-low-stock-alert";
          alertDiv.style.cssText =
            "margin-bottom: 20px; padding: 15px; background-color: #ffebee; border: 1px solid #f44336; border-radius: 8px; color: #c62828;";
          alertDiv.innerHTML = `
            <strong>⚠️ Alerta de Stock Bajo en Aviones:</strong> 
            <span id="planesLowStockCount">${totalLowStockAlerts}</span> aviones tienen productos con stock por debajo del mínimo requerido.
            <br><small>Haz clic en "Manage Stock" de cada avión para ver los detalles.</small>
          `;

          // Insertar al inicio de la sección de aviones
          const firstChild = planesSection.firstChild;
          planesSection.insertBefore(alertDiv, firstChild);
        } else {
          existingAlert.querySelector("#planesLowStockCount").textContent =
            totalLowStockAlerts;
        }
      } else if (existingAlert) {
        existingAlert.remove();
      }
    } catch (error) {
      console.error("Error loading planes:", error);
    }
  }

  editPlane(id) {
    this.fetchWithoutCache("api/planes.php")
      .then((response) => response.json())
      .then((planes) => {
        const plane = planes.find((p) => p.id == id);
        if (plane) {
          document.getElementById("planeId").value = plane.id;
          document.getElementById("planeName").value = plane.name;
          document.getElementById("planeDescription").value =
            plane.description || "";

          document.getElementById("planeFormTitle").textContent =
            "Editar Avión";
          document.getElementById("planeSubmitBtn").textContent =
            "Actualizar Avión";
          document.getElementById("planeCancelBtn").style.display =
            "inline-block";

          this.editingPlane = id;
        }
      });
  }

  cancelPlaneEdit() {
    document.getElementById("planeForm").reset();
    document.getElementById("planeId").value = "";
    document.getElementById("planeFormTitle").textContent = "Añadir Avión";
    document.getElementById("planeSubmitBtn").textContent = "Añadir Avión";
    document.getElementById("planeCancelBtn").style.display = "none";
    this.editingPlane = null;
  }

  async deletePlane(id) {
    if (confirm("¿Está seguro de que desea eliminar este avión?")) {
      try {
        const response = await this.fetchWithoutCache("api/planes.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          this.loadPlanes();
        }
      } catch (error) {
        console.error("Error deleting plane:", error);
      }
    }
  }

  // TICKETS CRUD
  // Load planes for ticket form
  async loadPlanesForTickets() {
    try {
      const response = await this.fetchWithoutCache("api/planes.php");
      const planes = await response.json();

      const select = document.getElementById("ticketPlane");
      select.innerHTML = '<option value="">Seleccionar Avión</option>';

      planes.forEach((plane) => {
        const option = document.createElement("option");
        option.value = plane.id;
        option.textContent = plane.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading planes for tickets:", error);
    }
  }

  // Load tickets with filtering support
  async loadTickets(
    pilotFilter = "",
    doctorFilter = "",
    dateFilter = "",
    descriptionFilter = ""
  ) {
    console.log("🎫 loadTickets called with filters:", {
      pilotFilter,
      doctorFilter,
      dateFilter,
      descriptionFilter,
    });
    try {
      let url = "api/tickets.php";
      const params = new URLSearchParams();

      if (pilotFilter) params.append("pilot", pilotFilter);
      if (doctorFilter) params.append("doctor", doctorFilter);
      if (dateFilter) params.append("date", dateFilter);
      if (descriptionFilter) params.append("description", descriptionFilter);

      if (params.toString()) {
        url += "?" + params.toString();
      }

      console.log("📡 Fetching tickets from:", url);
      const response = await this.fetchWithoutCache(url);

      if (!response.ok) {
        console.error("❌ API Error:", response.status, response.statusText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const tickets = await response.json();
      console.log("📡 Received tickets:", tickets);

      const tbody = document.querySelector("#ticketsTable tbody");
      if (!tbody) {
        console.error("❌ Tickets table tbody not found!");
        return;
      }

      tbody.innerHTML = "";
      console.log(`🎫 Processing ${tickets.length} tickets...`);

      tickets.forEach((ticket, index) => {
        console.log(`🎫 Processing ticket ${index + 1}:`, ticket);
        const row = tbody.insertRow();
        // Use ticket_date if available, otherwise fall back to created_at
        const displayDate = ticket.ticket_date
          ? new Date(ticket.ticket_date).toLocaleDateString()
          : new Date(ticket.created_at).toLocaleDateString();
        const totalCost = parseFloat(ticket.total_cost || 0);

        // Format pilots
        // Ya no usamos pilotos en tickets

        // Format doctors
        const doctorsHtml =
          ticket.doctors && ticket.doctors.length > 0
            ? ticket.doctors
                .map((d) => `<span class="doctor-tag">${d.name}</span>`)
                .join(" ")
            : '<span class="no-data">Sin médicos</span>';

        console.log(`🎫 Ticket ${ticket.id} doctors:`, ticket.doctors);
        console.log(`🎫 Creating row for ticket ${ticket.id} with edit button`);

        row.innerHTML = `
                    <td>${ticket.ticket_number}</td>
                    <td>${ticket.plane_name || "N/A"}</td>
                    <td class="doctors-list">${doctorsHtml}</td>
                    <td>${ticket.description || ""}</td>
                    <td>${displayDate}</td>
                    <td class="cost-cell">$${totalCost.toFixed(2)}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="console.log('Button clicked for ticket ${
                          ticket.id
                        }'); app.editTicket(${ticket.id})">Editar</button>
                        <button class="btn-small btn-info" onclick="app.manageTicketItems(${
                          ticket.id
                        })">Manage Items</button>
                        <button class="btn-small btn-danger" onclick="app.deleteTicket(${
                          ticket.id
                        })">Eliminar</button>
                    </td>
                `;

        console.log(`🎫 Row created for ticket ${ticket.id}`);
      });
      console.log("✅ loadTickets completed successfully");
    } catch (error) {
      console.error("❌ Error loading tickets:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  // Create or update ticket method
  async createTicket() {
    const ticketId = document.getElementById("ticketId").value;
    const planeId = document.getElementById("ticketPlane").value;
    const ticketNumber = document.getElementById("ticketNumber").value;
    const description = document.getElementById("ticketDescription").value;
    const ticketDate = document.getElementById("ticketDate").value;

    // Get selected pilots
    // Ya no lo usamos

    // Get selected doctors
    const selectedDoctors = [];
    document
      .querySelectorAll('#ticketDoctors input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        selectedDoctors.push(parseInt(checkbox.value));
      });

    if (!planeId || !ticketNumber || !ticketDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const isEditing = ticketId && ticketId.trim() !== "";
      const method = isEditing ? "PUT" : "POST";
      const requestBody = {
        plane_id: planeId,
        doctor_ids: selectedDoctors,
        ticket_number: ticketNumber,
        description: description,
        ticket_date: ticketDate,
      };

      if (isEditing) {
        requestBody.id = parseInt(ticketId);
      }

      const response = await this.fetchWithoutCache("api/tickets.php", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        this.cancelTicketEdit();
        this.loadTickets();

        if (isEditing) {
          alert("Se ha Actualizado el ticket correctamente");
        } else {
          alert("Se ha creado el ticket correctamente");
        }
      } else {
        alert(
          "Error guardando el ticket: " + (result.error || "Error desconocido")
        );
      }
    } catch (error) {
      console.error("Error guardando el ticket:", error);
      alert("Error guardando el ticket: " + error.message);
    }
  }

  async deleteTicket(id) {
    if (confirm("¿Está seguro de que desea eliminar este ticket?")) {
      try {
        const response = await fetch("api/tickets.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id }),
        });

        const result = await response.json();

        if (result.success) {
          this.loadTickets();
          alert("Ticket deleted successfully");
        } else {
          alert("Error deleting ticket: " + (result.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert("Error deleting ticket: " + error.message);
      }
    }
  }

  async editTicket(id) {
    console.log("🔧 editTicket called with ID:", id);
    //alert('Edit button clicked! ID: ' + id);

    try {
      // Fetch the specific ticket with its pilots and doctors
      console.log("📡 Fetching ticket data...");
      const response = await this.fetchWithoutCache(`api/tickets.php?id=${id}`);
      console.log("📡 Response status:", response.status);
      const ticketData = await response.json();
      console.log("📡 Ticket data received:", ticketData);

      if (ticketData && ticketData.length > 0) {
        const ticket = ticketData[0]; // API returns array, get first item
        console.log("✅ Processing ticket:", ticket);

        // Set basic ticket information with error handling
        console.log("📝 Setting form values...");

        try {
          const ticketIdEl = document.getElementById("ticketId");
          if (ticketIdEl) {
            ticketIdEl.value = ticket.id;
            console.log("✅ Set ticketId");
          } else {
            console.log("❌ ticketId element not found");
          }
        } catch (error) {
          console.error("❌ Error setting ticketId:", error);
        }

        try {
          const ticketPlaneEl = document.getElementById("ticketPlane");
          if (ticketPlaneEl) {
            ticketPlaneEl.value = ticket.plane_id;
            console.log("✅ Set ticketPlane");
          } else {
            console.log("❌ ticketPlane element not found");
          }
        } catch (error) {
          console.error("❌ Error setting ticketPlane:", error);
        }

        try {
          const ticketNumberEl = document.getElementById("ticketNumber");
          if (ticketNumberEl) {
            ticketNumberEl.value = ticket.ticket_number;
            console.log("✅ Set ticketNumber");
          } else {
            console.log("❌ ticketNumber element not found");
          }
        } catch (error) {
          console.error("❌ Error setting ticketNumber:", error);
        }

        try {
          const ticketDescEl = document.getElementById("ticketDescription");
          if (ticketDescEl) {
            ticketDescEl.value = ticket.description || "";
            console.log("✅ Set ticketDescription");
          } else {
            console.log("❌ ticketDescription element not found");
          }
        } catch (error) {
          console.error("❌ Error setting ticketDescription:", error);
        }

        try {
          const ticketDateEl = document.getElementById("ticketDate");
          if (ticketDateEl) {
            ticketDateEl.value = ticket.ticket_date || "";
            console.log("✅ Set ticketDate");
          } else {
            console.log("❌ ticketDate element not found");
          }
        } catch (error) {
          console.error("❌ Error setting ticketDate:", error);
        }

        // Clear all pilot checkboxes first
        // No más pilotos en tickets

        // Check the pilots assigned to this ticket
        // No more pilots

        // Clear all doctor checkboxes first
        console.log("👨‍⚕️ Clearing doctor checkboxes...");
        try {
          document
            .querySelectorAll('#ticketDoctors input[type="checkbox"]')
            .forEach((cb) => {
              cb.checked = false;
            });
        } catch (error) {
          console.error("❌ Error clearing doctor checkboxes:", error);
        }

        // Check the doctors assigned to this ticket
        if (ticket.doctors && ticket.doctors.length > 0) {
          console.log("👨‍⚕️ Setting doctor checkboxes:", ticket.doctors);
          ticket.doctors.forEach((doctor) => {
            try {
              const checkbox = document.getElementById(`doctor_${doctor.id}`);
              if (checkbox) {
                checkbox.checked = true;
                console.log(`✅ Checked doctor ${doctor.id}`);
              } else {
                console.log(
                  `❌ Doctor checkbox not found: doctor_${doctor.id}`
                );
              }
            } catch (error) {
              console.error(`❌ Error setting doctor ${doctor.id}:`, error);
            }
          });
        }

        // Update form UI for editing mode
        console.log("🎨 Updating form UI...");
        const titleElement = document.getElementById("ticketFormTitle");
        const submitBtn = document.getElementById("ticketSubmitBtn");
        const cancelBtn = document.getElementById("ticketCancelBtn");

        if (titleElement) {
          titleElement.textContent = "Editar Ticket";
          console.log("✅ Title updated");
        } else {
          console.log("❌ Title element not found");
        }

        if (submitBtn) {
          submitBtn.textContent = "Actualizar Ticket";
          console.log("✅ Submit button updated");
        } else {
          console.log("❌ Submit button not found");
        }

        if (cancelBtn) {
          cancelBtn.style.display = "inline-block";
          console.log("✅ Cancel button shown");
        } else {
          console.log("❌ Cancel button not found");
        }

        // Scroll to form
        const formElement = document.getElementById("ticketForm");
        if (formElement) {
          console.log("📜 Scrolling to form...");
          formElement.scrollIntoView({ behavior: "smooth" });
        } else {
          console.log("❌ Form element not found");
        }

        this.editingTicket = id;
        console.log("✅ Edit setup complete");
        //alert('Edit setup complete! Check the form.');
      } else {
        console.log("❌ No ticket data found");
        alert("Ticket not found");
      }
    } catch (error) {
      console.error("❌ Error loading ticket for editing:", error);
      alert("Error loading ticket: " + error.message);
    }
  }

  cancelTicketEdit() {
    document.getElementById("ticketForm").reset();
    document.getElementById("ticketId").value = "";
    document.getElementById("ticketFormTitle").textContent = "Crear Ticket";
    document.getElementById("ticketSubmitBtn").textContent = "Crear Ticket";
    document.getElementById("ticketCancelBtn").style.display = "none";

    // Set today's date as default
    document.getElementById("ticketDate").value = new Date()
      .toISOString()
      .split("T")[0];

    // Uncheck all checkboxes
    document
      .querySelectorAll('#ticketDoctors input[type="checkbox"]')
      .forEach((cb) => (cb.checked = false));

    this.editingTicket = null;
  }

  async deleteTicket(id) {
    if (confirm("¿Está seguro de que desea eliminar este ticket?")) {
      try {
        const response = await fetch("api/tickets.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          this.loadTickets();
        }
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }
    }
  }

  async loadPlanesForTickets() {
    try {
      const response = await fetch("api/planes.php");
      const planes = await response.json();

      const select = document.getElementById("ticketPlane");
      select.innerHTML = '<option value="">Seleccionar Avión</option>';

      planes.forEach((plane) => {
        const option = document.createElement("option");
        option.value = plane.id;
        option.textContent = plane.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading planes for tickets:", error);
    }
  }

  // PILOTS CRUD
  // delete pilot CRUD

  // DOCTORS CRUD METHODS
  async loadDoctors() {
    try {
      const response = await this.fetchWithoutCache("api/doctors.php");
      const doctors = await response.json();

      const tbody = document.querySelector("#doctorsTable tbody");
      tbody.innerHTML = "";

      doctors.forEach((doctor) => {
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
      console.error("Error loading doctors:", error);
    }
  }

  async saveDoctor() {
    const id = document.getElementById("doctorId").value;
    const name = document.getElementById("doctorName").value;

    if (!name.trim()) {
      alert("Please enter a doctor name");
      return;
    }

    try {
      const response = await this.fetchWithoutCache("api/doctors.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id || null, name: name }),
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById("doctorForm").reset();
        document.getElementById("doctorId").value = "";
        this.cancelDoctorEdit();
        this.loadDoctors();
      } else {
        alert("Error saving doctor: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving doctor:", error);
      alert("Error saving doctor: " + error.message);
    }
  }

  editDoctor(id) {
    this.fetchWithoutCache("api/doctors.php")
      .then((response) => response.json())
      .then((doctors) => {
        const doctor = doctors.find((d) => d.id == id);
        if (doctor) {
          document.getElementById("doctorId").value = doctor.id;
          document.getElementById("doctorName").value = doctor.name;

          document.getElementById("doctorFormTitle").textContent =
            "Editar Médico";
          document.getElementById("doctorSubmitBtn").textContent =
            "Actualizar Médico";
          document.getElementById("doctorCancelBtn").style.display =
            "inline-block";

          this.editingDoctor = id;
        }
      });
  }

  cancelDoctorEdit() {
    document.getElementById("doctorForm").reset();
    document.getElementById("doctorId").value = "";
    document.getElementById("doctorFormTitle").textContent = "Añadir Médico";
    document.getElementById("doctorSubmitBtn").textContent = "Añadir Médico";
    document.getElementById("doctorCancelBtn").style.display = "none";
    this.editingDoctor = null;
  }

  async deleteDoctor(id) {
    if (confirm("¿Está seguro de que desea eliminar este médico?")) {
      try {
        const response = await this.fetchWithoutCache("api/doctors.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id }),
        });

        const result = await response.json();

        if (result.success) {
          this.loadDoctors();
        } else {
          alert("Error deleting doctor: " + (result.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("Error deleting doctor: " + error.message);
      }
    }
  }

  // Load doctors for ticket form
  async loadDoctorsForTickets() {
    try {
      const response = await this.fetchWithoutCache("api/doctors.php");
      const doctors = await response.json();

      const container = document.getElementById("ticketDoctors");
      container.innerHTML = "";

      doctors.forEach((doctor) => {
        const div = document.createElement("div");
        div.className = "multi-select-item";
        div.innerHTML = `
                    <input type="checkbox" id="doctor_${doctor.id}" value="${doctor.id}">
                    <label for="doctor_${doctor.id}">${doctor.name}</label>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      console.error("Error loading doctors for tickets:", error);
    }
  }

  // Load pilots for ticket form (multi-select)
  // Ya no hace log in

  // Filter methods
  applyFilters() {
    const pilot = document.getElementById("filterPilot").value;
    const doctor = document.getElementById("filterDoctor").value;
    const date = document.getElementById("filterDate").value;
    const description = document.getElementById("filterDescription").value;

    this.loadTickets(pilot, doctor, date, description);
  }

  clearFilters() {
    document.getElementById("filterPilot").value = "";
    document.getElementById("filterDoctor").value = "";
    document.getElementById("filterDate").value = "";
    document.getElementById("filterDescription").value = "";
    this.loadTickets();
  }

  // Updated createTicket method to handle both create and update
  async createTicket() {
    const ticketId = document.getElementById("ticketId").value;
    const planeId = document.getElementById("ticketPlane").value;
    const ticketNumber = document.getElementById("ticketNumber").value;
    const description = document.getElementById("ticketDescription").value;

    // Get selected pilots
    // Ya no lo usamos

    // Get selected doctors
    const selectedDoctors = [];
    document
      .querySelectorAll('#ticketDoctors input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        selectedDoctors.push(parseInt(checkbox.value));
      });

    if (!planeId || !ticketNumber) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const isEditing = ticketId && ticketId.trim() !== "";
      const method = isEditing ? "PUT" : "POST";
      const requestBody = {
        plane_id: planeId,
        doctor_ids: selectedDoctors,
        ticket_number: ticketNumber,
        description: description,
      };

      if (isEditing) {
        requestBody.id = parseInt(ticketId);
      }

      const response = await fetch("api/tickets.php", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        this.cancelTicketEdit();
        this.loadTickets();

        if (isEditing) {
          alert("Ticket updated successfully");
        } else {
          alert("Ticket created successfully");
        }
      } else {
        alert("Error saving ticket: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert("Error saving ticket: " + error.message);
    }
  }

  async deleteTicket(id) {
    if (confirm("¿Está seguro de que desea eliminar este ticket?")) {
      try {
        const response = await fetch("api/tickets.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id }),
        });

        const result = await response.json();

        if (result.success) {
          this.loadTickets();
          alert("Ticket deleted successfully");
        } else {
          alert("Error deleting ticket: " + (result.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert("Error deleting ticket: " + error.message);
      }
    }
  }
  async managePlaneStock(planeId) {
    try {
      const response = await this.fetchWithoutCache("api/products.php");
      const products = await response.json();

      const stockResponse = await this.fetchWithoutCache(
        `api/plane-stock.php?plane_id=${planeId}`
      );
      const stockData = await stockResponse.json();

      // Obtener información del avión
      const planeResponse = await this.fetchWithoutCache("api/planes.php");
      const planes = await planeResponse.json();
      const plane = planes.find((p) => p.id == planeId);

      const planeDetails = document.getElementById("planeDetails");
      const container = document.getElementById("planeStockContainer");

      // Contar productos con stock bajo
      let lowStockCount = 0;
      let lowStockProducts = [];

      products.forEach((product) => {
        const stock = stockData.find((s) => s.product_id == product.id);
        const currentStock = stock ? stock.current_stock : 0;
        const minimumStock = stock ? stock.minimum_quantity : 0;

        if (minimumStock > 0 && currentStock < minimumStock) {
          lowStockCount++;
          lowStockProducts.push({
            name: product.name,
            current: currentStock,
            minimum: minimumStock,
            needed: minimumStock - currentStock,
          });
        }
      });

      // Crear el contenido HTML
      let html = `
        <div class="plane-stock-header">
          <h4>Gestión de Stock - ${plane ? plane.name : "Avión"}</h4>
          <button class="btn-secondary" onclick="app.cancelPlaneStockManagement()">
            ✕ Cerrar Gestión
          </button>
        </div>
      `;

      // Mostrar alerta de stock bajo si hay productos afectados
      if (lowStockCount > 0) {
        html += `
          <div class="plane-low-stock-alert" style="margin-bottom: 20px; padding: 15px; background-color: #ffebee; border: 1px solid #f44336; border-radius: 8px; color: #c62828;">
            <strong>⚠️ Alerta de Stock Bajo en ${
              plane ? plane.name : "Avión"
            }:</strong><br>
            <span id="planeLowStockCount">${lowStockCount}</span> productos tienen stock por debajo del mínimo requerido.
            <div class="low-stock-details" style="margin-top: 10px; font-size: 14px;">
              <strong>Productos afectados:</strong><br>
        `;

        lowStockProducts.forEach((product) => {
          html += `
            • ${product.name}: ${product.current}/${product.minimum} (Faltan: ${product.needed})
          `;
        });

        html += `
            </div>
          </div>
        `;
      }

      // Agregar la tabla de productos
      html += `
        <div class="plane-stock-table">
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Stock Almacén</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
      `;

      products.forEach((product) => {
        const stock = stockData.find((s) => s.product_id == product.id);
        const currentStock = stock ? stock.current_stock : 0;
        const minimumStock = stock ? stock.minimum_quantity : 0;
        const isLowStock = minimumStock > 0 && currentStock < minimumStock;

        html += `
          <tr class="${isLowStock ? "plane-low-stock-row" : ""}">
            <td><strong>${product.name}</strong></td>
            <td>${currentStock}</td>
            <td>${minimumStock}</td>
            <td>${product.total_stock}</td>
            <td>
              ${
                isLowStock
                  ? '<span style="color: #f44336; font-weight: bold;">⚠️ Stock Bajo</span>'
                  : '<span style="color: #4caf50; font-weight: bold;">✓ OK</span>'
              }
            </td>
            <td>
              <button class="btn-small btn-primary" onclick="app.setMinimum(${planeId}, ${
          product.id
        })">
                Establecer Mínimo
              </button>
              <button class="btn-small btn-info" onclick="app.transferToPlane(${planeId}, ${
          product.id
        })">
                Transferir
              </button>
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      planeDetails.style.display = "block";

      // Guardar el planeId actual para referencia
      this.currentPlaneStockId = planeId;
    } catch (error) {
      console.error("Error managing plane stock:", error);
    }
  }

  async setMinimum(planeId, productId) {
    const minimum = prompt("Establecer nivel mínimo de stock:");
    if (minimum !== null && !isNaN(minimum)) {
      try {
        const response = await this.fetchWithoutCache("api/plane-stock.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plane_id: planeId,
            product_id: productId,
            minimum_quantity: parseInt(minimum),
          }),
        });

        if (response.ok) {
          // Recargar la gestión de stock para mostrar las alertas actualizadas
          this.managePlaneStock(planeId);
          // Actualizar alertas en la sección de aviones
          await this.updatePlaneStockAlerts();
          console.log("✅ Stock mínimo actualizado");
        } else {
          alert("Error al establecer el stock mínimo");
        }
      } catch (error) {
        console.error("Error setting minimum:", error);
        alert("Error al establecer el stock mínimo: " + error.message);
      }
    }
  }

  async transferToPlane(planeId, productId) {
    const quantity = prompt("Ingresa la cantidad a transferir:");
    if (quantity !== null && !isNaN(quantity)) {
      try {
        //Ingresar la logica para mandar una alerta
        const validacion = await this.fetchWithoutCache(
          `api/products.php?id=${productId}`
        );
        const data = await validacion.json();
        if (quantity > data.stock) {
          alert(
            "No hay suficiente stock en el almacén para transferir esta cantidad."
          );
        } else {
          const response = await this.fetchWithoutCache("api/transfer.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plane_id: planeId,
              product_id: productId,
              quantity: parseInt(quantity),
            }),
          });

          if (response.ok) {
            // Recargar la gestión de stock para mostrar las alertas actualizadas
            this.managePlaneStock(planeId);
            this.loadProducts();
            // Actualizar alertas en la sección de aviones
            await this.updatePlaneStockAlerts();
            console.log("✅ Transferencia completada");
          } else {
            alert("Error al realizar la transferencia");
          }
        }
        // fin la de la lógica para mandar una alerta
      } catch (error) {
        console.error("Error transferring to plane:", error);
      }
    }
  }

  // Función para cancelar la gestión de stock del avión
  cancelPlaneStockManagement() {
    const planeDetails = document.getElementById("planeDetails");
    const container = document.getElementById("planeStockContainer");

    // Limpiar el contenido
    container.innerHTML = "";
    planeDetails.style.display = "none";

    // Limpiar la referencia del avión actual
    this.currentPlaneStockId = null;

    console.log("🗑️ Gestión de stock del avión cancelada");
  }

  async manageTicketItems(ticketId) {
    try {
      console.log("Loading ticket items for ticket ID:", ticketId);

      const response = await this.fetchWithoutCache(
        `api/ticket-details.php?ticket_id=${ticketId}`
      );
      const ticketDetails = await response.json();

      console.log("Ticket details response:", ticketDetails);

      if (ticketDetails.error) {
        alert("Error loading ticket details: " + ticketDetails.error);
        return;
      }

      const itemsResponse = await this.fetchWithoutCache(
        `api/ticket-items.php?ticket_id=${ticketId}`
      );
      const ticketItems = await itemsResponse.json();

      console.log("Ticket items response:", ticketItems);

      if (ticketItems.error) {
        console.error("Error loading ticket items:", ticketItems.error);
        // Continue anyway, might just be no items yet
      }

      const ticketDetailsDiv = document.getElementById("ticketDetails");
      const container = document.getElementById("ticketItemsContainer");

      container.innerHTML = `
                <h4>Ticket Items Management</h4>
                <p><strong>Ticket:</strong> ${ticketDetails.ticket_number} - <strong>Plane:</strong> ${ticketDetails.plane_name}</p>
                <div class="add-item-form">
                    <h5>Add Item</h5>
                    <select id="itemProduct" onchange="app.updateItemPreview()">
                        <option value="">Select Product</option>
                    </select>
                    <input type="number" id="itemQuantity" placeholder="Quantity" min="1" oninput="app.updateItemPreview()">
                    <div id="itemPreview" class="item-preview" style="display: none;">
                        <span>Estimated cost: $<span id="previewCost">0.00</span></span>
                    </div>
                    <button onclick="app.addTicketItem(${ticketId})">Add Item</button>
                </div>
                <div class="ticket-items-list">
                    <h5>Current Items</h5>
                    <div id="currentItemsList"></div>
                    <div id="totalCost" class="total-cost" style="display: none;">
                        <strong>Total Cost: $<span id="totalAmount">0.00</span></strong>
                    </div>
                </div>
            `;

      // Populate available products
      const productSelect = document.getElementById("itemProduct");
      if (
        ticketDetails.available_products &&
        ticketDetails.available_products.length > 0
      ) {
        console.log("Available products:", ticketDetails.available_products);
        ticketDetails.available_products.forEach((product) => {
          const option = document.createElement("option");
          option.value = product.product_id;
          option.setAttribute("data-price", product.price || 0);
          option.textContent = `${product.product_name} - $${parseFloat(
            product.price || 0
          ).toFixed(2)} (Available: ${product.current_stock})`;
          productSelect.appendChild(option);
        });
      } else {
        console.log("No products available in this plane");
        productSelect.innerHTML =
          '<option value="">No products available in this plane</option>';
      }

      // Show current items and calculate total
      const currentItemsList = document.getElementById("currentItemsList");
      const totalCostDiv = document.getElementById("totalCost");
      const totalAmountSpan = document.getElementById("totalAmount");
      let totalCost = 0;

      if (ticketItems && Array.isArray(ticketItems) && ticketItems.length > 0) {
        console.log("Displaying ticket items:", ticketItems);
        ticketItems.forEach((item) => {
          const itemPrice = parseFloat(item.price || 0);
          const itemQuantity = parseInt(item.quantity_used || 0);
          const itemTotal = itemPrice * itemQuantity;
          totalCost += itemTotal;

          const itemDiv = document.createElement("div");
          itemDiv.className = "ticket-item";
          itemDiv.innerHTML = `
                        <div class="item-info">
                            <span class="item-name">${item.product_name}</span>
                            <span class="item-details">Cantidad: ${itemQuantity} × $${itemPrice.toFixed(
            2
          )} = $${itemTotal.toFixed(2)}</span>
                        </div>
                        <button class="btn-small btn-danger" onclick="app.removeTicketItem(${
                          item.id
                        }, ${ticketId})">Remove</button>
                    `;
          currentItemsList.appendChild(itemDiv);
        });

        // Show total cost
        totalAmountSpan.textContent = totalCost.toFixed(2);
        totalCostDiv.style.display = "block";
      } else {
        console.log("No items found for this ticket");
        currentItemsList.innerHTML =
          "<p>No items added to this ticket yet.</p>";
        totalCostDiv.style.display = "none";
      }

      ticketDetailsDiv.style.display = "block";
    } catch (error) {
      console.error("Error managing ticket items:", error);
      alert("Error loading ticket items: " + error.message);
    }
  }

  updateItemPreview() {
    const productSelect = document.getElementById("itemProduct");
    const quantityInput = document.getElementById("itemQuantity");
    const previewDiv = document.getElementById("itemPreview");
    const previewCostSpan = document.getElementById("previewCost");

    if (productSelect && quantityInput && previewDiv && previewCostSpan) {
      const selectedOption = productSelect.options[productSelect.selectedIndex];
      const price = parseFloat(selectedOption.getAttribute("data-price") || 0);
      const quantity = parseInt(quantityInput.value || 0);

      if (productSelect.value && quantity > 0) {
        const totalCost = price * quantity;
        previewCostSpan.textContent = totalCost.toFixed(2);
        previewDiv.style.display = "block";
      } else {
        previewDiv.style.display = "none";
      }
    }
  }

  async addTicketItem(ticketId) {
    const productId = document.getElementById("itemProduct").value;
    const quantity = document.getElementById("itemQuantity").value;

    if (!productId || !quantity) {
      alert("Please select a product and enter quantity");
      return;
    }

    if (parseInt(quantity) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    try {
      const response = await this.fetchWithoutCache("api/ticket-items.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          product_id: productId,
          quantity_used: parseInt(quantity), // Use quantity_used to match API
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear the form
        document.getElementById("itemProduct").value = "";
        document.getElementById("itemQuantity").value = "";
        // Reload the ticket items
        this.manageTicketItems(ticketId);
      } else {
        alert("Error adding item: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error adding ticket item:", error);
      alert("Error adding item: " + error.message);
    }
  }

  async removeTicketItem(itemId, ticketId) {
    if (confirm("Remove this item from the ticket?")) {
      try {
        const response = await this.fetchWithoutCache("api/ticket-items.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId }),
        });

        const result = await response.json();

        if (result.success) {
          this.manageTicketItems(ticketId);
        } else {
          alert("Error removing item: " + (result.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error removing ticket item:", error);
        alert("Error removing item: " + error.message);
      }
    }
  }
}

// Inicializar modo oscuro temprano
(function () {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();

// Initialize the app
const app = new WarehouseApp();

// Register service worker for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);

        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, prompt user to refresh
              if (confirm("Nueva versión disponible. ¿Desea actualizar?")) {
                window.location.reload();
              }
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "UPDATE_AVAILABLE") {
            if (confirm("Nueva versión disponible. ¿Desea actualizar?")) {
              window.location.reload();
            }
          }
        });
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// Add install prompt for PWA
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Show install button or banner
  showInstallPromotion();
});

function showInstallPromotion() {
  // Create install button if it doesn't exist
  if (!document.getElementById("installBtn")) {
    const installBtn = document.createElement("button");
    installBtn.id = "installBtn";
    installBtn.textContent = "📱 Instalar App";
    installBtn.className = "btn-primary";
    installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            border-radius: 25px;
            padding: 12px 20px;
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        `;

    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.remove();
      }
    });

    document.body.appendChild(installBtn);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (installBtn.parentNode) {
        installBtn.style.opacity = "0.7";
      }
    }, 10000);
  }
}

// Handle app installation
window.addEventListener("appinstalled", (evt) => {
  console.log("App was installed");
  const installBtn = document.getElementById("installBtn");
  if (installBtn) {
    installBtn.remove();
  }
});
