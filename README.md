# User Management Application Setup and Usage

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=userma
DB_USER=postgres
DB_PASSWORD=root

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
API_BASE_URL=http://localhost:5000/api

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
```

Make sure to replace `your_jwt_secret_key` and `your_jwt_refresh_secret_key` with secure random strings.

## Starting the Backend Server

1. Open a terminal in the project root.
2. Navigate to the `backend` directory.
3. Install dependencies if not done yet:

```bash
npm install
```

4. Start the backend server:

```bash
node server.js
```

The backend server will start on port 5000 and connect to the database.

## Starting the Frontend Development Server

1. Open a new terminal in the project root.
2. Navigate to the `frontend` directory.
3. Install dependencies if not done yet:

```bash
npm install
```

4. Start the frontend development server:

```bash
npm run dev
```

The frontend will start on port 5173.

## Testing Login and Registration

- Open your browser and go to `http://localhost:5173/register` to create a new user.
- Use a strong password that meets the requirements:
  - At least 12 characters
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character
- After registration, you should be logged in automatically and redirected to the dashboard.
- To login, go to `http://localhost:5173/login` and enter your credentials.

## Super Admin Account

A super admin account is created automatically on backend startup with the following credentials:

- Email: `superadmin@example.com`
- Password: `SuperAdmin123!`

Use this account to access admin features.

## Troubleshooting

- Ensure the backend server is running and environment variables are loaded.
- Ensure the frontend server is running and API base URL is correct.
- Check browser console and backend terminal for error messages.
- Restart servers after any changes to environment variables or code.

If you encounter issues, please provide error messages or logs for further assistance.
