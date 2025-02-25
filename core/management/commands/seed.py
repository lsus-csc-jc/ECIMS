# core/management/commands/seed.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Profile

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **options):
        # Optional: Delete existing profiles and users for seeding purposes
        Profile.objects.all().delete()
        User.objects.filter(username__in=['alice', 'bob', 'charlie']).delete()
        self.stdout.write('Deleted old profiles and users.')

      Sample data – adjust these keys to match your Profile model
    sample_data = [
         {'username': 'alice', 'email': 'alice@example.com', 'bio': 'Hello, I am Alice!'},
           {'username': 'charlie', 'email': 'charlie@example.com', 'bio': 'Hey, I am Charlie.'},
        ]

        for data in sample_data:
            # Create a new user with a default password
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password='password123'
            )
            # Create the profile using the 'user' field and the 'bio'
            profile = Profile.objects.create(
                user=user,
                bio=data['bio']
            )
            self.stdout.write(f'Created profile for user: {user.username}')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
