# Contributing to Crypto-Buy

Thank you for your interest in contributing! Here are guidelines to help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork locally**
   ```bash
   git clone https://github.com/YOUR_USERNAME/crypto-buy.git
   cd crypto-buy
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. **Install all dependencies**
   ```bash
   npm run install-all
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```
   Or in separate terminals:
   ```bash
   # Terminal 1 - Frontend
   cd front && npm run dev
   
   # Terminal 2 - Backend
   cd back && npm start
   ```

3. **Copy environment files**
   ```bash
   # Backend
   cp back/.env.example back/.env
   
   # Frontend
   cp front/.env.example front/.env
   ```
   Update with your own values (especially Stripe keys).

## Code Guidelines

### Frontend
- Use functional components with React hooks
- Keep components small and focused
- Use the existing context for state management
- Follow the folder structure:
  - `components/` - Reusable UI components
  - `pages/` - Full page components
  - `context/` - React Context providers
  - `api.js` - API client (centralized)

### Backend
- Use Express middleware appropriately
- Place routes in `routes/` directory
- Keep middleware in `middleware/` directory
- Use utility functions for common tasks
- Follow RESTful API conventions

## Git Workflow

1. **Make your changes** on your feature branch
2. **Commit with clear messages**
   ```bash
   git commit -m "feat: add user authentication"
   git commit -m "fix: resolve payment processing issue"
   git commit -m "docs: update README with setup instructions"
   ```
   Use conventional commit prefixes:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `style:` - Formatting

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Clearly describe what your PR does
   - Link any related issues
   - Include screenshots for UI changes

## Building & Testing

### Build Frontend
```bash
cd front && npm run build
```

### Preview Production Build
```bash
cd front && npm run preview
```

## Before Submitting

- [ ] Code follows project style guidelines
- [ ] No console errors or warnings
- [ ] All dependencies are documented
- [ ] Changes are tested locally
- [ ] Commit messages are clear and descriptive

## Issues & Bug Reports

- Check existing issues first
- Provide clear reproduction steps
- Include error messages and screenshots
- Specify your environment (OS, Node version, etc.)

## Questions?

Feel free to open an issue to discuss larger changes before starting work.

Happy coding! 🚀
