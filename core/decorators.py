# core/decorators.py
from functools import wraps
from django.http import HttpResponseForbidden

def allowed_roles(roles=[]):
    """
    Decorator that allows access to a view only if the user belongs to one of the allowed groups or has one of the allowed roles in their profile.
    Superusers and users with Admin role automatically bypass this check.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper_func(request, *args, **kwargs):
            # Allow access if the user is a superuser
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # Allow access if user has Admin role in their profile
            if hasattr(request.user, 'profile') and request.user.profile.role == 'Admin':
                # Make them a superuser to ensure full access
                request.user.is_superuser = True
                request.user.is_staff = True
                request.user.save()
                return view_func(request, *args, **kwargs)
                
            # Check if the user belongs to any of the allowed groups
            if request.user.groups.filter(name__in=roles).exists():
                return view_func(request, *args, **kwargs)
                
            # Check if user's profile role is in the allowed roles
            if hasattr(request.user, 'profile') and request.user.profile.role in roles:
                return view_func(request, *args, **kwargs)
                
            # Deny access if the user doesn't meet any of the conditions
            return HttpResponseForbidden("You are not authorized to view this page.")
        return wrapper_func
    return decorator
