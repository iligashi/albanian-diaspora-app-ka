# Albanian Diaspora Web Application

A modern, responsive web application that enables Albanian diaspora users to manage everyday life tasks in Kosovo remotely.

## 🚀 Features

### Authentication System
- User registration/login with email & password
- Password hashing using bcrypt
- JWT-based authentication with middleware protection
- Role-based access control (User, Admin, Vendor)

### Remote Payment Center
- Pay bills (electricity, water, rent, internet, etc.)
- Add multiple family members/households
- Payment history and receipt generation
- Mock payment gateway integration

### Gift Sending Module
- Browse gift categories (flowers, cakes, local goods)
- Customize messages and voice notes
- Track delivery status
- Admin dashboard for inventory management

### Home Service Booking
- Service categories (cleaning, repairs, electrician, etc.)
- Time slot booking with vendors
- Booking status updates
- Review system after service completion

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety and better development experience
- **React Hook Form** - Form handling and validation
- **React Hot Toast** - Toast notifications

### Backend (Future Implementation)
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing

## 📁 Project Structure

\`\`\`
albanian-diaspora-app/
├── app/
│   ├── components/          # Reusable components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── LandingPage.tsx  # Landing page with auth
│   │   ├── LoginForm.tsx    # Login form component
│   │   ├── RegisterForm.tsx # Registration form
│   │   └── Navbar.tsx       # Navigation component
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Dependencies
\`\`\`

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd albanian-diaspora-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Interface**: Clean, professional design with Albanian diaspora branding
- **Loading States**: Smooth loading animations and feedback
- **Form Validation**: Real-time validation with helpful error messages
- **Toast Notifications**: User-friendly feedback for actions
- **Accessible Components**: Proper ARIA labels and keyboard navigation

## 🔒 Security Features (Planned)

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Protected routes with middleware
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with Helmet

## 📱 Current Implementation

This is a **frontend-only implementation** with:
- ✅ Complete authentication UI (login/register)
- ✅ Responsive landing page
- ✅ Dashboard with statistics and quick actions
- ✅ Mock authentication (localStorage-based)
- ✅ Modern, accessible UI components
- ✅ Mobile-friendly navigation

## 🔄 Next Steps

To complete the full-stack application:

1. **Backend Implementation**
   - Set up Express.js server
   - Implement MongoDB database
   - Create API endpoints
   - Add JWT authentication

2. **Feature Completion**
   - Payment processing system
   - Gift sending module
   - Service booking system
   - Admin dashboard

3. **Production Deployment**
   - Database setup (MongoDB Atlas)
   - Environment configuration
   - Deployment to Vercel/Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/new-feature\`
3. Commit your changes: \`git commit -am 'Add new feature'\`
4. Push to the branch: \`git push origin feature/new-feature\`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
