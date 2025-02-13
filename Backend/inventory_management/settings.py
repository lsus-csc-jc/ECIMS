import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from the .env file early
load_dotenv()

# Build paths inside the project like: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent

#############################################
# SECURITY & ENVIRONMENT CONFIGURATION
#############################################

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'fallback-secret-key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

#############################################
# APPLICATION DEFINITION
#############################################

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',

    # Your apps
    'inventory_management',  # Contains your models, views, serializers, etc.
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be near the top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'inventory_management.urls'

#############################################
# TEMPLATES CONFIGURATION
#############################################

# Using a custom template directory located at BASE_DIR/inventory_management/templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "inventory_management" / "templates"],  # Ensure this points to the correct directory
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

#############################################
# WSGI APPLICATION
#############################################

WSGI_APPLICATION = 'inventory_management.wsgi.application'

#############################################
# DATABASE CONFIGURATION
#############################################

DATABASES = {
    'default': {
        'ENGINE': os.getenv("DB_ENGINE", "django.db.backends.sqlite3"),
        'NAME': os.getenv("DB_NAME", BASE_DIR / "db.sqlite3"),
        'USER': os.getenv("DB_USER", ""),
        'PASSWORD': os.getenv("DB_PASSWORD", ""),
        'HOST': os.getenv("DB_HOST", ""),
        'PORT': os.getenv("DB_PORT", ""),
    }
}

#############################################
# PASSWORD VALIDATION
#############################################

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

#############################################
# INTERNATIONALIZATION
#############################################

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

#############################################
# STATIC & MEDIA FILES
#############################################

STATIC_URL = '/static/'
# Configure static files directory; update the path if your static files reside in a different location
STATICFILES_DIRS = [BASE_DIR / "inventory_management" / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

#############################################
# DEFAULT PRIMARY KEY FIELD TYPE
#############################################

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

#############################################
# DJANGO REST FRAMEWORK SETTINGS
#############################################

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

#############################################
# DJANGO SIMPLE JWT SETTINGS
#############################################

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # Token valid for 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),  # Expect "Authorization: Bearer <token>"
}

#############################################
# CORS CONFIGURATION
#############################################

CORS_ALLOW_ALL_ORIGINS = True  # Set to False in production
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React frontend running locally
    "http://127.0.0.1:3000",
]
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS = ["*"]

#############################################
# AUTHENTICATION BACKENDS
#############################################

AUTHENTICATION_BACKENDS = [
    'inventory_management.backends.EmailBackend',  # Our custom email auth backend
    'django.contrib.auth.backends.ModelBackend',   # Fallback to default
]


#############################################
# CUSTOM USER MODEL
#############################################


