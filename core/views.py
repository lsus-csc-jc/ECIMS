from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import SignUpForm  # Import the fixed signup form
from django.http import JsonResponse
from .models import Order, Supplier
import json
import uuid

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
