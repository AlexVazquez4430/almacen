# Warehouse Management System - CRUD Implementation

## Overview
This warehouse management system now includes complete CRUD (Create, Read, Update, Delete) operations for:
- **Products** (with variable pricing)
- **Planes** 
- **Tickets** (with pilot assignment)
- **Pilots** (simplified - name only)

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

### 4. Pilots CRUD (New Entity - Simplified)
- ✅ **Create**: Add new pilots with name only
- ✅ **Read**: View all pilots in a table format
- ✅ **Update**: Edit pilot name
- ✅ **Delete**: Remove pilots from the system
- ✅ **Simplified Structure**: Only requires pilot name (as requested)

### 5. Pricing and Cost Management (NEW)
- ✅ **Product Pricing**: Each product has a configurable price
- ✅ **Ticket Item Costs**: View individual item costs (quantity × price)
- ✅ **Total Cost Calculation**: Automatic calculation of total ticket cost
- ✅ **Cost Preview**: Real-time cost preview when adding items
- ✅ **Ticket Cost Display**: Total cost shown in tickets table

## Database Schema Changes (SQLite)

### New Table: `pilots`
```sql
CREATE TABLE pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Table: `products`
```sql
-- Price column added automatically by database.php
ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;
```

### Modified Table: `tickets`
```sql
-- Pilot ID column added automatically by database.php
ALTER TABLE tickets ADD COLUMN pilot_id INTEGER;
```

## Database Setup

**Important**: This system uses **SQLite** database, not MySQL. The database file (`warehouse.db`) is automatically created and managed by the application.

### Automatic Setup
- The `config/database.php` file automatically creates all required tables
- Sample pilot data is automatically inserted on first run
- No manual database setup required

### Sample Pilots (Auto-created)
- Juan Pérez
- María García
- Carlos López
- Ana Rodríguez
- Luis Martínez

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
- `POST /api/pilots.php` - Create new pilot (name only)
- `PUT /api/pilots.php` - Update pilot name
- `DELETE /api/pilots.php` - Delete pilot

## User Interface Features

### Simplified Pilot Management
- **Name Only**: Pilots only require a name field (as requested)
- **Simple Form**: Clean, minimal form for adding/editing pilots
- **Easy Management**: Quick add, edit, and delete operations

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

### Quick Start
1. **Upload Files**: Upload all files to your web server
2. **Access Application**: Open `index.html` in your browser
3. **Automatic Setup**: Database and tables are created automatically
4. **Start Using**: Begin adding products, planes, pilots, and tickets

### No Database Configuration Required
- SQLite database is automatically created
- All tables are automatically set up
- Sample data is automatically inserted
- No manual SQL commands needed

## File Structure
```
├── api/
│   ├── pilots.php (NEW - Simplified)
│   ├── products.php (UPDATED - with price)
│   ├── planes.php (UPDATED - full CRUD)
│   ├── tickets.php (UPDATED - with pilots)
│   └── ... (other existing files)
├── config/
│   └── database.php (UPDATED - auto-setup)
├── css/
│   └── style.css (UPDATED)
├── js/
│   └── app.js (COMPLETELY REWRITTEN)
├── index.html (UPDATED)
├── database_schema.sql (REFERENCE ONLY)
└── README.md (THIS FILE)
```

## Key Improvements

1. **Simplified Pilots**: Only name field required (as requested)
2. **Automatic Database Setup**: No manual configuration needed
3. **Complete CRUD Operations**: All entities support full CRUD functionality
4. **Better UX**: Edit forms with proper state management and cancel options
5. **Data Relationships**: Proper relationships between tickets, planes, and pilots
6. **Responsive Design**: Improved mobile compatibility
7. **Error Handling**: Better error handling and user feedback
8. **Code Organization**: Cleaner, more maintainable JavaScript code

## Usage

1. **Products**: Add products with pricing, edit details, manage stock levels
2. **Planes**: Manage aircraft fleet, assign stock to planes
3. **Pilots**: Maintain simple pilot database with names only
4. **Tickets**: Create work orders with plane and pilot assignments
5. **Stock Management**: Transfer inventory between warehouse and planes
6. **Ticket Items**: Manage items associated with specific tickets with cost tracking
7. **Cost Management**:
   - View individual item costs (quantity × unit price)
   - See real-time cost preview when adding items
   - Track total ticket costs in the tickets table
   - Monitor product pricing across all transactions

## Troubleshooting

### Pilots Not Working?
- Ensure the web server has write permissions for the directory (SQLite needs to create the database file)
- Check browser console for JavaScript errors
- Verify that the `config/database.php` file is accessible

### Database Issues?
- The SQLite database file (`warehouse.db`) is created automatically
- If issues persist, delete the `warehouse.db` file and refresh the page to recreate it
- Ensure proper file permissions on the web server

The system maintains all existing functionality while adding comprehensive CRUD operations and the simplified pilot management feature you requested.