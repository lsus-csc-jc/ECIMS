# core/decorators.py
from functools import wraps
from django.http import HttpResponseForbidden

def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # First, ensure the user is authenticated
            if not request.user.is_authenticated:
                return HttpResponseForbidden("You do not have permission to view this page.")
            
            # Example role-check logic. Adjust according to your user model.
            user_role = getattr(request.user, 'role', None)
            if user_role not in allowed_roles:
                return HttpResponseForbidden("You do not have permission to view this page.")
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
