# Weather ADK AGUI - Fixed and Working! 🌤️

A weather application built with **Google ADK**, **CopilotKit**, and **Human-in-the-Loop** functionality.

## ✅ What's Fixed

Your app now follows the **exact pattern** from the working reference code you provided:

### Backend (`backend_tool_rendering.py`)
- ✅ Uses `Agent` from `google.adk.agents` (not `LlmAgent`)
- ✅ Defines human-in-the-loop tool as dictionary (`CONFIRM_WEATHER_TOOL`)
- ✅ Clear agent instructions with tool reference
- ✅ Simplified endpoint at root path `/`
- ✅ Uses `gemini-2.0-flash-exp` model

### Frontend (`app/page.tsx`)
- ✅ Uses `useHumanInTheLoop` hook for weather confirmation
- ✅ Beautiful confirmation UI matching reference design
- ✅ Proper state management with `useState` and `useEffect`
- ✅ Handles accept/reject flow correctly
- ✅ Simplified routing

### Key Changes Made
1. **Removed MCP tools** - Now using direct `get_weather` async function
2. **Simplified agent structure** - Following exact reference pattern
3. **Fixed routing** - Backend at `/`, frontend proxy handles it
4. **Better error handling** - No more "invocation_id and new_message are None" errors

## 🚀 Quick Start

### 1. Setup Environment

Create `.env.local` in project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

```bash
# Python dependencies (using uv)
cd weather
uv sync
cd ..

# Node dependencies
npm install
```

### 3. Start the Application

**Option A: Use the startup script (Recommended)**
```bash
./start.sh
```

**Option B: Manual start**

Terminal 1 - Backend:
```bash
uv run uvicorn backend_tool_rendering:app --host 0.0.0.0 --port 8000
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 4. Open Your Browser

Navigate to: **http://localhost:3000**

## 🎯 How to Use

1. **Ask for weather**: "What's the weather in Paris?"

2. **Confirmation dialog appears**:
   - ✅ Get current weather forecast (enabled by default)
   - ☐ Check weather alerts (disabled by default)
   - Toggle options as needed

3. **Click "Confirm"** to fetch weather

4. **Beautiful weather card displays** with:
   - Temperature (°C and °F)
   - Weather conditions
   - Humidity
   - Wind speed
   - "Feels like" temperature

## 🏗️ Architecture

```
┌─────────────────┐
│  Next.js (3000) │  Frontend with CopilotKit
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  API Routes     │  Proxy layer
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  FastAPI (8000) │  ADK Agent with ag-ui-adk
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Gemini  │  LLM (gemini-2.0-flash-exp)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Open-Meteo API │  Weather data source
└─────────────────┘
```

## 📁 Project Structure

```
Weather-ADK-AGUI/
├── app/
│   ├── page.tsx                    # Main UI with Human-in-the-Loop
│   ├── style.css                   # Custom styles
│   ├── layout.tsx                  # Next.js layout
│   └── api/
│       └── copilotkit/
│           └── [integrationId]/
│               ├── route.ts        # API proxy
│               └── info/
│                   └── route.ts    # Agent info endpoint
├── backend_tool_rendering.py       # ADK Agent with HITL
├── start.sh                        # Startup script
├── package.json                    # Node dependencies
└── weather/
    └── pyproject.toml              # Python dependencies
```

## 🎨 Human-in-the-Loop Flow

```
User asks for weather
        ↓
Agent calls confirm_weather_query tool
        ↓
Frontend shows confirmation UI
        ↓
User selects options and clicks "Confirm"
        ↓
Agent receives confirmation
        ↓
Agent calls get_weather tool
        ↓
Frontend displays weather card
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, TailwindCSS
- **Backend**: FastAPI, Google ADK, ag-ui-adk
- **AI**: Google Gemini 2.0 Flash Experimental
- **UI Framework**: CopilotKit
- **Weather API**: Open-Meteo (free, no API key needed)

## 🔧 Troubleshooting

### Backend errors
```bash
# Check if backend is running
curl http://localhost:8000/health
```

### Frontend not connecting
- Ensure both servers are running
- Check browser console for errors
- Verify `.env.local` has valid `GEMINI_API_KEY`

### Port already in use
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

## 📝 What Makes This Work

The key difference from your previous version:

1. **Simple tool definition** - Tool defined as dictionary, not as Python function decorated for ADK
2. **Agent instruction includes tool reference** - Agent knows exact tool schema
3. **Direct weather function** - No MCP layer complexity
4. **Matching frontend/backend** - Names and parameters align perfectly

## 🌟 Example Queries

- "What's the weather in San Francisco?"
- "Tell me about the weather in New York"
- "How's the weather in Tokyo today?"
- "Check the weather in London"
- "What's it like in Paris right now?"

## 📚 References

This implementation is based on the working patterns from:
- CopilotKit Human-in-the-Loop example
- ag-ui-adk reference implementation
- Google ADK Agent patterns

## 🎉 Success!

Your Weather ADK AGUI is now fully functional with human-in-the-loop approval! 

The agent will **always** ask for your confirmation before fetching weather data, giving you control over which information to retrieve.

---

**Questions or issues?** Check `FIX_SUMMARY.md` for detailed technical analysis.

