# Development Guide

## Project Overview

Crypto-Buy is a full-stack cryptocurrency purchasing platform with:
- **Frontend**: React 18 + Vite for fast development and optimized builds
- **Backend**: Express.js with JWT authentication and Stripe integration
- **Architecture**: Monorepo with npm workspaces

## Development Workflow

### Option 1: Local Development (Recommended)

```bash
# One-time setup
npm run install-all

# Development (from root)
npm run dev

# Or in separate terminals
cd front && npm run dev     # Terminal 1
cd back && npm start         # Terminal 2
```

**Pros:**
- Full debugging access
- Hot reload for both frontend and backend
- Easy to modify code and see changes immediately

### Option 2: Docker Setup

```bash
# First time
docker-compose up --build

# Subsequent runs
docker-compose up
```

**Pros:**
- Consistent environment across machines
- No local dependency conflicts
- Easy deployment

## Project Structure

### Frontend (`front/`)

**Key Files:**
- `index.html` - Entry HTML file
- `src/main.jsx` - React app entry point
- `src/App.jsx` - Main app component with routing
- `src/api.js` - Centralized API client with axios

**Key Directories:**
- `src/pages/` - Full-page components (routed)
- `src/components/` - Reusable UI components
- `src/context/` - React Context (AuthContext, CartContext)

**Important Patterns:**
```javascript
// Using API client
import api from '../api'
api.get('/endpoint').then(res => console.log(res.data))

// Using Auth context
import { useAuth } from '../context/AuthContext'
const { user, login, logout } = useAuth()

// Using Cart context
import { useCart } from '../context/CartContext'
const { cart, addToCart, removeFromCart } = useCart()
```

### Backend (`back/`)

**Key Files:**
- `server.js` - Express app setup and routes
- `db.js` - Database initialization
- `middleware/auth.js` - JWT authentication middleware

**Key Directories:**
- `routes/` - API endpoint handlers
- `middleware/` - Express middleware
- `utils/` - Helper functions (email, etc.)

**API Structure:**
```javascript
// Example route in routes/products.js
router.get('/', (req, res) => {
  // Get all products
})

// Registered in server.js
app.use('/api/products', require('./routes/products'))
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create route file** (`back/routes/feature.js`):
```javascript
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ data: 'your data' });
});

module.exports = router;
```

2. **Register in backend** (`back/server.js`):
```javascript
app.use('/api/feature', require('./routes/feature'));
```

3. **Call from frontend** (`front/src/api.js`):
```javascript
api.get('/feature').then(res => console.log(res.data))
```

### Adding a New Frontend Page

1. **Create component** (`front/src/pages/Feature.jsx`):
```jsx
import { useState, useEffect } from 'react'
import api from '../api'

export default function Feature() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    api.get('/feature').then(res => setData(res.data))
  }, [])
  
  return <div>{data && <p>{data.message}</p>}</div>
}
```

2. **Add route** (`front/src/App.jsx`):
```jsx
import Feature from './pages/Feature'

<Route path="/feature" element={<Feature />} />
```

### Using Authentication

**Backend:**
```javascript
const auth = require('../middleware/auth')

// Protected route
router.get('/protected', auth, (req, res) => {
  // req.user contains decoded JWT data
  res.json({ user: req.user })
})
```

**Frontend:**
```jsx
import { useAuth } from '../context/AuthContext'

function MyComponent() {
  const { user, logout } = useAuth()
  
  if (!user) return <Navigate to="/login" />
  
  return <div>Welcome {user.email}</div>
}
```

## Environment Configuration

### Backend `.env`
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your_secret_key_change_in_production
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
ADMIN_EMAIL=admin@example.com
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Debugging

### Frontend
- Use React DevTools browser extension
- Check Network tab for API calls
- Use `console.log()` or debugger
- Check Vite dev server output

### Backend
- Check server terminal output
- Use `console.log()` or Node debugger
- Check network requests in browser DevTools
- Add error handling and logging

## Performance Optimization

### Frontend
- Code splitting for routes (already in Vite)
- Image optimization
- CSS modules to avoid conflicts
- React.memo for expensive components

### Backend
- Query optimization
- Response compression (gzip)
- Connection pooling
- Caching for static data

## Testing

### Running Tests
```bash
# Frontend tests (configure test runner)
cd front && npm test

# Backend tests
cd back && npm test
```

## Building for Production

### Frontend
```bash
cd front
npm run build
# Output: dist/ folder
```

### Backend
No build needed; deploy directly or use Docker image.

## Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Install dependencies: `npm install --workspace=front --workspace=back`
2. Build frontend: `npm run build --workspace=front`
3. Set production environment variables
4. Start backend: `npm start --workspace=back`

## Troubleshooting

### Port Conflicts
```bash
# Check what's using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

### Dependency Issues
```bash
# Clean install
rm -rf node_modules front/node_modules back/node_modules
npm install --workspace=front --workspace=back
```

### CORS Errors
Ensure backend CORS is configured for frontend URL:
```javascript
app.use(cors({ 
  origin: 'http://localhost:5173', 
  credentials: true 
}))
```

### API Not Responding
1. Check backend is running on correct port
2. Verify VITE_API_URL in frontend .env
3. Check network requests in browser DevTools

## Git Workflow

### Before Committing
```bash
# Check changes
git status

# Stage changes
git add .

# Commit with conventional message
git commit -m "feat: add feature name"
```

### Commit Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

## Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Vite Documentation](https://vitejs.dev)
- [Stripe Documentation](https://stripe.com/docs)
- [JWT Introduction](https://jwt.io/introduction)

## Getting Help

1. Check the main README.md
2. Review similar features in the codebase
3. Check CONTRIBUTING.md for guidelines
4. Open an issue on GitHub
