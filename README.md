# Parking Space Management Backend API

A comprehensive Node.js/Express.js backend API for the parking space management system.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (User, Owner, Admin)
- **User Management**: Registration, login, profile management
- **Parking Space Management**: CRUD operations with geospatial search
- **Booking System**: Complete booking lifecycle with check-in/check-out
- **Admin Dashboard**: User management, analytics, and system oversight
- **Real-time Features**: QR code generation, location-based services

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: bcryptjs for password hashing
- **File Upload**: Multer (for future image uploads)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password

### Parking Spaces (`/api/parking-spaces`)
- `GET /` - Get all parking spaces (with filters)
- `GET /:id` - Get single parking space
- `POST /` - Create new parking space (Owner/Admin)
- `PUT /:id` - Update parking space (Owner/Admin)
- `DELETE /:id` - Delete parking space (Owner/Admin)
- `GET /owner/my-spaces` - Get owner's parking spaces

### Bookings (`/api/bookings`)
- `POST /` - Create new booking
- `GET /` - Get user's bookings
- `GET /:id` - Get single booking
- `PUT /:id/status` - Update booking status
- `POST /:id/checkin` - Check in to parking space
- `POST /:id/checkout` - Check out from parking space
- `GET /owner/my-bookings` - Get bookings for owner's spaces

### Admin (`/api/admin`)
- `GET /dashboard` - Admin dashboard statistics
- `GET /users` - Get all users with filters
- `PUT /users/:id/status` - Update user status
- `GET /parking-spaces` - Get all parking spaces
- `PUT /parking-spaces/:id/status` - Update parking space status
- `GET /bookings` - Get all bookings
- `GET /analytics` - Get analytics data

## Setup Instructions

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. **Required Environment Variables**:
   ```
   ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/parking-management
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Start Production Server**:
   ```bash
   npm start
   ```

## Database Models

### User Model
- Authentication fields (email, password)
- Role-based access (user, owner, admin)
- Profile information
- Business details (for owners)
- Preferences and settings

### ParkingSpace Model
- Location with geospatial coordinates
- Pricing (hourly, daily, monthly)
- Availability schedule
- Features (covered, security, etc.)
- Vehicle type support
- Owner reference

### Booking Model
- User and parking space references
- Time period (start/end times)
- Vehicle information
- Pricing breakdown
- Payment details
- Check-in/check-out tracking
- QR code for access

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based authorization
- Input validation and sanitization
- CORS configuration
- Error handling middleware

## API Response Format

All API responses follow this consistent format:

```json
{
  "success": true|false,
  "message": "Description of the result",
  "data": {
    // Response data here
  },
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Authentication/authorization errors
- Database errors
- File upload errors
- General server errors

## Development

- Use `npm run dev` for development with nodemon
- API will be available at `http://localhost:5000`
- Health check endpoint: `http://localhost:5000/api/health`

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS for production frontend URL
5. Use PM2 or similar for process management
