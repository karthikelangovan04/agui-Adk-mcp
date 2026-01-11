# Quick Start Guide

## Prerequisites

1. ✅ Python virtual environment set up
2. ✅ Node.js dependencies installed
3. ✅ `.env.local` with `GEMINI_API_KEY`

## Starting the Application

### Step 1: Start the FastAPI Backend

Open Terminal 1:

```bash
cd /Users/karthike/Desktop/Vibe\ Coding/Weather-ADK-AGUI
./start_backend.sh
```

Or manually:

```bash
cd weather
source .venv/bin/activate
uvicorn ../backend_tool_rendering:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start the Next.js Frontend

Open Terminal 2:

```bash
cd /Users/karthike/Desktop/Vibe\ Coding/Weather-ADK-AGUI
npm run dev
```

You should see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### Step 3: Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Testing

1. **Test Weather Forecast:**
   - Type: "What's the weather forecast for San Francisco? (37.7749, -122.4194)"
   - Or click the suggestion: "Weather in San Francisco"

2. **Test Weather Alerts:**
   - Type: "Get weather alerts for California"
   - Or: "Get alerts for CA"

## Troubleshooting

### Backend not starting?
- Check if port 8000 is available
- Verify dependencies: `cd weather && uv run python -c "import ag_ui_adk, fastapi, uvicorn"`

### Frontend can't connect?
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify `BACKEND_URL` in API route (defaults to `http://localhost:8000`)

### Agent not found error?
- Ensure backend is running
- Check `/info` endpoint: `curl http://localhost:8000/info`
- Verify agent name matches: `backend_tool_rendering`

