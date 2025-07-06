# Albanian Diaspora App Setup Instructions

## Prerequisites
1. Node.js (v18 or higher)
2. MongoDB (running on localhost:27017)
3. Git

## Installation Steps

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Environment Setup
Create a `.env.local` file in the root directory with the following variables:

\`\`\`
MONGODB_URI=mongodb://localhost:27017/albanian-diaspora
JWT_SECRET=a3ac3c49cee9e7af1402fce0684f50ec34daecf64acd14d94fffa5b490b3300e
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=admin
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Start MongoDB
Make sure MongoDB is running on your local machine:
\`\`\`bash
# On macOS with Homebrew
brew services start mongodb-community

# On Windows
net start MongoDB

# On Linux
sudo systemctl start mongod
\`\`\`

### 4. Run the Application
\`\`\`bash
npm run dev
\`\`\`

The application will be available at: http://localhost:3000

## Access Points

### Regular Users
- Register: http://localhost:3000 (click "Sign Up")
- Login: http://localhost:3000 (click "Sign In")

### Super Admin
- URL: http://localhost:3000/super-admin
- Username: admin
- Password: admin

## Features to Test

### 1. User Registration & Login
- Create a new user account
- Login with your credentials
- Update profile information

### 2. Family Management
- Add family members in your profile
- Chat with family members
- Send money to family members
- Send gifts to family members

### 3. Payment System
- Create a payment
- Pay for the payment using the "Pay Now" button
- View payment status updates

### 4. Gift System
- Create a gift order
- Select family members as recipients
- Pay for gifts immediately
- Track gift delivery status

### 5. Service Booking
- Book a service
- Pay for services
- Track service progress

### 6. Super Admin Dashboard
- View user statistics
- Manage users (make premium, activate/deactivate)
- Add new features
- View analytics and revenue charts

## Database Collections

The app will automatically create these MongoDB collections:
- users
- payments
- gifts
- services
- adminlogs
- features

## Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB is running: `mongosh` should connect successfully
2. Check if the database name is correct in .env.local
3. Verify MongoDB is listening on port 27017

### Application Not Starting
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check for port conflicts (default is 3000)
3. Verify all environment variables are set correctly

### Data Not Appearing
1. Check browser console for API errors
2. Verify MongoDB connection in terminal logs
3. Ensure you're logged in with a valid token

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/super-admin

### User Management
- GET /api/admin/users
- PUT /api/admin/users

### Payments
- GET /api/payments
- POST /api/payments
- POST /api/payments/[id]/pay

### Gifts
- GET /api/gifts
- POST /api/gifts
- POST /api/gifts/[id]/pay

### Services
- GET /api/services
- POST /api/services
- POST /api/services/[id]/pay

### Family
- POST /api/family
- POST /api/family/[id]/send-money
- POST /api/family/[id]/send-gift

## Next Steps
1. Configure Stripe for real payments
2. Set up email notifications
3. Add more payment methods
4. Implement real-time chat
5. Add push notifications
