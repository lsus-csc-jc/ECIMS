from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True, help_text="Required. Enter a valid email address.")

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')  # Use 'username' instead of 'name'

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']  # Store email properly
        user.is_superuser = True  # Give superuser privileges
        user.is_staff = True      # Give staff access
        user.is_active = True     # Ensure account is active
        if commit:
            user.save()
        return user
