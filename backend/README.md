# Learning Path Dashboard Backend

This is the backend server for the Learning Path Dashboard application, which allows users to create, manage, and track progress on learning paths.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

## Setup

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the backend directory with the following variables (or use the existing one):
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=learnmap_db
   JWT_SECRET=your_jwt_secret_key_here
   ```
   Replace `your_password` with your MySQL password.

## Running the Application

### Start the server

```
npm start
```

For development with auto-reload:
```
npm run dev
```

### Test the API

To verify that the API is running correctly:
```
npm run test-api
```

## Database

The application will automatically:
1. Create the database if it doesn't exist
2. Set up the required tables
3. Establish relationships between tables

## API Endpoints

- `GET /` - Check if the API is running
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/users` - Get all users (admin only)
- `GET /api/learning-paths` - Get all learning paths
- `POST /api/learning-paths` - Create a new learning path
- `GET /api/resources` - Get all resources
- `POST /api/progress` - Update progress on a resource

## Troubleshooting

If you encounter any issues:

1. Check that MySQL is running
2. Verify your database credentials in the `.env` file
3. Check the console for specific error messages
4. Ensure all dependencies are installed with `npm install`

## License

ISC