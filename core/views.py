from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout, get_user_model, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden, HttpResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from core.models import Profile
import json
import uuid
from .decorators import allowed_roles
from .roles import ROLE_SETTINGS_ACCESS, ROLE_INVENTORY_ACCESS, ROLE_ORDERS_ACCESS, ROLE_SUPPLIERS_ACCESS, ROLE_REPORTS_ACCESS
from .forms import SignUpForm  # Import the fixed signup form
from .models import Order, Supplier, Profile, InventoryItem, InventoryItem, OrderItem
import logging
from django.db import transaction, IntegrityError
from django.db.models import Count, Q # Import Q for complex lookups
import pandas as pd
import io
import codecs
import csv

# Get an instance of a logger
# logger = logging.getLogger(__name__) # Removing logger for simplification

User = get_user_model()

def login_page(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f'Logged in as {user.username}.')
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

def signup_page(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Account created successfully! Please log in.")
            return redirect('login')
        else:
            messages.error(request, "There was an error creating your account. Please check the details.")
            print(form.errors)  # Debugging in terminal
    else:
        form = SignUpForm()
    return render(request, 'signup.html', {'form': form})


@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
def save_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            supplier_id = data.get('supplier')
            expected_delivery = data.get('expectedDelivery')
            items_data = data.get('items') # Expecting a list of items

            # --- Basic Validation --- 
            if not supplier_id:
                return JsonResponse({'success': False, 'error': 'Supplier is required.'}, status=400)
            if not items_data or not isinstance(items_data, list) or len(items_data) == 0:
                 return JsonResponse({'success': False, 'error': 'Order must contain at least one item.'}, status=400)

            # --- Get Supplier --- 
            try:
                supplier = Supplier.objects.get(id=supplier_id)
            except Supplier.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Supplier not found.'}, status=404)
            
            # --- Generate Order Number --- 
            order_number = str(uuid.uuid4())[:8] # Consider making this check for uniqueness in a loop if collisions are likely

            # --- Create the Main Order --- 
            # Status defaults to PENDING as defined in the model
            order = Order.objects.create(
                order_number=order_number,
                supplier=supplier,
                expected_delivery=expected_delivery 
                # Removed product, quantity. Status defaults to PENDING.
            )

            # --- Create Order Items --- 
            order_items_to_create = []
            for item_data in items_data:
                product_name = item_data.get('product_name')
                quantity_str = item_data.get('quantity')
                
                # Validate item data
                if not product_name:
                    # If an item is invalid, we should ideally roll back the order creation or handle it.
                    # For simplicity now, we'll return an error, but this leaves an empty order behind.
                    # A database transaction would be better here in a production scenario.
                     return JsonResponse({'success': False, 'error': 'All items must have a product name.'}, status=400)
                try:
                    quantity = int(quantity_str)
                    if quantity <= 0:
                        raise ValueError("Quantity must be positive")
                except (ValueError, TypeError):
                    return JsonResponse({'success': False, 'error': f'Invalid quantity for product "{product_name}". Must be a positive whole number.'}, status=400)

                # Add valid item to list for bulk creation
                order_items_to_create.append(
                    OrderItem(order=order, product_name=product_name, quantity=quantity)
                )
            
            # Create all items in one go if the list is not empty
            if order_items_to_create:
                OrderItem.objects.bulk_create(order_items_to_create)
            else:
                # This case should ideally be caught earlier, but as a safeguard:
                order.delete() # Clean up the empty order if no valid items were processed
                return JsonResponse({'success': False, 'error': 'No valid items found in the order.'}, status=400)

            # Query for an updated supplier list (optional, might not be needed anymore)
            suppliers = list(Supplier.objects.all().values('id', 'name'))

            return JsonResponse({
                'success': True,
                'message': 'Order saved successfully',
                'order_id': order.id, # Optionally return the new order ID
                'suppliers': suppliers 
            })
        
        except json.JSONDecodeError:
             return JsonResponse({'success': False, 'error': 'Invalid JSON format.'}, status=400)
        except Exception as e:
            # Log the exception in a real application
            # logger.exception("Error saving order:") 
            return JsonResponse({'success': False, 'error': f'An unexpected error occurred: {str(e)}'}, status=500)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
def get_suppliers(request):
    suppliers = Supplier.objects.all().values('id', 'name')
    return JsonResponse({'suppliers': list(suppliers)})


@csrf_exempt
@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
def update_order(request, order_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_status = data.get('status')
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)
        except json.JSONDecodeError:
             return JsonResponse({'success': False, 'error': 'Invalid JSON format.'}, status=400)
        except Exception as e:
            # logger.exception(f"Error fetching order {order_id} for update:")
            return JsonResponse({'success': False, 'error': f'Error processing request: {str(e)}'}, status=500)
        
        # Validate new status
        valid_statuses = [s[0] for s in Order.ORDER_STATUS]
        if new_status not in valid_statuses:
            return JsonResponse({'success': False, 'error': f'Invalid status: {new_status}'}, status=400)

        previous_status = order.status
        order.status = new_status
        order.save()

        # --- Update Inventory on Completion --- 
        if previous_status == 'PENDING' and new_status == 'COMPLETED':
            try:
                # Iterate over the items associated with this order
                for item in order.items.all(): 
                    # Find or create the inventory item based on the product name from the order item
                    inventory_item, created = InventoryItem.objects.get_or_create(
                        name=item.product_name, # Use product_name from OrderItem
                        defaults={'quantity': 0, 'threshold': 0} # Removed description field
                    )
                    # Increment the inventory quantity
                    inventory_item.quantity += item.quantity # Use quantity from OrderItem
                    inventory_item.save() # This recalculates inventory status via the model's save() method
                
                # Optional: Log successful inventory update
                # logger.info(f"Inventory updated successfully for completed order {order.order_number} (ID: {order_id})")

            except Exception as e:
                # Log the error
                # logger.exception(f"Error updating inventory for completed order {order.order_number} (ID: {order_id}):")
                # Inform the user, but the order status is already updated.
                # Consider how to handle partial inventory update failures.
                messages.warning(request, f"Order status updated to COMPLETED, but there was an issue updating inventory: {str(e)}")
                # Return success=True because the order *status* was updated, but maybe add a warning message
                return JsonResponse({'success': True, 'message': 'Order updated, but inventory update failed.'})

        return JsonResponse({'success': True, 'message': 'Order updated successfully'})

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
@require_POST
@login_required
@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
def add_user(request):
    name = request.POST.get("name")
    email = request.POST.get("email")
    password = request.POST.get("password")
    role = request.POST.get("role")
    
    if not (name and email and password and role):
        return JsonResponse({"success": False, "error": "Missing required fields."})
    
    try:
        user = User.objects.create_user(username=name, email=email, password=password)
        user.profile.role = role
        user.profile.save()
        
        # If creating an Admin user, give superuser privileges
        if role == 'Admin':
            user.is_superuser = True
            user.is_staff = True
            user.save()
        
        response_data = {
            "success": True,
            "user": {
                "id": user.id,         # Added user id
                "username": user.username,
                "email": user.email,
                "role": user.profile.role,
            }
        }
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})



