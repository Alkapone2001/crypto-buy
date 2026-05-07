# Crypto-Buy - Full-Stack Application

A modern cryptocurrency purchasing platform with separate frontend and backend services.

## 📁 Project Structure

```
crypto-buy/
├── front/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context (Auth, Cart)
│   │   ├── pages/          # Page components
│   │   ├── api.js          # API client with axios
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── dist/               # Production build (generated)
├── back/                    # Express.js Backend
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & middleware
│   ├── utils/              # Helper functions
│   ├── server.js           # Express server
│   ├── db.js               # Database setup
│   └── package.json
├── package.json            # Root monorepo config
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd crypto-buy
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   npm install
   npm install --workspace=front
   npm install --workspace=back
   ```
   
   Or use the convenience script:
   ```bash
   npm run install-all
   ```

### Development

#### Start Frontend (Development Server)
```bash
cd front
npm run dev
```
Frontend will be available at `http://localhost:5173`

#### Start Backend Server
```bash
cd back
npm start
```
Backend will run on `http://localhost:3001`

#### Run Both Simultaneously (from root)
```bash
npm run dev
```

### Building

#### Build Frontend for Production
```bash
cd front
npm run build
```
Output: `front/dist/` folder with optimized assets

#### Preview Production Build
```bash
cd front
npm run preview
```

## 📦 Available Scripts

### From Root Directory
- `npm run install-all` - Install dependencies for all workspaces
- `npm run build` - Build frontend for production
- `npm run dev` - Run frontend dev server and backend simultaneously

### Frontend (`cd front`)
- `npm run dev` - Start Vite dev server on port 5173
- `npm run build` - Build for production (creates `dist/` folder)
- `npm run preview` - Preview production build locally

### Backend (`cd back`)
- `npm start` - Start Express server on port 3001
- `npm run dev` - Run server (same as start)

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Vite 5** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Stripe.js** - Payment processing

### Backend
- **Express.js** - Web framework
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Stripe API** - Payment processing
- **Nodemailer** - Email notifications
- **CORS** - Cross-origin requests
- **sql.js** - Database

## 🔧 Configuration

### Frontend (`front/vite.config.js`)
- Port: 5173
- API proxy: `/api` → `http://localhost:3001`

### Backend (`back/server.js`)
- Port: 3001 (or `PORT` environment variable)
- CORS enabled for `http://localhost:5173`

## 📋 Environment Variables

### Backend (.env)
```
PORT=3001
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
ADMIN_EMAIL=admin@example.com
```

## 🌳 Git Workflow

### Initial Setup
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Commit & Push
```bash
git add .
git commit -m "Initial commit: Setup full-stack project structure"
git push origin main
```

## 📝 API Routes

All API requests are prefixed with `/api`:

- `/api/auth` - Authentication
- `/api/rates` - Exchange rates
- `/api/orders` - Orders management
- `/api/payments` - Payment processing
- `/api/products` - Product listing
- `/api/admin` - Admin dashboard

## 📂 Build Output

After building, frontend assets are generated in `front/dist/`:
- `index.html` - Main HTML file
- `assets/` - CSS and JavaScript bundles (minified and tree-shaken)

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 or 3001 is already in use:
- Frontend: Edit `front/vite.config.js` server.port
- Backend: Set `PORT` environment variable

### Dependencies Not Installing
```bash
rm -rf node_modules front/node_modules back/node_modules
npm install
npm install --workspace=front
npm install --workspace=back
```

### Build Failures
Ensure all dependencies are installed and Node.js version matches requirements.

## 📄 License

ISC

## 👤 Author

Your Name