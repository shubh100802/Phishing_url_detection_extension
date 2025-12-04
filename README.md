# Phishing URL Detection System

A comprehensive solution for detecting and preventing phishing attacks through real-time URL analysis and user awareness.

## 🚀 Features

- **Real-time URL Analysis**: Instantly checks URLs against known phishing databases
- **User Authentication**: Secure login/registration system with JWT
- **Dashboard**: Comprehensive analytics and reporting interface
- **Browser Extension**: Seamless integration with Chrome browser
- **API Endpoints**: RESTful API for URL checking and user management
- **Security**: Rate limiting, CORS, and Helmet for enhanced security

## 🛠️ Project Structure

```
Capstone/
├── backend/                 # Node.js + Express server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   └── server.js          # Main server file
├── frontend/              # Dashboard UI
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── index.html         # Main dashboard
├── chrome-extension/      # Chrome extension files
│   ├── manifest.json      # Extension manifest
│   ├── background.js      # Service worker
│   ├── content.js         # Content script
│   └── popup/             # Extension popup files
├── .env                  # Environment variables (gitignored)
├── .gitignore            # Git ignore file
└── package.json          # Project dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- Modern web browser (Chrome recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shubh100802/Phishing_url_capstone.git
   cd Phishing_url_capstone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the MongoDB connection string and other variables

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open `frontend/index.html` in your browser
   - Or access via `http://localhost:3000` if configured

### Loading the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` directory
4. Pin the extension to your toolbar for easy access

## 🛡️ Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Secure password hashing with bcrypt
- CORS protection
- Helmet.js for secure HTTP headers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For any queries, please open an issue or contact the project maintainers.

## 🌟 Acknowledgements

- Built with ❤️ using Node.js, Express, and MongoDB
- Special thanks to all contributors
=======
# Phishing_url_capstone
>>>>>>> 1a05cbe2468651e7ebe2730eec3d527982847648
