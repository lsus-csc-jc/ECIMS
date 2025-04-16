# core/roles.py

# Only Admin/Owner should access settings
ROLE_SETTINGS_ACCESS = ['Admin', 'Owner']

# All users have access to inventory - including Managers
ROLE_INVENTORY_ACCESS = ['Admin', 'Owner', 'Manager', 'Employee']

# Admin/Owner/Manager should access orders
ROLE_ORDERS_ACCESS = ['Admin', 'Owner', 'Manager']

# Admin/Owner/Manager should access reports
ROLE_REPORTS_ACCESS = ['Admin', 'Owner', 'Manager']

# Admin/Owner/Manager should access suppliers
ROLE_SUPPLIERS_ACCESS = ['Admin', 'Owner', 'Manager']
