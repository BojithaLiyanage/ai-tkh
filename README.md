
# AI-Based Textile Fiber Learning Platform

The AI-Based Textile Fiber Learning Platform is an innovative educational technology solution that revolutionizes fiber science education through intelligent, personalized learning experiences. This comprehensive platform leverages artificial intelligence to deliver role-specific content tailored for students, researchers, and industry professionals across all educational levels.

Featuring an AI-powered chatbot specifically fine-tuned for textile fiber science, the platform provides contextual learning support, personalized learning paths, and adaptive content delivery based on each user's background and expertise. Built on a hierarchical content structure spanning five core domains—fiber classification, structure, properties, chemistry, applications, and sustainability—the system serves as both an intelligent knowledge repository and interactive tutoring system that bridges theoretical concepts with practical industry applications.

## Architecture

This platform consists of two main components:

- **Backend**: FastAPI-based REST API with PostgreSQL database
- **Frontend**: React + TypeScript application built with Vite

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or later)
- **npm** (comes with Node.js)
- **Python** (v3.8 or later)
- **pip** (Python package manager)
- **PostgreSQL** (v12 or later)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-tkh
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Database Setup

1. **Create PostgreSQL Database**:
   ```bash
   # Connect to PostgreSQL as superuser
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE ai_tkh;
   CREATE USER ai_tkh_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ai_tkh TO ai_tkh_user;
   \q
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the backend directory:
   ```bash
   # Backend/.env
   DATABASE_URL=postgresql://ai_tkh_user:your_password@localhost:5432/ai_tkh
   SECRET_KEY=your-super-secret-key-change-in-production
   BACKEND_CORS_ORIGINS=http://localhost:5173
   ENV=local
   ```

3. **Run Database Migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Create Super Admin User** (Optional):
   ```bash
   python create_super_admin.py
   ```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../frontend
```

#### Install Node.js Dependencies
```bash
npm install
```

## Running the Application

### 1. Start the Backend Server

From the `backend` directory:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- **API Base URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Endpoints**: http://localhost:8000/api

### 2. Start the Frontend Development Server

From the `frontend` directory:
```bash
npm run dev
```

The frontend application will be available at:
- **Application URL**: http://localhost:5173

## User Roles & Access

The platform supports three user types:

1. **Super Admin**: Full system access, can create admin users
2. **Admin**: Administrative privileges, content management
3. **Client**: Standard user access, learning features

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Client user registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/create-user` - Create user (Super Admin only)

### Content Management
- `GET /api/modules` - List all modules
- `POST /api/modules` - Create new module
- `GET /api/modules/{module_id}/topics` - List topics for a module
- `POST /api/modules/{module_id}/topics` - Create new topic
- `GET /api/topics/{topic_id}/subtopics` - List subtopics for a topic
- `POST /api/topics/{topic_id}/subtopics` - Create new subtopic

## Development Commands

### Backend
```bash
# Run development server with auto-reload
uvicorn app.main:app --reload

# Create new database migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Downgrade migrations
alembic downgrade -1
```

### Frontend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Database Migrations

The project uses Alembic for database migrations. Migration files are located in `backend/alembic/versions/`.

To create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Your migration description"
alembic upgrade head
```

## Environment Configuration

### Backend Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT token secret key
- `BACKEND_CORS_ORIGINS`: Allowed frontend origins
- `ENV`: Environment (local/development/production)

### Frontend Configuration
The frontend automatically connects to the backend API at `http://localhost:8000/api` during development.

## Troubleshooting

### Common Backend Issues
1. **Database Connection Error**: Verify PostgreSQL is running and connection details are correct
2. **Migration Errors**: Ensure database user has proper permissions
3. **Port Already in Use**: Change the port with `--port 8001`

### Common Frontend Issues
1. **Port Already in Use**: Vite will automatically suggest an alternative port
2. **API Connection Error**: Ensure backend server is running on port 8000
3. **Node Modules Issues**: Delete `node_modules` and run `npm install` again

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

