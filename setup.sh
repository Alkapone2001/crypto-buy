#!/bin/bash

# Crypto-Buy Project Setup Script
# This script automates the initial setup of the full-stack project

set -e  # Exit on error

echo "🚀 Crypto-Buy Project Setup"
echo "============================"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo "✓ npm $(npm --version) detected"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo "✓ Root dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install --workspace=front
echo "✓ Frontend dependencies installed"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --workspace=back
echo "✓ Backend dependencies installed"
echo ""

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

if [ ! -f back/.env ]; then
    cp back/.env.example back/.env
    echo "✓ Created back/.env (please configure)"
else
    echo "✓ back/.env already exists"
fi

if [ ! -f front/.env ]; then
    cp front/.env.example front/.env
    echo "✓ Created front/.env (please configure)"
else
    echo "✓ front/.env already exists"
fi

echo ""

# Test builds
echo "🔨 Building frontend..."
cd front
npm run build
cd ..
echo "✓ Frontend build successful"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure environment variables:"
echo "   - back/.env (add your Stripe keys and JWT secret)"
echo "   - front/.env (add your Stripe public key)"
echo ""
echo "2. Start development:"
echo "   npm run dev"
echo ""
echo "3. Or start services individually:"
echo "   Terminal 1: cd front && npm run dev"
echo "   Terminal 2: cd back && npm start"
echo ""
