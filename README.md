# Phishing URL Detection System

Full-stack phishing URL detection platform with:
- Node/Express API + MongoDB
- Admin and user dashboards
- Chrome extension for quick URL scans

## Features

- Real-time URL analysis with risk score and verdict
- JWT authentication (admin/user roles)
- Threat and user management for admins
- User scan history and dashboard reporting
- Chrome extension popup scanner

## Project Structure

```text
Capstone/
|- backend/
|  |- config/
|  |- controllers/
|  |- middleware/
|  |- models/
|  |- routes/
|  `- server.js
|- frontend/
|  |- admin-dashboard/
|  |- user-dashboard/
|  |- css/
|  |- js/
|  `- *.html pages
|- chrome-extension/
|  |- manifest.json
|  |- popup.html
|  |- popup.js
|  |- background.js
|  `- content.js
|- package.json
`- env.example
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- Copy `env.example` to `.env`
- Set `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`

3. Start backend:
```bash
npm run dev
```

4. Open frontend:
- `frontend/index.html` (served from a local static server, e.g. Live Server on port 5500)

5. Load extension:
- Open `chrome://extensions/`
- Enable Developer Mode
- Load unpacked extension from `chrome-extension/`

## Security Notes

- Use strong secrets in `.env` (`JWT_SECRET`, bcrypt rounds as needed)
- Disable admin seeding in production unless explicitly needed
- Do not store plain credentials in frontend storage