@login_required
@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
def reset_password(request):
    if request.method == "POST":
        new_password = request.POST.get('new_password', '').strip()
        confirm_password = request.POST.get('confirm_password', '').strip()
        target_user_id = request.POST.get('target_user_id', None) # Keep this name for the hidden input

        # --- Validation --- 
        if not target_user_id:
            messages.error(request, "User ID was missing. Cannot reset password.")
            return redirect('settings')
        try:
            target_user_id = int(target_user_id)
        except ValueError:
            messages.error(request, "Invalid User ID format.")
            return redirect('settings')

        if not new_password:
            messages.error(request, "Password cannot be empty.")
            return redirect('settings')

        if new_password != confirm_password:
            messages.error(request, "Passwords do not match. Please try again.")
            return redirect('settings')

        # --- Action --- 
        try:
            target_user = User.objects.get(pk=target_user_id)

            target_user.set_password(new_password)
            target_user.save() 

            # --- Update Session If Changing Own Password --- 
            if request.user.pk == target_user.pk:
                update_session_auth_hash(request, target_user) # Keeps the user logged in
                messages.success(request, f"Your password has been successfully changed!")
            else:
                messages.success(request, f"Password for {target_user.username} successfully changed!")
            
            return redirect('settings')

        except User.DoesNotExist:
            messages.error(request, f"User with ID {target_user_id} not found.")
            return redirect('settings')
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {str(e)}")
            return redirect('settings')

    # If not POST (e.g., GET request), just redirect back
    return redirect('settings')

