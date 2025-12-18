# Secure Incident Reporting System (MERN Stack)

A highly secure and scalable cybersecurity Incident Reporting System with advanced dashboard functionalities, filtering, logging, and role-based access control (RBAC).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Frontend Routes](#frontend-routes)
- [Role-Based Access Control](#role-based-access-control)
- [Real-time Notifications](#real-time-notifications)
- [Security Features](#security-features)
- [Database Models](#database-models)

## 🚀 Features

### Authentication & Role-Based Access (RBAC)
- **Users**: Can submit incidents and view only their own reports
- **Admins**: Can view, update, filter, and manage all incidents
- **Super Admin**: Can manage users, assign roles, and delete incidents permanently

### Advanced Dashboard (Role-Based Views)

#### For Users
- View their submitted incidents in a clean table format
- Search, sort, and filter incidents by category, status, or date
- Receive real-time notifications when an admin updates their incident status
- Create new incidents with evidence file uploads
- Responsive mobile-friendly interface

#### For Admins
- **Analytics Dashboard** with widgets:
  - Total Incidents (Count of all incidents)
  - Open vs Resolved Incidents (Pie chart)
  - Most Common Categories (Bar chart)
  - Average Resolution Time
- **Incident Filters & Sorting**
  - Filter by Status (Open, In Progress, Resolved, Closed)
  - Filter by Category (Phishing, Malware, Ransomware, etc.)
  - Sort by Date, Severity (Priority), or User Reports
- **Bulk Actions**
  - Mark multiple incidents as "Resolved"
  - Assign incidents to different admins
- **Export Functionality**
  - Export incidents as CSV
  - Export incidents as PDF
- Real-time incident reports without page refresh
- Responsive mobile-friendly interface

#### For Super Admin
- **User Management System**
  - Add, edit, or delete users
  - Assign roles (User, Admin, Super Admin)
  - Block or unblock users
- **Audit Logs**
  - Track who created, modified, or deleted incidents
  - Filter by User Type, Date Range
  - View IP addresses and user roles
- **Hard Delete Incidents**
  - Permanently delete incidents (no soft delete)
  - Search functionality for incidents
- Responsive mobile-friendly interface

### Incident Reporting Form
- Fields: Title, Description, Category (Dropdown), Priority (Low, Medium, High), Date, Evidence Upload
- Form Validation (Required fields, file size limit 5MB, accepted formats: JPG, PNG, PDF)
- Maximum 5 files per incident

### Real-time Updates & Notifications (WebSockets - Socket.io)
- Users get notifications when an admin updates their incident
- Admins see real-time incident reports without page refresh
- Notification bell with unread count badge
- Persistent notifications stored in database
- Mark as read functionality

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens) with Refresh Tokens
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting, XSS Protection, MongoDB Sanitization
- **Logging**: Winston
- **PDF Generation**: PDFKit
- **CSV Export**: json2csv

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Custom components with Tailwind

## 📁 Project Structure

```
secure-incident-reporting/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Authentication logic
│   │   │   ├── incident.controller.js # Incident CRUD operations
│   │   │   ├── user.controller.js     # User management
│   │   │   ├── log.controller.js      # Audit log queries
│   │   │   └── notification.controller.js # Notification management
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT authentication & RBAC
│   │   │   ├── error.middleware.js    # Error handling
│   │   │   └── upload.middleware.js   # File upload handling
│   │   ├── models/
│   │   │   ├── User.js                # User schema
│   │   │   ├── Incident.js            # Incident schema
│   │   │   ├── AuditLog.js            # Audit log schema
│   │   │   └── Notification.js       # Notification schema
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # Auth endpoints
│   │   │   ├── incident.routes.js     # Incident endpoints
│   │   │   ├── user.routes.js         # User endpoints
│   │   │   ├── log.routes.js         # Audit log endpoints
│   │   │   └── notification.routes.js # Notification endpoints
│   │   ├── utils/
│   │   │   ├── jwt.js                # JWT utilities
│   │   │   └── logger.js             # Winston logger config
│   │   ├── public/
│   │   │   └── uploads/              # Uploaded evidence files
│   │   └── server.js                 # Express server setup
│   ├── package.json
│   └── .env                          # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── EvidenceViewer.jsx     # Evidence file viewer
    │   │   ├── NotificationBell.jsx   # Notification bell component
    │   │   ├── layout/
    │   │   │   └── AppLayout.jsx      # Main layout wrapper
    │   │   └── ui/                    # Reusable UI components
    │   ├── context/
    │   │   ├── AuthContext.jsx        # Authentication context
    │   │   ├── SocketContext.jsx       # Socket.io context
    │   │   └── NotificationContext.jsx # Notification context
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx          # Login page
    │   │   │   └── Register.jsx       # Registration page
    │   │   ├── user/
    │   │   │   ├── Dashboard.jsx       # User dashboard
    │   │   │   └── CreateIncident.jsx # Create incident form
    │   │   ├── admin/
    │   │   │   └── Dashboard.jsx      # Admin dashboard
    │   │   └── superadmin/
    │   │       ├── Dashboard.jsx      # Super admin dashboard
    │   │       ├── Users.jsx          # User management
    │   │       └── Logs.jsx          # Audit logs
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx    # Route protection
    │   ├── services/
    │   │   ├── api.js                 # Axios configuration
    │   │   ├── incidents.js           # Incident API calls
    │   │   ├── admin.js               # Admin API calls
    │   │   ├── superadmin.js          # Super admin API calls
    │   │   ├── notifications.js       # Notification API calls
    │   │   └── socket.js              # Socket.io client
    │   ├── App.jsx                    # Main app component
    │   └── main.jsx                   # Entry point
    ├── package.json
    └── .env                          # Environment variables
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the `backend` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/incident-reporting
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

   The backend server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔐 Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Required |
| `JWT_EXPIRE` | JWT token expiration | `7d` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `30d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | No |

**Request Body Examples:**

**Register:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Endpoints (`/users`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/users/me` | Get current user info | Yes | Any |
| GET | `/users/admins` | Get list of assignable admins | Yes | ADMIN, SUPER_ADMIN |
| GET | `/users` | Get all users (paginated) | Yes | SUPER_ADMIN |
| POST | `/users` | Create new user | Yes | SUPER_ADMIN |
| PATCH | `/users/:id` | Update user | Yes | SUPER_ADMIN |
| DELETE | `/users/:id` | Delete user | Yes | SUPER_ADMIN |

**Query Parameters for GET `/users`:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `role` - Filter by role (USER, ADMIN, SUPER_ADMIN)
- `isBlocked` - Filter by blocked status (true/false)
- `search` - Search by name or email

**Request Body for POST `/users`:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "ADMIN"
}
```

**Request Body for PATCH `/users/:id`:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "ADMIN",
  "isBlocked": false
}
```

### Incident Endpoints (`/incidents`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/incidents` | Get incidents (paginated) | Yes | Any |
| GET | `/incidents/:id` | Get single incident | Yes | Any |
| POST | `/incidents` | Create new incident | Yes | USER only |
| PATCH | `/incidents/:id` | Update incident | Yes | Any (with restrictions) |
| DELETE | `/incidents/:id` | Hard delete incident | Yes | SUPER_ADMIN |
| GET | `/incidents/stats` | Get incident statistics | Yes | ADMIN, SUPER_ADMIN |
| GET | `/incidents/export/csv` | Export incidents as CSV | Yes | ADMIN, SUPER_ADMIN |
| GET | `/incidents/export/pdf` | Export incidents as PDF | Yes | ADMIN, SUPER_ADMIN |
| PATCH | `/incidents/bulk/resolve` | Bulk resolve incidents | Yes | ADMIN, SUPER_ADMIN |

**Query Parameters for GET `/incidents`:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status (Open, In Progress, Resolved, Closed)
- `category` - Filter by category
- `priority` - Filter by priority (Low, Medium, High)
- `search` - Search in title, description, category
- `sort` - Sort order (e.g., `-createdAt`, `priority`, `createdBy`)
- `from` - Filter by date from (ISO date)
- `to` - Filter by date to (ISO date)

**Request Body for POST `/incidents`:**
```json
{
  "title": "Security Breach Detected",
  "description": "Unauthorized access detected in system",
  "category": "Security Breach",
  "priority": "High",
  "incidentDate": "2025-01-15"
}
```
**Note:** Evidence files are uploaded as `multipart/form-data` with field name `evidence` (max 5 files, 5MB each)

**Request Body for PATCH `/incidents/:id`:**
```json
{
  "status": "In Progress",
  "assignedTo": "user_id_here",
  "resolutionNotes": "Working on fix"
}
```

**Request Body for PATCH `/incidents/bulk/resolve`:**
```json
{
  "incidentIds": ["id1", "id2", "id3"]
}
```

### Audit Log Endpoints (`/logs`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/logs` | Get audit logs (paginated) | Yes | SUPER_ADMIN |

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 200)
- `userRole` - Filter by user role (USER, ADMIN, SUPER_ADMIN)
- `from` - Filter by date from (ISO date)
- `to` - Filter by date to (ISO date)

### Notification Endpoints (`/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get user notifications | Yes |
| PATCH | `/notifications/:id/read` | Mark notification as read | Yes |
| PATCH | `/notifications/read-all` | Mark all notifications as read | Yes |
| DELETE | `/notifications/:id` | Delete notification | Yes |
| DELETE | `/notifications` | Delete all notifications | Yes |

**Query Parameters for GET `/notifications`:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `unreadOnly` - Filter unread only (true/false)

## 🎯 Frontend Routes

| Route | Component | Description | Role Required |
|-------|-----------|-------------|---------------|
| `/` | Redirect | Redirects based on user role | Any authenticated |
| `/login` | Login | Login page | Public |
| `/register` | Register | Registration page | Public |
| `/user` | UserDashboard | User's incidents | USER |
| `/user/new` | CreateIncident | Create new incident | USER only |
| `/admin` | AdminDashboard | Admin dashboard | ADMIN, SUPER_ADMIN |
| `/superadmin` | SuperAdminDashboard | Super admin dashboard | SUPER_ADMIN |
| `/superadmin/users` | UsersPage | User management | SUPER_ADMIN |
| `/superadmin/logs` | AuditLogsPage | Audit logs | SUPER_ADMIN |

## 🔒 Role-Based Access Control

### USER Role
- ✅ Create incidents
- ✅ View own incidents only
- ✅ Edit own incidents (only when status is "Open")
- ✅ Search, filter, and sort own incidents
- ❌ Cannot view other users' incidents
- ❌ Cannot update incident status
- ❌ Cannot assign incidents

### ADMIN Role
- ✅ View all incidents
- ✅ Update incident status, priority, category
- ✅ Assign incidents to admins
- ✅ Bulk resolve incidents
- ✅ Export incidents (CSV/PDF)
- ✅ View analytics dashboard
- ✅ Filter and sort all incidents
- ❌ Cannot create incidents (only users can)
- ❌ Cannot delete incidents permanently
- ❌ Cannot manage users

### SUPER_ADMIN Role
- ✅ All ADMIN permissions
- ✅ Manage users (create, update, delete, assign roles)
- ✅ Block/unblock users
- ✅ Hard delete incidents permanently
- ✅ View audit logs with filters
- ✅ View all system activities

## 🔔 Real-time Notifications

The system uses Socket.io for real-time notifications:

### Socket Events

**Client → Server:**
- `joinRoom` - Join a room for notifications
  ```javascript
  socket.emit('joinRoom', 'user_123')
  ```

**Server → Client:**
- `incident:new` - New incident created (broadcasted to admins)
- `incident:update` - Incident updated (broadcasted to admins)
- `incident:delete` - Incident deleted
- `incident:bulk-resolve` - Bulk resolve completed
- `incident:notification` - Personal notification (sent to specific user)

### Notification Types
- `INCIDENT_CREATED` - New incident created
- `INCIDENT_UPDATED` - Incident updated
- `INCIDENT_RESOLVED` - Incident resolved
- `INCIDENT_IN_PROGRESS` - Incident in progress
- `INCIDENT_REOPENED` - Incident reopened
- `INCIDENT_CLOSED` - Incident closed
- `INCIDENT_DELETED` - Incident deleted
- `INCIDENT_ASSIGNED` - Incident assigned to admin
- `BULK_RESOLVE` - Bulk resolve action

## 🛡️ Security Features

### Backend Security
- **Helmet**: Sets security HTTP headers
- **CORS**: Cross-origin resource sharing configured
- **Rate Limiting**: 100 requests per 15 minutes per IP (production)
- **XSS Protection**: XSS-Clean middleware
- **MongoDB Sanitization**: Prevents NoSQL injection
- **HPP**: Prevents HTTP Parameter Pollution
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs with salt rounds
- **IP Address Tracking**: Captures real client IP (handles proxies)
- **Audit Logging**: Tracks all actions with IP and user agent

### Frontend Security
- **Protected Routes**: Role-based route protection
- **Token Storage**: Secure token handling
- **Input Validation**: Client-side validation
- **File Upload Validation**: Size and type checking

## 📊 Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique, validated),
  password: String (required, hashed),
  role: String (enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: 'USER'),
  isBlocked: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Incident Model
```javascript
{
  title: String (required, maxlength: 100),
  description: String (required),
  category: String (enum: ['Security Breach', 'Data Leak', 'System Failure', 
                           'Unauthorized Access', 'Malware', 'Phishing', 
                           'Ransomware', 'Other']),
  priority: String (enum: ['Low', 'Medium', 'High']),
  status: String (enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
                  default: 'Open'),
  incidentDate: Date (required),
  evidenceFiles: [String],
  createdBy: ObjectId (ref: 'User', required),
  assignedTo: ObjectId (ref: 'User'),
  resolvedAt: Date,
  resolutionNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog Model
```javascript
{
  action: String (required),
  entity: String (required),
  entityId: ObjectId (required),
  performedBy: ObjectId (ref: 'User', required),
  oldValues: Mixed,
  newValues: Mixed,
  ipAddress: String (required),
  userAgent: String,
  status: String (enum: ['Success', 'Failed'], default: 'Success'),
  error: {
    message: String,
    stack: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  user: ObjectId (ref: 'User', required),
  type: String (enum: ['INCIDENT_CREATED', 'INCIDENT_UPDATED', 
                       'INCIDENT_RESOLVED', 'INCIDENT_IN_PROGRESS',
                       'INCIDENT_REOPENED', 'INCIDENT_CLOSED',
                       'INCIDENT_DELETED', 'INCIDENT_ASSIGNED', 
                       'BULK_RESOLVE']),
  title: String (required),
  message: String (required),
  incidentId: ObjectId (ref: 'Incident'),
  read: Boolean (default: false),
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Backend Deployment

1. **Set environment variables** in your hosting platform
2. **Build and start**:
   ```bash
   npm start
   ```

3. **Ensure MongoDB is accessible** from your server
4. **Configure CORS** to allow your frontend domain
5. **Set up file storage** for uploads (consider cloud storage for production)

### Frontend Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variables**:
   ```env
   VITE_API_URL=https://your-api-domain.com/api/v1
   VITE_SOCKET_URL=https://your-api-domain.com
   ```
