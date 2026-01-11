# Weather ADK AGUI Project

A weather application that uses Google ADK (Agent Development Kit) with MCP (Model Context Protocol) to fetch weather data from the National Weather Service API, and displays it using CopilotKit and AGUI.

## Project Structure

```
Weather-ADK-AGUI/
├── weather/              # Python MCP server and ADK agent
│   ├── weather.py        # MCP server with get_forecast and get_alerts tools
│   ├── agent.py          # Google ADK agent configuration
│   └── pyproject.toml     # Python dependencies
├── app/                  # Next.js application
│   ├── page.tsx          # Main chat interface with CopilotKit
│   ├── style.css         # Custom styles
│   └── api/
│       └── copilotkit/
│           └── [integrationId]/
│               └── route.ts  # API route for CopilotKit integration
└── README.md
```

## Setup Instructions

### 1. Python Environment Setup

```bash
# Navigate to the weather directory
cd weather

# Create virtual environment
uv venv

# Install dependencies (no need to activate - uv handles it automatically)
uv add "mcp[cli]" httpx "google-adk" "python-dotenv"
```

### 2. Next.js Setup

```bash
# Navigate to project root
cd ..

# Install Next.js dependencies (if not already installed)
npm install
# or
yarn install

# Install CopilotKit dependencies
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime @copilotkit/runtime-google-adk
```

### 3. Environment Variables

The `.env.local` file has been created in the project root with the Gemini API key:

```env
# Gemini API Key (for ADK agent)
GEMINI_API_KEY=your_api_key_here
```

**Note**: The `.env.local` file is already created with your API key. Make sure it's in the project root directory.

### 4. Install Backend Dependencies

```bash
cd weather
uv add "ag-ui-adk" "fastapi" "uvicorn"
```

### 5. Running the Application

#### Terminal 1: Start the FastAPI Backend Server

```bash
# From project root
./start_backend.sh

# Or manually:
cd weather
source .venv/bin/activate  # or use: uv run
uvicorn ../backend_tool_rendering:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

#### Terminal 2: Start the Next.js Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

**Important**: Both servers must be running for the application to work properly.

## Usage

1. Open the application in your browser
2. Use the chat interface to ask about weather:
   - "What's the weather forecast for San Francisco? (37.7749, -122.4194)"
   - "Get weather alerts for California (CA)"
   - "Tell me about the weather in New York. (40.7128, -74.0060)"

## Features

### MCP Tools

1. **get_forecast(latitude, longitude)**: Fetches weather forecast for a specific location
   - Returns temperature, wind conditions, and detailed forecast for the next 5 periods

2. **get_alerts(state)**: Fetches active weather alerts for a US state
   - Returns event type, area, severity, description, and instructions

### UI Components

- **WeatherCard**: Displays current weather conditions with temperature, conditions, humidity, wind speed, and feels-like temperature
- **ForecastList**: Shows extended forecast for upcoming periods
- **AlertCard**: Displays weather alerts with severity-based color coding

## API Integration

The application uses:
- **National Weather Service (NWS) API**: Free public API for US weather data
- **Google ADK**: For agent orchestration
- **CopilotKit**: For the chat interface and tool rendering
- **MCP**: Model Context Protocol for tool communication

## Notes

- The MCP server runs as a subprocess when called by the Google ADK agent
- Weather data is fetched in real-time from the NWS API
- The UI automatically parses and renders MCP tool results
- State codes should be two-letter US state abbreviations (e.g., CA, NY, TX)