@login_required
@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
def delete_user(request, user_id):
    if request.method == 'POST':
        user_to_delete = get_object_or_404(User, pk=user_id)
        user_to_delete.delete()
        messages.success(request, 'User deleted successfully.')
    return redirect('settings')  # or wherever you want to go after deletion

@login_required
@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
def edit_user(request, user_id):
    user_to_edit = get_object_or_404(User, pk=user_id)

    if request.method == 'POST':
        new_username = request.POST.get('username')
        new_email = request.POST.get('email')
        new_role = request.POST.get('role')
        
        # Update fields as needed
        user_to_edit.username = new_username
        user_to_edit.email = new_email
        user_to_edit.profile.role = new_role
        user_to_edit.profile.save()
        
        # If role is changed to Admin, give superuser privileges
        if new_role == 'Admin':
            user_to_edit.is_superuser = True
            user_to_edit.is_staff = True
        else:
            # Only change superuser status if explicitly downgrading from Admin
            if new_role != 'Admin' and user_to_edit.is_superuser:
                user_to_edit.is_superuser = False
                user_to_edit.is_staff = False
        
        user_to_edit.save()
        
        messages.success(request, 'User updated successfully.')
        return redirect('settings')  # or some other page

    # If GET request, render a form pre-filled with user info
    return render(request, 'edit_user.html', {'user_to_edit': user_to_edit})




@csrf_exempt
@login_required
@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
def update_user(request, user_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            user = User.objects.get(id=user_id)
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)
            
            # Update role in profile
            profile = user.profile
            new_role = data.get('role', profile.role)
            profile.role = new_role
            profile.save()
            
            # If role is changed to Admin, give superuser privileges
            if new_role == 'Admin':
                user.is_superuser = True
                user.is_staff = True
            else:
                # Only change superuser status if explicitly downgrading from Admin
                if profile.role != 'Admin' and user.is_superuser:
                    user.is_superuser = False
                    user.is_staff = False
            
            user.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@allowed_roles(roles=['Manager', 'Employee'])
def view_inventory(request):
    # Logic to display inventory (implement your logic as needed)
    return render(request, 'inventory.html')


