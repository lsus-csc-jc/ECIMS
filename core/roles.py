# core/roles.py

# Only Admin/Owner should access settings
ROLE_SETTINGS_ACCESS = ['Admin', 'Owner']

# All groups have access to inventory
ROLE_INVENTORY_ACCESS = ['Admin', 'Owner', 'Manager', 'Employee']

# Only Admin/Owner/Manager should access orders
ROLE_ORDERS_ACCESS = ['Admin', 'Owner', 'Manager']
