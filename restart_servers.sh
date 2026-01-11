#!/bin/bash

# Weather App Restart Script
# This script restarts both the backend and frontend servers

echo "🔄 Restarting Weather App..."
echo ""

# Kill existing processes
echo "1️⃣ Stopping old servers..."
pkill -f "uvicorn backend_tool_rendering"
pkill -f "next dev"
sleep 2

# Start backend
echo "2️⃣ Starting backend server (port 8000)..."
cd "$(dirname "$0")"
uv run uvicorn backend_tool_rendering:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo "3️⃣ Starting frontend server (port 3000)..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Servers started!"
echo ""
echo "📡 Backend:  http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
wait

