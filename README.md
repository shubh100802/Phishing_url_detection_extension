# Phishing Detection System

A real-time phishing detection Chrome extension with a comprehensive dashboard.

## Project Structure

```
phishing-detection-system/
├── backend/                 # Node.js + Express server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   └── server.js           # Main server file
├── frontend/               # HTML/CSS/JS dashboard
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript files
│   └── index.html          # Main dashboard
├── chrome-extension/       # Chrome extension files
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Service worker
│   ├── content.js          # Content script
│   ├── popup.html          # Extension popup
│   └── popup.js            # Popup logic
└── package.json            # Node.js dependencies
```

## Phase 1 Features

- Basic Chrome extension with URL checking
- Simple dashboard interface
- MongoDB integration for storing detection data
- Basic API endpoints

## Setup Instructions

1. Install dependencies: `npm install`
2. Create `.env` file with MongoDB connection string
3. Start backend: `npm run dev`
4. Open `frontend/index.html` in browser
5. Load Chrome extension from `chrome-extension/` folder

## Technologies Used

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: HTML, CSS, JavaScript
- **Extension**: Chrome Extension API
- **Security**: Helmet, CORS, Rate Limiting
