# Authentication System Setup

This document describes the authentication system that has been implemented for the AI-TKH application with support for both admin and normal users.

## Features

✅ **Backend Features:**
- JWT-based authentication
- Password hashing with bcrypt
- User registration (signup)
- User login
- User roles: `admin` and `normal`
- Protected routes with role-based access
- PostgreSQL database with users table

✅ **Frontend Features:**
- Login screen
- Signup screen with user type selection
- Protected dashboard
- Authentication context for state management
- Automatic token storage and retrieval
- Route protection

## Database Schema

The `users` table includes:
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(10) DEFAULT 'normal' CHECK (user_type IN ('admin', 'normal')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Setup Instructions

### 1. Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run database migration:
```bash
# Make sure your database is running and DATABASE_URL is set in .env
alembic upgrade head
```

3. Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/ai_tkh
SECRET_KEY=your-super-secret-key-change-in-production
```

4. Start the backend server:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication Routes

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires authentication)

### Example API Usage

**Signup:**
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "user_type": "normal"  // or "admin"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

## Testing the Authentication Flow

### 1. Test Signup (Backend)
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword",
    "full_name": "Test User",
    "user_type": "normal"
  }'
```

### 2. Test Login (Backend)
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'
```

### 3. Test Protected Route (Backend)
```bash
# Use the token from login response
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Frontend Testing

1. Open http://localhost:5173 in your browser
2. You should be redirected to the login page
3. Click "Sign up here" to create a new account
4. Fill out the signup form:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: your password
   - User Type: Choose between Normal User or Admin
5. After signup, you should be automatically logged in and redirected to the dashboard
6. Try logging out and logging back in
7. Test admin vs normal user access

## File Structure

### Backend Files Added/Modified:
- `app/models/models.py` - Added User model
- `app/schemas/schemas.py` - Added authentication schemas
- `app/core/auth.py` - Authentication utilities and JWT handling
- `app/core/config.py` - Added SECRET_KEY configuration
- `app/api/routes.py` - Added authentication routes
- `alembic/versions/add_users_table.py` - Database migration
- `requirements.txt` - Added authentication dependencies

### Frontend Files Added/Modified:
- `src/services/api.ts` - API service for authentication
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/components/Login.tsx` - Login component
- `src/components/Signup.tsx` - Signup component
- `src/components/Dashboard.tsx` - Protected dashboard
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/App.tsx` - Main app with routing
- `src/App.css` - Styling for authentication components
- `package.json` - Added frontend dependencies

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Token expiration (30 minutes default)
- Protected routes require valid tokens
- Role-based access control (admin vs normal users)
- CORS configuration for frontend integration

## Next Steps

To extend this authentication system, you could:
- Add password reset functionality
- Implement email verification
- Add refresh token support
- Create admin panel for user management
- Add more granular permissions
- Implement OAuth integration (Google, GitHub, etc.)