@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
@csrf_exempt
@login_required
def add_inventory_item(request):
    """API endpoint to add a new inventory item"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Check if the data is a single item or an array of items
            if isinstance(data, list):
                # Handle multiple items
                created_items = []
                for item_data in data:
                    item = InventoryItem.objects.create(
                        name=item_data['name'],
                        quantity=item_data['quantity'],
                        threshold=item_data['threshold']
                    )
                    created_items.append({
                        'id': item.id,
                        'name': item.name,
                        'quantity': item.quantity,
                        'threshold': item.threshold,
                        'status': item.status,
                        'status_text': item.get_status_display()
                    })
                return JsonResponse({
                    'success': True,
                    'message': f'Successfully added {len(created_items)} items',
                    'items': created_items
                })
            else:
                # Handle single item
                item = InventoryItem.objects.create(
                    name=data['name'],
                    quantity=data['quantity'],
                    threshold=data['threshold']
                )
                return JsonResponse({
                    'success': True,
                    'id': item.id,
                    'status': item.status,
                    'status_text': item.get_status_display()
                })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
def delete_inventory_item(request, item_id):
    # Logic to delete an inventory item (implement deletion logic here)
    pass

@csrf_exempt
@require_POST
@login_required
def mark_alert_viewed(request, item_id):
    try:
        item = InventoryItem.objects.get(id=item_id)
        item.alert_triggered = True
        item.save()
        return JsonResponse({"success": True})
    except InventoryItem.DoesNotExist:
        return JsonResponse({"error": "Item not found"}, status=404)

@csrf_exempt
@require_http_methods(["PUT"])
@login_required
def update_inventory_item(request, item_id):
    try:
        # Retrieve the item
        item = InventoryItem.objects.get(id=item_id)

        # Parse the incoming data from the request body
        data = json.loads(request.body)

        # Update fields (only if provided in the request body)
        item.name = data.get("name", item.name)
        item.quantity = int(data.get("quantity", item.quantity))
        item.threshold = int(data.get("threshold", item.threshold))

        # Check if the quantity has changed and adjust alert status accordingly
        #if item.quantity < item.threshold:
            #if not item.alert_triggered:
                #item.alert_triggered = True
        #else:
        if item.quantity >= item.threshold:
            #if item.alert_triggered:
            item.alert_triggered = False

        # Save the changes
        item.save()

        return JsonResponse({
            "success": True,
            "item": {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "threshold": item.threshold,
                "status": item.status,
                "alert_triggered": item.alert_triggered,
            }
        })

    except InventoryItem.DoesNotExist:
        return JsonResponse({"error": "Item not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
@login_required
def settings_view(request):
    users = User.objects.all().select_related("profile")

    # Ensure profile exists for user
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        profile.phone = request.POST.get('phone', profile.phone)
        profile.website = request.POST.get('website', profile.website)
        profile.street = request.POST.get('street', profile.street)
        profile.city = request.POST.get('city', profile.city)
        profile.state = request.POST.get('state', profile.state)
        profile.zip_code = request.POST.get('zip_code', profile.zip_code)
        profile.timezone = request.POST.get('timezone', profile.timezone)
        profile.save()
        return redirect('settings')

    return render(request, 'settings.html', {
        'users': users,
        'user': request.user,
        'profile': profile,
    })


@login_required
def dashboard_view(request):
    # Calculate KPI counts
    total_products = InventoryItem.objects.count()
    # Count items that are Low Stock (2) or Out of Stock (1)
    stock_alerts = InventoryItem.objects.filter(Q(status=1) | Q(status=2)).count()
    pending_orders = Order.objects.filter(status='PENDING').count()
    total_suppliers = Supplier.objects.count() # Added supplier count
    
    # Fetch recent orders (e.g., last 5)
    recent_orders = Order.objects.order_by('-date_ordered')[:5]
    
    # Fetch recent suppliers (last 5)
    recent_suppliers = Supplier.objects.order_by('-date_added')[:5]
    
    # Fetch low/out-of-stock items
    low_stock_items = InventoryItem.objects.filter(Q(status=1) | Q(status=2)).order_by('status', 'name')
    
    # Prepare data for Inventory Status Pie Chart
    inventory_status_counts = InventoryItem.objects.values('status').annotate(count=Count('id')).order_by('status')
    # Convert status codes to labels for the chart
    chart_labels = []
    chart_data = []
    status_map = dict(InventoryItem.INV_STATUS_CHOICES) # Use choices from model
    for item in inventory_status_counts:
        chart_labels.append(status_map.get(item['status'], 'Unknown'))
        chart_data.append(item['count'])
        
    # Prepare data for Suppliers Status chart
    active_suppliers = Supplier.objects.filter(status=True).count()
    inactive_suppliers = Supplier.objects.filter(status=False).count()
    suppliers_chart_labels = ["Active", "Inactive"]
    suppliers_chart_data = [active_suppliers, inactive_suppliers]
    
    # Get top suppliers by order count
    top_suppliers = Supplier.objects.annotate(
        order_count=Count('orders')
    ).order_by('-order_count')[:5]

    context = {
        'total_products': total_products,
        'stock_alerts': stock_alerts,
        'pending_orders': pending_orders,
        'total_suppliers': total_suppliers, # Added to context
        'recent_orders': recent_orders,
        'recent_suppliers': recent_suppliers, # Added recent suppliers
        'top_suppliers': top_suppliers, # Added top suppliers
        'low_stock_items': low_stock_items,
        'inventory_chart_labels': json.dumps(chart_labels), # Pass as JSON for JS
        'inventory_chart_data': json.dumps(chart_data),   # Pass as JSON for JS
        'suppliers_chart_labels': json.dumps(suppliers_chart_labels), # Pass as JSON for JS
        'suppliers_chart_data': json.dumps(suppliers_chart_data),   # Pass as JSON for JS
    }
    return render(request, 'dashboard.html', context)

@login_required
def invmanagement_view(request):
    return render(request, 'invmanagement.html')

@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
def orders_view(request):
    orders = Order.objects.all().order_by('-date_ordered')
    return render(request, 'orders.html', {'orders': orders})

@login_required
@allowed_roles(roles=ROLE_SUPPLIERS_ACCESS)
def suppliers_view(request):
    return render(request, 'suppliers.html')

@login_required
@allowed_roles(roles=ROLE_REPORTS_ACCESS)
def reports_view(request):
    return render(request, 'reports.html')

@login_required
def changelog_view(request):
    return render(request, 'changelog.html')

def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect('login')

@login_required
def profile_list(request):
    profiles = Profile.objects.all().order_by('user__username')
    return render(request, 'profile_list.html', {'profiles': profiles})

@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
@require_POST # Ensure this view only accepts POST requests
def delete_order(request, order_id):
    order_to_delete = get_object_or_404(Order, pk=order_id)
    order_number = order_to_delete.order_number # Get number for message before deleting
    try:
        order_to_delete.delete()
        messages.success(request, f'Order {order_number} deleted successfully.')
    except Exception as e:
        messages.error(request, f'Error deleting order {order_number}: {str(e)}')
        # Log the error in a real application
        # logger.exception(f"Error deleting order {order_id}")
        
    return redirect('orders')

@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
@require_POST
def bulk_delete_orders(request):
    try:
        data = json.loads(request.body)
        order_ids = data.get('order_ids')

        if not order_ids or not isinstance(order_ids, list):
            return JsonResponse({'success': False, 'error': 'Invalid or missing order IDs.'}, status=400)

        # Filter valid integer IDs
        valid_ids = [int(id) for id in order_ids if str(id).isdigit()]
        
        if not valid_ids:
             return JsonResponse({'success': False, 'error': 'No valid order IDs provided.'}, status=400)

        # Perform deletion
        deleted_count, _ = Order.objects.filter(pk__in=valid_ids).delete()
        
        messages.success(request, f'{deleted_count} order(s) deleted successfully.')
        return JsonResponse({'success': True, 'message': f'{deleted_count} order(s) deleted.'})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        # Log error
        messages.error(request, f'An error occurred during bulk deletion: {str(e)}')
        return JsonResponse({'success': False, 'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@login_required
@allowed_roles(roles=ROLE_ORDERS_ACCESS)
@require_POST
def bulk_update_order_status(request):
    try:
        data = json.loads(request.body)
        order_ids = data.get('order_ids')
        new_status = data.get('status')

        if not order_ids or not isinstance(order_ids, list):
            return JsonResponse({'success': False, 'error': 'Invalid or missing order IDs.'}, status=400)
            
        valid_statuses = [s[0] for s in Order.ORDER_STATUS]
        if not new_status or new_status not in valid_statuses:
            return JsonResponse({'success': False, 'error': f'Invalid status: {new_status}'}, status=400)
            
        valid_ids = [int(id) for id in order_ids if str(id).isdigit()]
        if not valid_ids:
             return JsonResponse({'success': False, 'error': 'No valid order IDs provided.'}, status=400)

        updated_count = 0
        inventory_errors = []

        # Use a transaction to ensure atomicity
        with transaction.atomic():
            # Fetch the orders to be updated
            orders_to_update = Order.objects.select_for_update().filter(pk__in=valid_ids) 
            # select_for_update locks the rows

            for order in orders_to_update:
                previous_status = order.status
                
                # Skip if status is already the target status
                if previous_status == new_status:
                    continue

                order.status = new_status
                order.save() # Save the status change first
                updated_count += 1
                
                # --- Trigger Inventory Update Logic --- 
                if previous_status == 'PENDING' and new_status == 'COMPLETED':
                    try:
                        for item in order.items.all(): 
                            inventory_item, created = InventoryItem.objects.get_or_create(
                                name=item.product_name,
                                defaults={'quantity': 0, 'threshold': 0}
                            )
                            inventory_item.quantity += item.quantity
                            inventory_item.save() 
                    except Exception as e:
                        # Log the specific inventory error but continue processing other orders
                        # logger.exception(f"Inventory update failed for order {order.order_number} item {item.product_name}: {str(e)}")
                        inventory_errors.append(f"Order {order.order_number}: {str(e)}")
                        # Note: Depending on requirements, you might want to fail the entire transaction here
                        # by raising the exception instead of appending to inventory_errors.
                        # raise e # Uncomment this to make the whole bulk operation fail if one inventory update fails
        
        # --- Prepare response message --- 
        message = f'{updated_count} order(s) status updated to {new_status}.'
        success_status = True
        
        if inventory_errors:
            error_details = " Inventory update issues: " + "; ".join(inventory_errors)
            message += error_details
            messages.warning(request, message) # Use warning if there were partial errors
            # Decide if the overall operation counts as success if inventory failed
            # success_status = False # Uncomment if inventory failure means overall failure
        else:
             messages.success(request, message)

        return JsonResponse({'success': success_status, 'message': message})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON format.'}, status=400)
    except IntegrityError as e: # Catch potential database integrity errors
        messages.error(request, f'A database integrity error occurred: {str(e)}')
        return JsonResponse({'success': False, 'error': f'Database integrity error: {str(e)}'}, status=500)
    except Exception as e:
        # Log error
        messages.error(request, f'An unexpected error occurred during bulk status update: {str(e)}')
        return JsonResponse({'success': False, 'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@login_required
@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
@require_POST
def bulk_delete_inventory_items(request):
    try:
        data = json.loads(request.body)
        item_ids = data.get('item_ids')

        if not item_ids or not isinstance(item_ids, list):
            return JsonResponse({'success': False, 'error': 'Invalid or missing item IDs.'}, status=400)

        # Filter valid integer IDs
        valid_ids = [int(id) for id in item_ids if str(id).isdigit()]
        
        if not valid_ids:
             return JsonResponse({'success': False, 'error': 'No valid item IDs provided.'}, status=400)

        # Perform deletion
        deleted_count, _ = InventoryItem.objects.filter(pk__in=valid_ids).delete()
        
        # Note: We return JSON here because the inventory page seems to use fetch/API calls
        return JsonResponse({'success': True, 'message': f'{deleted_count} item(s) deleted.'})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        # Log error in a real application
        # logger.exception("Error during bulk inventory item deletion:")
        return JsonResponse({'success': False, 'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@csrf_exempt
@login_required
@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
def import_products(request):
    if request.method == 'POST':
        try:
            # Print debug info about the request
            print("Import products request received")
            print(f"FILES: {request.FILES}")
            print(f"POST: {request.POST}")
            
            excel_file = request.FILES.get('excel_file')
            if not excel_file:
                print("No file found in request")
                return JsonResponse({
                    'success': False,
                    'error': 'Please select a file to upload'
                })
                
            print(f"File received: {excel_file.name}, size: {excel_file.size} bytes")
                
            if not excel_file.name.endswith('.csv'):
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid file format. Please upload a CSV file (.csv)'
                })

            # Read the CSV file
            try:
                # First try with pandas
                try:
                    df = pd.read_csv(excel_file)
                    print(f"DataFrame created successfully with {len(df)} rows")
                    print(f"DataFrame head:\n{df.head()}")
                    print(f"DataFrame columns: {df.columns.tolist()}")
                except Exception as e:
                    print(f"Error with pandas: {str(e)}")
                    # If pandas fails, try with builtin csv module
                    excel_file.seek(0)  # Reset file pointer
                    import csv
                    reader = csv.DictReader(codecs.iterdecode(excel_file, 'utf-8'))
                    data = list(reader)
                    if not data:
                        raise Exception("No data found in CSV")
                    
                    # Convert to DataFrame
                    df = pd.DataFrame(data)
                    print(f"Created DataFrame from CSV module with {len(df)} rows")
            except Exception as e:
                print(f"Error reading CSV file: {str(e)}")
                return JsonResponse({
                    'success': False,
                    'error': f'Error reading CSV file: {str(e)}. Please make sure the file is not corrupted and is a valid CSV file.'
                })

            if df.empty:
                print("DataFrame is empty")
                return JsonResponse({
                    'success': False,
                    'error': 'The CSV file is empty. Please add some data.'
                })

            # Convert all column names to lowercase for easier matching
            df.columns = df.columns.str.lower().str.strip()
            
            # Define possible variations for each required field
            name_variations = ['name', 'product', 'item', 'product name', 'item name', 'productname', 'itemname', 'title', 'description']
            quantity_variations = ['quantity', 'qty', 'amount', 'stock', 'count', 'number', 'total', 'inventory']
            threshold_variations = ['threshold', 'minimum', 'min', 'reorder', 'reorder point', 'minimum stock', 'min stock', 'reorder level']

            # Find the best matching columns
            name_col = None
            quantity_col = None
            threshold_col = None

            for col in df.columns:
                col_lower = col.lower().strip()
                # Try to match name column
                if not name_col and any(variation in col_lower for variation in name_variations):
                    name_col = col
                # Try to match quantity column
                elif not quantity_col and any(variation in col_lower for variation in quantity_variations):
                    quantity_col = col
                # Try to match threshold column
                elif not threshold_col and any(variation in col_lower for variation in threshold_variations):
                    threshold_col = col

            # If we still don't have matches, try to use positional matching as fallback
            if not name_col and len(df.columns) >= 1:
                name_col = df.columns[0]  # First column is usually the name
            if not quantity_col and len(df.columns) >= 2:
                quantity_col = df.columns[1]  # Second column is usually quantity
            if not threshold_col and len(df.columns) >= 3:
                threshold_col = df.columns[2]  # Third column could be threshold

            print(f"Mapped columns: Name={name_col}, Quantity={quantity_col}, Threshold={threshold_col}")
            
            # Process each row
            success_count = 0
            error_count = 0
            errors = []
            
            # Skip empty rows
            df = df.dropna(how='all')
            
            for index, row in df.iterrows():
                try:
                    # Get and validate name
                    if name_col is None:
                        print(f"Row {index + 1}: Missing name column")
                        error_count += 1
                        continue
                        
                    name = str(row[name_col]).strip() if not pd.isna(row[name_col]) else None
                    if not name or pd.isna(name) or (index == 0 and name.lower() == name_col.lower()):
                        print(f"Row {index + 1}: Skipping header or empty name: {name}")
                        continue

                    # Get and validate quantity and threshold
                    try:
                        # Handle quantity
                        quantity = row[quantity_col] if quantity_col and not pd.isna(row[quantity_col]) else 0
                        if pd.isna(quantity):
                            quantity = 0
                        if isinstance(quantity, str):
                            quantity = quantity.replace(',', '').strip()
                        quantity = int(float(quantity))
                        if quantity < 0:
                            quantity = 0

                        # Handle threshold
                        threshold = row[threshold_col] if threshold_col and not pd.isna(row[threshold_col]) else 0
                        if pd.isna(threshold):
                            threshold = 0
                        if isinstance(threshold, str):
                            threshold = threshold.replace(',', '').strip()
                        threshold = int(float(threshold))
                        if threshold < 0:
                            threshold = 0
                            
                    except (ValueError, TypeError) as e:
                        print(f"Row {index + 1}: Error with quantity/threshold: {str(e)}")
                        # If there's an error with quantity or threshold, set them to 0
                        quantity = 0
                        threshold = 0

                    print(f"Processing row {index + 1}: Name='{name}', Quantity={quantity}, Threshold={threshold}")  # Debug log

                    # Create or update inventory item
                    try:
                        print(f"Attempting to save item to database: {name}, qty={quantity}, threshold={threshold}")
                        item, created = InventoryItem.objects.update_or_create(
                            name=name,
                            defaults={
                                'quantity': quantity,
                                'threshold': threshold
                            }
                        )
                        print(f"Database operation completed. Item ID: {item.id}, Created: {created}")
                        success_count += 1
                        print(f"Row {index + 1}: {'Created' if created else 'Updated'} item {name}")
                    except Exception as db_error:
                        print(f"DATABASE ERROR saving item {name}: {str(db_error)}")
                        error_count += 1
                        errors.append(f"Database error with {name}: {str(db_error)}")
                        continue

                except Exception as e:
                    error_count += 1
                    error_msg = f"Row {index + 1}: {str(e)}"
                    print(f"Error: {error_msg}")  # Debug log
                    errors.append(error_msg)
                    continue

            message = f'Successfully imported {success_count} products.'
            if error_count > 0:
                message += f' {error_count} items were skipped.'
            
            print(f"Import completed: {success_count} successes, {error_count} errors")
            return JsonResponse({
                'success': True,
                'message': message
            })
            
        except Exception as e:
            print(f"General error during import: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': f'Error processing file: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method'
    }, status=405)

@login_required
@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
def download_template(request):
    # Create a sample DataFrame with standard column names
    data = {
        'Product Name': ['Laptop Dell XPS 13', 'HP Printer Ink Cartridge'],
        'Quantity': [25, 100],
        'Threshold': [5, 20]
    }
    df = pd.DataFrame(data)
    
    # Create the CSV file in memory
    csv_file = io.StringIO()
    df.to_csv(csv_file, index=False)
    csv_file.seek(0)
    
    # Create the HTTP response
    response = HttpResponse(csv_file.getvalue(),
                          content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename=inventory_template.csv'
    
    return response

@login_required
@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
@csrf_exempt
def get_inventory_items(request):
    """API endpoint to get all inventory items"""
    items = InventoryItem.objects.all().order_by('name')
    data = [{
        'id': item.id,
        'name': item.name,
        'quantity': item.quantity,
        'threshold': item.threshold,
        'status': item.status,
        'status_text': item.get_status_display()
    } for item in items]
    return JsonResponse(data, safe=False)

@login_required
@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
@csrf_exempt
def update_inventory_item(request, item_id):
    """API endpoint to update an inventory item"""
    if request.method == 'PUT':
        try:
            item = InventoryItem.objects.get(id=item_id)
            data = json.loads(request.body)
            item.name = data.get('name', item.name)
            item.quantity = data.get('quantity', item.quantity)
            item.threshold = data.get('threshold', item.threshold)
            item.save()
            return JsonResponse({
                'success': True,
                'status': item.status,
                'status_text': item.get_status_display()
            })
        except InventoryItem.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Item not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
@allowed_roles(roles=ROLE_INVENTORY_ACCESS)
@csrf_exempt
def delete_inventory_item(request, item_id):
    """API endpoint to delete an inventory item"""
    if request.method == 'DELETE':
        try:
            item = InventoryItem.objects.get(id=item_id)
            item.delete()
            return JsonResponse({'success': True})
        except InventoryItem.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Item not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)
