from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .forms import SignUpForm  # Import the fixed signup form
from django.http import JsonResponse, HttpResponseForbidden
from .models import Order, Supplier
from .decorators import role_required
import json
import uuid
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt


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
        
        # If you have a profile model associated with User for storing roles:
        # (This assumes you have a OneToOne relation from User to Profile and a 'role' field.)
        user.profile.role = role
        user.profile.save()
        
        # Build the response data structure
        response_data = {
            "success": True,
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.profile.role,  # Adjust if your role field is stored elsewhere
            }
        }
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@role_required(['Manager', 'Employee'])
def view_inventory(request):
    # Your logic to display inventory
    return render(request, 'inventory.html')

@role_required(['Employee'])
def add_inventory_item(request):
    # Logic to add an inventory item
    if request.method == 'POST':
        # Process form data
        pass
    return render(request, 'add_inventory.html')

@role_required(['Manager'])
def delete_inventory_item(request, item_id):
    # Logic to delete an inventory item
    pass

@login_required
def settings_view(request):
    # Only superusers (owner) should access settings:
    if not request.user.is_superuser:
        return HttpResponseForbidden("Access Denied")
    users = User.objects.all()
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
def settings_view(request):
    return render(request, 'settings.html')

def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect('login')
