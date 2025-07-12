# Warehouse Management System - CRUD Implementation

## Overview
This warehouse management system now includes complete CRUD (Create, Read, Update, Delete) operations for:
- **Products** (with variable pricing)
- **Planes** 
- **Tickets** (with pilot assignment)
- **Pilots** (new entity)

## New Features Implemented

### 1. Products CRUD with Pricing
- ✅ **Create**: Add new products with name, description, price, and initial stock
- ✅ **Read**: View all products in a table format
- ✅ **Update**: Edit product details and update stock levels
- ✅ **Delete**: Remove products from the system
- ✅ **Price Field**: Added variable pricing for each product

### 2. Planes CRUD
- ✅ **Create**: Add new planes with name and description
- ✅ **Read**: View all planes in a table format
- ✅ **Update**: Edit plane details
- ✅ **Delete**: Remove planes from the system
- ✅ **Stock Management**: Existing functionality preserved

### 3. Tickets CRUD with Pilot Assignment
- ✅ **Create**: Create new tickets with plane and pilot assignment
- ✅ **Read**: View all tickets with plane and pilot information
- ✅ **Update**: Edit ticket details including reassigning planes/pilots
- ✅ **Delete**: Remove tickets from the system
- ✅ **Pilot Field**: Added pilot assignment to each ticket

### 4. Pilots CRUD (New Entity)
- ✅ **Create**: Add new pilots with name, license number, email, and phone
- ✅ **Read**: View all pilots in a table format
- ✅ **Update**: Edit pilot information
- ✅ **Delete**: Remove pilots from the system

## Database Schema Changes

### New Table: `pilots`
```sql
CREATE TABLE pilots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Table: `products`
```sql
ALTER TABLE products ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
```

### Modified Table: `tickets`
```sql
ALTER TABLE tickets ADD COLUMN pilot_id INT;
ALTER TABLE tickets ADD FOREIGN KEY (pilot_id) REFERENCES pilots(id) ON DELETE SET NULL;
```

## API Endpoints

### Products API (`api/products.php`)
- `GET /api/products.php` - Get all products
- `POST /api/products.php` - Create new product
- `PUT /api/products.php` - Update product (full update or stock only)
- `DELETE /api/products.php` - Delete product

### Planes API (`api/planes.php`)
- `GET /api/planes.php` - Get all planes
- `POST /api/planes.php` - Create new plane
- `PUT /api/planes.php` - Update plane
- `DELETE /api/planes.php` - Delete plane

### Tickets API (`api/tickets.php`)
- `GET /api/tickets.php` - Get all tickets with plane and pilot names
- `POST /api/tickets.php` - Create new ticket
- `PUT /api/tickets.php` - Update ticket
- `DELETE /api/tickets.php` - Delete ticket

### Pilots API (`api/pilots.php`) - NEW
- `GET /api/pilots.php` - Get all pilots
- `POST /api/pilots.php` - Create new pilot
- `PUT /api/pilots.php` - Update pilot
- `DELETE /api/pilots.php` - Delete pilot

## User Interface Features

### Form Enhancements
- Edit mode for all entities with form state management
- Cancel buttons for edit operations
- Form validation and error handling
- Dynamic form titles and button text

### Table Actions
- **Edit** buttons for inline editing
- **Delete** buttons with confirmation dialogs
- **Manage Stock** for planes (existing functionality)
- **Manage Items** for tickets (existing functionality)
- **Update Stock** for products (existing functionality)

### Navigation
- Added "Pilotos" section to main navigation
- Responsive design improvements
- Better button styling with color coding

## Installation & Setup

1. **Database Setup**: Run the SQL commands in `database_schema.sql` to create/modify tables
2. **Sample Data**: The schema file includes sample pilot data
3. **File Structure**: All files are properly organized in their respective directories

## File Structure
```
├── api/
│   ├── pilots.php (NEW)
│   ├── products.php (UPDATED)
│   ├── planes.php (UPDATED)
│   ├── tickets.php (UPDATED)
│   └── ... (other existing files)
├── css/
│   └── style.css (UPDATED)
├── js/
│   └── app.js (COMPLETELY REWRITTEN)
├── index.html (UPDATED)
└── database_schema.sql (NEW)
```

## Key Improvements

1. **Complete CRUD Operations**: All entities now support full CRUD functionality
2. **Better UX**: Edit forms with proper state management and cancel options
3. **Data Relationships**: Proper foreign key relationships between tickets, planes, and pilots
4. **Responsive Design**: Improved mobile compatibility
5. **Error Handling**: Better error handling and user feedback
6. **Code Organization**: Cleaner, more maintainable JavaScript code

## Usage

1. **Products**: Add products with pricing, edit details, manage stock levels
2. **Planes**: Manage aircraft fleet, assign stock to planes
3. **Pilots**: Maintain pilot database with license information
4. **Tickets**: Create work orders with plane and pilot assignments
5. **Stock Management**: Transfer inventory between warehouse and planes
6. **Ticket Items**: Manage items associated with specific tickets

The system maintains all existing functionality while adding comprehensive CRUD operations and the new pilot management feature.