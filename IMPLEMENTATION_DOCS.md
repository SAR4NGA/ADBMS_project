# Vaultix Implementation Documentation

This document contains a comprehensive breakdown of the architectural patterns, security controls, backend logging mechanisms, and environment orchestration utilized to build **Vaultix**—an advanced expense tracking system for stationery shops (developed for the ADBMS 2026 university module).

---

## 1. Project Directory Structure
```
Vaultix/
├── backend/
│   ├── config/
│   │   └── db.js            # SQL Server connection pool (uses Tedious + dotenv)
│   ├── controllers/
│   │   └── authController.js# Authentication routes & JWT generation + logger
│   ├── routes/
│   │   └── authRoutes.js    # Auth router mapping /login
│   ├── scripts/
│   │   ├── initDb.js        # Automated migration, table schema sync & admin seeding
│   │   └── inspectDb.js     # DB Inspector for metadata and column definition
│   ├── .env                 # Environment config (git-ignored)
│   ├── .gitignore           # Backend git ignores
│   ├── Dockerfile           # Alpine-based Node environment container
│   ├── package.json         # Node package definitions & script definitions
│   └── server.js            # Express server configuration
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js     # Intercepted Axios connection mapping container API
│   │   ├── pages/
│   │   │   ├── Login.jsx    # Premium high-end glassmorphism login portal
│   │   │   ├── Login.css    # Interactive micro-animations & background styling
│   │   │   ├── Dashboard.jsx# Secure dashboard interface (visible after login)
│   │   │   └── Dashboard.css# Clean UI panels matching styling guidelines
│   │   ├── App.jsx          # Protected routes logic & path maps
│   │   ├── main.jsx         # App rendering portal
│   │   └── index.css        # CSS variable styling & core typography settings
│   ├── .gitignore           # Frontend git ignores
│   └── package.json         # Frontend modules configuration
├── docker-compose.yml       # Dev orchestration mapping container to host:5000
├── DATABASE_CHANGES.md      # DB migrations and audit trail
└── IMPLEMENTATION_DOCS.md   # System Architecture & Development guide
```

---

## 2. Decoupled Client-Server Architecture

### 2.1 Backend (Express.js)
The backend acts as a stateless JSON API:
- **Server Core (`server.js`)**: Configures Express, enables standard middleware parsing (URL encoded + JSON bodies), and binds Cross-Origin Resource Sharing (CORS) permissions.
- **Database Layer (`config/db.js`)**: Leverages `mssql` connection pooling. Reuses a single active connection across the lifecycles of API queries, securing faster responses. Uses a robust `path`-resolved environment config loader.
- **Security**:
  - Passwords are encrypted using **Bcrypt** algorithm. Plaintext strings are never saved or displayed.
  - Generates secure **JSON Web Tokens (JWT)** valid for 24 hours, returning the user payload (ID, Username, Role) on validation.

### 2.2 Frontend (React.js + Vite)
Built for speed and premium aesthetics:
- **Dynamic CSS & Animation**: Pure vanilla CSS is implemented to support dark slate themes, vibrant radial background shifts, floating cards, custom HSL text gradients, and interactive focus states.
- **Axios HTTP Client (`src/api/axios.js`)**: Intercepts outgoing requests to check if a JWT is stored in `localStorage`. If found, it automatically attaches it as an `Authorization: Bearer <token>` header, facilitating smooth backend verification.
- **Routing & Client Security (`src/App.jsx`)**: Declares standard routes. Implements a React Router wrap-around `<ProtectedRoute>` to block unauthenticated requests. Users without a JWT are securely redirected to the `/login` screen.

---

## 3. Comprehensive Logging System
To make debugging simple and robust, the backend logs essential system events with structured formats.

### Log Entry Scheme:
```
[TIMESTAMP] [SYSTEM_LEVEL] [EVENT_TYPE] Message/Details
```

### Supported Events:
1. **Database Connections**:
   - Connection success: `✅ Connected to SQL Server successfully.`
   - Connection failure: `❌ Database connection failed: [details]`
2. **Auth Gateway (authController.js)**:
   - Login attempts: `[INFO] Login attempt received. Username: "admin" from IP: ::1`
   - Data verification: `[INFO] Connecting to database...` / `Fetching user...`
   - Incorrect username: `[WARN] Login failed: User "not_exist" not found.`
   - Verification stages: `[INFO] User found. Verifying password for user "admin"...`
   - Incorrect password: `[WARN] Login failed: Incorrect password for user "admin".`
   - Token creation: `[INFO] Password verified. Generating JWT token for "admin"...`
   - Logged successfully: `[SUCCESS] User "admin" (Role: Admin) logged in successfully.`
   - System exceptions: `[ERROR] Exception occurred during login flow: [stack trace]`

This lets database admins and support teams easily filter console outputs via simple CLI queries (e.g. searching for `[SUCCESS]`, `[WARN]`, or `[ERROR]`).

---

## 4. Dockerization Orchestration
The environment is containerized using Docker to ensure consistency across developer setups:

- **Dockerfile**:
  - Leverages lightweight `node:18-alpine` base image to maintain a minimal surface area.
  - Installs npm packages directly inside the build cache.
  - Mounts code files to dynamic directories.
- **Docker Compose**:
  - Exposes port `5000:5000` to the host machine.
  - Creates virtual volumes for node modules so local dependencies do not conflict with containerized binaries.

---

## 5. Getting Started

### 1. Initialize database and add Admin
Run the seeding script to create the `[User]` table and the default administrator:
```bash
node backend/scripts/initDb.js
```

### 2. Boot Backend (Docker)
Start the server in Docker:
```bash
docker-compose up --build
```

### 3. Run Frontend (React)
Start the React application using Vite:
```bash
cd frontend
npm run dev
```

Log in using the seeded credentials:
- **Username**: `admin`
- **Password**: `admin1234`
