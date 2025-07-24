
# Host
Host our Project

# Content Shield Platform

A blockchain-inspired social media platform for digital content copyright protection and licensing management.

## 🚀 Features

- **Content Ownership Verification**: Blockchain-inspired content hashing for authenticity
- **Granular Licensing Controls**: Free, paid, permission-based, and restricted content access
- **Admin Dashboard**: Complete platform governance and user management
- **Secure File Management**: Multi-format upload with automatic thumbnail generation
- **Role-Based Access Control**: Admin and user roles with appropriate permissions
- **License Request System**: Streamlined approval workflow for content access

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **Shadcn/UI** components with Radix UI primitives
- **TanStack React Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for full-stack type safety
- **Passport.js** for authentication
- **Multer** for file upload handling
- **bcrypt** for password security

### Database
- **SQLite** with Drizzle ORM
- **Session-based authentication** with SQLite storage
- **Type-safe database operations** with schema validation

## 📁 Project Structure

```
content-shield-platform/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Express backend application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Database operations
├── shared/                # Shared TypeScript schemas
├── db/                    # Database configuration
├── uploads/               # File storage directory
└── sqlite/               # SQLite database files
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/content-shield-platform.git
cd content-shield-platform
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

### Default Admin Account
- **Email**: admin@contentshield.com
- **Password**: admin123

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Update database schema
- `npm run db:seed` - Seed database with sample data

## 🏗 Architecture Highlights

### Authentication System
- Session-based authentication with secure password hashing
- Role-based access control (admin/user)
- Protected routes for sensitive operations

### File Management
- Secure file uploads with validation
- Automatic thumbnail generation for images
- Content integrity verification through hashing

### Licensing Workflow
- Request-based licensing system
- Approval/rejection workflow
- Access control based on license status

### Admin Controls
- User management and analytics
- Content moderation capabilities
- System-wide governance tools

## 🔒 Security Features

- Password encryption with bcrypt
- Input validation using Zod schemas
- CORS protection
- Session security
- File upload restrictions

## 📊 Database Schema

### Core Tables
- **users**: User accounts with role permissions
- **posts**: Content with licensing information
- **license_requests**: Licensing workflow management
- **comments**: User engagement tracking
- **likes**: Content popularity metrics
- **delete_requests**: Content moderation queue

## 🌐 Deployment

### Replit Deployment
This project is optimized for Replit deployment with:
- Zero-configuration setup
- Built-in HTTPS support
- Persistent file storage
- Automatic application restarts

### Production Considerations
- Migrate to PostgreSQL for production scale
- Implement Redis for session caching
- Add CDN for static file delivery
- Configure proper environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/content-shield-platform](https://github.com/yourusername/content-shield-platform)

## 🙏 Acknowledgments

- React team for the excellent framework
- Drizzle team for the type-safe ORM
- Shadcn for the beautiful UI components
- Tailwind CSS for the utility-first styling approach
 195c785 (My project)
