#!/bin/bash

# Start the FastAPI backend server
cd "$(dirname "$0")"

echo "Starting FastAPI backend server..."
echo "Make sure you have installed: ag-ui-adk, fastapi, uvicorn"
echo ""

# Activate virtual environment if it exists
if [ -d "weather/.venv" ]; then
    source weather/.venv/bin/activate
fi

# Run the backend server
uvicorn backend_tool_rendering:app --host 0.0.0.0 --port 8000 --reload

