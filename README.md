# Kashmir Optical Centre - Management System

A comprehensive optical store management system built with React, SQLite, and Tailwind CSS for managing customers, eye checkups, orders, and sales reports.

## Features

- **Customer Management**: Add, edit, search, and view customer details with complete records
- **Eye Checkup Records**: Store detailed eye examination data for both distance and near vision
- **Order Management**: Track orders with frame details, pricing, and delivery status
- **Sales Reports**: Generate comprehensive sales analytics and reports
- **SQLite Database**: All data is stored locally in a SQLite database file
- **Mobile Responsive**: Fully responsive design that works on all devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## Technology Stack

- **Frontend**: React 18, React Router DOM
- **Database**: SQLite3 with better-sqlite3
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 16 or higher)
- npm (comes with Node.js)

## Installation & Setup

1. **Clone or download the project**
   ```bash
   # If you have git, clone the repository
   git clone <repository-url>
   cd optical-store-manager

   # Or if you downloaded as ZIP, extract and navigate to the folder
   cd optical-store-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database (first time setup)**
   ```bash
   node reset-db.js
   ```
   This creates the database with a default store configuration.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173` (Vite's default port)
   - The application will show the login screen

## Authentication & Access

The application supports two types of authentication:

### Store Manager Access
- **Store ID**: `Kashmir Optical Centre`
- **PIN**: `1234`
- Use this for daily store operations (customers, orders, checkups, reports)

### Super Admin Access
- **Username**: `superadmin`
- **Password**: `optical@admin2024`
- Use this for store management and administrative functions

### How to Change Admin Credentials

#### Changing Store PIN:
1. Login as Super Admin
2. Navigate to Settings/Store Management
3. Select the store to edit
4. Update the PIN field
5. Save changes

#### Changing Super Admin Credentials:
1. Edit `src/services/superAdminService.js`
2. Modify the following lines:
   ```javascript
   this.SUPER_ADMIN_USERNAME = 'your-new-username';
   this.SUPER_ADMIN_PASSWORD = 'your-new-password';
   ```
3. Restart the application

## Store Management

### Super Admin Features
With super admin access, you can:
- **Create new stores**: Add multiple optical store locations
- **Edit store details**: Update store information, contact details, and PINs
- **Delete stores**: Remove stores from the system
- **View all stores**: Manage multiple store locations from one interface

### Store Configuration
Each store can be configured with:
- Store name and address
- Contact information (phone, email)
- Custom PIN for staff access
- Individual databases per store

### Multi-Store Support
The system supports multiple store locations, each with:
- Independent customer databases
- Separate inventory and order tracking
- Individual sales reports
- Store-specific staff access

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm start` - Alternative command to start development server
- `node reset-db.js` - Reset database and create default store

## Database

The application uses SQLite for data storage:
- Database file: `optical_store.db` (created automatically)
- Tables: customers, checkups, orders
- All data is stored locally on your machine
- No external database setup required

## Usage Guide

### 1. Dashboard
- View business overview and statistics
- Quick access to recent orders
- Performance metrics (daily, weekly, monthly revenue)

### 2. Customer Management
- Add new customers with personal details
- Search customers by name or phone
- Edit existing customer information
- View complete customer history

### 3. Eye Checkups
- Record detailed eye examination results
- Store both distance vision (DV) and near vision (NV) measurements
- Track prescription changes over time
- Link checkups to specific customers

### 4. Order Management
- Create new orders linked to customers and checkups
- Track frame and lens details
- Manage pricing, advances, and balance amounts
- Update order status (pending, completed, delivered)

### 5. Reports
- Generate sales reports by date range
- View revenue analytics
- Track business performance metrics

## Mobile Responsiveness

The application is fully responsive and includes:
- Collapsible sidebar navigation on mobile
- Responsive grid layouts
- Touch-friendly buttons and form controls
- Optimized for tablets and smartphones

## Data Backup

Since data is stored in `optical_store.db`, you can:
- Back up by copying the database file
- Restore by replacing the database file
- Transfer data between machines

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill the process using port 5173
   npx kill-port 5173
   # Then try running again
   npm run dev
   ```

4. **Dependencies issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Build errors**
   ```bash
   # Try building for production
   npm run build
   ```

6. **Cannot access admin features**
   - Ensure you're logged in as Super Admin, not Store Manager
   - Check that credentials are correct in `superAdminService.js`

## Project Structure

```
optical-store-manager/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CheckupForm.jsx
│   │   ├── CustomerDetails.jsx
│   │   ├── CustomerForm.jsx
│   │   ├── Layout.jsx
│   │   └── OrderForm.jsx
│   ├── pages/              # Main application pages
│   │   ├── Checkups.jsx
│   │   ├── Customers.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Orders.jsx
│   │   └── Reports.jsx
│   ├── utils/              # Utility functions
│   │   └── database.js     # SQLite database operations
��   ├── App.jsx             # Main application component
│   ├── index.css          # Global styles
│   └── main.jsx           # Application entry point
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Contributing

1. Make sure all features work correctly
2. Test on both desktop and mobile devices
3. Follow the existing code style and patterns
4. Ensure database operations are properly handled

## License

This project is for internal use by Kashmir Optical Centre.

## Support

For technical support or questions about the application:
1. Check this README for common solutions
2. Review the code comments for implementation details
3. Test features in a development environment before production use

---

**Note**: This is a local application that stores all data on your machine. Make sure to regularly backup your `optical_store.db` file to prevent data loss.


Separate username/password authentication (`superadmin` / `optical@admin2024`)
