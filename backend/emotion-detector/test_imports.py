# Test imports
try:
    from models import *
    print("Models imported successfully")
except Exception as e:
    print(f"Models import failed: {e}")

try:
    from auth_fixed import *
    print("Auth imported successfully")
except Exception as e:
    print(f"Auth import failed: {e}")

try:
    from database import *
    print("Database imported successfully")
except Exception as e:
    print(f"Database import failed: {e}")

print("All imports tested")
