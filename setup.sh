#!/bin/bash

# Setup script for Weather ADK AGUI Project

echo "Setting up Weather ADK AGUI Project..."

# Setup Python environment
echo "Setting up Python environment..."
cd weather
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing Python dependencies..."
uv add "mcp[cli]" httpx "google-adk" "python-dotenv"

cd ..

# Setup Node.js environment
echo "Setting up Node.js environment..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo "Setup complete!"
echo ""
echo "To start the development server:"
echo "  1. Activate the Python virtual environment: cd weather && source .venv/bin/activate"
echo "  2. Start Next.js: npm run dev"
echo ""
echo "Or run both in separate terminals."

