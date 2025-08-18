# Rudraksha: The Saviour - Frontend Dashboard System

## Overview
This is a comprehensive frontend system for a phishing detection platform with separate admin and user dashboards. The system provides role-based access control with modern, responsive interfaces.

## Project Structure

```
frontend/
├── index.html                 # Landing page with role selection
├── adminlogin.html           # Admin login page
├── userlogin.html            # User login page
├── css/
│   ├── landing.css          # Landing page styles
│   ├── adminlogin.css       # Admin login styles
│   └── userlogin.css        # User login styles
├── js/
│   ├── landing.js           # Landing page functionality
│   ├── adminlogin.js        # Admin login logic
│   └── userlogin.js         # User login logic
├── admin-dashboard/          # Admin dashboard files
│   ├── index.html           # Admin dashboard main page
│   ├── css/
│   │   └── admin-dashboard.css
│   └── js/
│       └── admin-dashboard.js
└── user-dashboard/           # User dashboard files
    ├── index.html           # User dashboard main page
    ├── css/
    │   └── user-dashboard.css
    └── js/
        └── user-dashboard.js
```

## Features

### Landing Page (`index.html`)
- Modern 3D styling with animations
- Role selection (Admin/User)
- Responsive design with glassmorphism effects
- Interactive floating shapes and parallax effects

### Admin Login (`adminlogin.html`)
- Username/password authentication
- Dummy credentials: `admin` / `admin123`
- Remember me functionality
- Form validation and error handling
- Redirects to admin dashboard on success

### User Login (`userlogin.html`)
- Email/password authentication
- Dummy credentials: `user@example.com` / `user123`
- Email validation and password strength indicator
- Remember me functionality
- Redirects to user dashboard on success

### Admin Dashboard (`admin-dashboard/index.html`)
- **Overview Section**: System statistics, recent activity
- **Threat Management**: View and manage detected threats
- **Analytics**: Charts and reports (placeholder for future implementation)
- **User Management**: Manage user accounts and permissions
- **System Settings**: Configure security parameters and preferences
- Professional dark theme with blue accents

### User Dashboard (`user-dashboard/index.html`)
- **Overview Section**: Personal scan statistics, quick actions
- **URL Scanner**: Check URLs for phishing threats
- **Scan History**: View previous scan results
- **Reports**: Generate and download security reports
- **Preferences**: Customize personal settings
- Modern light theme with teal/blue accents

## How to Use

### 1. Start the System
1. Open `frontend/index.html` in a web browser
2. Choose your role (Admin or User)

### 2. Admin Access
1. Click "Administrator" on the landing page
2. Use credentials: `admin` / `admin123`
3. Access the full admin dashboard with system management tools

### 3. User Access
1. Click "User" on the landing page
2. Use credentials: `user@example.com` / `user123`
3. Access personal dashboard with URL scanning capabilities

### 4. URL Scanning (User Dashboard)
1. Navigate to "URL Scanner" section
2. Enter a URL to scan
3. Choose scan options (deep scan, save history)
4. View detailed scan results with threat analysis

## Technical Details

### Authentication
- Currently uses dummy credentials stored in JavaScript
- No backend connection required
- Session management through localStorage
- Remember me functionality implemented

### Responsive Design
- Mobile-first approach
- CSS Grid and Flexbox layouts
- Media queries for different screen sizes
- Touch-friendly interface elements

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox support
- Local storage API support

## Future Enhancements

### Backend Integration
- Real authentication system
- Database integration for scan history
- API endpoints for threat detection
- User management system

### Advanced Features
- Real-time threat detection
- Machine learning integration
- Advanced analytics and reporting
- Multi-language support
- Dark/light theme switching

### Chrome Extension
- Browser integration
- Real-time URL checking
- Popup interface
- Background threat monitoring

## Development Notes

### CSS Framework
- Custom CSS with modern design principles
- CSS Grid and Flexbox for layouts
- CSS animations and transitions
- Glassmorphism and 3D effects

### JavaScript
- Vanilla JavaScript (no frameworks)
- ES6+ features
- Modular function organization
- Event-driven architecture

### File Organization
- Separate folders for admin and user dashboards
- Consistent naming conventions
- Modular CSS and JavaScript files
- Easy to maintain and extend

## Getting Started

1. **Clone or download** the project files
2. **Open** `frontend/index.html` in a web browser
3. **Choose your role** and log in with the provided credentials
4. **Explore** the dashboard features and functionality

## Support

For questions or issues:
- Check the browser console for JavaScript errors
- Ensure all files are in the correct directory structure
- Verify browser compatibility
- Check that all CSS and JavaScript files are properly linked

---

**Note**: This is a frontend-only demonstration system. In production, it would be integrated with a backend server and real authentication system.
