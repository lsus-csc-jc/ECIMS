from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt

import json
import uuid

from .forms import SignUpForm  # Import the fixed signup form
from .models import Order, Supplier, Profile, InventoryItem
from .decorators import role_required

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
            product = data.get('product')
            quantity = data.get('quantity')
            supplier_name = data.get('supplier')
            expected_delivery = data.get('expectedDelivery')
            form_status = data.get('status')
            
            if not supplier_name:
                return JsonResponse({'success': False, 'error': 'Supplier name is required.'}, status=400)
            
            status_mapping = {
                'Pending': 'PENDING',
                'Completed': 'COMPLETED',
                'Returned': 'CANCELLED'
            }
            order_status = status_mapping.get(form_status, 'PENDING')
            
            supplier, created = Supplier.objects.get_or_create(
                name=supplier_name,
                defaults={'contact_email': 'unknown@example.com'}
            )
            
            order_number = str(uuid.uuid4())[:8]
            
            order = Order.objects.create(
                order_number=order_number,
                supplier=supplier,
                status=order_status,
                product=product,
                quantity=quantity,
                expected_delivery=expected_delivery
            )
            
            return JsonResponse({'success': True, 'message': 'Order saved successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
@require_POST
def add_user(request):
    name = request.POST.get("name")
    email = request.POST.get("email")
    password = request.POST.get("password")
    role = request.POST.get("role")
    
    # Check that all required fields are provided
    if not (name and email and password and role):
        return JsonResponse({"success": False, "error": "Missing required fields."})
    
    try:
        # Create a new user; create_user automatically hashes the password
        user = User.objects.create_user(username=name, email=email, password=password)
        
        # Set the role on the associated profile (assumes OneToOne relationship exists)
        user.profile.role = role
        user.profile.save()
        
        response_data = {
            "success": True,
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.profile.role,
            }
        }
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

def reset_user_password(request, user_id):
    user = get_object_or_404(User, id=user_id)
    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        if new_password and new_password == confirm_password:
            user.set_password(new_password)  # This hashes the new password
            user.save()
            messages.success(request, "Password reset successfully!")
            return redirect('settings')  # Change to your desired redirect
        else:
            messages.error(request, "Passwords do not match or are empty.")
    return render(request, 'reset_password.html', {'user': user})


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


@role_required(['Manager', 'Employee'])
def view_inventory(request):
    # Logic to display inventory (implement your logic as needed)
    return render(request, 'inventory.html')

@role_required(['Employee'])
def add_inventory_item(request):
    # Logic to add an inventory item
    if request.method == 'POST':
        # Process form data (implement your logic here)
        pass
    return render(request, 'add_inventory.html')

@role_required(['Manager'])
def delete_inventory_item(request, item_id):
    # Logic to delete an inventory item (implement deletion logic here)
    pass

@csrf_exempt
@require_POST
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
        if item.quantity < item.threshold:
            if not item.alert_triggered:
                item.alert_triggered = True
        else:
            if item.alert_triggered:
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

@login_required
def settings_view(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Access Denied")
    users = User.objects.all().select_related("profile")
    return render(request, 'settings.html', {'users': users})

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
