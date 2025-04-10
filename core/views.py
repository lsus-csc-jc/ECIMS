from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout, get_user_model, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from core.models import Profile
import json
import uuid
from .decorators import allowed_roles
from .roles import ROLE_SETTINGS_ACCESS, ROLE_INVENTORY_ACCESS, ROLE_ORDERS_ACCESS
from django.http import JsonResponse
from .forms import SignUpForm  # Import the fixed signup form
from .models import Order, Supplier, Profile, InventoryItem, OrderItem
import logging
from django.db import transaction, IntegrityError

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

def get_suppliers(request):
    suppliers = Supplier.objects.all().values('id', 'name')
    return JsonResponse({'suppliers': list(suppliers)})


@csrf_exempt
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
                        defaults={'quantity': 0, 'description': '', 'threshold': 0} # Sensible defaults if created
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



@login_required # Ensure user is logged in
def reset_password(request):
    # --- Permission Check --- 
    if not request.user.is_superuser:
        messages.error(request, "You do not have permission to reset passwords.")
        return redirect('settings')

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

def delete_user(request, user_id):
    if request.method == 'POST':
        # Optional: check if the request.user is allowed to delete
        user_to_delete = get_object_or_404(User, pk=user_id)
        user_to_delete.delete()
        messages.success(request, 'User deleted successfully.')
    return redirect('settings')  # or wherever you want to go after deletion

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
        user_to_edit.save()
        
        messages.success(request, 'User updated successfully.')
        return redirect('settings')  # or some other page

    # If GET request, render a form pre-filled with user info
    return render(request, 'edit_user.html', {'user_to_edit': user_to_edit})




@csrf_exempt
def update_user(request, user_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            user = User.objects.get(id=user_id)
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)
            user.save()

            # Update role in profile
            profile = user.profile
            profile.role = data.get('role', profile.role)
            profile.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@allowed_roles(roles=['Manager', 'Employee'])
def view_inventory(request):
    # Logic to display inventory (implement your logic as needed)
    return render(request, 'inventory.html')


@allowed_roles(roles=['Employee'])
def add_inventory_item(request):
    # Logic to add an inventory item
    if request.method == 'POST':
        # Process form data (implement your logic here)
        pass
    return render(request, 'add_inventory.html')


@allowed_roles(roles=['Manager'])
def delete_inventory_item(request, item_id):
    # Logic to delete an inventory item (implement deletion logic here)
    pass

@allowed_roles(roles=ROLE_SETTINGS_ACCESS)
@login_required
def settings_view(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Access Denied")

    users = User.objects.all().select_related("profile")

    # Ensure profile exists for superuser
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
    return render(request, 'dashboard.html')

@login_required
def invmanagement_view(request):
    return render(request, 'invmanagement.html')

@login_required
def orders_view(request):
    orders = Order.objects.all().order_by('-date_ordered')
    return render(request, 'orders.html', {'orders': orders})

@login_required
def suppliers_view(request):
    return render(request, 'suppliers.html')

@login_required
def reports_view(request):
    return render(request, 'reports.html')

@login_required
def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect('login')

@login_required
def profile_list(request):
    profiles = Profile.objects.all().order_by('user__username')
    return render(request, 'profile_list.html', {'profiles': profiles})

@login_required
@require_POST # Ensure this view only accepts POST requests
def delete_order(request, order_id):
    # Optional: Add permission check here (e.g., only superusers/managers)
    # if not request.user.is_superuser:
    #     messages.error(request, "You don't have permission to delete orders.")
    #     return redirect('orders')

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
@require_POST
def bulk_delete_orders(request):
    # Optional: Permission check
    # if not request.user.is_superuser:
    #     return JsonResponse({'success': False, 'error': 'Permission denied'}, status=403)
    
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
@require_POST
def bulk_update_order_status(request):
    # Optional: Permission check
        
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
                                defaults={'quantity': 0, 'description': '', 'threshold': 0}
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
