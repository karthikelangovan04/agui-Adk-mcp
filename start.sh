#!/bin/bash

# Weather ADK AGUI Startup Script

echo "🌤️  Starting Weather ADK AGUI..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local file not found"
    echo "Please create .env.local with your GEMINI_API_KEY"
    echo ""
fi

# Kill any existing processes on ports 3000 and 8000
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 2

# Start backend in the background
echo "🐍 Starting Python backend (port 8000)..."
uv run uvicorn backend_tool_rendering:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
sleep 3

# Start frontend in the background
echo "⚛️  Starting Next.js frontend (port 3000)..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Servers started!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait

